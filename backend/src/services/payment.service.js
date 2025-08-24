// backend/src/services/payment.service.js
// Service for handling all payment and transaction processing with CCBill

const crypto = require('crypto');
const axios = require('axios');
const Transaction = require('../models/Transaction');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const MemberAnalytics = require('../models/MemberAnalytics');
const { sendNotification } = require('./notification.service');
const { trackEvent } = require('./analytics.service');

// CCBill Configuration
const CCBILL_CONFIG = {
  accountNumber: process.env.CCBILL_ACCOUNT_NUMBER,
  subaccessNumber: process.env.CCBILL_SUBACCOUNT_NUMBER,
  salt: process.env.CCBILL_SALT,
  flexFormId: process.env.CCBILL_FLEX_FORM_ID,
  apiUrl: process.env.CCBILL_API_URL || 'https://api.ccbill.com',
  dataLinkUsername: process.env.CCBILL_DATALINK_USERNAME,
  dataLinkPassword: process.env.CCBILL_DATALINK_PASSWORD,
  webhookSecret: process.env.CCBILL_WEBHOOK_SECRET,
  // Platform fee: CCBill takes 15%, we take 20% of remaining
  platformFeePercentage: 0.20
};

// ============================================
// PAYMENT PROCESSING
// ============================================

/**
 * Generate CCBill payment form data
 * This creates the necessary data for the frontend to submit to CCBill
 */
exports.generatePaymentFormData = async (paymentData) => {
  try {
    const {
      memberId,
      creatorId,
      amount,
      type, // 'content_purchase', 'tip', 'special_offer', 'message_unlock'
      contentId = null,
      metadata = {}
    } = paymentData;
    
    // Validate amount - minimum $1.99, no maximum limit
    if (amount < 1.99) {
      throw new Error('Minimum payment amount is $1.99');
    }
    
    // Get member and creator details
    const member = await Member.findById(memberId).populate('user');
    const creator = await Creator.findById(creatorId).populate('user');
    
    if (!member || !creator) {
      throw new Error('Invalid member or creator');
    }
    
    // Generate unique transaction ID for tracking
    const transactionId = `TXN_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    
    // Calculate fees (after CCBill's 15% cut)
    const ccbillFee = amount * 0.15;
    const afterCCBill = amount - ccbillFee;
    const platformFee = afterCCBill * CCBILL_CONFIG.platformFeePercentage;
    const creatorEarnings = afterCCBill - platformFee;
    
    // Create pending transaction record
    const transaction = new Transaction({
      member: memberId,
      creator: creatorId,
      amount,
      type,
      status: 'pending',
      paymentMethod: 'ccbill',
      ccbillTransactionId: transactionId,
      platformFee: platformFee,
      creatorEarnings: creatorEarnings,
      contentId: contentId,
      metadata: {
        ...metadata,
        source: metadata.source || 'direct',
        interactionId: metadata.interactionId,
        ccbillFee: ccbillFee
      },
      createdAt: new Date()
    });
    
    await transaction.save();
    
    // Generate CCBill form digest for security
    const formDigest = this.generateCCBillDigest({
      initialPrice: amount.toFixed(2),
      initialPeriod: this.getInitialPeriod(type),
      clientAccnum: CCBILL_CONFIG.accountNumber,
      clientSubacc: CCBILL_CONFIG.subaccessNumber
    });
    
    // Prepare form data for CCBill
    const formData = {
      clientAccnum: CCBILL_CONFIG.accountNumber,
      clientSubacc: CCBILL_CONFIG.subaccessNumber,
      formName: CCBILL_CONFIG.flexFormId,
      
      // Pricing - one-time payment only
      initialPrice: amount.toFixed(2),
      initialPeriod: this.getInitialPeriod(type),
      currencyCode: '840', // USD
      
      // Customer info
      email: member.user.email,
      username: member.username,
      customerFname: member.user.firstName || '',
      customerLname: member.user.lastName || '',
      
      // Custom pass-through variables (CCBill allows custom1-5)
      custom1: transaction._id.toString(),
      custom2: memberId.toString(),
      custom3: creatorId.toString(),
      custom4: type,
      custom5: contentId || '',
      
      // Security
      formDigest: formDigest,
      
      // Dynamic pricing descriptor
      productDesc: this.getProductDescription(type, creator.username),
      
      // Success/Decline URLs
      successUrl: `${process.env.FRONTEND_URL}/payment/success?tid=${transaction._id}`,
      declineUrl: `${process.env.FRONTEND_URL}/payment/decline?tid=${transaction._id}`
    };
    
    return {
      success: true,
      transactionId: transaction._id,
      formData,
      formUrl: 'https://bill.ccbill.com/jpost/signup.cgi',
      amount: transaction.amount,
      creatorEarnings: creatorEarnings.toFixed(2),
      platformFee: platformFee.toFixed(2)
    };
    
  } catch (error) {
    console.error('Payment form generation error:', error);
    throw error;
  }
};

/**
 * Process CCBill webhook notification
 * Called when CCBill sends payment status updates
 */
exports.processCCBillWebhook = async (webhookData) => {
  try {
    // Verify webhook signature
    if (!this.verifyCCBillWebhook(webhookData)) {
      throw new Error('Invalid webhook signature');
    }
    
    const {
      eventType,
      transactionId,
      subscriptionId,
      custom1, // Our transaction ID
      custom2, // Member ID
      custom3, // Creator ID
      custom4, // Payment type
      custom5, // Content ID
      billedAmount,
      billedCurrency,
      accountingAmount,
      timestamp,
      clientAccnum,
      clientSubacc
    } = webhookData;
    
    // Find the transaction
    const transaction = await Transaction.findById(custom1);
    
    if (!transaction) {
      console.error('Transaction not found for webhook:', custom1);
      return { success: false, error: 'Transaction not found' };
    }
    
    // Handle different event types
    switch (eventType) {
      case 'NewSaleSuccess':
        await this.handleSuccessfulPayment(transaction, webhookData);
        break;
        
      case 'NewSaleFailure':
        await this.handleFailedPayment(transaction, webhookData);
        break;
        
      case 'Chargeback':
        await this.handleChargeback(transaction, webhookData);
        break;
        
      case 'Refund':
        await this.handleRefund(transaction, webhookData);
        break;
        
      default:
        console.log('Unhandled CCBill event type:', eventType);
    }
    
    return { success: true, eventType, transactionId: transaction._id };
    
  } catch (error) {
    console.error('CCBill webhook processing error:', error);
    throw error;
  }
};

/**
 * Handle successful payment from CCBill
 */
exports.handleSuccessfulPayment = async (transaction, webhookData) => {
  try {
    // Update transaction status
    transaction.status = 'completed';
    transaction.ccbillTransactionId = webhookData.transactionId;
    transaction.completedAt = new Date();
    transaction.metadata.ccbillResponse = webhookData;
    
    await transaction.save();
    
    // Update creator earnings
    await this.updateCreatorEarnings(transaction);
    
    // Update member analytics
    await this.updateMemberAnalytics(transaction.member, transaction.amount, transaction.type);
    
    // Send notifications
    await this.notifyPaymentSuccess(transaction);
    
    // Track analytics
    await this.trackPaymentAnalytics(transaction);
    
    // Handle content unlock if applicable
    if (transaction.contentId) {
      await this.unlockContent(transaction.member, transaction.contentId);
    }
    
    return transaction;
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
exports.handleFailedPayment = async (transaction, webhookData) => {
  try {
    transaction.status = 'failed';
    transaction.failureReason = webhookData.reasonForDecline || 'Payment declined';
    transaction.metadata.ccbillResponse = webhookData;
    
    await transaction.save();
    
    // Notify member of failure
    const member = await Member.findById(transaction.member).populate('user');
    await sendNotification(member.user, {
      type: 'payment_failed',
      title: 'Payment Failed',
      body: `Your payment of $${transaction.amount} could not be processed`,
      data: {
        transactionId: transaction._id,
        reason: transaction.failureReason
      }
    });
    
    return transaction;
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
    throw error;
  }
};

/**
 * Process special offer redemption
 */
exports.processSpecialOfferPayment = async (offerId, memberId) => {
  try {
    const SpecialOffer = require('../models/SpecialOffer');
    const offer = await SpecialOffer.findById(offerId).populate('creator');
    
    if (!offer) {
      throw new Error('Offer not found');
    }
    
    // Validate offer
    if (offer.status.current !== 'active') {
      throw new Error('Offer is no longer active');
    }
    
    if (new Date() > offer.validity.endDate) {
      throw new Error('Offer has expired');
    }
    
    // Check if member is eligible
    const isEligible = await this.checkOfferEligibility(offer, memberId);
    
    if (!isEligible) {
      throw new Error('You are not eligible for this offer');
    }
    
    // Calculate discounted price
    const originalPrice = offer.offer.originalPrice || 0;
    const discountedPrice = this.calculateDiscountedPrice(
      originalPrice,
      offer.offer.discount
    );
    
    // Generate payment form for special offer
    const paymentData = await this.generatePaymentFormData({
      memberId,
      creatorId: offer.creator._id,
      amount: discountedPrice,
      type: 'special_offer',
      metadata: {
        offerId: offerId.toString(),
        offerType: offer.offer.type,
        originalPrice,
        discountAmount: originalPrice - discountedPrice,
        source: 'special_offer'
      }
    });
    
    // Mark offer as viewed
    offer.performance.views = (offer.performance.views || 0) + 1;
    await offer.save();
    
    return paymentData;
    
  } catch (error) {
    console.error('Special offer payment error:', error);
    throw error;
  }
};

// ============================================
// CREATOR EARNINGS MANAGEMENT
// ============================================

/**
 * Update creator earnings after successful payment
 */
exports.updateCreatorEarnings = async (transaction) => {
  try {
    const creator = await Creator.findById(transaction.creator);
    
    if (!creator) {
      throw new Error('Creator not found');
    }
    
    // Update creator's balance
    creator.availableBalance = (creator.availableBalance || 0) + transaction.creatorEarnings;
    creator.totalEarnings = (creator.totalEarnings || 0) + transaction.creatorEarnings;
    creator.lastPaymentReceived = new Date();
    
    // Track earnings by type
    if (!creator.earningsByType) {
      creator.earningsByType = {};
    }
    creator.earningsByType[transaction.type] = 
      (creator.earningsByType[transaction.type] || 0) + transaction.creatorEarnings;
    
    await creator.save();
    
    // Update creator analytics if exists
    const CreatorAnalytics = require('../models/CreatorAnalytics');
    const analytics = await CreatorAnalytics.findOne({ creator: transaction.creator });
    
    if (analytics) {
      analytics.revenue.today += transaction.creatorEarnings;
      analytics.revenue.thisWeek += transaction.creatorEarnings;
      analytics.revenue.thisMonth += transaction.creatorEarnings;
      analytics.revenue.total += transaction.creatorEarnings;
      await analytics.save();
    }
    
  } catch (error) {
    console.error('Error updating creator earnings:', error);
    throw error;
  }
};

/**
 * Process creator payout request
 */
exports.processCreatorPayout = async (creatorId, amount, payoutMethod = 'bank_transfer') => {
  try {
    const creator = await Creator.findById(creatorId).populate('user');
    
    if (!creator) {
      throw new Error('Creator not found');
    }
    
    // Check minimum payout amount
    const minimumPayout = 50; // $50 minimum
    if (amount < minimumPayout) {
      throw new Error(`Minimum payout amount is $${minimumPayout}`);
    }
    
    // Check available balance
    if (creator.availableBalance < amount) {
      throw new Error('Insufficient balance');
    }
    
    // Create payout record
    const payout = {
      creatorId,
      amount,
      method: payoutMethod,
      status: 'pending',
      requestedAt: new Date(),
      payoutDetails: {
        bankAccount: creator.payoutDetails?.bankAccount,
        paypalEmail: creator.payoutDetails?.paypalEmail
      }
    };
    
    // Update creator balance
    creator.availableBalance -= amount;
    creator.pendingPayouts = (creator.pendingPayouts || 0) + amount;
    
    if (!creator.payoutHistory) {
      creator.payoutHistory = [];
    }
    creator.payoutHistory.push(payout);
    
    await creator.save();
    
    // Send notification
    await sendNotification(creator.user, {
      type: 'payout_requested',
      title: 'Payout Request Received',
      body: `Your payout request of $${amount} is being processed`,
      data: {
        amount,
        method: payoutMethod,
        estimatedTime: '3-5 business days'
      }
    });
    
    // Send admin notification for manual processing
    // In production, this would integrate with CCBill's payout API
    await this.notifyAdminOfPayoutRequest(creator, amount, payoutMethod);
    
    return {
      success: true,
      amount,
      newBalance: creator.availableBalance,
      status: 'pending',
      estimatedTime: '3-5 business days'
    };
    
  } catch (error) {
    console.error('Payout processing error:', error);
    throw error;
  }
};

// ============================================
// ANALYTICS & TRACKING
// ============================================

/**
 * Update member analytics after payment
 */
exports.updateMemberAnalytics = async (memberId, amount, type) => {
  try {
    let analytics = await MemberAnalytics.findOne({ member: memberId });
    
    if (!analytics) {
      // Create analytics record if doesn't exist
      analytics = new MemberAnalytics({
        member: memberId,
        spending: {
          last24Hours: 0,
          last7Days: 0,
          last30Days: 0,
          last90Days: 0,
          lifetime: 0
        }
      });
    }
    
    // Update spending windows
    analytics.spending.last24Hours += amount;
    analytics.spending.last7Days += amount;
    analytics.spending.last30Days += amount;
    analytics.spending.last90Days += amount;
    analytics.spending.lifetime += amount;
    
    // Update metadata
    analytics.metadata.totalPurchases = (analytics.metadata.totalPurchases || 0) + 1;
    analytics.metadata.lastPurchase = new Date();
    analytics.metadata.averagePurchaseValue = 
      analytics.spending.lifetime / analytics.metadata.totalPurchases;
    
    // Determine spending tier
    if (analytics.spending.last30Days >= 500) {
      analytics.spending.tier = 'whale';
    } else if (analytics.spending.last30Days >= 200) {
      analytics.spending.tier = 'vip';
    } else if (analytics.spending.last30Days >= 50) {
      analytics.spending.tier = 'regular';
    } else if (analytics.spending.last30Days >= 10) {
      analytics.spending.tier = 'occasional';
    } else {
      analytics.spending.tier = 'new';
    }
    
    await analytics.save();
    
    // Recalculate member score
    const { calculateMemberScore } = require('./memberScoring.service');
    await calculateMemberScore(memberId);
    
  } catch (error) {
    console.error('Error updating member analytics:', error);
  }
};

/**
 * Track payment analytics
 */
exports.trackPaymentAnalytics = async (transaction) => {
  try {
    await trackEvent({
      category: 'payment',
      action: transaction.type,
      label: `creator:${transaction.creator}_member:${transaction.member}`,
      value: transaction.amount,
      userId: transaction.member,
      userType: 'member',
      metadata: {
        transactionId: transaction._id,
        creatorId: transaction.creator,
        paymentMethod: transaction.paymentMethod,
        source: transaction.metadata?.source
      }
    });
    
    // Track conversion if from interaction
    if (transaction.metadata?.interactionId) {
      await trackEvent({
        category: 'conversion',
        action: 'interaction_to_purchase',
        label: transaction.metadata.interactionId,
        value: transaction.amount,
        userId: transaction.creator,
        userType: 'creator'
      });
    }
    
  } catch (error) {
    console.error('Error tracking payment analytics:', error);
  }
};

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Notify payment success
 */
exports.notifyPaymentSuccess = async (transaction) => {
  try {
    // Get creator and member details
    const creator = await Creator.findById(transaction.creator).populate('user');
    const member = await Member.findById(transaction.member).populate('user');
    
    // Notify creator
    await sendNotification(creator.user, {
      type: 'payment_received',
      title: '💰 Payment Received!',
      body: `${member.username} just made a purchase of $${transaction.amount}`,
      priority: 'high',
      data: {
        transactionId: transaction._id,
        memberId: transaction.member,
        amount: transaction.amount,
        earnings: transaction.creatorEarnings,
        type: transaction.type
      }
    });
    
    // Notify member
    await sendNotification(member.user, {
      type: 'payment_success',
      title: 'Payment Successful',
      body: `Your payment of $${transaction.amount} has been processed`,
      data: {
        transactionId: transaction._id,
        creatorId: transaction.creator,
        amount: transaction.amount
      }
    });
    
  } catch (error) {
    console.error('Error sending payment notifications:', error);
  }
};

/**
 * Notify admin of payout request
 */
exports.notifyAdminOfPayoutRequest = async (creator, amount, method) => {
  try {
    // This would send notification to admin dashboard
    // In production, integrate with admin notification system
    console.log(`Payout Request: Creator ${creator.username} requested $${amount} via ${method}`);
    
    // Track payout request
    await trackEvent({
      category: 'payout',
      action: 'requested',
      label: `creator:${creator._id}`,
      value: amount,
      userId: creator._id,
      userType: 'creator',
      metadata: {
        method,
        balance: creator.availableBalance
      }
    });
    
  } catch (error) {
    console.error('Error notifying admin of payout:', error);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate CCBill form digest for security
 */
exports.generateCCBillDigest = (params) => {
  const stringToHash = 
    params.initialPrice +
    params.initialPeriod +
    params.clientAccnum +
    params.clientSubacc +
    CCBILL_CONFIG.salt;
  
  return crypto
    .createHash('md5')
    .update(stringToHash)
    .digest('hex');
};

/**
 * Verify CCBill webhook signature
 */
exports.verifyCCBillWebhook = (webhookData) => {
  // CCBill webhook verification
  // In production, implement proper signature verification
  const signature = webhookData.signature || webhookData.responseDigest;
  const expectedSignature = crypto
    .createHash('md5')
    .update(webhookData.transactionId + CCBILL_CONFIG.webhookSecret)
    .digest('hex');
  
  return signature === expectedSignature;
};

/**
 * Get initial period for CCBill based on payment type
 */
exports.getInitialPeriod = (type) => {
  // All payments are one-time, using CCBill's minimum period
  return '2'; // 2 days for one-time purchases (CCBill minimum)
};

/**
 * Get product description for CCBill
 */
exports.getProductDescription = (type, creatorUsername) => {
  switch (type) {
    case 'content_purchase':
      return `Content unlock from ${creatorUsername}`;
    case 'message_unlock':
      return `Private message from ${creatorUsername}`;
    case 'tip':
      return `Tip for ${creatorUsername}`;
    case 'special_offer':
      return `Special offer from ${creatorUsername}`;
    default:
      return `Purchase from ${creatorUsername}`;
  }
};

/**
 * Calculate discounted price
 */
exports.calculateDiscountedPrice = (originalPrice, discount) => {
  if (!discount) return originalPrice;
  
  if (discount.type === 'percentage') {
    return originalPrice * (1 - discount.percentage / 100);
  } else if (discount.type === 'fixed') {
    return Math.max(1.99, originalPrice - discount.fixedAmount); // Minimum $1.99
  }
  return originalPrice;
};

/**
 * Check offer eligibility
 */
exports.checkOfferEligibility = async (offer, memberId) => {
  if (offer.recipients.targetType === 'all') {
    return true;
  }
  
  if (offer.recipients.targetType === 'segment') {
    const analytics = await MemberAnalytics.findOne({ member: memberId });
    return offer.recipients.segments.includes(analytics?.spending.tier || 'new');
  }
  
  if (offer.recipients.targetType === 'specific') {
    return offer.recipients.members.some(m => m.member.toString() === memberId);
  }
  
  return false;
};

/**
 * Unlock content after successful payment
 */
exports.unlockContent = async (memberId, contentId) => {
  try {
    const Content = require('../models/Content');
    const content = await Content.findById(contentId);
    
    if (content) {
      // Add member to unlocked list
      if (!content.unlockedBy) {
        content.unlockedBy = [];
      }
      
      if (!content.unlockedBy.includes(memberId)) {
        content.unlockedBy.push(memberId);
        content.purchaseCount = (content.purchaseCount || 0) + 1;
        await content.save();
      }
      
      // Update member's unlocked content
      const member = await Member.findById(memberId);
      if (!member.unlockedContent) {
        member.unlockedContent = [];
      }
      
      if (!member.unlockedContent.includes(contentId)) {
        member.unlockedContent.push(contentId);
        await member.save();
      }
    }
    
  } catch (error) {
    console.error('Error unlocking content:', error);
  }
};

/**
 * Handle chargeback
 */
exports.handleChargeback = async (transaction, webhookData) => {
  try {
    // Update transaction status
    transaction.status = 'chargeback';
    transaction.chargebackDate = new Date();
    transaction.metadata.chargebackData = webhookData;
    await transaction.save();
    
    // Deduct from creator earnings
    const creator = await Creator.findById(transaction.creator);
    if (creator) {
      creator.availableBalance = Math.max(0, 
        (creator.availableBalance || 0) - transaction.creatorEarnings
      );
      creator.totalChargebacks = (creator.totalChargebacks || 0) + 1;
      creator.chargebackAmount = (creator.chargebackAmount || 0) + transaction.amount;
      await creator.save();
    }
    
    // Flag member for risk
    const member = await Member.findById(transaction.member);
    if (member) {
      member.riskLevel = 'high';
      member.chargebackCount = (member.chargebackCount || 0) + 1;
      await member.save();
    }
    
    // Notify admin
    console.log(`CHARGEBACK ALERT: Transaction ${transaction._id} for $${transaction.amount}`);
    
  } catch (error) {
    console.error('Error handling chargeback:', error);
  }
};

/**
 * Handle refund
 */
exports.handleRefund = async (transaction, webhookData) => {
  try {
    // Update transaction status
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundAmount = webhookData.refundAmount || transaction.amount;
    transaction.metadata.refundData = webhookData;
    await transaction.save();
    
    // Deduct from creator earnings
    const creator = await Creator.findById(transaction.creator);
    if (creator) {
      const refundFromEarnings = transaction.creatorEarnings * 
        (transaction.refundAmount / transaction.amount);
      
      creator.availableBalance = Math.max(0, 
        (creator.availableBalance || 0) - refundFromEarnings
      );
      creator.totalRefunds = (creator.totalRefunds || 0) + 1;
      creator.refundAmount = (creator.refundAmount || 0) + transaction.refundAmount;
      await creator.save();
    }
    
    // Notify member
    const member = await Member.findById(transaction.member).populate('user');
    await sendNotification(member.user, {
      type: 'refund_processed',
      title: 'Refund Processed',
      body: `Your refund of $${transaction.refundAmount} has been processed`,
      data: {
        transactionId: transaction._id,
        amount: transaction.refundAmount
      }
    });
    
  } catch (error) {
    console.error('Error handling refund:', error);
  }
};

/**
 * Get payment statistics for creator
 */
exports.getCreatorPaymentStats = async (creatorId, period = 'all') => {
  try {
    const query = { creator: creatorId, status: 'completed' };
    
    // Add date filter based on period
    if (period !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case 'month':
          startDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case 'year':
          startDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }
    
    const transactions = await Transaction.find(query);
    
    const stats = {
      totalRevenue: 0,
      totalEarnings: 0,
      totalTransactions: transactions.length,
      averageTransaction: 0,
      byType: {}
    };
    
    transactions.forEach(t => {
      stats.totalRevenue += t.amount;
      stats.totalEarnings += t.creatorEarnings;
      
      if (!stats.byType[t.type]) {
        stats.byType[t.type] = {
          count: 0,
          revenue: 0,
          earnings: 0
        };
      }
      
      stats.byType[t.type].count++;
      stats.byType[t.type].revenue += t.amount;
      stats.byType[t.type].earnings += t.creatorEarnings;
    });
    
    if (stats.totalTransactions > 0) {
      stats.averageTransaction = stats.totalRevenue / stats.totalTransactions;
    }
    
    return stats;
    
  } catch (error) {
    console.error('Error getting creator payment stats:', error);
    throw error;
  }
};

// Calculate platform fee
function calculatePlatformFee(amount, type) {
  const feePercentages = {
    content_purchase: 0.20, // 20%
    message_unlock: 0.20, // 20%
    tip: 0.10, // 10%
    special_offer: 0.20, // 20%
  };
  
  const percentage = feePercentages[type] || 0.20;
  // CCBill takes 15%, then we take our percentage of what's left
  const afterCCBill = amount * 0.85;
  return Math.round(afterCCBill * percentage * 100) / 100;
}

module.exports = exports;