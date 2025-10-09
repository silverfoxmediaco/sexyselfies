/**
 * CCBill Payment Controller
 * Handles all payment operations using CCBill REST API
 */

const ccbillService = require('../services/ccbill.service');
const ccbillWidgetService = require('../services/ccbill.widget.service');
const Payment = require('../models/Payment');
const PaymentMethod = require('../models/PaymentMethod');
const Subscription = require('../models/Subscription');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Content = require('../models/Content');
const CreatorEarnings = require('../models/CreatorEarnings');
const Transaction = require('../models/Transaction');

/**
 * Get frontend token for payment form
 * @route GET /api/v1/payments/token
 */
exports.getFrontendToken = async (req, res) => {
  try {
    const tokenData = await ccbillService.getFrontendToken();

    res.json({
      success: true,
      data: tokenData
    });
  } catch (error) {
    console.error('Get frontend token error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate payment token'
    });
  }
};

/**
 * Add payment method
 * @route POST /api/v1/payments/add-method
 */
exports.addPaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const { cardData } = req.body;

    // Validate card data
    if (!cardData || !cardData.cardNumber || !cardData.expiryMonth || !cardData.expiryYear || !cardData.cvv) {
      return res.status(400).json({
        success: false,
        error: 'Missing required card information'
      });
    }

    // Validate card number
    if (!ccbillService.validateCardNumber(cardData.cardNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid card number'
      });
    }

    // Create payment token via CCBill
    const tokenResult = await ccbillService.createPaymentToken({
      ...cardData,
      email: req.user.email
    });

    // Check if payment method already exists
    const existingMethod = await PaymentMethod.findOne({
      user: userId,
      last4: tokenResult.last4,
      cardType: tokenResult.cardType
    });

    if (existingMethod) {
      return res.status(400).json({
        success: false,
        error: 'This payment method already exists'
      });
    }

    // Create payment method record
    const paymentMethod = new PaymentMethod({
      user: userId,
      token: tokenResult.paymentToken,
      last4: tokenResult.last4,
      cardType: tokenResult.cardType,
      expiryMonth: tokenResult.expiryMonth,
      expiryYear: tokenResult.expiryYear,
      isDefault: req.body.setAsDefault || false,
      billingAddress: cardData.billingAddress,
      isVerified: true,
      verifiedAt: new Date()
    });

    await paymentMethod.save();

    // If set as default, update other methods
    if (paymentMethod.isDefault) {
      await paymentMethod.setAsDefault();
    }

    res.json({
      success: true,
      data: {
        paymentMethodId: paymentMethod._id,
        last4: paymentMethod.last4,
        cardType: paymentMethod.cardType,
        expiryDisplay: paymentMethod.expiryDisplay,
        isDefault: paymentMethod.isDefault
      }
    });
  } catch (error) {
    console.error('Add payment method error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to add payment method'
    });
  }
};

/**
 * Get user's payment methods
 * @route GET /api/v1/payments/methods
 */
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user._id;

    const methods = await PaymentMethod.getUserMethods(userId);

    res.json({
      success: true,
      data: methods.map(method => ({
        id: method._id,
        maskedNumber: method.maskedNumber,
        cardType: method.cardType,
        expiryDisplay: method.expiryDisplay,
        isDefault: method.isDefault,
        isExpired: method.isExpired,
        lastUsedAt: method.lastUsedAt
      }))
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment methods'
    });
  }
};

/**
 * Remove payment method
 * @route DELETE /api/v1/payments/methods/:id
 */
exports.removePaymentMethod = async (req, res) => {
  try {
    const userId = req.user._id;
    const methodId = req.params.id;

    const method = await PaymentMethod.findOne({
      _id: methodId,
      user: userId
    });

    if (!method) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Deactivate instead of delete (for audit trail)
    await method.deactivate();

    res.json({
      success: true,
      message: 'Payment method removed successfully'
    });
  } catch (error) {
    console.error('Remove payment method error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove payment method'
    });
  }
};

/**
 * Process tip payment
 * @route POST /api/v1/payments/tip
 */
exports.processTip = async (req, res) => {
  try {
    const userId = req.user._id;
    const { creatorId, amount, paymentMethodId, message } = req.body;

    // Validate amount
    if (!amount || amount < 0.99) {
      return res.status(400).json({
        success: false,
        error: 'Minimum tip amount is $0.99'
      });
    }

    // Get member
    const member = await Member.findOne({ user: userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Get creator
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    // Get payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: userId,
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      member: member._id,
      creator: creatorId,
      amount,
      type: 'tip',
      paymentMethod: paymentMethodId,
      metadata: {
        message,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await payment.save();

    // Charge payment token via CCBill
    const chargeResult = await ccbillService.chargePaymentToken({
      paymentToken: paymentMethod.token,
      amount,
      description: `Tip to ${creator.displayName || creator.username}`,
      invoiceId: payment._id.toString(),
      email: req.user.email
    });

    // Update payment record
    await payment.markCompleted(chargeResult.transactionId);

    // Update payment method last used
    await paymentMethod.markUsed();

    // Update creator earnings
    await CreatorEarnings.findOneAndUpdate(
      { creator: creatorId },
      {
        $inc: {
          totalEarnings: payment.creatorEarnings,
          availableBalance: payment.creatorEarnings
        }
      },
      { upsert: true }
    );

    // Send notification to creator
    // TODO: Implement notification service

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        transactionId: chargeResult.transactionId,
        amount: payment.amount,
        creatorEarnings: payment.creatorEarnings
      }
    });
  } catch (error) {
    console.error('Process tip error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process tip'
    });
  }
};

/**
 * Purchase content (PPV)
 * @route POST /api/v1/payments/purchase
 */
exports.purchaseContent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { contentId, paymentMethodId } = req.body;

    // Get member
    const member = await Member.findOne({ user: userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Get content
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    // Check if already unlocked
    const alreadyUnlocked = content.monetization?.unlocks?.some(
      unlock => unlock.member?.toString() === member._id.toString()
    );

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        error: 'Content already unlocked'
      });
    }

    const amount = content.pricing?.currentPrice || 4.99;

    // Get payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: userId,
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Create payment record
    const payment = new Payment({
      user: userId,
      member: member._id,
      creator: content.creator,
      amount,
      type: 'unlock',
      content: contentId,
      paymentMethod: paymentMethodId,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await payment.save();

    // Charge payment token via CCBill
    const chargeResult = await ccbillService.chargePaymentToken({
      paymentToken: paymentMethod.token,
      amount,
      description: `Unlock content: ${content.title || 'Untitled'}`,
      invoiceId: payment._id.toString(),
      email: req.user.email
    });

    // Update payment record
    await payment.markCompleted(chargeResult.transactionId);

    // Update payment method last used
    await paymentMethod.markUsed();

    // Unlock content for member
    if (!content.monetization) {
      content.monetization = { unlocks: [], totalEarnings: 0 };
    }

    content.monetization.unlocks.push({
      member: member._id,
      unlockedAt: new Date(),
      transactionId: payment._id,
      amount
    });

    content.monetization.totalEarnings += amount;
    await content.save();

    // Add to member's purchased content
    member.purchasedContent.push({
      creator: content.creator,
      content: contentId,
      purchaseDate: new Date(),
      amount
    });
    await member.save();

    // Update creator earnings
    await CreatorEarnings.findOneAndUpdate(
      { creator: content.creator },
      {
        $inc: {
          totalEarnings: payment.creatorEarnings,
          availableBalance: payment.creatorEarnings
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      data: {
        paymentId: payment._id,
        transactionId: chargeResult.transactionId,
        amount: payment.amount,
        contentUnlocked: true
      }
    });
  } catch (error) {
    console.error('Purchase content error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to purchase content'
    });
  }
};

/**
 * Create subscription
 * @route POST /api/v1/payments/subscribe
 */
exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const { creatorId, tier, amount, paymentMethodId, billingCycle } = req.body;

    // Get member
    const member = await Member.findOne({ user: userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member not found'
      });
    }

    // Get creator
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({
      user: userId,
      creator: creatorId,
      status: 'active'
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        error: 'Already subscribed to this creator'
      });
    }

    // Get payment method
    const paymentMethod = await PaymentMethod.findOne({
      _id: paymentMethodId,
      user: userId,
      isActive: true
    });

    if (!paymentMethod) {
      return res.status(404).json({
        success: false,
        error: 'Payment method not found'
      });
    }

    // Calculate billing period in days
    const billingPeriodDays = billingCycle === 'monthly' ? 30 :
                               billingCycle === 'quarterly' ? 90 :
                               billingCycle === 'yearly' ? 365 : 30;

    // Create subscription via CCBill
    const subscriptionResult = await ccbillService.createSubscription({
      paymentToken: paymentMethod.token,
      amount,
      period: billingPeriodDays,
      subscriptionTypeId: tier,
      description: `Subscription to ${creator.displayName || creator.username}`,
      invoiceId: `SUB_${Date.now()}`,
      email: req.user.email
    });

    // Create subscription record
    const subscription = new Subscription({
      member: member._id,
      user: userId,
      creator: creatorId,
      tier,
      amount,
      billingCycle: billingCycle || 'monthly',
      ccbillSubscriptionId: subscriptionResult.subscriptionId,
      paymentMethod: paymentMethodId,
      nextBillingDate: subscriptionResult.nextBillingDate || new Date(Date.now() + billingPeriodDays * 24 * 60 * 60 * 1000)
    });

    await subscription.save();
    await subscription.activate();

    // Create initial payment record
    const payment = new Payment({
      user: userId,
      member: member._id,
      creator: creatorId,
      amount,
      type: 'subscription',
      ccbillSubscriptionId: subscriptionResult.subscriptionId,
      ccbillTransactionId: subscriptionResult.transactionId,
      paymentMethod: paymentMethodId,
      status: 'completed',
      completedAt: new Date()
    });

    await payment.save();

    // Update creator earnings
    await CreatorEarnings.findOneAndUpdate(
      { creator: creatorId },
      {
        $inc: {
          totalEarnings: payment.creatorEarnings,
          availableBalance: payment.creatorEarnings
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      data: {
        subscriptionId: subscription._id,
        ccbillSubscriptionId: subscription.ccbillSubscriptionId,
        amount: subscription.amount,
        nextBillingDate: subscription.nextBillingDate
      }
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create subscription'
    });
  }
};

/**
 * Cancel subscription
 * @route DELETE /api/v1/payments/subscription/:id
 */
exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user._id;
    const subscriptionId = req.params.id;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Subscription is not active'
      });
    }

    // Cancel via CCBill
    await ccbillService.cancelSubscription(subscription.ccbillSubscriptionId);

    // Update subscription record
    await subscription.cancel(req.body.reason || 'User requested cancellation', 'user');

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: {
        subscriptionId: subscription._id,
        cancelledAt: subscription.cancelledAt
      }
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel subscription'
    });
  }
};

/**
 * Get payment history
 * @route GET /api/v1/payments/history
 */
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type, status, limit = 50 } = req.query;

    const payments = await Payment.getUserHistory(userId, {
      type,
      status,
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve payment history'
    });
  }
};

/**
 * Get user subscriptions
 * @route GET /api/v1/payments/subscriptions
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const subscriptions = await Subscription.getUserSubscriptions(userId, status);

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve subscriptions'
    });
  }
};

/**
 * Generate CCBill widget payment URL for credit purchase
 * @route POST /api/v1/payments/ccbill/widget/credits
 */
exports.generateCreditPurchaseURL = async (req, res) => {
  try {
    const userId = req.user._id;
    const { credits, firstName, lastName } = req.body;

    // Validate credits
    if (!credits || credits < 5) {
      return res.status(400).json({
        success: false,
        error: 'Minimum credit purchase is 5 credits ($5.00)'
      });
    }

    // Generate payment URL
    const paymentData = ccbillWidgetService.createCreditPurchaseURL(
      userId,
      credits,
      req.user.email,
      {
        firstName: firstName || req.user.firstName,
        lastName: lastName || req.user.lastName,
        returnUrl: `${process.env.CLIENT_URL}/member/wallet`,
        declineUrl: `${process.env.CLIENT_URL}/member/wallet?status=declined`
      }
    );

    // Create pending transaction record (using Transaction model instead of Payment)
    const transaction = new Transaction({
      user: userId,
      type: 'credit_purchase',
      amount: paymentData.amount,
      credits: paymentData.credits,
      status: 'pending',
      paymentProvider: 'ccbill',
      metadata: {
        transactionId: paymentData.transactionId,
        paymentURL: paymentData.paymentURL,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      }
    });

    await transaction.save();

    res.json({
      success: true,
      data: {
        paymentURL: paymentData.paymentURL,
        transactionId: paymentData.transactionId,
        amount: paymentData.amount,
        credits: paymentData.credits,
        expiresIn: paymentData.expiresIn
      }
    });
  } catch (error) {
    console.error('Generate credit purchase URL error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate payment URL'
    });
  }
};

/**
 * Handle CCBill widget webhook (payment confirmation)
 * @route POST /api/v1/payments/ccbill/widget/webhook
 */
exports.handleWidgetWebhook = async (req, res) => {
  try {
    console.log('CCBill widget webhook received:', req.body);

    // Parse webhook data
    const webhookData = ccbillWidgetService.parseWebhookData(req.body);

    // Verify webhook signature
    if (!ccbillWidgetService.verifyWebhookSignature(req.body)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({
        success: false,
        error: 'Invalid signature'
      });
    }

    // Find the payment record
    const payment = await Payment.findOne({
      'metadata.transactionId': webhookData.transactionId
    });

    if (!payment) {
      console.error('Payment not found for transaction:', webhookData.transactionId);
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Update payment record
    payment.ccbillTransactionId = webhookData.ccbillTransactionId;
    payment.status = 'completed';
    payment.completedAt = new Date();
    await payment.save();

    // Add credits to user
    const Member = require('../models/Member');
    const member = await Member.findOne({ user: payment.user });

    if (member) {
      member.credits = (member.credits || 0) + webhookData.credits;
      await member.save();

      console.log(`✅ Added ${webhookData.credits} credits to user ${payment.user}`);
    }

    // Create transaction record
    const transaction = new Transaction({
      user: payment.user,
      type: 'credit_purchase',
      amount: webhookData.amount,
      credits: webhookData.credits,
      status: 'completed',
      paymentProvider: 'ccbill',
      transactionId: webhookData.ccbillTransactionId,
      metadata: {
        paymentId: payment._id,
        ccbillData: webhookData
      }
    });

    await transaction.save();

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });
  } catch (error) {
    console.error('Widget webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook'
    });
  }
};

module.exports = exports;
