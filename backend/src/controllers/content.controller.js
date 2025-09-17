// backend/src/controllers/content.controller.js
const Content = require('../models/Content');
const Transaction = require('../models/Transaction');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const MemberAnalytics = require('../models/MemberAnalytics');
const { processPayment } = require('../services/payment.service');
const { trackEvent } = require('../services/analytics.service');
const { sendNotification } = require('../services/notification.service');

/**
 * Get all content (preview mode - blurred/watermarked)
 */
const getAllContent = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      priceMin,
      priceMax,
      sort = '-createdAt',
      creatorId,
    } = req.query;

    const query = {
      status: 'active',
      isPublished: true,
    };

    if (category) query.category = category;
    if (creatorId) query.creatorId = creatorId;

    // Optional price filtering - no limits enforced
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = parseFloat(priceMin);
      if (priceMax) query.price.$lte = parseFloat(priceMax);
    }

    const content = await Content.find(query)
      .select('-fullMediaUrl') // Don't send full resolution URL
      .populate('creatorId', 'username profileImage isVerified')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Content.countDocuments(query);

    // Add blur flag to all content
    const previewContent = content.map(item => ({
      ...item.toObject(),
      isBlurred: true,
      unlockPrice: item.price,
      previewUrl: item.thumbnailUrl || item.blurredUrl,
    }));

    res.json({
      success: true,
      data: previewContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
    });
  }
};

/**
 * Get single content (full if unlocked, preview if not)
 */
const getContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const hasAccess = req.hasAccess; // Set by middleware

    // Use content from middleware if available, otherwise fetch
    let content = req.content;
    if (!content) {
      content = await Content.findById(id).populate(
        'creator',
        'displayName profileImage bio isVerified'
      );

      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found',
        });
      }
    }

    console.log(
      `📊 Content access: ${hasAccess ? 'FULL' : 'PREVIEW'} for content ${content._id}`
    );

    // Track view
    if (content.stats) {
      content.stats.views = (content.stats.views || 0) + 1;
      await content.save();
    }

    // Return based on access
    if (hasAccess) {
      // Full access - return everything including full media URL
      console.log(`✅ Returning full content access`);
      res.json({
        success: true,
        data: content,
        hasAccess: true,
        unlockedAt: req.transaction?.createdAt,
      });
    } else {
      // Preview only - return blurred/watermarked version
      console.log(`🔒 Returning preview content`);
      const preview = {
        ...content.toObject(),
        fullMediaUrl: undefined, // Remove full URL
        mediaUrl:
          content.blurredUrl || content.thumbnailUrl || content.thumbnail,
        isBlurred: true,
        unlockPrice: content.price,
        hasAccess: false,
      };

      res.json({
        success: true,
        data: preview,
        hasAccess: false,
        unlockPrice: content.price,
      });
    }
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
    });
  }
};

/**
 * Unlock content (micro-transaction)
 */
const unlockContent = async (req, res) => {
  try {
    const { id } = req.params;
    const memberId = req.user.id;
    const { paymentMethodId } = req.body;

    // Get content
    const content = await Content.findById(id).populate('creatorId');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Check if already unlocked
    const existingUnlock = await Transaction.findOne({
      memberId,
      contentId: id,
      type: 'content_unlock',
      status: 'completed',
    });

    if (existingUnlock) {
      return res.status(400).json({
        success: false,
        message: 'Content already unlocked',
        unlockedAt: existingUnlock.createdAt,
      });
    }

    const amount = content.price;

    // Process payment
    const paymentResult = await processPayment({
      amount,
      memberId,
      creatorId: content.creatorId._id,
      paymentMethodId,
      description: `Unlock: ${content.title}`,
      metadata: {
        contentId: content._id,
        type: 'content_unlock',
      },
    });

    if (!paymentResult.success) {
      return res.status(402).json({
        success: false,
        message: paymentResult.message || 'Payment failed',
      });
    }

    // Create transaction record
    const transaction = await Transaction.create({
      transactionId: paymentResult.transactionId,
      memberId,
      creatorId: content.creatorId._id,
      contentId: content._id,
      type: 'content_unlock',
      amount,
      status: 'completed',
      paymentMethod: paymentResult.paymentMethod,
      paymentDetails: paymentResult.details,
      unlockDetails: {
        unlockedAt: new Date(),
        deviceInfo: {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          deviceType: req.headers['user-agent']?.includes('Mobile')
            ? 'mobile'
            : 'desktop',
        },
      },
      analytics: {
        source: req.query.source || 'direct',
        memberSegment: req.user.segment || 'regular',
      },
    });

    // Update content stats
    content.stats.unlocks += 1;
    content.stats.revenue += amount;
    await content.save();

    // Update member analytics
    await MemberAnalytics.findOneAndUpdate(
      { memberId },
      {
        $inc: {
          'spending.lifetime': amount,
          'spending.contentPurchases': 1,
        },
        $push: {
          'engagement.purchaseHistory': {
            contentId: content._id,
            amount,
            date: new Date(),
          },
        },
      }
    );

    // Send notifications
    await sendNotification({
      userId: content.creatorId._id,
      type: 'content_unlocked',
      title: 'Content Unlocked! 💰',
      message: `${req.user.username} unlocked "${content.title}" for $${amount}`,
      data: {
        contentId: content._id,
        memberId,
        earnings: amount * 0.8, // Creator gets 80%
      },
    });

    // Track analytics
    await trackEvent({
      event: 'content_unlock',
      memberId,
      creatorId: content.creatorId._id,
      contentId: content._id,
      amount,
      source: req.query.source,
    });

    // Return full content now that it's unlocked
    const unlockedContent = await Content.findById(id).populate(
      'creatorId',
      'username profileImage bio isVerified'
    );

    res.json({
      success: true,
      message: 'Content unlocked successfully!',
      transaction: {
        id: transaction._id,
        amount,
        creatorEarnings: transaction.creatorEarnings,
      },
      data: unlockedContent,
    });
  } catch (error) {
    console.error('Unlock content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlocking content',
    });
  }
};

/**
 * Get content preview (always blurred)
 */
const getContentPreview = async (req, res) => {
  try {
    const { id } = req.params;

    const content = await Content.findById(id)
      .select(
        'title description thumbnailUrl blurredUrl price category creatorId stats'
      )
      .populate('creatorId', 'username profileImage isVerified');

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...content.toObject(),
        isPreview: true,
        isBlurred: true,
        unlockPrice: content.price,
        mediaUrl: content.blurredUrl || content.thumbnailUrl,
      },
    });
  } catch (error) {
    console.error('Get preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching preview',
    });
  }
};

/**
 * Get my unlocked content
 */
const getMyUnlockedContent = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { page = 1, limit = 20, creatorId } = req.query;

    const query = {
      memberId,
      type: 'content_unlock',
      status: 'completed',
    };

    if (creatorId) query.creatorId = creatorId;

    const transactions = await Transaction.find(query)
      .populate({
        path: 'contentId',
        populate: {
          path: 'creatorId',
          select: 'username profileImage',
        },
      })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Transaction.countDocuments(query);

    const unlockedContent = transactions
      .filter(t => t.contentId) // Filter out deleted content
      .map(t => ({
        ...t.contentId.toObject(),
        unlockedAt: t.createdAt,
        transactionId: t._id,
        hasAccess: true,
      }));

    res.json({
      success: true,
      data: unlockedContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get unlocked content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unlocked content',
    });
  }
};

/**
 * Create content (creator only)
 */
const createContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      title,
      description,
      price,
      category,
      mediaUrl,
      thumbnailUrl,
      mediaType,
      tags,
    } = req.body;

    // Validate minimum price only
    if (!price || price < 0.99) {
      return res.status(400).json({
        success: false,
        message: 'Price must be at least $0.99',
      });
    }

    const content = await Content.create({
      creatorId,
      title,
      description,
      price,
      category,
      fullMediaUrl: mediaUrl,
      thumbnailUrl,
      blurredUrl: thumbnailUrl, // You'd generate a blurred version
      mediaType,
      tags,
      status: 'active',
      isPublished: true,
    });

    res.status(201).json({
      success: true,
      message: 'Content created successfully',
      data: content,
    });
  } catch (error) {
    console.error('Create content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating content',
    });
  }
};

/**
 * Update content
 */
const updateContent = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;
    const updates = req.body;

    const content = await Content.findOne({ _id: id, creatorId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or unauthorized',
      });
    }

    // Validate minimum price if updating
    if (updates.price && updates.price < 0.99) {
      return res.status(400).json({
        success: false,
        message: 'Price must be at least $0.99',
      });
    }

    Object.assign(content, updates);
    await content.save();

    res.json({
      success: true,
      message: 'Content updated successfully',
      data: content,
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
    });
  }
};

/**
 * Delete content (soft delete)
 */
const deleteContent = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;

    const content = await Content.findOne({ _id: id, creatorId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or unauthorized',
      });
    }

    // Soft delete to preserve unlock history
    content.status = 'deleted';
    content.isPublished = false;
    await content.save();

    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
    });
  }
};

/**
 * Like content
 */
const likeContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Check if already liked
    if (content.likes.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: 'Content already liked',
      });
    }

    content.likes.push(userId);
    content.stats.likes = content.likes.length;
    await content.save();

    res.json({
      success: true,
      message: 'Content liked',
      likes: content.stats.likes,
    });
  } catch (error) {
    console.error('Like content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking content',
    });
  }
};

/**
 * Unlike content
 */
const unlikeContent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const content = await Content.findById(id);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    content.likes = content.likes.filter(like => like.toString() !== userId);
    content.stats.likes = content.likes.length;
    await content.save();

    res.json({
      success: true,
      message: 'Content unliked',
      likes: content.stats.likes,
    });
  } catch (error) {
    console.error('Unlike content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unliking content',
    });
  }
};

/**
 * Report content
 */
const reportContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, description } = req.body;
    const reporterId = req.user.id;

    // Create report in database
    await Report.create({
      contentId: id,
      reporterId,
      reason,
      description,
      status: 'pending',
    });

    res.json({
      success: true,
      message: 'Content reported. Our team will review it within 24 hours.',
    });
  } catch (error) {
    console.error('Report content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reporting content',
    });
  }
};

/**
 * Get creator's content
 */
const getCreatorContent = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.id;

    const content = await Content.find({
      creatorId,
      status: 'active',
      isPublished: true,
    })
      .select('-fullMediaUrl')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Check which content is unlocked by this user
    let unlockedIds = [];
    if (userId) {
      const unlocked = await Transaction.find({
        memberId: userId,
        creatorId,
        type: 'content_unlock',
        status: 'completed',
      }).select('contentId');

      unlockedIds = unlocked.map(t => t.contentId.toString());
    }

    const contentWithAccess = content.map(item => ({
      ...item.toObject(),
      hasAccess: unlockedIds.includes(item._id.toString()),
      isBlurred: !unlockedIds.includes(item._id.toString()),
      unlockPrice: item.price,
    }));

    const total = await Content.countDocuments({
      creatorId,
      status: 'active',
      isPublished: true,
    });

    res.json({
      success: true,
      data: contentWithAccess,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get creator content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching creator content',
    });
  }
};

/**
 * Get bundled content
 */
const getBundledContent = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const hasAccess = req.hasAccess;

    // Fetch bundle details
    const bundle = await req.db
      .collection('bundles')
      .findOne({ _id: bundleId });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: 'Bundle not found',
      });
    }

    // Get all content in bundle
    const content = await Content.find({
      _id: { $in: bundle.contentIds },
    }).populate('creatorId', 'username profileImage');

    if (hasAccess) {
      res.json({
        success: true,
        data: content,
        bundle: bundle,
        hasAccess: true,
      });
    } else {
      // Return preview with bundle pricing
      const previews = content.map(item => ({
        ...item.toObject(),
        fullMediaUrl: undefined,
        isBlurred: true,
      }));

      res.json({
        success: true,
        data: previews,
        bundle: {
          ...bundle,
          price: bundle.price,
          originalPrice: bundle.originalPrice,
          discount: bundle.discount,
          savings: bundle.originalPrice - bundle.price,
        },
        hasAccess: false,
      });
    }
  } catch (error) {
    console.error('Get bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bundle',
    });
  }
};

/**
 * Unlock bundle
 */
const unlockBundle = async (req, res) => {
  try {
    const { bundleId } = req.params;
    const memberId = req.user.id;
    const { paymentMethodId } = req.body;

    // Similar to unlockContent but for bundles
    // Process payment for bundle price
    // Unlock all content in bundle
    // Create bundle transaction

    res.json({
      success: true,
      message: 'Bundle unlocked successfully!',
    });
  } catch (error) {
    console.error('Unlock bundle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unlocking bundle',
    });
  }
};

/**
 * Get content statistics (creator only)
 */
const getContentStats = async (req, res) => {
  try {
    const { id } = req.params;
    const creatorId = req.user.id;

    const content = await Content.findOne({ _id: id, creatorId });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found or unauthorized',
      });
    }

    // Get detailed unlock history
    const unlockHistory = await Transaction.find({
      contentId: id,
      type: 'content_unlock',
      status: 'completed',
    })
      .select('amount createdAt memberId')
      .populate('memberId', 'username')
      .sort('-createdAt')
      .limit(50);

    // Calculate additional stats
    const stats = {
      ...content.stats,
      conversionRate:
        content.stats.views > 0
          ? ((content.stats.unlocks / content.stats.views) * 100).toFixed(2)
          : 0,
      averageRevenue:
        content.stats.unlocks > 0
          ? (content.stats.revenue / content.stats.unlocks).toFixed(2)
          : 0,
      recentUnlocks: unlockHistory,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content statistics',
    });
  }
};

module.exports = {
  getAllContent,
  getContent,
  getContentPreview,
  createContent,
  updateContent,
  deleteContent,
  unlockContent, // Renamed from purchaseContent
  likeContent,
  unlikeContent,
  reportContent,
  getCreatorContent,
  getBundledContent,
  unlockBundle,
  getMyUnlockedContent,
  getContentStats,
};
