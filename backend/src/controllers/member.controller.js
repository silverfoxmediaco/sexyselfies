const Member = require('../models/Member');
const Creator = require('../models/Creator');
const CreatorConnection = require('../models/CreatorConnection');
const Content = require('../models/Content');
const Transaction = require('../models/Transaction');

// Services
const { updateMemberActivity } = require('../services/memberAnalytics.service');

// @desc    Get member profile
// @route   GET /api/members/profile
// @access  Private (Member only)
exports.getMemberProfile = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id }).populate(
      'user',
      'email lastLogin'
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update member profile
// @route   PUT /api/members/profile
// @access  Private (Member only)
exports.updateMemberProfile = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member profile not found',
      });
    }

    const updatedMember = await Member.findByIdAndUpdate(member._id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: updatedMember,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Update preferences
// @route   PUT /api/members/preferences
// @access  Private (Member only)
exports.updatePreferences = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });

    member.preferences = {
      ...member.preferences,
      ...req.body,
    };

    await member.save();

    res.status(200).json({
      success: true,
      data: member.preferences,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Purchase content
// @route   POST /api/members/purchase/:contentId
// @access  Private (Member only)
exports.purchaseContent = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });
    const content = await Content.findById(req.params.contentId).populate(
      'creator'
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    // Check if already purchased
    const alreadyPurchased = member.purchasedContent.some(
      p => p.content.toString() === content._id.toString()
    );

    if (alreadyPurchased) {
      return res.status(400).json({
        success: false,
        error: 'Content already purchased',
      });
    }

    // Check credits
    if (member.credits < content.price) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient credits',
      });
    }

    // Process purchase
    member.credits -= content.price;
    member.purchasedContent.push({
      creator: content.creator._id,
      content: content._id,
      amount: content.price,
    });
    await member.save();

    // Update content stats
    content.stats.purchases += 1;
    content.stats.revenue += content.price;
    content.purchasedBy.push({
      member: member._id,
      amount: content.price,
    });
    await content.save();

    // Create transaction
    await Transaction.create({
      member: member._id,
      creator: content.creator._id,
      content: content._id,
      type: 'content_purchase',
      amount: content.price,
      status: 'completed',
    });

    // Update creator earnings
    const creator = await Creator.findById(content.creator._id);
    creator.stats.totalEarnings += content.price * 0.8; // 80% to creator
    creator.stats.monthlyEarnings += content.price * 0.8;
    await creator.save();

    res.status(200).json({
      success: true,
      data: {
        content,
        remainingCredits: member.credits,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get purchased content
// @route   GET /api/members/purchased
// @access  Private (Member only)
exports.getPurchasedContent = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id }).populate({
      path: 'purchasedContent.content',
      populate: {
        path: 'creator',
        select: 'displayName profileImage',
      },
    });

    res.status(200).json({
      success: true,
      count: member.purchasedContent.length,
      data: member.purchasedContent,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Add credits
// @route   POST /api/members/credits/add
// @access  Private (Member only)
exports.addCredits = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    const member = await Member.findOne({ user: req.user.id });

    // Here you would integrate with Stripe/PayPal
    // For now, we'll just add credits directly

    member.credits += amount;
    await member.save();

    // Create transaction record
    await Transaction.create({
      member: member._id,
      type: 'credit_purchase',
      amount,
      paymentMethod,
      status: 'completed',
    });

    res.status(200).json({
      success: true,
      data: {
        credits: member.credits,
        added: amount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get credits history
// @route   GET /api/members/credits/history
// @access  Private (Member only)
exports.getCreditsHistory = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });

    const transactions = await Transaction.find({
      member: member._id,
      type: {
        $in: ['credit_purchase', 'content_purchase', 'tip', 'message_unlock'],
      },
    })
      .sort({ createdAt: -1 })
      .limit(50);

    res.status(200).json({
      success: true,
      currentCredits: member.credits,
      data: transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Like creator
// @route   POST /api/members/swipe/like/:creatorId
// @access  Private (Member only)
exports.likeCreator = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });
    const creator = await Creator.findById(req.params.creatorId);

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    // Check if already liked
    const alreadyLiked = member.likes.some(
      l => l.creator.toString() === creator._id.toString()
    );

    if (alreadyLiked) {
      return res.status(400).json({
        success: false,
        error: 'Already liked this creator',
      });
    }

    // Add to likes
    member.likes.push({ creator: creator._id });
    await member.save();

    // Check for existing connection record
    let connection = await CreatorConnection.findOne({
      member: member._id,
      creator: creator._id,
    });

    if (!connection) {
      connection = await CreatorConnection.create({
        member: member._id,
        creator: creator._id,
        memberLiked: true,
      });
    } else {
      connection.memberLiked = true;
      // Check if it's a connection (both liked)
      if (connection.creatorLiked) {
        connection.isConnected = true;
        connection.connectedAt = Date.now();

        // Update creator stats
        creator.stats.totalCreatorConnections += 1;
        await creator.save();
      }
      await connection.save();
    }

    // 📊 Track member activity for analytics
    await updateMemberActivity(member._id, 'swipe_like');

    res.status(200).json({
      success: true,
      isConnected: connection.isConnected,
      data: connection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Pass creator
// @route   POST /api/members/swipe/pass/:creatorId
// @access  Private (Member only)
exports.passCreator = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });

    // Add to passes
    member.passes.push({ creator: req.params.creatorId });
    await member.save();

    // 📊 Track member activity for analytics
    await updateMemberActivity(member._id, 'swipe_pass');

    res.status(200).json({
      success: true,
      message: 'Creator passed',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Super Like feature disabled - controller commented out
// // @desc    Super like creator
// // @route   POST /api/members/swipe/superlike/:creatorId
// // @access  Private (Member only)
// exports.superLikeCreator = async (req, res, next) => {
//   try {
//     const member = await Member.findOne({ user: req.user.id });
//     const creator = await Creator.findById(req.params.creatorId);

//     // Check daily super likes limit
//     const today = new Date();
//     today.setHours(0, 0, 0, 0);

//     if (member.dailySuperLikes.resetAt < today) {
//       member.dailySuperLikes.count = 1;
//       member.dailySuperLikes.resetAt = new Date(today.getTime() + 24 * 60 * 60 * 1000);
//     }

//     if (member.dailySuperLikes.count <= 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No super likes remaining today'
//       });
//     }

//     // Add to super likes
//     member.superLikes.push({ creator: creator._id });
//     member.dailySuperLikes.count -= 1;
//     await member.save();

//     // Create or update connection
//     let connection = await CreatorConnection.findOne({
//       member: member._id,
//       creator: creator._id
//     });

//     if (!connection) {
//       connection = await CreatorConnection.create({
//         member: member._id,
//         creator: creator._id,
//         memberLiked: true,
//         memberSuperLiked: true
//       });
//     } else {
//       connection.memberLiked = true;
//       connection.memberSuperLiked = true;
//       if (connection.creatorLiked) {
//         connection.isConnected = true;
//         connection.connectedAt = Date.now();
//         creator.stats.totalCreatorConnections += 1;
//         await creator.save();
//       }
//       await connection.save();
//     }

//     // Notify creator about super like
//     // TODO: Send notification

//     // 📊 Track member activity for analytics
//     await updateMemberActivity(member._id, 'swipe_superlike');

//     res.status(200).json({
//       success: true,
//       isConnected: connection.isConnected,
//       remainingSuperLikes: member.dailySuperLikes.count,
//       data: connection
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       error: error.message
//     });
//   }
// };

// @desc    Get connections
// @route   GET /api/members/connections
// @access  Private (Member only)
exports.getCreatorConnections = async (req, res, next) => {
  try {
    const member = await Member.findOne({ user: req.user.id });

    const connections = await CreatorConnection.find({
      member: member._id,
      isConnected: true,
      isActive: true,
    })
      .populate('creator', 'displayName profileImage bio lastActive')
      .sort({ connectedAt: -1 });

    res.status(200).json({
      success: true,
      count: connections.length,
      data: connections,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Mark member profile as complete
// @route   POST /api/members/complete-profile
// @access  Private (Member only)
exports.completeProfile = async (req, res, next) => {
  try {
    const member = await Member.findOneAndUpdate(
      { user: req.user.id },
      { profileComplete: true },
      { new: true }
    );

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        profileComplete: true,
        message: 'Profile setup completed successfully!',
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

module.exports = exports;
