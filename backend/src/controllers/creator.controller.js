const Creator = require('../models/Creator');
const Content = require('../models/Content');
const Transaction = require('../models/Transaction');
const Connection = require('../models/Connections');

// @desc    Get all creators
// @route   GET /api/creators
// @access  Public
exports.getCreators = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'lastActive',
      isVerified,
      minPrice,
      maxPrice 
    } = req.query;

    const query = { isPaused: false };

    // Add filters
    if (isVerified) query.isVerified = isVerified === 'true';
    if (minPrice || maxPrice) {
      query.contentPrice = {};
      if (minPrice) query.contentPrice.$gte = parseFloat(minPrice);
      if (maxPrice) query.contentPrice.$lte = parseFloat(maxPrice);
    }

    const creators = await Creator.find(query)
      .populate('user', 'email lastLogin')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ [sortBy]: -1 })
      .exec();

    const count = await Creator.countDocuments(query);

    res.status(200).json({
      success: true,
      count: creators.length,
      total: count,
      pages: Math.ceil(count / limit),
      currentPage: page,
      data: creators
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single creator
// @route   GET /api/creators/:id
// @access  Public
exports.getCreator = async (req, res, next) => {
  try {
    const creator = await Creator.findById(req.params.id)
      .populate('user', 'email lastLogin');

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    res.status(200).json({
      success: true,
      data: creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update creator profile
// @route   PUT /api/creators/profile
// @access  Private (Creator only)
exports.updateCreatorProfile = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found'
      });
    }

    const updatedCreator = await Creator.findByIdAndUpdate(
      creator._id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: updatedCreator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Upload content
// @route   POST /api/creators/content
// @access  Private (Creator only)
exports.uploadContent = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found'
      });
    }

    const content = await Content.create({
      creator: creator._id,
      ...req.body
    });

    res.status(201).json({
      success: true,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get creator's content
// @route   GET /api/creators/:id/content
// @access  Public
exports.getCreatorContent = async (req, res, next) => {
  try {
    const content = await Content.find({ 
      creator: req.params.id,
      isActive: true 
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: content.length,
      data: content
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete content
// @route   DELETE /api/creators/content/:contentId
// @access  Private (Creator only)
exports.deleteContent = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });
    
    const content = await Content.findOne({
      _id: req.params.contentId,
      creator: creator._id
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    content.isActive = false;
    await content.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get creator stats
// @route   GET /api/creators/stats
// @access  Private (Creator only)
exports.getCreatorStats = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    const totalContent = await Content.countDocuments({ 
      creator: creator._id 
    });

    const totalConnections = await Connection.countDocuments({ 
      creator: creator._id,
      isConnected: true 
    });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyEarnings = await Transaction.aggregate([
      {
        $match: {
          creator: creator._id,
          status: 'completed',
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$creatorEarnings' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalContent,
        totalConnections,
        monthlyEarnings: monthlyEarnings[0]?.total || 0,
        ...creator.stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get earnings
// @route   GET /api/creators/earnings
// @access  Private (Creator only)
exports.getEarnings = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    const earnings = await Transaction.find({
      creator: creator._id,
      status: 'completed'
    })
    .sort({ createdAt: -1 })
    .limit(100);

    const totalEarnings = earnings.reduce((sum, t) => sum + t.creatorEarnings, 0);

    res.status(200).json({
      success: true,
      total: totalEarnings,
      data: earnings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Request payout
// @route   POST /api/creators/payout
// @access  Private (Creator only)
exports.requestPayout = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });
    const { amount, method } = req.body;

    // Check if creator has enough balance
    if (creator.stats.totalEarnings < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient balance'
      });
    }

    // Create payout transaction
    const payout = await Transaction.create({
      creator: creator._id,
      type: 'payout',
      amount,
      paymentMethod: method,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      data: payout
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get public profile (for members browsing)
// @route   GET /api/creators/profile/:username
// @access  Public
exports.getPublicProfile = async (req, res, next) => {
  try {
    const creator = await Creator.findOne({ 
      username: req.params.username,
      isPaused: false 
    })
    .populate('user', 'lastLogin')
    .select('-stats.totalEarnings -stats.monthlyEarnings');

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }

    res.status(200).json({
      success: true,
      data: creator
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Placeholder functions for routes that don't have implementation yet
exports.getSubscriptionStatus = async (req, res) => {
  res.status(501).json({ message: 'Subscription feature not implemented - using pay-per-content model' });
};

exports.getAvailablePlans = async (req, res) => {
  res.status(501).json({ message: 'No subscription plans - using pay-per-content model' });
};

exports.upgradeSubscription = async (req, res) => {
  res.status(501).json({ message: 'No subscriptions to upgrade - using pay-per-content model' });
};

exports.cancelSubscription = async (req, res) => {
  res.status(501).json({ message: 'No subscriptions to cancel - using pay-per-content model' });
};

exports.getNotifications = async (req, res) => {
  res.status(501).json({ message: 'Notifications feature coming soon' });
};

exports.markNotificationAsRead = async (req, res) => {
  res.status(501).json({ message: 'Notification marking feature coming soon' });
};

exports.updateNotificationPreferences = async (req, res) => {
  res.status(501).json({ message: 'Notification preferences feature coming soon' });
};

exports.getTrendingCreators = async (req, res) => {
  res.status(501).json({ message: 'Trending creators feature coming soon' });
};

exports.getRecommendations = async (req, res) => {
  res.status(501).json({ message: 'Recommendations feature coming soon' });
};

module.exports = exports;