// backend/src/controllers/memberAnalytics.controller.js
// Controller for member analytics and value calculations

const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');
const {
  calculateMemberScore,
  determineSpendingTier,
  predictLifetimeValue,
  identifyHighPotential,
  riskAssessment,
} = require('../services/memberScoring.service');
const { trackEvent } = require('../services/analytics.service');

// ============================================
// MEMBER VALUE CALCULATIONS
// ============================================

/**
 * Calculate member value score
 * @route POST /api/analytics/members/:memberId/calculate-value
 */
exports.calculateMemberValue = async (req, res) => {
  try {
    const { memberId } = req.params;
    const creatorId = req.user.id;

    // Calculate comprehensive score
    const score = await calculateMemberScore(memberId);

    // Get member analytics
    const analytics = await MemberAnalytics.findOne({
      member: memberId,
    }).populate('member', 'username avatar');

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Member analytics not found',
      });
    }

    // Check if creator can view this member
    if (
      !analytics.privacy.discoverable ||
      analytics.privacy.blockedCreators.includes(creatorId)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Cannot access member analytics',
      });
    }

    // Track analytics view
    await trackEvent({
      category: 'analytics_view',
      action: 'member_value',
      userId: creatorId,
      userType: 'creator',
      metadata: { memberId },
    });

    res.json({
      success: true,
      data: {
        member: {
          id: analytics.member._id,
          username: analytics.member.username,
          avatar: analytics.member.avatar,
        },
        valueScore: score,
        scoring: analytics.scoring,
        spending: {
          tier: analytics.spending.tier,
          last30Days: analytics.spending.last30Days,
          lifetime: analytics.spending.lifetime,
          velocity: analytics.spending.velocity,
        },
        activity: analytics.activity,
        engagement: analytics.engagement,
        calculatedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('Calculate member value error:', error);
    res.status(500).json({
      success: false,
      message: 'Error calculating member value',
    });
  }
};

/**
 * Segment members by criteria
 * @route POST /api/analytics/members/segment
 */
exports.segmentMembers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      segmentBy = 'spending', // spending, activity, preferences, custom
      filters = {},
      limit = 50,
      page = 1,
    } = req.body;

    // Build segmentation query
    let query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId },
    };

    // Apply segmentation
    switch (segmentBy) {
      case 'spending':
        if (filters.tier) {
          query['spending.tier'] = {
            $in: Array.isArray(filters.tier) ? filters.tier : [filters.tier],
          };
        }
        if (filters.minSpend) {
          query['spending.last30Days'] = { $gte: filters.minSpend };
        }
        if (filters.maxSpend) {
          query['spending.last30Days'] = {
            ...query['spending.last30Days'],
            $lte: filters.maxSpend,
          };
        }
        break;

      case 'activity':
        if (filters.activityLevel) {
          query['activity.level'] = {
            $in: Array.isArray(filters.activityLevel)
              ? filters.activityLevel
              : [filters.activityLevel],
          };
        }
        if (filters.lastActiveDays) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - filters.lastActiveDays);
          query['activity.lastActive'] = { $gte: cutoffDate };
        }
        break;

      case 'preferences':
        if (filters.categories) {
          query['preferences.topCategories.category'] = {
            $in: filters.categories,
          };
        }
        if (filters.contentTypes) {
          query['preferences.contentTypes.type'] = {
            $in: filters.contentTypes,
          };
        }
        break;

      case 'custom':
        // Custom segmentation based on multiple criteria
        if (filters.valueScore) {
          query['scoring.valueScore'] = { $gte: filters.valueScore };
        }
        if (filters.churnRisk) {
          query['scoring.churnRisk.level'] = filters.churnRisk;
        }
        if (filters.hasInteracted !== undefined) {
          const interactions = await MemberInteraction.distinct('member', {
            creator: creatorId,
          });
          if (filters.hasInteracted) {
            query['member'] = { $in: interactions };
          } else {
            query['member'] = { $nin: interactions };
          }
        }
        break;
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;

    const segments = await MemberAnalytics.find(query)
      .populate('member', 'username avatar lastActive')
      .sort('-scoring.valueScore')
      .skip(skip)
      .limit(limit);

    const total = await MemberAnalytics.countDocuments(query);

    // Calculate segment statistics
    const segmentStats = await MemberAnalytics.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalMembers: { $sum: 1 },
          avgValueScore: { $avg: '$scoring.valueScore' },
          totalSpending: { $sum: '$spending.last30Days' },
          avgSpending: { $avg: '$spending.last30Days' },
          tiers: {
            $push: '$spending.tier',
          },
        },
      },
    ]);

    const stats = segmentStats[0] || {
      totalMembers: 0,
      avgValueScore: 0,
      totalSpending: 0,
      avgSpending: 0,
    };

    // Count by tier
    const tierCounts = segments.reduce((acc, s) => {
      acc[s.spending.tier] = (acc[s.spending.tier] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        segments: segments.map(s => ({
          memberId: s.member._id,
          username: s.member.username,
          avatar: s.member.avatar,
          tier: s.spending.tier,
          valueScore: s.scoring.valueScore,
          last30DaySpend: s.spending.last30Days,
          activityLevel: s.activity.level,
          lastActive: s.activity.lastActive,
          churnRisk: s.scoring.churnRisk.level,
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        statistics: {
          ...stats,
          tierDistribution: tierCounts,
        },
      },
    });
  } catch (error) {
    console.error('Segment members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error segmenting members',
    });
  }
};

/**
 * Predict purchase likelihood
 * @route GET /api/analytics/members/:memberId/predict-purchase
 */
exports.predictPurchaseLikelihood = async (req, res) => {
  try {
    const { memberId } = req.params;
    const creatorId = req.user.id;

    // Get member analytics
    const analytics = await MemberAnalytics.findOne({ member: memberId });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Calculate purchase likelihood factors
    const factors = {
      spendingTrend:
        analytics.spending.velocity.trend === 'increasing' ? 0.8 : 0.4,
      activityLevel:
        analytics.activity.level === 'very-active'
          ? 0.9
          : analytics.activity.level === 'active'
            ? 0.7
            : 0.3,
      engagement: analytics.engagement.messageResponseRate / 100,
      previousPurchases: Math.min(1, analytics.metadata.totalPurchases / 10),
      daysSinceLastPurchase: Math.max(
        0,
        1 - daysBetween(analytics.metadata.lastPurchase, new Date()) / 30
      ),
    };

    // Check interaction history with this creator
    const interactions = await MemberInteraction.find({
      creator: creatorId,
      member: memberId,
    })
      .sort('-createdAt')
      .limit(10);

    const hasPositiveHistory = interactions.some(
      i => i.conversion.resulted_in_purchase
    );
    const responseRate =
      interactions.filter(i => i.response.hasResponded).length /
      (interactions.length || 1);

    factors.creatorRelationship = hasPositiveHistory ? 0.9 : responseRate;

    // Calculate weighted likelihood
    const weights = {
      spendingTrend: 0.25,
      activityLevel: 0.2,
      engagement: 0.15,
      previousPurchases: 0.2,
      daysSinceLastPurchase: 0.1,
      creatorRelationship: 0.1,
    };

    const likelihood = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + value * weights[key];
    }, 0);

    const likelihoodPercentage = Math.round(likelihood * 100);

    // Determine recommendation
    let recommendation;
    if (likelihoodPercentage >= 70) {
      recommendation = 'High likelihood - Send personalized offer';
    } else if (likelihoodPercentage >= 40) {
      recommendation = 'Moderate likelihood - Build relationship first';
    } else {
      recommendation = 'Low likelihood - Focus on engagement';
    }

    res.json({
      success: true,
      data: {
        memberId,
        likelihood: likelihoodPercentage,
        factors,
        recommendation,
        suggestedActions: getSuggestedActions(likelihoodPercentage, factors),
        optimalTiming: getOptimalTiming(analytics),
      },
    });
  } catch (error) {
    console.error('Predict purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Error predicting purchase likelihood',
    });
  }
};

/**
 * Get spending trends
 * @route GET /api/analytics/members/spending-trends
 */
exports.getSpendingTrends = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = 'last30Days', groupBy = 'tier' } = req.query;

    // Get date range
    const dateRange = getDateRange(period);

    // Aggregate spending trends
    const trends = await Transaction.aggregate([
      {
        $match: {
          creator: creatorId,
          status: 'completed',
          createdAt: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      {
        $lookup: {
          from: 'memberanalytics',
          localField: 'member',
          foreignField: 'member',
          as: 'analytics',
        },
      },
      {
        $unwind: '$analytics',
      },
      {
        $group: {
          _id:
            groupBy === 'tier'
              ? '$analytics.spending.tier'
              : groupBy === 'day'
                ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
                : groupBy === 'week'
                  ? { $week: '$createdAt' }
                  : '$analytics.activity.level',
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
          uniqueMembers: { $addToSet: '$member' },
          avgTransactionValue: { $avg: '$amount' },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Calculate growth metrics
    const previousPeriod = getPreviousPeriod(period);
    const previousTrends = await Transaction.aggregate([
      {
        $match: {
          creator: creatorId,
          status: 'completed',
          createdAt: { $gte: previousPeriod.start, $lte: previousPeriod.end },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const currentTotal = trends.reduce((sum, t) => sum + t.totalRevenue, 0);
    const previousTotal = previousTrends[0]?.totalRevenue || 0;
    const growthRate =
      previousTotal > 0
        ? (((currentTotal - previousTotal) / previousTotal) * 100).toFixed(2)
        : 0;

    res.json({
      success: true,
      data: {
        period,
        trends: trends.map(t => ({
          segment: t._id,
          revenue: t.totalRevenue,
          transactions: t.transactionCount,
          uniqueMembers: t.uniqueMembers.length,
          avgTransactionValue: Math.round(t.avgTransactionValue * 100) / 100,
        })),
        summary: {
          totalRevenue: currentTotal,
          growthRate: parseFloat(growthRate),
          growthDirection:
            growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'stable',
        },
      },
    });
  } catch (error) {
    console.error('Get spending trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching spending trends',
    });
  }
};

/**
 * Identify whale members
 * @route GET /api/analytics/members/whales
 */
exports.identifyWhales = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { limit = 20, includeVIP = false } = req.query;

    // Query for whales
    const query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId },
      'spending.tier': includeVIP ? { $in: ['whale', 'vip'] } : 'whale',
    };

    const whales = await MemberAnalytics.find(query)
      .populate('member', 'username avatar joinDate')
      .sort('-spending.last30Days')
      .limit(parseInt(limit));

    // Get interaction history for each whale
    const whalesWithHistory = await Promise.all(
      whales.map(async whale => {
        const interactions = await MemberInteraction.find({
          creator: creatorId,
          member: whale.member._id,
        })
          .sort('-createdAt')
          .limit(5);

        const lastInteraction = interactions[0];
        const totalPurchases = interactions.filter(
          i => i.conversion.resulted_in_purchase
        ).length;
        const totalSpent = interactions.reduce(
          (sum, i) => sum + (i.conversion.purchaseAmount || 0),
          0
        );

        return {
          member: {
            id: whale.member._id,
            username: whale.member.username,
            avatar: whale.member.avatar,
            joinDate: whale.member.joinDate,
          },
          analytics: {
            tier: whale.spending.tier,
            last30DaySpend: whale.spending.last30Days,
            lifetimeSpend: whale.spending.lifetime,
            averagePurchase: whale.spending.averagePurchase,
            velocity: whale.spending.velocity,
            valueScore: whale.scoring.valueScore,
            churnRisk: whale.scoring.churnRisk.level,
          },
          interaction: {
            lastInteraction: lastInteraction?.createdAt,
            totalInteractions: interactions.length,
            totalPurchases,
            totalSpentWithYou: totalSpent,
            responseRate:
              (interactions.filter(i => i.response.hasResponded).length /
                (interactions.length || 1)) *
              100,
          },
          recommendations: getWhaleRecommendations(whale, interactions),
        };
      })
    );

    res.json({
      success: true,
      data: {
        whales: whalesWithHistory,
        total: whales.length,
        statistics: {
          totalWhaleSpend: whales.reduce(
            (sum, w) => sum + w.spending.last30Days,
            0
          ),
          avgWhaleSpend:
            whales.reduce((sum, w) => sum + w.spending.last30Days, 0) /
            whales.length,
          highestSpender: whales[0],
        },
      },
    });
  } catch (error) {
    console.error('Identify whales error:', error);
    res.status(500).json({
      success: false,
      message: 'Error identifying whales',
    });
  }
};

/**
 * Get churn risk assessment
 * @route GET /api/analytics/members/:memberId/churn-risk
 */
exports.getChurnRisk = async (req, res) => {
  try {
    const { memberId } = req.params;
    const creatorId = req.user.id;

    // Perform risk assessment
    const risk = await riskAssessment(memberId);

    // Get member's recent activity
    const recentInteractions = await MemberInteraction.find({
      creator: creatorId,
      member: memberId,
    })
      .sort('-createdAt')
      .limit(10);

    // Calculate retention strategies
    const strategies = getRetentionStrategies(risk, recentInteractions);

    res.json({
      success: true,
      data: {
        memberId,
        riskAssessment: risk,
        strategies,
        urgency:
          risk.level === 'high'
            ? 'immediate'
            : risk.level === 'medium'
              ? 'soon'
              : 'monitor',
      },
    });
  } catch (error) {
    console.error('Get churn risk error:', error);
    res.status(500).json({
      success: false,
      message: 'Error assessing churn risk',
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((new Date(date2) - new Date(date1)) / oneDay));
}

function getDateRange(period) {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      break;
    case 'last7Days':
      start.setDate(start.getDate() - 7);
      break;
    case 'last30Days':
      start.setDate(start.getDate() - 30);
      break;
    case 'last90Days':
      start.setDate(start.getDate() - 90);
      break;
    default:
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}

function getPreviousPeriod(period) {
  const range = getDateRange(period);
  const duration = range.end - range.start;

  return {
    start: new Date(range.start - duration),
    end: new Date(range.start),
  };
}

function getSuggestedActions(likelihood, factors) {
  const actions = [];

  if (likelihood >= 70) {
    actions.push('Send exclusive offer within 24 hours');
    actions.push('Highlight new premium content');
  } else if (likelihood >= 40) {
    actions.push('Send personalized message first');
    actions.push('Share free preview content');
    actions.push('Build rapport before offering');
  } else {
    actions.push('Focus on engagement over sales');
    actions.push('Send value-first content');
    actions.push('Ask about preferences');
  }

  if (factors.daysSinceLastPurchase < 0.5) {
    actions.push('Wait a few days before next offer');
  }

  return actions;
}

function getOptimalTiming(analytics) {
  const lastActive = new Date(analytics.activity.lastActive);
  const hour = lastActive.getHours();

  // Determine optimal time based on activity patterns
  if (hour >= 20 || hour < 2) {
    return 'Evening (8 PM - 12 AM)';
  } else if (hour >= 12 && hour < 14) {
    return 'Lunch time (12 PM - 2 PM)';
  } else if (hour >= 6 && hour < 9) {
    return 'Morning (6 AM - 9 AM)';
  } else {
    return 'Afternoon (2 PM - 6 PM)';
  }
}

function getWhaleRecommendations(whale, interactions) {
  const recommendations = [];
  const daysSinceLastInteraction = interactions[0]
    ? daysBetween(interactions[0].createdAt, new Date())
    : 999;

  if (daysSinceLastInteraction > 7) {
    recommendations.push('Priority re-engagement needed');
  }

  if (whale.spending.velocity.trend === 'increasing') {
    recommendations.push('Capitalize on increasing spend trend');
  }

  if (whale.scoring.churnRisk.level === 'high') {
    recommendations.push('Immediate retention action required');
  }

  recommendations.push('Offer VIP perks and exclusive access');

  return recommendations;
}

function getRetentionStrategies(risk, interactions) {
  const strategies = [];

  if (risk.level === 'high') {
    strategies.push({
      action: 'Send win-back offer',
      timing: 'Within 24 hours',
      discount: '30-50%',
    });
    strategies.push({
      action: 'Personal video message',
      timing: 'Immediately',
      message: 'We miss you!',
    });
  } else if (risk.level === 'medium') {
    strategies.push({
      action: 'Exclusive content preview',
      timing: 'Within 3 days',
    });
    strategies.push({
      action: 'Check-in message',
      timing: 'This week',
    });
  }

  return strategies;
}

module.exports = exports;
