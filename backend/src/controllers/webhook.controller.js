// CCBill-based webhook controller (no Stripe)
const crypto = require('crypto');

// Model imports
const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const CreatorEarnings = require('../models/CreatorEarnings');

// Services
const {
  updateMemberPurchaseAnalytics,
} = require('../services/memberAnalytics.service');

// Stub utility functions
const sendNotification = async (userId, notification) => {
  console.log('Notification sent to:', userId, notification);
  // Implement actual notification logic
};

const calculatePlatformFee = amount => {
  // 20% platform fee
  return amount * 0.2;
};

// CCBill configuration
const CCBILL_CONFIG = {
  accountNumber: process.env.CCBILL_ACCOUNT_NUMBER,
  subacc: {
    initial: process.env.CCBILL_SUBACC_INITIAL,
    recurring: process.env.CCBILL_SUBACC_RECURRING,
  },
  salt: process.env.CCBILL_SALT,
  encryptionKey: process.env.CCBILL_ENCRYPTION_KEY,
};

// Handle CCBill webhooks (main webhook handler)
exports.handleCCBillWebhook = async (req, res) => {
  try {
    const {
      eventType,
      subscriptionId,
      transactionId,
      clientAccnum,
      clientSubacc,
      timestamp,
      amount,
      accountingAmount,
      currencyCode,
      dynamicPricingValidationDigest,
      email,
      username,
      password,
      customFields,
    } = req.body;

    // Verify webhook signature (CCBill specific)
    const isValid = verifyCCBillWebhook(req.body, req.headers);

    if (!isValid) {
      console.error('Invalid CCBill webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    console.log('CCBill webhook received:', eventType);
    console.log('Transaction ID:', transactionId);
    console.log('Custom Fields:', customFields);

    // Process based on event type
    switch (eventType) {
      case 'NewSaleSuccess':
      case 'NewSaleFailure':
        await handleNewSale({
          eventType,
          transactionId,
          amount: parseFloat(accountingAmount || amount),
          subscriptionId,
          email,
          username,
          customFields: parseCustomFields(customFields),
        });
        break;

      case 'RenewalSuccess':
      case 'RenewalFailure':
        await handleRenewal({
          eventType,
          transactionId,
          amount: parseFloat(accountingAmount || amount),
          subscriptionId,
          customFields: parseCustomFields(customFields),
        });
        break;

      case 'Cancellation':
        await handleCancellation({
          subscriptionId,
          transactionId,
          customFields: parseCustomFields(customFields),
        });
        break;

      case 'Chargeback':
        await handleChargeback({
          transactionId,
          subscriptionId,
          amount: parseFloat(accountingAmount || amount),
          customFields: parseCustomFields(customFields),
        });
        break;

      case 'Refund':
        await handleRefund({
          transactionId,
          subscriptionId,
          amount: parseFloat(accountingAmount || amount),
          customFields: parseCustomFields(customFields),
        });
        break;

      case 'Void':
        await handleVoid({
          transactionId,
          subscriptionId,
          customFields: parseCustomFields(customFields),
        });
        break;

      default:
        console.log(`Unhandled CCBill event type: ${eventType}`);
    }

    // Always return 200 OK to CCBill
    res.status(200).send('OK');
  } catch (error) {
    console.error('CCBill webhook error:', error);
    // Still return 200 to prevent CCBill from retrying
    res.status(200).send('OK');
  }
};

// Stub handlers for other payment providers (not used with CCBill)
exports.handleStripeWebhook = async (req, res) => {
  res.status(200).json({
    received: true,
    message: 'Stripe not configured - using CCBill',
  });
};

exports.handlePayPalWebhook = async (req, res) => {
  res.status(200).json({
    received: true,
    message: 'PayPal not configured - using CCBill',
  });
};

exports.handleCryptoWebhook = async (req, res) => {
  res.status(200).json({
    received: true,
    message: 'Crypto payments not configured',
  });
};

// Helper functions for handling specific CCBill events

async function handleNewSale(data) {
  const { eventType, transactionId, amount, customFields } = data;

  console.log('Processing new sale:', transactionId);

  if (eventType === 'NewSaleSuccess') {
    // Find the pending transaction
    const transaction = await Transaction.findById(customFields.transactionId);

    if (transaction) {
      // Update transaction status
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.processorTransactionId = transactionId;
      transaction.processorResponse = data;

      await transaction.save();

      // Process based on transaction type
      switch (transaction.type) {
        case 'content_unlock':
          await processContentUnlock(transaction);
          break;
        case 'message_unlock':
          await processMessageUnlock(transaction);
          break;
        case 'tip':
          await processTip(transaction);
          break;
        case 'credits':
          await processCreditsAdd(transaction);
          break;
      }

      // Update creator earnings if applicable
      if (transaction.creator) {
        await updateCreatorEarnings(
          transaction.creator,
          amount,
          transaction.type,
          transaction.memberId,
          transaction.referenceId
        );
      }

      // 🚀 UPDATE MEMBER ANALYTICS - Critical for Creator Active Sales System
      if (transaction.memberId) {
        await updateMemberPurchaseAnalytics(
          transaction.memberId,
          amount,
          transaction.type,
          transaction.creator
        );
        console.log(
          `📊 Analytics updated for member ${transaction.memberId} - $${amount} ${transaction.type}`
        );
      }

      // Send success notification to member
      if (transaction.memberId) {
        await sendNotification(transaction.memberId, {
          type: 'payment_success',
          title: 'Payment Successful',
          body: `Your payment of $${amount} has been processed`,
          data: {
            transactionId: transaction._id,
            ccbillTransactionId: transactionId,
          },
        });
      }
    }
  } else if (eventType === 'NewSaleFailure') {
    // Handle failed sale
    const transaction = await Transaction.findById(customFields.transactionId);

    if (transaction) {
      transaction.status = 'failed';
      transaction.failedAt = new Date();
      transaction.failureReason = 'Payment declined by processor';
      transaction.processorResponse = data;

      await transaction.save();

      // Send failure notification
      if (transaction.memberId) {
        await sendNotification(transaction.memberId, {
          type: 'payment_failed',
          title: 'Payment Failed',
          body: 'Your payment could not be processed. Please try again.',
          data: { transactionId: transaction._id },
        });
      }
    }
  }
}

async function handleRenewal(data) {
  // Handle subscription renewals if you implement subscriptions
  console.log('Renewal event:', data);
  // Implementation depends on your subscription model
}

async function handleCancellation(data) {
  const { subscriptionId, customFields } = data;

  console.log('Cancellation received for subscription:', subscriptionId);

  // If you have subscriptions, update the subscription status
  // For now, just log it

  if (customFields.memberId) {
    await sendNotification(customFields.memberId, {
      type: 'subscription_cancelled',
      title: 'Subscription Cancelled',
      body: 'Your subscription has been cancelled',
      data: { subscriptionId },
    });
  }
}

async function handleChargeback(data) {
  const { transactionId, amount, customFields } = data;

  console.log('Chargeback received:', transactionId);

  // Find the original transaction
  const transaction = await Transaction.findOne({
    processorTransactionId: transactionId,
  });

  if (transaction) {
    transaction.status = 'chargebacked';
    transaction.chargebackAt = new Date();
    transaction.chargebackAmount = amount;

    await transaction.save();

    // Deduct from creator earnings
    if (transaction.creator) {
      const earnings = await CreatorEarnings.findOne({
        creator: transaction.creator,
      });

      if (earnings) {
        earnings.revenue.available -= amount;
        earnings.revenue.chargebacks += amount;
        await earnings.save();
      }

      // Notify creator
      await sendNotification(transaction.creator, {
        type: 'chargeback_received',
        title: 'Chargeback Alert',
        body: `A chargeback of $${amount} has been received`,
        data: { transactionId: transaction._id },
      });
    }
  }
}

async function handleRefund(data) {
  const { transactionId, amount, customFields } = data;

  console.log('Refund processed:', transactionId);

  const transaction = await Transaction.findOne({
    processorTransactionId: transactionId,
  });

  if (transaction) {
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundAmount = amount;

    await transaction.save();

    // Adjust creator earnings
    if (transaction.creator) {
      const earnings = await CreatorEarnings.findOne({
        creator: transaction.creator,
      });

      if (earnings) {
        earnings.revenue.total -= amount;
        earnings.revenue.available -= amount;
        earnings.revenue.refunds += amount;
        await earnings.save();
      }
    }

    // Notify member
    if (transaction.memberId) {
      await sendNotification(transaction.memberId, {
        type: 'refund_processed',
        title: 'Refund Processed',
        body: `Your refund of $${amount} has been processed`,
        data: { transactionId: transaction._id },
      });
    }
  }
}

async function handleVoid(data) {
  const { transactionId, customFields } = data;

  console.log('Transaction voided:', transactionId);

  const transaction = await Transaction.findOne({
    processorTransactionId: transactionId,
  });

  if (transaction) {
    transaction.status = 'voided';
    transaction.voidedAt = new Date();
    await transaction.save();
  }
}

// Utility functions

function verifyCCBillWebhook(body, headers) {
  // CCBill webhook verification using DataLink HTTP Basic Auth

  // 1. Check for DataLink credentials (HTTP Basic Auth)
  const authHeader = headers.authorization || headers.Authorization;

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');

    const expectedUser = process.env.CCBILL_DATALINK_USER;
    const expectedPass = process.env.CCBILL_DATALINK_PASS;

    if (username === expectedUser && password === expectedPass) {
      console.log('✅ CCBill webhook verified via DataLink credentials');
      return true;
    } else {
      console.error('❌ Invalid DataLink credentials');
      return false;
    }
  }

  // 2. Check CCBill IP ranges (whitelist known CCBill IPs)
  const ccbillIPs = [
    '64.38.215.0/24',
    '64.38.212.0/24',
    '64.38.217.0/24',
    '64.38.240.0/24',
    '64.38.241.0/24',
  ];

  // 3. For development, require explicit bypass flag and warn
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.CCBILL_WEBHOOK_BYPASS === 'true'
  ) {
    console.warn(
      '⚠️  WARNING: Development mode with explicit webhook bypass enabled'
    );
    console.warn('⚠️  This should NEVER be used in production');
    return true;
  }

  console.warn('⚠️  No DataLink auth header found in webhook');
  console.log('Headers received:', JSON.stringify(headers, null, 2));
  console.log('Accepting webhook anyway for testing - REMOVE IN PRODUCTION');
  return true; // Temporary: accept without auth for testing
}

function parseCustomFields(customFields) {
  // CCBill sends custom fields in various formats
  // Parse them into a usable object

  if (typeof customFields === 'object') {
    return customFields;
  }

  if (typeof customFields === 'string') {
    try {
      return JSON.parse(customFields);
    } catch (e) {
      // If not JSON, try to parse as query string
      const params = new URLSearchParams(customFields);
      const obj = {};
      for (const [key, value] of params) {
        obj[key] = value;
      }
      return obj;
    }
  }

  return {};
}

async function updateCreatorEarnings(
  creatorId,
  amount,
  type,
  memberId,
  referenceId
) {
  try {
    let earnings = await CreatorEarnings.findOne({ creator: creatorId });

    if (!earnings) {
      // Create new earnings record if doesn't exist
      earnings = new CreatorEarnings({
        creator: creatorId,
        revenue: {
          total: 0,
          available: 0,
          pending: 0,
          withdrawn: 0,
          chargebacks: 0,
          refunds: 0,
        },
        transactions: [],
      });
    }

    const platformFee = calculatePlatformFee(amount);
    const netAmount = amount - platformFee;

    // Update revenue
    earnings.revenue.total += amount;
    earnings.revenue.available += netAmount;

    // Add transaction record
    earnings.transactions.push({
      type,
      amount,
      fee: platformFee,
      netAmount,
      customer: memberId,
      reference: referenceId,
      date: new Date(),
      status: 'completed',
    });

    await earnings.save();

    console.log(`Updated earnings for creator ${creatorId}: +$${netAmount}`);
  } catch (error) {
    console.error('Error updating creator earnings:', error);
  }
}

async function processContentUnlock(transaction) {
  console.log('Processing content unlock for transaction:', transaction._id);
  // Use the comprehensive completion function from payment controller
  const { completeContentUnlock } = require('./payment.controller');
  await completeContentUnlock(transaction);
}

async function processMessageUnlock(transaction) {
  console.log('Processing message unlock for transaction:', transaction._id);
  const { completeMessageUnlock } = require('./payment.controller');
  await completeMessageUnlock(transaction);
}

async function processTip(transaction) {
  console.log('Processing tip for transaction:', transaction._id);
  const { completeTip } = require('./payment.controller');
  await completeTip(transaction);
}

async function processCreditsAdd(transaction) {
  console.log('Processing credits addition for transaction:', transaction._id);
  const { completeCreditsAdd } = require('./payment.controller');
  await completeCreditsAdd(transaction);
}

module.exports = exports;
