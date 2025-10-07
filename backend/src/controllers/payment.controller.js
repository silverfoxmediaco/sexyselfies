// CCBill-based payment controller (no Stripe)
const crypto = require('crypto');

// Stub imports - these will be created as needed
const Content = require('../models/Content');
const CreatorMessage = require('../models/CreatorMessage');
const CreatorEarnings = require('../models/CreatorEarnings');
const CreatorConnection = require('../models/CreatorConnection');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Transaction = require('../models/Transaction');
const MemberAnalytics = require('../models/MemberAnalytics');
const analyticsService = require('../services/analytics.service');

// Stub utility functions - create these files as needed
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
  clientAccnum: process.env.CCBILL_CLIENT_ACCNUM,
  clientSubacc: process.env.CCBILL_CLIENT_SUBACC,
  formName: process.env.CCBILL_FORM_NAME,
  salt: process.env.CCBILL_SALT,
  flexFormId: process.env.CCBILL_FLEX_FORM_ID,
  currencyCode: '840', // USD
  baseUrl:
    process.env.NODE_ENV === 'production'
      ? 'https://api.ccbill.com/wap-frontflex/flexforms/'
      : 'https://sandbox-api.ccbill.com/wap-frontflex/flexforms/',
  webhookUrl: `${process.env.BACKEND_URL || 'https://your-domain.com'}/api/webhooks/ccbill`,
  approvalUrl: `${process.env.FRONTEND_URL}/payment/success`,
  declineUrl: `${process.env.FRONTEND_URL}/payment/failed`,
};

// Generate CCBill payment link
exports.createPaymentLink = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { amount, type, referenceId, description } = req.body;

    // Validate amount
    if (amount < 2.95 || amount > 100) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be between $2.95 and $100',
      });
    }

    // Create pending transaction record
    const transaction = new Transaction({
      member: memberId,
      amount,
      type, // content_unlock, message_unlock, tip, credits
      status: 'pending',
      referenceId,
      currency: 'USD',
      processor: 'ccbill',
    });

    await transaction.save();

    // Generate CCBill form digest for security
    const formDigest = generateCCBillDigest({
      initialPrice: amount,
      initialPeriod: 30, // One-time purchase
      currencyCode: '840', // USD
      transactionId: transaction._id.toString(),
    });

    // Build CCBill payment URL
    const paymentUrl = buildCCBillUrl({
      initialPrice: amount,
      initialPeriod: 30,
      formDigest,
      customFields: {
        transactionId: transaction._id.toString(),
        memberId,
        type,
        referenceId,
      },
    });

    res.json({
      success: true,
      paymentUrl,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Create payment link error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating payment link',
    });
  }
};

// Process content unlock payment
exports.processContentUnlock = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { contentId } = req.body;

    // Get content
    const content = await Content.findById(contentId);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Check if already unlocked
    const alreadyUnlocked = content.monetization?.unlocks?.find(
      u => u.member?.toString() === memberId
    );

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Content already unlocked',
      });
    }

    // Create payment link for content
    const amount = content.pricing?.currentPrice || 4.99;

    // Create transaction
    const transaction = new Transaction({
      member: memberId,
      creator: content.creator,
      amount,
      type: 'content_unlock',
      status: 'pending',
      referenceId: contentId,
      processor: 'ccbill',
    });

    await transaction.save();

    // Generate payment URL with member data
    const member = await Member.findById(memberId).populate('user');
    const paymentUrl = buildCCBillUrl({
      initialPrice: amount,
      initialPeriod: 30,
      formDigest: generateCCBillDigest({
        initialPrice: amount,
        initialPeriod: 30,
        currencyCode: CCBILL_CONFIG.currencyCode,
      }),
      transactionId: transaction._id.toString(),
      memberId,
      contentType: 'content_unlock',
      referenceId: contentId,
      customerData: {
        firstName: member?.profile?.firstName || 'Member',
        lastName: member?.profile?.lastName || 'User',
        email: member?.user?.email || '',
      },
    });

    res.json({
      success: true,
      paymentUrl,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Process content unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
    });
  }
};

// Process content unlock with TEST CREDITS (Development/QA)
exports.processContentUnlockWithTestCredits = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { contentId } = req.body;

    // Get member
    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Get content
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Check if already unlocked
    const alreadyUnlocked = content.monetization?.unlocks?.find(
      u => u.member?.toString() === memberId
    );

    if (alreadyUnlocked) {
      return res.status(400).json({
        success: false,
        message: 'Content already unlocked',
      });
    }

    const amount = content.pricing?.currentPrice || 4.99;

    // Check test credits balance
    if (member.testCredits < amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient test credits. You have $${member.testCredits.toFixed(2)}, need $${amount.toFixed(2)}`,
        availableTestCredits: member.testCredits,
        requiredAmount: amount,
      });
    }

    // Deduct test credits
    member.testCredits -= amount;
    await member.save();

    // Create test transaction
    const transaction = new Transaction({
      transactionId: `TEST_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      memberId: memberId,
      creatorId: content.creator,
      creator: content.creator,
      amount,
      type: 'content_unlock',
      contentId: contentId,
      status: 'completed',
      paymentMethod: 'test_credits',
      isTestTransaction: true,
      creatorEarnings: amount * 0.8, // 80% to creator (for testing calculations)
      platformFee: 0.2,
      paymentDetails: {
        walletBalanceBefore: member.testCredits + amount,
        walletBalanceAfter: member.testCredits,
      },
      unlockDetails: {
        unlockedAt: new Date(),
        viewCount: 0,
      },
      analytics: {
        source: req.body.source || 'test',
        memberSegment: 'test',
      },
      metadata: {
        ip: req.ip,
        userAgent: req.get('user-agent'),
        notes: 'Test credit transaction - NOT REAL MONEY',
      },
    });

    await transaction.save();

    // Add member to content unlocks
    if (!content.monetization) {
      content.monetization = { unlocks: [], totalEarnings: 0 };
    }

    content.monetization.unlocks.push({
      member: memberId,
      unlockedAt: new Date(),
      transactionId: transaction._id,
      amount: amount,
    });

    content.monetization.totalEarnings += amount;
    await content.save();

    // Add to member's purchased content for Library
    member.purchasedContent.push({
      creator: content.creator,
      content: contentId,
      purchaseDate: new Date(),
      amount: amount,
    });
    await member.save();

    // Update creator earnings (mark as test)
    const creatorEarnings = await CreatorEarnings.findOneAndUpdate(
      { creator: content.creator },
      {
        $inc: {
          availableBalance: amount * 0.8,
          lifetimeEarnings: amount * 0.8,
          testEarnings: amount * 0.8, // Track test earnings separately
        },
        $push: {
          transactions: {
            type: 'content_unlock',
            amount: amount * 0.8,
            transactionId: transaction._id,
            isTest: true,
            createdAt: new Date(),
          },
        },
      },
      { upsert: true, new: true }
    );

    // Track analytics event for purchase
    try {
      await analyticsService.trackEvent({
        category: 'conversion',
        action: 'content_unlock',
        label: `test_credits`,
        value: amount,
        userId: content.creator,
        userType: 'creator',
        metadata: {
          contentId: contentId,
          contentType: content.type,
          memberId: memberId,
          amount: amount,
          paymentMethod: 'test_credits',
          isTestTransaction: true,
          source: req.body.source || 'browse',
        },
      });
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
      // Don't fail the purchase if analytics fails
    }

    // Update member analytics
    try {
      await MemberAnalytics.findOneAndUpdate(
        { member: memberId },
        {
          $inc: {
            'spending.totalSpent': amount,
            'spending.contentPurchases': 1,
            'engagement.contentUnlocks': 1,
          },
          $set: {
            'spending.lastPurchaseDate': new Date(),
          },
          $push: {
            'spending.purchaseHistory': {
              date: new Date(),
              amount: amount,
              type: 'content_unlock',
              contentId: contentId,
              creatorId: content.creator,
              isTestTransaction: true,
            },
          },
        },
        { upsert: true, new: true }
      );
    } catch (memberAnalyticsError) {
      console.error('Member analytics update error:', memberAnalyticsError);
      // Don't fail the purchase if analytics fails
    }

    console.log(
      `✅ TEST CREDIT unlock - Member ${memberId} unlocked content ${contentId} for $${amount}. Balance: $${member.testCredits}`
    );

    res.json({
      success: true,
      message: `Content unlocked with test credits! Remaining: $${member.testCredits.toFixed(2)}`,
      data: {
        transactionId: transaction._id,
        isTestTransaction: true,
        amountCharged: amount,
        remainingTestCredits: member.testCredits,
        content: {
          _id: content._id,
          title: content.title,
          type: content.type,
          mediaUrl: content.mediaUrl,
        },
      },
    });
  } catch (error) {
    console.error('Process test credit unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing test credit unlock',
      error: error.message,
    });
  }
};

// Process message unlock payment
exports.processMessageUnlock = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { messageId } = req.body;

    // Get message
    const message = await CreatorMessage.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found',
      });
    }

    // Verify member is recipient
    if (message.member?.toString() !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if already unlocked
    if (message.purchase?.status === 'unlocked') {
      return res.status(400).json({
        success: false,
        message: 'Message already unlocked',
      });
    }

    const amount = message.pricing?.price || 2.99;

    // Create transaction
    const transaction = new Transaction({
      member: memberId,
      creator: message.creator,
      amount,
      type: 'message_unlock',
      status: 'pending',
      referenceId: messageId,
      processor: 'ccbill',
    });

    await transaction.save();

    // Generate payment URL
    const paymentUrl = buildCCBillUrl({
      initialPrice: amount,
      initialPeriod: 30,
      formDigest: generateCCBillDigest({
        initialPrice: amount,
        initialPeriod: 30,
        currencyCode: '840',
        transactionId: transaction._id.toString(),
      }),
      customFields: {
        transactionId: transaction._id.toString(),
        messageId,
        memberId,
        creatorId: message.creator.toString(),
      },
    });

    res.json({
      success: true,
      paymentUrl,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Process message unlock error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing payment',
    });
  }
};

// Process tip payment
exports.processTip = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { creatorId, amount, message } = req.body;

    // Validate tip amount
    if (amount < 1 || amount > 500) {
      return res.status(400).json({
        success: false,
        message: 'Tip must be between $1 and $500',
      });
    }

    // Create transaction
    const transaction = new Transaction({
      member: memberId,
      creator: creatorId,
      amount,
      type: 'tip',
      status: 'pending',
      message,
      processor: 'ccbill',
    });

    await transaction.save();

    // Generate payment URL
    const paymentUrl = buildCCBillUrl({
      initialPrice: amount,
      initialPeriod: 30,
      formDigest: generateCCBillDigest({
        initialPrice: amount,
        initialPeriod: 30,
        currencyCode: '840',
        transactionId: transaction._id.toString(),
      }),
      customFields: {
        transactionId: transaction._id.toString(),
        memberId,
        creatorId,
        tipMessage: message || '',
      },
    });

    res.json({
      success: true,
      paymentUrl,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Process tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing tip',
    });
  }
};

// Add credits to account
exports.addCredits = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { packageId } = req.body;

    // Get credit package
    const packages = getCreditPackages();
    const selectedPackage = packages.find(p => p.id === packageId);

    if (!selectedPackage) {
      return res.status(400).json({
        success: false,
        message: 'Invalid package',
      });
    }

    // Create transaction
    const transaction = new Transaction({
      member: memberId,
      amount: selectedPackage.price,
      type: 'credits',
      status: 'pending',
      credits: selectedPackage.credits + (selectedPackage.bonus || 0),
      processor: 'ccbill',
    });

    await transaction.save();

    // Generate payment URL
    const paymentUrl = buildCCBillUrl({
      initialPrice: selectedPackage.price,
      initialPeriod: 30,
      formDigest: generateCCBillDigest({
        initialPrice: selectedPackage.price,
        initialPeriod: 30,
        currencyCode: '840',
        transactionId: transaction._id.toString(),
      }),
      customFields: {
        transactionId: transaction._id.toString(),
        memberId,
        packageId,
        credits: selectedPackage.credits + (selectedPackage.bonus || 0),
      },
    });

    res.json({
      success: true,
      paymentUrl,
      transactionId: transaction._id,
    });
  } catch (error) {
    console.error('Add credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding credits',
    });
  }
};

// Confirm payment (called by webhook)
exports.confirmPayment = async (req, res) => {
  try {
    const { transactionId, ccbillTransactionId, status } = req.body;

    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    if (status === 'approved') {
      transaction.status = 'completed';
      transaction.completedAt = new Date();
      transaction.processorTransactionId = ccbillTransactionId;

      await transaction.save();

      // Process based on transaction type
      switch (transaction.type) {
        case 'content_unlock':
          await completeContentUnlock(transaction);
          break;
        case 'message_unlock':
          await completeMessageUnlock(transaction);
          break;
        case 'tip':
          await completeTip(transaction);
          break;
        case 'credits':
          await completeCreditsAdd(transaction);
          break;
      }

      res.json({
        success: true,
        message: 'Payment confirmed',
        transaction,
      });
    } else {
      transaction.status = 'failed';
      transaction.failedAt = new Date();
      await transaction.save();

      res.status(400).json({
        success: false,
        message: 'Payment failed',
      });
    }
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Error confirming payment',
    });
  }
};

// Get credit packages
exports.getCreditPackages = async (req, res) => {
  try {
    const packages = getCreditPackages();

    res.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('Get credit packages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching packages',
    });
  }
};

// Get payment methods (for CCBill, this might be saved cards if supported)
exports.getPaymentMethods = async (req, res) => {
  try {
    // CCBill doesn't typically store payment methods like Stripe
    // This would depend on your CCBill configuration
    res.json({
      success: true,
      methods: [],
      message: 'Payment methods handled by CCBill',
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching payment methods',
    });
  }
};

// Stub methods for routes that need them
exports.createPaymentIntent = exports.createPaymentLink;
exports.addPaymentMethod = async (req, res) => {
  res.json({ success: true, message: 'Payment methods handled by CCBill' });
};
exports.removePaymentMethod = async (req, res) => {
  res.json({ success: true, message: 'Payment methods handled by CCBill' });
};
exports.setDefaultPaymentMethod = async (req, res) => {
  res.json({ success: true, message: 'Payment methods handled by CCBill' });
};
exports.requestPayout = async (req, res) => {
  res.json({ success: true, message: 'Payout request received' });
};
exports.getPayoutMethods = async (req, res) => {
  res.json({ success: true, methods: [] });
};
exports.addPayoutMethod = async (req, res) => {
  res.json({ success: true, message: 'Payout method added' });
};
exports.getPayoutHistory = async (req, res) => {
  res.json({ success: true, history: [] });
};
exports.getPayoutSchedule = async (req, res) => {
  res.json({ success: true, schedule: {} });
};
exports.enableInstantPayouts = async (req, res) => {
  res.json({ success: true, message: 'Instant payouts enabled' });
};
exports.getTransactionHistory = async (req, res) => {
  res.json({ success: true, transactions: [] });
};
exports.getTransaction = async (req, res) => {
  res.json({ success: true, transaction: {} });
};
exports.downloadTransactionReport = async (req, res) => {
  res.json({ success: true, message: 'Report generation started' });
};
exports.requestRefund = async (req, res) => {
  res.json({ success: true, message: 'Refund request received' });
};
exports.getRefundStatus = async (req, res) => {
  res.json({ success: true, status: 'pending' });
};
exports.handleChargeback = async (req, res) => {
  res.json({ success: true, message: 'Chargeback handled' });
};
exports.getPaymentAnalytics = async (req, res) => {
  res.json({ success: true, analytics: {} });
};
exports.getRevenueReport = async (req, res) => {
  res.json({ success: true, report: {} });
};
exports.getCustomerAnalytics = async (req, res) => {
  res.json({ success: true, analytics: {} });
};
exports.applyPromoCode = async (req, res) => {
  res.json({ success: true, message: 'Promo code applied' });
};
exports.validatePromoCode = async (req, res) => {
  res.json({ success: true, valid: true });
};
exports.createPromoCode = async (req, res) => {
  res.json({ success: true, code: 'PROMO123' });
};
exports.getWalletBalance = async (req, res) => {
  res.json({ success: true, balance: 0 });
};
exports.getWalletTransactions = async (req, res) => {
  res.json({ success: true, transactions: [] });
};
exports.transferFunds = async (req, res) => {
  res.json({ success: true, message: 'Transfer completed' });
};
exports.exportTransactions = async (req, res) => {
  res.json({ success: true, message: 'Export started' });
};
exports.disputeTransaction = async (req, res) => {
  res.json({ success: true, message: 'Dispute filed' });
};
exports.getSubscriptionPlans = async (req, res) => {
  res.json({ success: true, plans: [] });
};
exports.createSubscription = async (req, res) => {
  res.json({ success: true, message: 'Subscription created' });
};
exports.cancelSubscription = async (req, res) => {
  res.json({ success: true, message: 'Subscription cancelled' });
};
exports.updateSubscription = async (req, res) => {
  res.json({ success: true, message: 'Subscription updated' });
};
exports.getTaxInfo = async (req, res) => {
  res.json({ success: true, taxInfo: {} });
};
exports.submitTaxForms = async (req, res) => {
  res.json({ success: true, message: 'Tax forms submitted' });
};
exports.getTaxDocuments = async (req, res) => {
  res.json({ success: true, documents: [] });
};
exports.getPlatformFees = async (req, res) => {
  res.json({
    success: true,
    fees: {
      platform: 0.2, // 20%
      processing: 0.029, // 2.9%
      fixed: 0.3, // $0.30
    },
  });
};
exports.calculateFees = async (req, res) => {
  const { amount } = req.body;
  const platformFee = amount * 0.2;
  const processingFee = amount * 0.029 + 0.3;
  const total = platformFee + processingFee;
  const netAmount = amount - total;

  res.json({
    success: true,
    amount,
    platformFee,
    processingFee,
    totalFees: total,
    netAmount,
  });
};
exports.getExchangeRates = async (req, res) => {
  res.json({
    success: true,
    rates: {
      USD: 1.0,
      EUR: 0.85,
      GBP: 0.73,
      CAD: 1.25,
    },
  });
};

// Helper functions

function generateCCBillDigest(params) {
  const { initialPrice, initialPeriod, currencyCode } = params;
  const formString = `${initialPrice}${initialPeriod}${currencyCode}${CCBILL_CONFIG.salt}`;
  return crypto.createHash('md5').update(formString).digest('hex');
}

// Validate CCBill webhook signature
function validateCCBillSignature(body, signature) {
  if (!CCBILL_CONFIG.salt || !signature) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', CCBILL_CONFIG.salt)
    .update(JSON.stringify(body))
    .digest('hex');

  return expectedSignature === signature;
}

function buildCCBillUrl(params) {
  const queryParams = new URLSearchParams({
    clientAccnum: CCBILL_CONFIG.clientAccnum,
    clientSubacc: CCBILL_CONFIG.clientSubacc,
    formName: CCBILL_CONFIG.formName,
    flexFormId: CCBILL_CONFIG.flexFormId,
    initialPrice: params.initialPrice,
    initialPeriod: params.initialPeriod,
    currencyCode: CCBILL_CONFIG.currencyCode,
    formDigest: params.formDigest,
    // CCBill standard callback URLs
    approvalUrl: CCBILL_CONFIG.approvalUrl,
    declineUrl: CCBILL_CONFIG.declineUrl,
    // Custom fields for transaction tracking
    customer_fname: params.customerData?.firstName || '',
    customer_lname: params.customerData?.lastName || '',
    email: params.customerData?.email || '',
    // Pass transaction data
    transactionId: params.transactionId,
    memberId: params.memberId,
    contentType: params.contentType || params.type,
    referenceId: params.referenceId,
  });

  return `${CCBILL_CONFIG.baseUrl}${CCBILL_CONFIG.flexFormId}?${queryParams.toString()}`;
}

async function completeContentUnlock(transaction) {
  try {
    console.log('Completing content unlock:', transaction._id);

    // 1. Get the content
    const content = await Content.findById(transaction.referenceId);
    if (!content) {
      throw new Error('Content not found');
    }

    // 2. Add member to content unlocks
    if (!content.monetization) {
      content.monetization = { unlocks: [], totalEarnings: 0 };
    }

    // Check if already unlocked (safety check)
    const existingUnlock = content.monetization.unlocks.find(
      u => u.member?.toString() === transaction.member.toString()
    );

    if (!existingUnlock) {
      content.monetization.unlocks.push({
        member: transaction.member,
        unlockedAt: new Date(),
        paidAmount: transaction.amount,
        transactionId: transaction._id,
        deviceInfo: {
          ip: transaction.metadata?.ip,
          userAgent: transaction.metadata?.userAgent,
        },
      });

      content.monetization.totalEarnings += transaction.amount;
      content.analytics.sales.count += 1;
      content.analytics.sales.revenue += transaction.amount;

      await content.save();
    }

    // 3. Update Creator Earnings
    let creatorEarnings = await CreatorEarnings.findOne({
      creator: transaction.creator,
    });

    if (!creatorEarnings) {
      // Create new earnings record if doesn't exist
      creatorEarnings = new CreatorEarnings({
        creator: transaction.creator,
        creatorProfile: transaction.creator, // This might need adjustment based on your schema
      });
    }

    // Update real-time metrics
    const today = new Date();
    const isToday =
      creatorEarnings.realTimeMetrics.todayEarnings.lastUpdated.toDateString() ===
      today.toDateString();

    if (isToday) {
      creatorEarnings.realTimeMetrics.todayEarnings.amount +=
        transaction.creatorEarnings;
      creatorEarnings.realTimeMetrics.todayEarnings.transactionCount += 1;
    } else {
      // Reset for new day
      creatorEarnings.realTimeMetrics.todayEarnings = {
        amount: transaction.creatorEarnings,
        transactionCount: 1,
        lastUpdated: today,
        hourlyBreakdown: [],
        comparedToYesterday: {
          percentage: 0,
          difference: 0,
          trend: 'stable',
        },
      };
    }

    // Update earnings breakdown by source
    creatorEarnings.earningsBreakdown.bySource.contentSales.amount +=
      transaction.creatorEarnings;
    creatorEarnings.earningsBreakdown.bySource.contentSales.count += 1;

    // Update lifetime earnings
    creatorEarnings.analytics.lifetimeEarnings += transaction.creatorEarnings;

    // Update pending payout amount
    creatorEarnings.payouts.pending.amount += transaction.creatorEarnings;
    creatorEarnings.payouts.pending.netAmount =
      creatorEarnings.payouts.pending.amount -
      (creatorEarnings.payouts.pending.processingFee || 0);

    // Update daily goal progress
    if (creatorEarnings.goals.daily.target > 0) {
      creatorEarnings.goals.daily.achieved += transaction.creatorEarnings;
      creatorEarnings.goals.daily.percentage =
        (creatorEarnings.goals.daily.achieved /
          creatorEarnings.goals.daily.target) *
        100;
    }

    // Update monthly goal progress
    if (creatorEarnings.goals.monthly.target > 0) {
      creatorEarnings.goals.monthly.achieved += transaction.creatorEarnings;
      creatorEarnings.goals.monthly.percentage =
        (creatorEarnings.goals.monthly.achieved /
          creatorEarnings.goals.monthly.target) *
        100;
    }

    await creatorEarnings.save();

    // 4. Update transaction with unlock details
    transaction.unlockDetails = {
      unlockedAt: new Date(),
      viewCount: 0,
      deviceInfo: {
        ip: transaction.metadata?.ip,
        userAgent: transaction.metadata?.userAgent,
        deviceType: transaction.metadata?.deviceType,
      },
    };

    await transaction.save();

    // 5. Send notifications
    await sendNotification(transaction.creator, {
      type: 'content_sold',
      message: `Your content earned $${transaction.creatorEarnings.toFixed(2)}!`,
      amount: transaction.creatorEarnings,
      contentId: transaction.referenceId,
      buyerId: transaction.member,
    });

    await sendNotification(transaction.member, {
      type: 'content_unlocked',
      message: 'Content unlocked! You can now view it.',
      contentId: transaction.referenceId,
      creatorId: transaction.creator,
    });

    console.log(
      `✅ Content unlock completed: $${transaction.amount} -> Creator gets $${transaction.creatorEarnings}`
    );
  } catch (error) {
    console.error('❌ Error completing content unlock:', error);
    throw error;
  }
}

async function completeMessageUnlock(transaction) {
  try {
    console.log('Completing message unlock:', transaction._id);

    // 1. Get the message
    const message = await CreatorMessage.findById(transaction.referenceId);
    if (!message) {
      throw new Error('Message not found');
    }

    // 2. Update message unlock status
    message.purchase = {
      status: 'unlocked',
      unlockedAt: new Date(),
      paidAmount: transaction.amount,
      transactionId: transaction._id,
    };

    await message.save();

    // 3. Update Creator Earnings (similar to content unlock)
    let creatorEarnings = await CreatorEarnings.findOne({
      creator: transaction.creator,
    });

    if (!creatorEarnings) {
      creatorEarnings = new CreatorEarnings({
        creator: transaction.creator,
        creatorProfile: transaction.creator,
      });
    }

    // Update earnings breakdown by source
    creatorEarnings.earningsBreakdown.bySource.messages.amount +=
      transaction.creatorEarnings;
    creatorEarnings.earningsBreakdown.bySource.messages.count += 1;

    // Update real-time metrics
    const today = new Date();
    const isToday =
      creatorEarnings.realTimeMetrics.todayEarnings.lastUpdated.toDateString() ===
      today.toDateString();

    if (isToday) {
      creatorEarnings.realTimeMetrics.todayEarnings.amount +=
        transaction.creatorEarnings;
      creatorEarnings.realTimeMetrics.todayEarnings.transactionCount += 1;
    } else {
      creatorEarnings.realTimeMetrics.todayEarnings = {
        amount: transaction.creatorEarnings,
        transactionCount: 1,
        lastUpdated: today,
        hourlyBreakdown: [],
        comparedToYesterday: { percentage: 0, difference: 0, trend: 'stable' },
      };
    }

    creatorEarnings.analytics.lifetimeEarnings += transaction.creatorEarnings;
    creatorEarnings.payouts.pending.amount += transaction.creatorEarnings;

    await creatorEarnings.save();

    // 4. Send notifications
    await sendNotification(transaction.creator, {
      type: 'message_sold',
      message: `Your message earned $${transaction.creatorEarnings.toFixed(2)}!`,
      amount: transaction.creatorEarnings,
      messageId: transaction.referenceId,
      buyerId: transaction.member,
    });

    await sendNotification(transaction.member, {
      type: 'message_unlocked',
      message: 'Message unlocked! You can now view the content.',
      messageId: transaction.referenceId,
      creatorId: transaction.creator,
    });

    console.log(
      `✅ Message unlock completed: $${transaction.amount} -> Creator gets $${transaction.creatorEarnings}`
    );
  } catch (error) {
    console.error('❌ Error completing message unlock:', error);
    throw error;
  }
}

async function completeTip(transaction) {
  try {
    console.log('Completing tip:', transaction._id);

    // 1. Update Creator Earnings
    let creatorEarnings = await CreatorEarnings.findOne({
      creator: transaction.creator,
    });

    if (!creatorEarnings) {
      creatorEarnings = new CreatorEarnings({
        creator: transaction.creator,
        creatorProfile: transaction.creator,
      });
    }

    // Update earnings breakdown by source
    creatorEarnings.earningsBreakdown.bySource.tips.amount +=
      transaction.creatorEarnings;
    creatorEarnings.earningsBreakdown.bySource.tips.count += 1;

    // Update real-time metrics
    const today = new Date();
    const isToday =
      creatorEarnings.realTimeMetrics.todayEarnings.lastUpdated.toDateString() ===
      today.toDateString();

    if (isToday) {
      creatorEarnings.realTimeMetrics.todayEarnings.amount +=
        transaction.creatorEarnings;
      creatorEarnings.realTimeMetrics.todayEarnings.transactionCount += 1;
    } else {
      creatorEarnings.realTimeMetrics.todayEarnings = {
        amount: transaction.creatorEarnings,
        transactionCount: 1,
        lastUpdated: today,
        hourlyBreakdown: [],
        comparedToYesterday: { percentage: 0, difference: 0, trend: 'stable' },
      };
    }

    creatorEarnings.analytics.lifetimeEarnings += transaction.creatorEarnings;
    creatorEarnings.payouts.pending.amount += transaction.creatorEarnings;

    // Update daily and monthly goals
    if (creatorEarnings.goals.daily.target > 0) {
      creatorEarnings.goals.daily.achieved += transaction.creatorEarnings;
      creatorEarnings.goals.daily.percentage =
        (creatorEarnings.goals.daily.achieved /
          creatorEarnings.goals.daily.target) *
        100;
    }

    if (creatorEarnings.goals.monthly.target > 0) {
      creatorEarnings.goals.monthly.achieved += transaction.creatorEarnings;
      creatorEarnings.goals.monthly.percentage =
        (creatorEarnings.goals.monthly.achieved /
          creatorEarnings.goals.monthly.target) *
        100;
    }

    await creatorEarnings.save();

    // 2. Create tip record in connections if applicable
    const connection = await CreatorConnection.findOne({
      creator: transaction.creator,
      member: transaction.member,
    });

    if (connection) {
      if (!connection.tips) connection.tips = [];
      connection.tips.push({
        amount: transaction.amount,
        creatorEarnings: transaction.creatorEarnings,
        message: transaction.message,
        transactionId: transaction._id,
        createdAt: new Date(),
      });
      await connection.save();
    }

    // 3. Send notifications
    await sendNotification(transaction.creator, {
      type: 'tip_received',
      message: `You received a $${transaction.creatorEarnings.toFixed(2)} tip! ${transaction.message ? '"' + transaction.message + '"' : ''}`,
      amount: transaction.creatorEarnings,
      tipperId: transaction.member,
      tipMessage: transaction.message,
    });

    await sendNotification(transaction.member, {
      type: 'tip_sent',
      message: 'Your tip was sent successfully!',
      amount: transaction.amount,
      creatorId: transaction.creator,
    });

    console.log(
      `✅ Tip completed: $${transaction.amount} -> Creator gets $${transaction.creatorEarnings}`
    );
  } catch (error) {
    console.error('❌ Error completing tip:', error);
    throw error;
  }
}

async function completeCreditsAdd(transaction) {
  try {
    console.log('Adding credits:', transaction._id);

    // 1. Get member
    const member = await Member.findById(transaction.member);
    if (!member) {
      throw new Error('Member not found');
    }

    // 2. Add credits to member account
    if (!member.wallet) {
      member.wallet = { balance: 0, credits: 0 };
    }

    const creditsToAdd = transaction.credits || 0;
    member.wallet.credits += creditsToAdd;

    // 3. Add transaction to member's wallet history
    if (!member.wallet.transactions) {
      member.wallet.transactions = [];
    }

    member.wallet.transactions.push({
      type: 'credit_purchase',
      amount: transaction.amount,
      credits: creditsToAdd,
      transactionId: transaction._id,
      createdAt: new Date(),
      description: `Purchased ${creditsToAdd} credits`,
    });

    await member.save();

    // 4. Update transaction with credit details
    transaction.unlockDetails = {
      creditsAdded: creditsToAdd,
      newBalance: member.wallet.credits,
      processedAt: new Date(),
    };

    await transaction.save();

    // 5. Send notification
    await sendNotification(transaction.member, {
      type: 'credits_added',
      message: `${creditsToAdd} credits added to your account!`,
      credits: creditsToAdd,
      newBalance: member.wallet.credits,
    });

    console.log(
      `✅ Credits added: ${creditsToAdd} credits -> Member balance: ${member.wallet.credits}`
    );
  } catch (error) {
    console.error('❌ Error adding credits:', error);
    throw error;
  }
}

function getCreditPackages() {
  return [
    {
      id: 'starter',
      credits: 10,
      price: 9.99,
      bonus: 0,
      popular: false,
    },
    {
      id: 'popular',
      credits: 25,
      price: 19.99,
      bonus: 5,
      popular: true,
      savings: '20%',
    },
    {
      id: 'value',
      credits: 50,
      price: 39.99,
      bonus: 15,
      popular: false,
      savings: '30%',
    },
    {
      id: 'premium',
      credits: 100,
      price: 69.99,
      bonus: 40,
      popular: false,
      savings: '40%',
    },
  ];
}

module.exports = exports;
