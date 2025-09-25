// Gift Service - Utilities and validation for gift functionality
const Gift = require('../models/Gift');
const Content = require('../models/Content');
const Member = require('../models/Member');
const Creator = require('../models/Creator');

/**
 * Validate if a creator can send a gift to a member
 * @param {ObjectId} creatorId - Creator's database ID
 * @param {ObjectId} memberId - Member's database ID
 * @param {ObjectId} contentId - Content's database ID
 * @returns {Object} - Validation result
 */
exports.validateGiftRules = async (creatorId, memberId, contentId) => {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Check if creator exists and is verified
    const creator = await Creator.findById(creatorId);
    if (!creator) {
      validation.isValid = false;
      validation.errors.push('Creator not found');
      return validation;
    }

    if (!creator.isVerified) {
      validation.isValid = false;
      validation.errors.push('Only verified creators can send gifts');
      return validation;
    }

    // Check if member exists and is active
    const member = await Member.findById(memberId).populate('user', 'isActive');
    if (!member || !member.user?.isActive) {
      validation.isValid = false;
      validation.errors.push('Member not found or inactive');
      return validation;
    }

    // Check member privacy settings
    if (member.privacy?.allowGifts === false) {
      validation.isValid = false;
      validation.errors.push('Member does not accept gifts');
      return validation;
    }

    // Check if member has blocked this creator
    if (member.privacy?.blockedCreators?.includes(creatorId)) {
      validation.isValid = false;
      validation.errors.push('Member has blocked this creator');
      return validation;
    }

    // Check if content exists and belongs to creator
    const content = await Content.findById(contentId);
    if (!content) {
      validation.isValid = false;
      validation.errors.push('Content not found');
      return validation;
    }

    if (content.creator.toString() !== creatorId.toString()) {
      validation.isValid = false;
      validation.errors.push('Creator can only gift their own content');
      return validation;
    }

    if (content.status !== 'approved' || !content.isActive) {
      validation.isValid = false;
      validation.errors.push('Content is not available for gifting');
      return validation;
    }

    if (content.price <= 0) {
      validation.isValid = false;
      validation.errors.push('Only paid content can be gifted');
      return validation;
    }

    // Check daily limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Creator daily gift limit
    const dailyGifts = await Gift.countDocuments({
      creator: creatorId,
      giftedAt: { $gte: today },
    });

    if (dailyGifts >= 10) {
      validation.isValid = false;
      validation.errors.push('Daily gift limit reached (10 gifts per day)');
      return validation;
    }

    // Check if already gifted this member today
    const existingTodayGift = await Gift.findOne({
      creator: creatorId,
      member: memberId,
      giftedAt: { $gte: today },
    });

    if (existingTodayGift) {
      validation.isValid = false;
      validation.errors.push('Already sent a gift to this member today');
      return validation;
    }

    // Warnings (don't block, but inform)
    if (dailyGifts >= 7) {
      validation.warnings.push(`Approaching daily limit: ${dailyGifts}/10 gifts sent today`);
    }

    // Check if creator has gifted this content before (might be spam)
    const previousSameContentGifts = await Gift.countDocuments({
      creator: creatorId,
      content: contentId,
    });

    if (previousSameContentGifts >= 5) {
      validation.warnings.push('This content has been gifted frequently');
    }

    return validation;

  } catch (error) {
    validation.isValid = false;
    validation.errors.push(`Validation error: ${error.message}`);
    return validation;
  }
};

/**
 * Get gift statistics for a creator
 * @param {ObjectId} creatorId - Creator's database ID
 * @param {number} days - Number of days to look back
 * @returns {Object} - Gift statistics
 */
exports.getCreatorGiftStats = async (creatorId, days = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const stats = await Gift.aggregate([
      {
        $match: {
          creator: creatorId,
          giftedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: null,
          totalGifts: { $sum: 1 },
          totalValue: { $sum: '$originalPrice' },
          viewedGifts: {
            $sum: { $cond: [{ $ne: ['$viewedAt', null] }, 1, 0] },
          },
          clickThroughs: {
            $sum: { $cond: ['$clickedThrough', 1, 0] },
          },
          connections: {
            $sum: { $cond: ['$ledToConnection', 1, 0] },
          },
          purchases: {
            $sum: { $cond: ['$ledToPurchase', 1, 0] },
          },
          revenue: { $sum: '$purchaseAmount' },
        },
      },
    ]);

    const result = stats[0] || {
      totalGifts: 0,
      totalValue: 0,
      viewedGifts: 0,
      clickThroughs: 0,
      connections: 0,
      purchases: 0,
      revenue: 0,
    };

    // Calculate conversion rates
    result.viewRate = result.totalGifts > 0 ?
      ((result.viewedGifts / result.totalGifts) * 100).toFixed(1) : '0.0';
    result.clickThroughRate = result.viewedGifts > 0 ?
      ((result.clickThroughs / result.viewedGifts) * 100).toFixed(1) : '0.0';
    result.connectionRate = result.totalGifts > 0 ?
      ((result.connections / result.totalGifts) * 100).toFixed(1) : '0.0';
    result.purchaseRate = result.totalGifts > 0 ?
      ((result.purchases / result.totalGifts) * 100).toFixed(1) : '0.0';

    // Calculate ROI
    result.roi = result.totalValue > 0 ?
      (((result.revenue - result.totalValue) / result.totalValue) * 100).toFixed(1) : '0.0';

    return result;

  } catch (error) {
    console.error('Error getting creator gift stats:', error);
    return {
      totalGifts: 0,
      totalValue: 0,
      viewedGifts: 0,
      clickThroughs: 0,
      connections: 0,
      purchases: 0,
      revenue: 0,
      viewRate: '0.0',
      clickThroughRate: '0.0',
      connectionRate: '0.0',
      purchaseRate: '0.0',
      roi: '0.0',
    };
  }
};

/**
 * Get popular content for gifting (most gifted/successful content)
 * @param {ObjectId} creatorId - Creator's database ID
 * @param {number} limit - Number of results to return
 * @returns {Array} - Popular content list
 */
exports.getPopularGiftContent = async (creatorId, limit = 10) => {
  try {
    const popularContent = await Gift.aggregate([
      {
        $match: {
          creator: creatorId,
          giftedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
        },
      },
      {
        $group: {
          _id: '$content',
          giftCount: { $sum: 1 },
          viewCount: {
            $sum: { $cond: [{ $ne: ['$viewedAt', null] }, 1, 0] },
          },
          clickThroughs: {
            $sum: { $cond: ['$clickedThrough', 1, 0] },
          },
          connections: {
            $sum: { $cond: ['$ledToConnection', 1, 0] },
          },
          avgValue: { $avg: '$originalPrice' },
        },
      },
      {
        $lookup: {
          from: 'contents',
          localField: '_id',
          foreignField: '_id',
          as: 'content',
        },
      },
      {
        $unwind: '$content',
      },
      {
        $match: {
          'content.isActive': true,
          'content.status': 'approved',
        },
      },
      {
        $addFields: {
          successRate: {
            $cond: [
              { $gt: ['$giftCount', 0] },
              { $multiply: [{ $divide: ['$connections', '$giftCount'] }, 100] },
              0,
            ],
          },
        },
      },
      {
        $sort: {
          successRate: -1,
          giftCount: -1,
        },
      },
      {
        $limit: limit,
      },
      {
        $project: {
          contentId: '$_id',
          title: '$content.title',
          contentType: '$content.contentType',
          thumbnailUrl: '$content.thumbnailUrl',
          price: '$content.price',
          giftCount: 1,
          viewCount: 1,
          clickThroughs: 1,
          connections: 1,
          successRate: { $round: ['$successRate', 1] },
        },
      },
    ]);

    return popularContent;

  } catch (error) {
    console.error('Error getting popular gift content:', error);
    return [];
  }
};

/**
 * Check if member can receive gifts (privacy check)
 * @param {ObjectId} memberId - Member's database ID
 * @param {ObjectId} creatorId - Creator's database ID (optional)
 * @returns {Object} - Privacy check result
 */
exports.checkMemberGiftPrivacy = async (memberId, creatorId = null) => {
  try {
    const member = await Member.findById(memberId);
    if (!member) {
      return {
        canReceive: false,
        reason: 'Member not found',
      };
    }

    // Check if member allows gifts at all
    if (member.privacy?.allowGifts === false) {
      return {
        canReceive: false,
        reason: 'Member has disabled gift receiving',
      };
    }

    // Check if member allows gifts only from verified creators
    if (member.privacy?.allowGiftsFromVerified === true && creatorId) {
      const creator = await Creator.findById(creatorId);
      if (!creator?.isVerified) {
        return {
          canReceive: false,
          reason: 'Member only accepts gifts from verified creators',
        };
      }
    }

    // Check if member has blocked this specific creator
    if (creatorId && member.privacy?.blockedCreators?.includes(creatorId)) {
      return {
        canReceive: false,
        reason: 'Member has blocked this creator',
      };
    }

    return {
      canReceive: true,
      reason: 'Member can receive gifts',
    };

  } catch (error) {
    return {
      canReceive: false,
      reason: `Privacy check error: ${error.message}`,
    };
  }
};

/**
 * Clean up expired gifts (for scheduled job)
 * @returns {number} - Number of gifts cleaned up
 */
exports.cleanupExpiredGifts = async () => {
  try {
    const result = await Gift.cleanupExpiredGifts();
    console.log(`🧹 [Gift Service] Cleaned up ${result} expired gifts`);
    return result;
  } catch (error) {
    console.error('❌ [Gift Service] Error cleaning up expired gifts:', error);
    return 0;
  }
};

/**
 * Get gift insights for analytics dashboard
 * @param {ObjectId} creatorId - Creator's database ID
 * @returns {Object} - Gift insights
 */
exports.getGiftInsights = async (creatorId) => {
  try {
    const insights = {
      bestPerformingContent: await exports.getPopularGiftContent(creatorId, 5),
      recentStats: await exports.getCreatorGiftStats(creatorId, 7), // Last 7 days
      monthlyStats: await exports.getCreatorGiftStats(creatorId, 30), // Last 30 days
    };

    // Get member tier breakdown
    const memberTierBreakdown = await Gift.aggregate([
      {
        $match: {
          creator: creatorId,
          giftedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: '$sourceContext.memberTier',
          count: { $sum: 1 },
          connections: {
            $sum: { $cond: ['$ledToConnection', 1, 0] },
          },
        },
      },
      {
        $project: {
          tier: '$_id',
          giftsSent: '$count',
          connectionsGained: '$connections',
          conversionRate: {
            $cond: [
              { $gt: ['$count', 0] },
              { $round: [{ $multiply: [{ $divide: ['$connections', '$count'] }, 100] }, 1] },
              0,
            ],
          },
        },
      },
      {
        $sort: { conversionRate: -1 },
      },
    ]);

    insights.memberTierBreakdown = memberTierBreakdown;

    return insights;

  } catch (error) {
    console.error('Error getting gift insights:', error);
    return {
      bestPerformingContent: [],
      recentStats: {},
      monthlyStats: {},
      memberTierBreakdown: [],
    };
  }
};

module.exports = exports;