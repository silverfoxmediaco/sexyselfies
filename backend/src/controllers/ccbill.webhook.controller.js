/**
 * CCBill Webhook Controller
 * Handles CCBill DataLink webhook events
 */

const ccbillService = require('../services/ccbill.service');
const Payment = require('../models/Payment');
const Subscription = require('../models/Subscription');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const CreatorEarnings = require('../models/CreatorEarnings');

/**
 * Handle CCBill webhook events
 * @route POST /api/v1/webhooks/ccbill
 */
exports.handleWebhook = async (req, res) => {
  try {
    // Get signature and timestamp from headers
    const signature = req.get('X-CCBill-Signature');
    const timestamp = req.get('X-CCBill-Timestamp');

    // Verify webhook signature
    const isValid = ccbillService.verifyWebhookSignature(
      signature,
      timestamp,
      JSON.stringify(req.body)
    );

    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Parse webhook event
    const event = req.body;
    const eventType = event.eventType || event.event_type;

    console.log('CCBill webhook received:', eventType, event);

    // Route to appropriate handler
    switch (eventType) {
      case 'NewSaleSuccess':
      case 'new_sale_success':
        await handleNewSaleSuccess(event);
        break;

      case 'NewSaleFailure':
      case 'new_sale_failure':
        await handleNewSaleFailure(event);
        break;

      case 'RenewalSuccess':
      case 'renewal_success':
        await handleRenewalSuccess(event);
        break;

      case 'RenewalFailure':
      case 'renewal_failure':
        await handleRenewalFailure(event);
        break;

      case 'Cancellation':
      case 'cancellation':
        await handleCancellation(event);
        break;

      case 'Refund':
      case 'refund':
        await handleRefund(event);
        break;

      case 'Chargeback':
      case 'chargeback':
        await handleChargeback(event);
        break;

      case 'Expiration':
      case 'expiration':
        await handleExpiration(event);
        break;

      default:
        console.log('Unhandled webhook event type:', eventType);
    }

    // Always return 200 to acknowledge receipt
    res.json({
      success: true,
      message: 'Webhook processed'
    });
  } catch (error) {
    console.error('Webhook processing error:', error);

    // Still return 200 to prevent retries
    res.json({
      success: true,
      message: 'Webhook received but processing failed',
      error: error.message
    });
  }
};

/**
 * Handle successful payment
 */
async function handleNewSaleSuccess(event) {
  try {
    const {
      transactionId,
      subscriptionId,
      amount,
      currency,
      customerId,
      email,
      paymentType,
      merchantInvoiceId
    } = event;

    // Find payment by invoice ID
    let payment = await Payment.findById(merchantInvoiceId);

    if (!payment) {
      console.error('Payment not found for invoice:', merchantInvoiceId);
      return;
    }

    // Update payment status
    await payment.markCompleted(transactionId);

    if (subscriptionId) {
      payment.ccbillSubscriptionId = subscriptionId;
      await payment.save();
    }

    // Update creator earnings
    await CreatorEarnings.findOneAndUpdate(
      { creator: payment.creator },
      {
        $inc: {
          totalEarnings: payment.creatorEarnings,
          availableBalance: payment.creatorEarnings,
          totalTransactions: 1
        }
      },
      { upsert: true }
    );

    // If subscription payment, update subscription status
    if (payment.type === 'subscription' && subscriptionId) {
      const subscription = await Subscription.findOne({
        ccbillSubscriptionId: subscriptionId
      });

      if (subscription) {
        await subscription.activate();
        await subscription.recordBilling(amount, transactionId, payment._id);
      }
    }

    // Send success notification
    // TODO: Implement notification service
    console.log('Payment successful:', transactionId);
  } catch (error) {
    console.error('Handle new sale success error:', error);
    throw error;
  }
}

/**
 * Handle failed payment
 */
async function handleNewSaleFailure(event) {
  try {
    const {
      transactionId,
      merchantInvoiceId,
      declineReason,
      declineCode,
      email
    } = event;

    // Find payment by invoice ID
    let payment = await Payment.findById(merchantInvoiceId);

    if (!payment) {
      console.error('Payment not found for invoice:', merchantInvoiceId);
      return;
    }

    // Update payment status
    await payment.markFailed(declineCode, declineReason);

    // Send failure notification
    // TODO: Implement notification service
    console.log('Payment failed:', transactionId, declineReason);
  } catch (error) {
    console.error('Handle new sale failure error:', error);
    throw error;
  }
}

/**
 * Handle subscription renewal success
 */
async function handleRenewalSuccess(event) {
  try {
    const {
      subscriptionId,
      transactionId,
      amount,
      nextBillingDate,
      email
    } = event;

    // Find subscription
    const subscription = await Subscription.findOne({
      ccbillSubscriptionId: subscriptionId
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    // Create renewal payment record
    const payment = new Payment({
      user: subscription.user,
      member: subscription.member,
      creator: subscription.creator,
      amount,
      type: 'subscription',
      ccbillSubscriptionId: subscriptionId,
      ccbillTransactionId: transactionId,
      status: 'completed',
      completedAt: new Date()
    });

    await payment.save();

    // Record billing in subscription
    await subscription.recordBilling(amount, transactionId, payment._id);

    // Update creator earnings
    await CreatorEarnings.findOneAndUpdate(
      { creator: subscription.creator },
      {
        $inc: {
          totalEarnings: payment.creatorEarnings,
          availableBalance: payment.creatorEarnings,
          totalTransactions: 1
        }
      },
      { upsert: true }
    );

    console.log('Subscription renewed:', subscriptionId);
  } catch (error) {
    console.error('Handle renewal success error:', error);
    throw error;
  }
}

/**
 * Handle subscription renewal failure
 */
async function handleRenewalFailure(event) {
  try {
    const {
      subscriptionId,
      declineReason,
      declineCode,
      email
    } = event;

    // Find subscription
    const subscription = await Subscription.findOne({
      ccbillSubscriptionId: subscriptionId
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    // Record failed billing
    await subscription.recordFailedBilling(declineReason);

    // Send failure notification
    // TODO: Implement notification service
    console.log('Subscription renewal failed:', subscriptionId, declineReason);
  } catch (error) {
    console.error('Handle renewal failure error:', error);
    throw error;
  }
}

/**
 * Handle subscription cancellation
 */
async function handleCancellation(event) {
  try {
    const {
      subscriptionId,
      cancellationDate,
      reason,
      email
    } = event;

    // Find subscription
    const subscription = await Subscription.findOne({
      ccbillSubscriptionId: subscriptionId
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    // Cancel subscription
    await subscription.cancel(reason || 'Payment processor cancellation', 'system');

    console.log('Subscription cancelled:', subscriptionId);
  } catch (error) {
    console.error('Handle cancellation error:', error);
    throw error;
  }
}

/**
 * Handle refund
 */
async function handleRefund(event) {
  try {
    const {
      transactionId,
      refundTransactionId,
      amount,
      reason,
      email
    } = event;

    // Find payment by transaction ID
    const payment = await Payment.findOne({
      ccbillTransactionId: transactionId
    });

    if (!payment) {
      console.error('Payment not found for transaction:', transactionId);
      return;
    }

    // Process refund
    await payment.processRefund(reason);

    // Reverse creator earnings
    await CreatorEarnings.findOneAndUpdate(
      { creator: payment.creator },
      {
        $inc: {
          totalEarnings: -payment.creatorEarnings,
          availableBalance: -payment.creatorEarnings,
          totalRefunds: payment.amount
        }
      }
    );

    console.log('Payment refunded:', transactionId);
  } catch (error) {
    console.error('Handle refund error:', error);
    throw error;
  }
}

/**
 * Handle chargeback
 */
async function handleChargeback(event) {
  try {
    const {
      transactionId,
      chargebackAmount,
      reason,
      email
    } = event;

    // Find payment by transaction ID
    const payment = await Payment.findOne({
      ccbillTransactionId: transactionId
    });

    if (!payment) {
      console.error('Payment not found for transaction:', transactionId);
      return;
    }

    // Mark as refunded (chargeback is similar to refund)
    await payment.processRefund(`Chargeback: ${reason}`);

    // Reverse creator earnings and add chargeback fee
    const chargebackFee = 15; // Typical chargeback fee
    await CreatorEarnings.findOneAndUpdate(
      { creator: payment.creator },
      {
        $inc: {
          totalEarnings: -(payment.creatorEarnings + chargebackFee),
          availableBalance: -(payment.creatorEarnings + chargebackFee),
          totalChargebacks: payment.amount + chargebackFee
        }
      }
    );

    console.log('Chargeback processed:', transactionId);
  } catch (error) {
    console.error('Handle chargeback error:', error);
    throw error;
  }
}

/**
 * Handle subscription expiration
 */
async function handleExpiration(event) {
  try {
    const {
      subscriptionId,
      expirationDate,
      email
    } = event;

    // Find subscription
    const subscription = await Subscription.findOne({
      ccbillSubscriptionId: subscriptionId
    });

    if (!subscription) {
      console.error('Subscription not found:', subscriptionId);
      return;
    }

    // Update subscription status
    subscription.status = 'expired';
    subscription.expiresAt = new Date(expirationDate);
    await subscription.save();

    console.log('Subscription expired:', subscriptionId);
  } catch (error) {
    console.error('Handle expiration error:', error);
    throw error;
  }
}

/**
 * Test webhook endpoint (development only)
 * @route POST /api/v1/webhooks/ccbill/test
 */
exports.testWebhook = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Test endpoint not available in production'
    });
  }

  try {
    const event = req.body;
    console.log('Test webhook received:', event);

    res.json({
      success: true,
      message: 'Test webhook received',
      event
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;
