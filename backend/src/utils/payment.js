// Payment utility functions for CCBill integration
const crypto = require('crypto');
const Transaction = require('../models/Transaction');
const CreatorEarnings = require('../models/CreatorEarnings');
const Member = require('../models/Member');
const Creator = require('../models/Creator');

// CCBill configuration
const CCBILL_CONFIG = {
  accountNumber: process.env.CCBILL_ACCOUNT_NUMBER,
  subacc: {
    initial: process.env.CCBILL_SUBACC_INITIAL,
    recurring: process.env.CCBILL_SUBACC_RECURRING,
    credit: process.env.CCBILL_SUBACC_CREDIT
  },
  salt: process.env.CCBILL_SALT,
  flexFormId: process.env.CCBILL_FLEX_FORM_ID,
  dataLink: {
    username: process.env.CCBILL_DATALINK_USERNAME,
    password: process.env.CCBILL_DATALINK_PASSWORD
  }
};

/**
 * Process a payment for content or message unlock
 */
exports.processPayment = async (paymentData) => {
  try {
    const {
      memberId,
      creatorId,
      amount,
      type, // 'content_unlock', 'message_unlock', 'tip', 'credits'
      referenceId,
      paymentMethodId
    } = paymentData;

    // Validate payment amount
    if (amount < 0.99 || amount > 999.99) {
      throw new Error('Invalid payment amount');
    }

    // Check member has sufficient credits or payment method
    const member = await Member.findById(memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }

    // Process based on payment type
    let transaction;
    
    if (member.credits && member.credits >= amount) {
      // Use credits
      transaction = await processWithCredits(member, amount, type, referenceId, creatorId);
    } else {
      // Use CCBill
      transaction = await processWithCCBill(paymentData);
    }

    // Update creator earnings
    if (creatorId) {
      await updateCreatorEarnings(creatorId, amount, type, memberId, referenceId);
    }

    return {
      success: true,
      transaction,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Payment processing error:', error);
    throw error;
  }
};

/**
 * Process payment using member credits
 */
async function processWithCredits(member, amount, type, referenceId, creatorId) {
  // Deduct credits
  member.credits -= amount;
  await member.save();

  // Create transaction record
  const transaction = await Transaction.create({
    member: member._id,
    creator: creatorId,
    amount,
    type,
    status: 'completed',
    paymentMethod: 'credits',
    referenceId,
    completedAt: new Date(),
    processor: 'internal'
  });

  return transaction;
}

/**
 * Process payment using CCBill
 */
async function processWithCCBill(paymentData) {
  const {
    memberId,
    creatorId,
    amount,
    type,
    referenceId
  } = paymentData;

  // Create pending transaction
  const transaction = await Transaction.create({
    member: memberId,
    creator: creatorId,
    amount,
    type,
    status: 'pending',
    paymentMethod: 'ccbill',
    referenceId,
    processor: 'ccbill'
  });

  // Generate CCBill payment URL
  const paymentUrl = generateCCBillPaymentUrl({
    amount,
    transactionId: transaction._id,
    memberId,
    creatorId,
    type
  });

  // In production, you would redirect user to CCBill
  // For now, we'll simulate success
  setTimeout(async () => {
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    transaction.processorTransactionId = 'ccbill_' + Date.now();
    await transaction.save();
  }, 1000);

  return transaction;
}

/**
 * Generate CCBill payment URL
 */
function generateCCBillPaymentUrl(params) {
  const {
    amount,
    transactionId,
    memberId,
    creatorId,
    type
  } = params;

  // Generate form digest for security
  const formString = `${amount}30840${CCBILL_CONFIG.salt}`;
  const formDigest = crypto.createHash('md5').update(formString).digest('hex');

  // Build CCBill URL
  const baseUrl = 'https://api.ccbill.com/wap-frontflex/flexforms';
  const queryParams = new URLSearchParams({
    clientAccnum: CCBILL_CONFIG.accountNumber,
    clientSubacc: CCBILL_CONFIG.subacc.initial,
    flexFormId: CCBILL_CONFIG.flexFormId,
    initialPrice: amount,
    initialPeriod: 30,
    currencyCode: '840', // USD
    formDigest,
    transactionId,
    memberId,
    creatorId,
    type
  });

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Update creator earnings after successful payment
 */
async function updateCreatorEarnings(creatorId, amount, type, memberId, referenceId) {
  try {
    let earnings = await CreatorEarnings.findOne({ creator: creatorId });
    
    if (!earnings) {
      earnings = await CreatorEarnings.create({
        creator: creatorId,
        revenue: {
          total: 0,
          available: 0,
          pending: 0,
          withdrawn: 0
        },
        transactions: []
      });
    }

    // Calculate platform fee (20%)
    const platformFee = amount * 0.20;
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
      status: 'completed'
    });

    // Update daily/weekly/monthly earnings
    const today = new Date();
    earnings.dailyEarnings.today.total += amount;
    earnings.dailyEarnings.today.count += 1;
    
    await earnings.save();

    console.log(`Updated earnings for creator ${creatorId}: +$${netAmount}`);
    
    return earnings;
  } catch (error) {
    console.error('Error updating creator earnings:', error);
    throw error;
  }
}

/**
 * Calculate platform fee
 */
exports.calculatePlatformFee = (amount) => {
  // 20% platform fee
  return amount * 0.20;
};

/**
 * Calculate creator payout
 */
exports.calculateCreatorPayout = (amount) => {
  const fee = exports.calculatePlatformFee(amount);
  return amount - fee;
};

/**
 * Process refund
 */
exports.processRefund = async (transactionId, reason) => {
  try {
    const transaction = await Transaction.findById(transactionId);
    
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.status === 'refunded') {
      throw new Error('Transaction already refunded');
    }

    // Update transaction status
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundReason = reason;
    await transaction.save();

    // Return credits to member if credit payment
    if (transaction.paymentMethod === 'credits') {
      const member = await Member.findById(transaction.member);
      member.credits += transaction.amount;
      await member.save();
    }

    // Deduct from creator earnings
    if (transaction.creator) {
      const earnings = await CreatorEarnings.findOne({ 
        creator: transaction.creator 
      });
      
      if (earnings) {
        const netAmount = exports.calculateCreatorPayout(transaction.amount);
        earnings.revenue.total -= transaction.amount;
        earnings.revenue.available -= netAmount;
        earnings.revenue.refunds = (earnings.revenue.refunds || 0) + transaction.amount;
        await earnings.save();
      }
    }

    // Process refund with CCBill if CCBill payment
    if (transaction.paymentMethod === 'ccbill' && transaction.processorTransactionId) {
      await processCCBillRefund(transaction.processorTransactionId, transaction.amount);
    }

    return {
      success: true,
      message: 'Refund processed successfully'
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    throw error;
  }
};

/**
 * Process CCBill refund
 */
async function processCCBillRefund(ccbillTransactionId, amount) {
  // This would call CCBill's refund API
  console.log(`Processing CCBill refund for transaction ${ccbillTransactionId}`);
  
  // In production:
  // const response = await axios.post('https://datalink.ccbill.com/utils/subscriptionManagement.cgi', {
  //   clientAccnum: CCBILL_CONFIG.accountNumber,
  //   usingSubacc: CCBILL_CONFIG.subacc.initial,
  //   subscriptionId: ccbillTransactionId,
  //   action: 'cancelSubscription',
  //   username: CCBILL_CONFIG.dataLink.username,
  //   password: CCBILL_CONFIG.dataLink.password
  // });
  
  return { success: true };
}

/**
 * Verify CCBill webhook signature
 */
exports.verifyCCBillWebhook = (body, headers) => {
  // CCBill webhook verification
  // This would check the webhook signature against your CCBill configuration
  
  // For development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }
  
  // In production, verify the signature
  const signature = headers['x-ccbill-signature'];
  if (!signature) {
    return false;
  }
  
  // Implement actual signature verification based on CCBill's method
  // This is a simplified example
  const expectedSignature = crypto
    .createHash('md5')
    .update(JSON.stringify(body) + CCBILL_CONFIG.salt)
    .digest('hex');
  
  return signature === expectedSignature;
};

/**
 * Get payment statistics for a creator
 */
exports.getPaymentStats = async (creatorId, period = '30d') => {
  try {
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case '24h':
        startDate.setDate(now.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const transactions = await Transaction.find({
      creator: creatorId,
      status: 'completed',
      completedAt: { $gte: startDate }
    });

    const stats = {
      totalRevenue: 0,
      totalTransactions: transactions.length,
      averageTransaction: 0,
      byType: {
        content_unlock: { count: 0, amount: 0 },
        message_unlock: { count: 0, amount: 0 },
        tip: { count: 0, amount: 0 }
      },
      topSpenders: [],
      dailyRevenue: []
    };

    // Calculate statistics
    transactions.forEach(t => {
      stats.totalRevenue += t.amount;
      
      if (stats.byType[t.type]) {
        stats.byType[t.type].count++;
        stats.byType[t.type].amount += t.amount;
      }
    });

    stats.averageTransaction = stats.totalTransactions > 0 
      ? (stats.totalRevenue / stats.totalTransactions).toFixed(2)
      : 0;

    return stats;
  } catch (error) {
    console.error('Error getting payment stats:', error);
    throw error;
  }
};

/**
 * Process instant payout for creator
 */
exports.processInstantPayout = async (creatorId, amount, accountDetails) => {
  try {
    const creator = await Creator.findById(creatorId);
    
    if (!creator) {
      throw new Error('Creator not found');
    }

    // Check if instant payout is enabled
    const earnings = await CreatorEarnings.findOne({ creator: creatorId });
    
    if (!earnings || !earnings.payouts.instantPayoutEnabled) {
      throw new Error('Instant payout not enabled');
    }

    // Check available balance
    if (amount > earnings.revenue.available) {
      throw new Error('Insufficient available balance');
    }

    // Calculate instant payout fee (2.5%)
    const fee = amount * 0.025;
    const netAmount = amount - fee;

    // Process payout through payment provider
    // This would integrate with your payout provider (CCBill, PayPal, etc.)
    const payoutResult = await processCCBillPayout(creator, netAmount, accountDetails);

    // Update earnings
    earnings.revenue.available -= amount;
    earnings.revenue.withdrawn += netAmount;
    
    // Record payout
    earnings.payouts.history.push({
      amount,
      fee,
      netAmount,
      method: 'instant',
      status: 'completed',
      requestedAt: new Date(),
      processedAt: new Date(),
      transactionId: payoutResult.id,
      accountDetails: {
        ...accountDetails,
        // Mask sensitive data
        accountNumber: accountDetails.accountNumber 
          ? '****' + accountDetails.accountNumber.slice(-4)
          : undefined
      }
    });
    
    earnings.payouts.lastPayoutAt = new Date();
    earnings.payouts.totalPaidOut += netAmount;
    
    await earnings.save();

    return {
      success: true,
      payoutId: payoutResult.id,
      amount: netAmount,
      fee
    };
  } catch (error) {
    console.error('Instant payout error:', error);
    throw error;
  }
};

/**
 * Process CCBill payout
 */
async function processCCBillPayout(creator, amount, accountDetails) {
  // This would integrate with CCBill's payout API
  console.log(`Processing CCBill payout of $${amount} for creator ${creator._id}`);
  
  // Mock response for development
  return {
    id: 'ccbill_payout_' + Date.now(),
    status: 'success'
  };
}

/**
 * Get credit packages
 */
exports.getCreditPackages = () => {
  return [
    {
      id: 'starter',
      credits: 10,
      price: 9.99,
      bonus: 0,
      popular: false,
      savings: null
    },
    {
      id: 'popular',
      credits: 25,
      price: 19.99,
      bonus: 5,
      popular: true,
      savings: '20%'
    },
    {
      id: 'value',
      credits: 50,
      price: 39.99,
      bonus: 15,
      popular: false,
      savings: '30%'
    },
    {
      id: 'premium',
      credits: 100,
      price: 69.99,
      bonus: 40,
      popular: false,
      savings: '40%'
    }
  ];
};

/**
 * Add credits to member account
 */
exports.addCredits = async (memberId, credits) => {
  try {
    const member = await Member.findById(memberId);
    
    if (!member) {
      throw new Error('Member not found');
    }

    member.credits = (member.credits || 0) + credits;
    await member.save();

    return {
      success: true,
      newBalance: member.credits
    };
  } catch (error) {
    console.error('Add credits error:', error);
    throw error;
  }
};

module.exports = exports;