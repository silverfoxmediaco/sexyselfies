const Transaction = require('../models/Transaction');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Content = require('../models/Content');
// CCBill webhook handling will be added here later
// const ccbill = require('./ccbill-config'); // TODO: Add CCBill integration

// @desc    Get user's transactions
// @route   GET /api/transactions
// @access  Private
exports.getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, type, status } = req.query;
    const userRole = req.user.role;

    let query = {};

    if (userRole === 'member') {
      const member = await Member.findOne({ user: req.user.id });
      query.member = member._id;
    } else if (userRole === 'creator') {
      const creator = await Creator.findOne({ user: req.user.id });
      query.creator = creator._id;
    }

    if (type) query.type = type;
    if (status) query.status = status;

    const transactions = await Transaction.find(query)
      .populate('member', 'username')
      .populate('creator', 'displayName')
      .populate('content', 'title type')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Transaction.countDocuments(query);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total: count,
      pages: Math.ceil(count / limit),
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get specific transaction
// @route   GET /api/transactions/:id
// @access  Private
exports.getTransaction = async (req, res, next) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('member', 'username email')
      .populate('creator', 'displayName')
      .populate('content');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found',
      });
    }

    // Verify user has access to this transaction
    const userRole = req.user.role;
    let hasAccess = false;

    if (userRole === 'member') {
      const member = await Member.findOne({ user: req.user.id });
      hasAccess = transaction.member._id.toString() === member._id.toString();
    } else if (userRole === 'creator') {
      const creator = await Creator.findOne({ user: req.user.id });
      hasAccess = transaction.creator._id.toString() === creator._id.toString();
    }

    if (!hasAccess && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this transaction',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create purchase transaction
// @route   POST /api/transactions/purchase
// @access  Private (Member only)
exports.createPurchase = async (req, res, next) => {
  try {
    const { contentId, paymentMethod = 'credits' } = req.body;
    const member = await Member.findOne({ user: req.user.id });
    const content = await Content.findById(contentId).populate('creator');

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    // Check if already purchased
    const alreadyPurchased = await Transaction.findOne({
      member: member._id,
      content: content._id,
      type: 'content_purchase',
      status: 'completed',
    });

    if (alreadyPurchased) {
      return res.status(400).json({
        success: false,
        error: 'Content already purchased',
      });
    }

    // Process payment based on method
    if (paymentMethod === 'credits') {
      if (member.credits < content.price) {
        return res.status(400).json({
          success: false,
          error: 'Insufficient credits',
        });
      }

      member.credits -= content.price;
      await member.save();
    }

    // Create transaction
    const transaction = await Transaction.create({
      member: member._id,
      creator: content.creator._id,
      content: content._id,
      type: 'content_purchase',
      amount: content.price,
      paymentMethod,
      status: 'completed',
    });

    // Update content and creator stats
    content.stats.purchases += 1;
    content.stats.revenue += content.price;
    await content.save();

    const creator = await Creator.findById(content.creator._id);
    creator.stats.totalEarnings += transaction.creatorEarnings;
    creator.stats.monthlyEarnings += transaction.creatorEarnings;
    await creator.save();

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Create tip transaction
// @route   POST /api/transactions/tip
// @access  Private (Member only)
exports.createTip = async (req, res, next) => {
  try {
    const { creatorId, amount, message } = req.body;
    const member = await Member.findOne({ user: req.user.id });
    const creator = await Creator.findById(creatorId);

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    if (member.credits < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credits',
      });
    }

    // Process tip
    member.credits -= amount;
    await member.save();

    // Create transaction
    const transaction = await Transaction.create({
      member: member._id,
      creator: creator._id,
      type: 'tip',
      amount,
      status: 'completed',
      notes: message,
    });

    // Update creator earnings
    creator.stats.totalEarnings += transaction.creatorEarnings;
    creator.stats.monthlyEarnings += transaction.creatorEarnings;
    await creator.save();

    // TODO: Send notification to creator

    res.status(201).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get earnings report for creator
// @route   GET /api/transactions/earnings/report
// @access  Private (Creator only)
exports.getEarningsReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const creator = await Creator.findOne({ user: req.user.id });

    const query = {
      creator: creator._id,
      status: 'completed',
      type: { $in: ['content_purchase', 'tip', 'message_unlock'] },
    };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(query)
      .populate('member', 'username')
      .populate('content', 'title')
      .sort({ createdAt: -1 });

    // Calculate totals
    const summary = transactions.reduce(
      (acc, t) => {
        acc.totalRevenue += t.amount;
        acc.totalEarnings += t.creatorEarnings;
        acc.totalFees += t.platformFee;
        acc[t.type] = (acc[t.type] || 0) + t.creatorEarnings;
        return acc;
      },
      {
        totalRevenue: 0,
        totalEarnings: 0,
        totalFees: 0,
      }
    );

    res.status(200).json({
      success: true,
      summary,
      transactions: transactions.length,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Request payout
// @route   POST /api/transactions/payout/request
// @access  Private (Creator only)
exports.requestPayout = async (req, res, next) => {
  try {
    const { amount, paymentMethod, accountDetails } = req.body;
    const creator = await Creator.findOne({ user: req.user.id });

    // Check minimum payout amount
    const MIN_PAYOUT = 50;
    if (amount < MIN_PAYOUT) {
      return res.status(400).json({
        success: false,
        error: `Minimum payout amount is $${MIN_PAYOUT}`,
      });
    }

    // Check available balance
    const pendingPayouts = await Transaction.find({
      creator: creator._id,
      type: 'payout',
      status: 'pending',
    });

    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = creator.stats.totalEarnings - pendingAmount;

    if (amount > availableBalance) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient available balance',
        availableBalance,
      });
    }

    // Create payout transaction
    const payout = await Transaction.create({
      creator: creator._id,
      type: 'payout',
      amount,
      paymentMethod,
      status: 'pending',
      metadata: { accountDetails },
    });

    res.status(201).json({
      success: true,
      message: 'Payout request submitted',
      data: payout,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get payout history
// @route   GET /api/transactions/payout/history
// @access  Private (Creator only)
exports.getPayoutHistory = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    const payouts = await Transaction.find({
      creator: creator._id,
      type: 'payout',
    }).sort({ createdAt: -1 });

    const summary = {
      totalPaidOut: 0,
      pending: 0,
      completed: 0,
      failed: 0,
    };

    payouts.forEach(p => {
      summary[p.status] = (summary[p.status] || 0) + p.amount;
      if (p.status === 'completed') {
        summary.totalPaidOut += p.amount;
      }
    });

    res.status(200).json({
      success: true,
      summary,
      data: payouts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Handle CCBill webhook
// @route   POST /api/transactions/webhook/ccbill
// @access  Public (webhook)
exports.handleCCBillWebhook = async (req, res, next) => {
  try {
    // TODO: Implement CCBill webhook handling
    // CCBill sends different event types like:
    // - NewSaleSuccess
    // - RenewalSuccess
    // - Cancellation
    // - Refund

    const { eventType, subscriptionId, transactionId, amount } = req.body;

    console.log('CCBill Webhook received:', eventType);

    // Process based on event type
    switch (eventType) {
      case 'NewSaleSuccess':
        // Handle new credit purchase
        break;
      case 'RenewalSuccess':
        // Handle subscription renewal if applicable
        break;
      case 'Cancellation':
        // Handle cancellation
        break;
      case 'Refund':
        // Handle refund
        break;
      default:
        console.log(`Unhandled CCBill event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('CCBill webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = exports;
