// Gift Controller - Handle content gifting functionality
const Gift = require('../models/Gift');
const Content = require('../models/Content');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const { sendNotification, sendGiftNotificationEmail, sendGiftViewedNotificationEmail } = require('../services/notification.service');
const { trackAnalytics } = require('../services/analytics.service');

/**
 * Get creator's content library available for gifting
 * @route GET /api/v1/creator/content/giftable
 */
exports.getCreatorContentLibrary = async (req, res) => {
  try {
    const creatorUserId = req.user.id;
    console.log(`🎁 [Gift] Getting giftable content for creator user: ${creatorUserId}`);

    // Get creator profile
    const creator = await Creator.findOne({ user: creatorUserId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    console.log(`✅ [Gift] Creator found: ${creator.username || creator.displayName}`);

    // Get creator's approved content available for gifting
    const giftableContent = await Content.find({
      creator: creator._id,
      status: 'approved',
      isActive: true,
      // Only content with price > 0 can be gifted (has value)
      price: { $gt: 0 },
    })
    .select('title description contentType fileUrl thumbnailUrl price createdAt')
    .sort({ createdAt: -1 })
    .limit(50); // Reasonable limit

    console.log(`📊 [Gift] Found ${giftableContent.length} giftable content items`);

    // Format content for frontend
    const formattedContent = giftableContent.map(content => ({
      id: content._id,
      title: content.title,
      description: content.description,
      type: content.contentType,
      thumbnailUrl: content.thumbnailUrl,
      price: content.price,
      createdAt: content.createdAt,
    }));

    res.json({
      success: true,
      content: formattedContent,
      total: formattedContent.length,
      message: `Found ${formattedContent.length} items available for gifting`,
    });

  } catch (error) {
    console.error('❌ [Gift] Error getting giftable content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load content library',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Send a gift to a member
 * @route POST /api/v1/creator/members/:memberId/gift
 */
exports.sendGift = async (req, res) => {
  try {
    const creatorUserId = req.user.id;
    const { memberId } = req.params;
    const { contentId, message = 'Here\'s a special gift just for you! 🎁' } = req.body;

    console.log(`🎁 [Gift] Creator ${creatorUserId} sending gift to member ${memberId}`);
    console.log(`📦 [Gift] Content: ${contentId}, Message: "${message}"`);

    // Validation: Required fields
    if (!contentId) {
      return res.status(400).json({
        success: false,
        message: 'Content selection is required',
      });
    }

    // Get creator profile
    const creator = await Creator.findOne({ user: creatorUserId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    // Validation: Check if creator is verified
    if (!creator.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Only verified creators can send gifts',
        requiresVerification: true,
      });
    }

    // Validation: Check member exists and can receive gifts
    const member = await Member.findById(memberId).populate('user', 'isActive');
    if (!member || !member.user?.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Member not found or inactive',
      });
    }

    // Check if member allows gifts (privacy setting)
    if (member.privacy?.allowGifts === false) {
      return res.status(403).json({
        success: false,
        message: 'This member does not accept gifts',
      });
    }

    // Check if member has blocked this creator
    if (member.privacy?.blockedCreators?.includes(creator._id)) {
      return res.status(403).json({
        success: false,
        message: 'Unable to send gift to this member',
      });
    }

    // Validation: Verify content exists and belongs to creator
    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    if (content.creator.toString() !== creator._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only gift your own content',
      });
    }

    if (content.status !== 'approved' || !content.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This content is not available for gifting',
      });
    }

    // Check daily gift limits (handled by Gift model pre-save middleware)
    // Create the gift record
    const gift = new Gift({
      creator: creator._id,
      member: memberId,
      content: contentId,
      contentType: content.contentType,
      originalPrice: content.price,
      message: message.trim(),
      personalizedMessage: message.trim() !== 'Here\'s a special gift just for you! 🎁',
      sourceContext: {
        source: 'browse_members',
        memberTier: 'new', // Could be enhanced with actual member tier
      },
    });

    await gift.save();

    console.log(`✅ [Gift] Gift created successfully: ${gift._id}`);

    // Send in-app notification to member
    try {
      await sendNotification(memberId, {
        type: 'gift_received',
        title: `🎁 Gift from ${creator.username || creator.displayName}!`,
        body: `You received "${content.title}" (worth $${content.price})`,
        data: {
          giftId: gift._id,
          creatorId: creator._id,
          creatorUsername: creator.username || creator.displayName,
          creatorImage: creator.profileImage,
          contentType: content.contentType,
          contentTitle: content.title,
          originalPrice: content.price,
          message: message,
        },
        priority: 'high',
      });

      console.log(`📱 [Gift] In-app notification sent to member ${memberId}`);
    } catch (notificationError) {
      console.error('⚠️ [Gift] In-app notification failed (continuing):', notificationError.message);
    }

    // Send email notification to member
    try {
      await sendGiftNotificationEmail(
        member.user?.email || member.email,
        member.username,
        {
          creatorUsername: creator.username || creator.displayName,
          contentTitle: content.title,
          originalPrice: content.price,
          message: message,
        }
      );

      console.log(`📧 [Gift] Email notification sent to member ${memberId}`);
    } catch (emailError) {
      console.error('⚠️ [Gift] Email notification failed (continuing):', emailError.message);
    }

    // Track analytics
    try {
      await trackAnalytics('gift_sent', {
        creatorId: creator._id,
        memberId: memberId,
        contentId: contentId,
        contentType: content.contentType,
        originalPrice: content.price,
        hasPersonalizedMessage: gift.personalizedMessage,
      });
    } catch (analyticsError) {
      console.error('⚠️ [Gift] Analytics tracking failed (continuing):', analyticsError.message);
    }

    // Return success response
    res.status(201).json({
      success: true,
      gift: {
        id: gift._id,
        contentTitle: content.title,
        contentType: content.contentType,
        originalPrice: content.price,
        message: gift.message,
        sentTo: member.username,
        sentAt: gift.giftedAt,
      },
      message: `Gift sent successfully to ${member.username}!`,
    });

  } catch (error) {
    console.error('❌ [Gift] Error sending gift:', error);

    // Handle specific errors
    if (error.message.includes('Daily gift limit')) {
      return res.status(429).json({
        success: false,
        message: 'Daily gift limit reached (10 gifts per day)',
        code: 'DAILY_LIMIT_EXCEEDED',
      });
    }

    if (error.message.includes('Already sent a gift')) {
      return res.status(429).json({
        success: false,
        message: 'You already sent a gift to this member today',
        code: 'MEMBER_DAILY_LIMIT_EXCEEDED',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to send gift',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get gifts received by a member
 * @route GET /api/v1/member/gifts/received
 */
exports.getMemberGifts = async (req, res) => {
  try {
    const memberUserId = req.user.id;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    console.log(`🎁 [Gift] Getting gifts for member user: ${memberUserId}`);

    // Get member profile
    const member = await Member.findOne({ user: memberUserId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found',
      });
    }

    // Build query
    const query = { member: member._id };
    if (status !== 'all') {
      query.status = status;
    }

    // Get gifts with pagination
    const skip = (page - 1) * limit;
    const gifts = await Gift.find(query)
      .populate('creator', 'username displayName profileImage')
      .populate('content', 'title description contentType thumbnailUrl')
      .sort({ giftedAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const totalGifts = await Gift.countDocuments(query);

    console.log(`📊 [Gift] Found ${gifts.length} gifts for member`);

    // Format gifts for frontend
    const formattedGifts = gifts.map(gift => ({
      id: gift._id,
      creator: {
        id: gift.creator._id,
        username: gift.creator.username || gift.creator.displayName,
        profileImage: gift.creator.profileImage,
      },
      content: {
        id: gift.content._id,
        title: gift.content.title,
        description: gift.content.description,
        type: gift.content.contentType,
        thumbnailUrl: gift.content.thumbnailUrl,
      },
      originalPrice: gift.originalPrice,
      message: gift.message,
      giftedAt: gift.giftedAt,
      viewedAt: gift.viewedAt,
      status: gift.status,
      isExpired: gift.isExpired,
      isViewed: !!gift.viewedAt,
    }));

    res.json({
      success: true,
      gifts: formattedGifts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalGifts,
        pages: Math.ceil(totalGifts / limit),
      },
      message: `Found ${formattedGifts.length} gifts`,
    });

  } catch (error) {
    console.error('❌ [Gift] Error getting member gifts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load gifts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Mark a gift as viewed and get content access
 * @route GET /api/v1/member/gifts/:giftId/view
 */
exports.viewGift = async (req, res) => {
  try {
    const memberUserId = req.user.id;
    const { giftId } = req.params;

    console.log(`👁️ [Gift] Member ${memberUserId} viewing gift ${giftId}`);

    // Get member profile
    const member = await Member.findOne({ user: memberUserId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found',
      });
    }

    // Get gift and verify ownership
    const gift = await Gift.findById(giftId)
      .populate('creator', 'username displayName profileImage')
      .populate('content', 'title description contentType fileUrl thumbnailUrl');

    if (!gift) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found',
      });
    }

    if (gift.member.toString() !== member._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'This gift is not for you',
      });
    }


    // Mark as viewed if not already viewed
    if (!gift.viewedAt) {
      await gift.markAsViewed();
      console.log(`✅ [Gift] Gift ${giftId} marked as viewed`);

      // Send email notification to creator about gift being viewed
      try {
        const creatorUser = await require('../models/User').findById(gift.creator.user);
        if (creatorUser && creatorUser.email) {
          await sendGiftViewedNotificationEmail(
            creatorUser.email,
            gift.creator.username || gift.creator.displayName,
            {
              memberUsername: member.username,
              contentTitle: gift.content.title,
            }
          );
          console.log(`📧 [Gift] Gift viewed notification sent to creator`);
        }
      } catch (emailError) {
        console.error('⚠️ [Gift] Creator email notification failed:', emailError.message);
      }

      // Send real-time notification to creator
      try {
        await sendNotification(gift.creator._id, {
          type: 'gift_viewed',
          title: `👀 ${member.username} viewed your gift!`,
          body: `Your gift "${gift.content.title}" was just opened`,
          data: {
            giftId: gift._id,
            memberUsername: member.username,
            contentTitle: gift.content.title,
          },
          priority: 'high',
        });
        console.log(`📱 [Gift] Real-time notification sent to creator`);
      } catch (notificationError) {
        console.error('⚠️ [Gift] Creator notification failed:', notificationError.message);
      }

      // Track analytics
      try {
        await trackAnalytics('gift_viewed', {
          giftId: gift._id,
          creatorId: gift.creator._id,
          memberId: member._id,
          contentId: gift.content._id,
        });
      } catch (analyticsError) {
        console.error('⚠️ [Gift] View analytics failed:', analyticsError.message);
      }
    }

    // Return gift content with access
    res.json({
      success: true,
      gift: {
        id: gift._id,
        creator: {
          id: gift.creator._id,
          username: gift.creator.username || gift.creator.displayName,
          profileImage: gift.creator.profileImage,
        },
        content: {
          id: gift.content._id,
          title: gift.content.title,
          description: gift.content.description,
          type: gift.content.contentType,
          fileUrl: gift.content.fileUrl, // Member gets access to actual content
          thumbnailUrl: gift.content.thumbnailUrl,
        },
        originalPrice: gift.originalPrice,
        message: gift.message,
        giftedAt: gift.giftedAt,
        viewedAt: gift.viewedAt,
      },
      message: 'Gift content accessed successfully',
    });

  } catch (error) {
    console.error('❌ [Gift] Error viewing gift:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to access gift content',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

/**
 * Track gift click-through to creator profile
 * @route POST /api/v1/member/gifts/:giftId/click-through
 */
exports.trackClickThrough = async (req, res) => {
  try {
    const memberUserId = req.user.id;
    const { giftId } = req.params;

    console.log(`🔗 [Gift] Tracking click-through for gift ${giftId}`);

    // Get member profile
    const member = await Member.findOne({ user: memberUserId });
    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found',
      });
    }

    // Get gift and verify ownership
    const gift = await Gift.findById(giftId);
    if (!gift || gift.member.toString() !== member._id.toString()) {
      return res.status(404).json({
        success: false,
        message: 'Gift not found',
      });
    }

    // Track click-through
    await gift.trackClickThrough();

    // Track analytics
    try {
      await trackAnalytics('gift_click_through', {
        giftId: gift._id,
        creatorId: gift.creator,
        memberId: member._id,
      });
    } catch (analyticsError) {
      console.error('⚠️ [Gift] Click-through analytics failed:', analyticsError.message);
    }

    res.json({
      success: true,
      message: 'Click-through tracked successfully',
    });

  } catch (error) {
    console.error('❌ [Gift] Error tracking click-through:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track click-through',
    });
  }
};

/**
 * Get gift analytics for creator
 * @route GET /api/v1/creator/gifts/analytics
 */
exports.getGiftAnalytics = async (req, res) => {
  try {
    const creatorUserId = req.user.id;
    const { days = 30 } = req.query;

    console.log(`📊 [Gift] Getting gift analytics for creator ${creatorUserId}`);

    // Get creator profile
    const creator = await Creator.findOne({ user: creatorUserId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    // Get conversion statistics
    const stats = await Gift.getCreatorConversionRate(creator._id, parseInt(days));

    res.json({
      success: true,
      analytics: {
        period: `${days} days`,
        ...stats,
        conversionRate: {
          viewRate: stats.totalGifts > 0 ? ((stats.viewedGifts / stats.totalGifts) * 100).toFixed(1) : '0.0',
          connectionRate: stats.totalGifts > 0 ? ((stats.connectionsFromGifts / stats.totalGifts) * 100).toFixed(1) : '0.0',
          purchaseRate: stats.totalGifts > 0 ? ((stats.purchasesFromGifts / stats.totalGifts) * 100).toFixed(1) : '0.0',
        },
      },
      message: 'Gift analytics retrieved successfully',
    });

  } catch (error) {
    console.error('❌ [Gift] Error getting gift analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load gift analytics',
    });
  }
};