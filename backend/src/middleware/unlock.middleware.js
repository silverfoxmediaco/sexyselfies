// backend/src/middleware/unlock.middleware.js
// Middleware for handling micro-transaction unlocks instead of subscriptions

const Transaction = require('../models/Transaction');
const Content = require('../models/Content');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Message = require('../models/Message');

/**
 * Check if member has unlocked specific content
 */
const checkContentUnlock = async (req, res, next) => {
  try {
    const { contentId } = req.params;
    const memberId = req.user.id;

    // Check if content exists
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Creator always has access to their own content
    if (content.creator.toString() === memberId) {
      req.hasAccess = true;
      return next();
    }

    // Check if member has purchased this content
    const transaction = await Transaction.findOne({
      memberId,
      contentId,
      type: 'content_unlock',
      status: 'completed',
    });

    if (transaction) {
      req.hasAccess = true;
      req.transaction = transaction;
    } else {
      req.hasAccess = false;
      req.unlockPrice = content.price || 2.99; // Default price if not set
    }

    next();
  } catch (error) {
    console.error('Content unlock check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking content access',
    });
  }
};

/**
 * Check if member has unlocked creator's profile content
 */
const checkProfileUnlock = async (req, res, next) => {
  try {
    const { creatorId } = req.params;
    const memberId = req.user.id;

    // Check if it's the creator viewing their own profile
    if (creatorId === memberId) {
      req.hasAccess = true;
      return next();
    }

    // Check for any unlocked content from this creator
    const unlockedContent = await Transaction.findOne({
      memberId,
      creatorId,
      type: { $in: ['content_unlock', 'profile_unlock', 'message_unlock'] },
      status: 'completed',
    });

    req.hasUnlockedContent = !!unlockedContent;
    req.unlockedCount = await Transaction.countDocuments({
      memberId,
      creatorId,
      type: { $in: ['content_unlock', 'profile_unlock', 'message_unlock'] },
      status: 'completed',
    });

    next();
  } catch (error) {
    console.error('Profile unlock check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking profile access',
    });
  }
};

/**
 * Check member's spending limits
 */
const checkSpendingLimit = async (req, res, next) => {
  try {
    const memberId = req.user.id;
    const { amount } = req.body;

    const member = await Member.findById(memberId);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Check daily spending limit if set
    if (member.settings?.dailySpendingLimit) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todaySpending = await Transaction.aggregate([
        {
          $match: {
            memberId: member._id,
            status: 'completed',
            createdAt: { $gte: today },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
          },
        },
      ]);

      const currentSpending = todaySpending[0]?.total || 0;

      if (currentSpending + amount > member.settings.dailySpendingLimit) {
        return res.status(403).json({
          success: false,
          message: 'Daily spending limit reached',
          limit: member.settings.dailySpendingLimit,
          spent: currentSpending,
          remaining: Math.max(
            0,
            member.settings.dailySpendingLimit - currentSpending
          ),
        });
      }
    }

    // Check wallet balance if using credits
    if (member.settings?.useWallet && member.wallet?.balance < amount) {
      return res.status(402).json({
        success: false,
        message: 'Insufficient wallet balance',
        required: amount,
        balance: member.wallet?.balance || 0,
        topUpUrl: '/wallet/topup',
      });
    }

    next();
  } catch (error) {
    console.error('Spending limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking spending limits',
    });
  }
};

/**
 * Track micro-transaction for analytics
 */
const trackUnlock = async (req, res, next) => {
  try {
    const { contentId, creatorId, type = 'content_unlock' } = req.body;
    const memberId = req.user.id;

    // Create analytics event
    const analyticsData = {
      memberId,
      creatorId,
      contentId,
      type,
      amount: req.body.amount,
      timestamp: new Date(),
      source: req.headers['referer'] || 'direct',
      deviceType: req.headers['user-agent']?.includes('Mobile')
        ? 'mobile'
        : 'desktop',
    };

    // Fire and forget analytics tracking
    process.nextTick(() => {
      // This would normally send to your analytics service
      console.log('Tracking unlock:', analyticsData);
    });

    next();
  } catch (error) {
    console.error('Unlock tracking error:', error);
    // Don't block the request for analytics errors
    next();
  }
};

/**
 * Validate unlock price
 */
const validateUnlockPrice = (req, res, next) => {
  const { amount } = req.body;

  // Allow free content (amount = 0) or validate minimum paid price
  if (amount !== 0 && (!amount || amount < 0.99)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid unlock price. Minimum paid price is $0.99 or free ($0)',
      minPrice: 0.99,
    });
  }

  // Round to 2 decimal places
  req.body.amount = Math.round(amount * 100) / 100;

  next();
};

/**
 * Check if member has access to message content
 */
const checkMessageUnlock = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const memberId = req.user.id;

    // Check if message has paid content
    const message = await Message.findOne({
      _id: messageId,
      'paidContent.price': { $exists: true },
    });

    if (!message) {
      req.hasAccess = true; // Free message
      return next();
    }

    // Check if member is sender
    if (message.sender.toString() === memberId) {
      req.hasAccess = true;
      return next();
    }

    // Check if already unlocked
    const unlock = await Transaction.findOne({
      memberId,
      messageId,
      type: 'message_unlock',
      status: 'completed',
    });

    req.hasAccess = !!unlock;
    req.unlockPrice = message.paidContent?.price || 2.99;

    next();
  } catch (error) {
    console.error('Message unlock check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking message access',
    });
  }
};

/**
 * Bundle unlock check - for multiple content pieces
 */
const checkBundleUnlock = async (req, res, next) => {
  try {
    const { bundleId } = req.params;
    const memberId = req.user.id;

    // TODO: Create Bundle model - for now return not found
    // const bundle = await Bundle.findOne({ _id: bundleId });
    const bundle = null; // Temporary until Bundle model is created

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found',
      });
    }

    // Check if member has unlocked this bundle
    const bundleUnlock = await Transaction.findOne({
      memberId,
      bundleId,
      type: 'bundle_unlock',
      status: 'completed',
    });

    if (bundleUnlock) {
      req.hasAccess = true;
      req.unlockedContent = bundle.contentIds;
    } else {
      req.hasAccess = false;
      req.bundlePrice = bundle.price;
      req.bundleDiscount = bundle.discount || 20; // Default 20% discount for bundles
    }

    next();
  } catch (error) {
    console.error('Bundle unlock check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking bundle access',
    });
  }
};

module.exports = {
  checkContentUnlock,
  checkProfileUnlock,
  checkSpendingLimit,
  trackUnlock,
  validateUnlockPrice,
  checkMessageUnlock,
  checkBundleUnlock,
};
