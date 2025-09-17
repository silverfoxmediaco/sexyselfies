// backend/src/routes/creatorSales.routes.js
// Routes for creator sales dashboard, analytics, and team features

const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  verifiedCreatorOnly,
  checkVerificationLevel,
  featureUnlocked,
} = require('../middleware/verification.middleware');
const {
  checkDailyInteractionLimit,
  bulkActionLimits,
} = require('../middleware/salesLimits.middleware');
const { dataVisibilityRules } = require('../middleware/privacy.middleware');

// Import controllers
const {
  getMyHighValueMembers,
  trackSalesActivity,
  getConversionMetrics,
  getSalesRecommendations,
  getBestPerformingOffers,
  getSalesDashboard,
} = require('../controllers/creatorSales.controller');

// Import services for direct routes
const {
  findIdealMembers,
  suggestOutreachStrategy,
} = require('../services/connections.service');
const {
  segmentBySpending,
  segmentByActivity,
  segmentByPreferences,
  createCustomSegments,
} = require('../utils/memberSegmentation');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('creator'));

// ============================================
// SALES DASHBOARD ROUTES
// ============================================

/**
 * @route   GET /api/creator/sales/dashboard
 * @desc    Get comprehensive sales dashboard data
 * @access  Creator (Verified)
 */
router.get(
  '/dashboard',
  verifiedCreatorOnly,
  dataVisibilityRules,
  getSalesDashboard
);

/**
 * @route   GET /api/creator/sales/dashboard/realtime
 * @desc    Get real-time sales metrics
 * @access  Creator (Verified)
 */
router.get('/dashboard/realtime', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { getRealTimeMetrics } = require('../services/analytics.service');

    const metrics = await getRealTimeMetrics(creatorId);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Real-time metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching real-time metrics',
    });
  }
});

/**
 * @route   GET /api/creator/sales/dashboard/summary
 * @desc    Get sales summary for different periods
 * @access  Creator (Verified)
 */
router.get('/dashboard/summary', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = 'week' } = req.query; // today, week, month, year

    const CreatorSalesActivity = require('../models/CreatorSalesActivity');
    const salesActivity = await CreatorSalesActivity.findOne({
      creator: creatorId,
    });

    if (!salesActivity) {
      return res.json({
        success: true,
        data: {
          message: 'No sales activity yet',
          period,
          metrics: {
            totalInteractions: 0,
            totalConversions: 0,
            totalRevenue: 0,
            conversionRate: 0,
          },
        },
      });
    }

    // Get metrics based on period
    let metrics;
    switch (period) {
      case 'today':
        metrics = salesActivity.daily;
        break;
      case 'week':
        metrics = salesActivity.metrics.last7Days;
        break;
      case 'month':
        metrics = salesActivity.metrics.last30Days;
        break;
      case 'year':
      case 'all':
        metrics = salesActivity.metrics.allTime;
        break;
      default:
        metrics = salesActivity.metrics.last7Days;
    }

    res.json({
      success: true,
      data: {
        period,
        metrics,
        goals: salesActivity.goals.filter(g => g.status === 'active'),
        achievements: salesActivity.gamification.achievements.filter(
          a => a.unlockedAt
        ).length,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard summary',
    });
  }
});

// ============================================
// SALES ANALYTICS ROUTES
// ============================================

/**
 * @route   GET /api/creator/sales/analytics/conversion
 * @desc    Get detailed conversion metrics
 * @access  Creator (Verified)
 */
router.get('/analytics/conversion', verifiedCreatorOnly, getConversionMetrics);

/**
 * @route   GET /api/creator/sales/analytics/funnel
 * @desc    Get sales funnel analysis
 * @access  Creator (Verified)
 */
router.get('/analytics/funnel', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = 'last30Days' } = req.query;

    const { salesFunnelAnalysis } = require('../services/analytics.service');
    const funnel = await salesFunnelAnalysis(creatorId, period);

    res.json({
      success: true,
      data: funnel,
    });
  } catch (error) {
    console.error('Funnel analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing sales funnel',
    });
  }
});

/**
 * @route   GET /api/creator/sales/analytics/revenue
 * @desc    Get revenue attribution analysis
 * @access  Creator (Verified)
 */
router.get('/analytics/revenue', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = 'last30Days' } = req.query;

    const { revenueAttribution } = require('../services/analytics.service');
    const revenue = await revenueAttribution(creatorId, period);

    res.json({
      success: true,
      data: revenue,
    });
  } catch (error) {
    console.error('Revenue analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing revenue',
    });
  }
});

/**
 * @route   GET /api/creator/sales/analytics/segments
 * @desc    Get member segment analytics
 * @access  Creator (Verified)
 */
router.get('/analytics/segments', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      type = 'spending', // spending, activity, preferences, custom
      groupBy = 'tier',
    } = req.query;

    let segments;

    switch (type) {
      case 'spending':
        segments = await segmentBySpending({ creatorId, groupBy });
        break;
      case 'activity':
        segments = await segmentByActivity({ creatorId });
        break;
      case 'preferences':
        segments = await segmentByPreferences({
          creatorId,
          matchCreatorContent: true,
        });
        break;
      case 'custom':
        segments = await createCustomSegments({ creatorId });
        break;
      default:
        segments = await segmentBySpending({ creatorId });
    }

    res.json({
      success: true,
      data: segments,
    });
  } catch (error) {
    console.error('Segment analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing segments',
    });
  }
});

/**
 * @route   POST /api/creator/sales/analytics/track
 * @desc    Track sales activity
 * @access  Creator (Verified)
 */
router.post('/analytics/track', verifiedCreatorOnly, trackSalesActivity);

// ============================================
// PERFORMANCE METRICS ROUTES
// ============================================

/**
 * @route   GET /api/creator/sales/performance
 * @desc    Get overall performance metrics
 * @access  Creator (Verified)
 */
router.get('/performance', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const CreatorSalesActivity = require('../models/CreatorSalesActivity');

    const salesActivity = await CreatorSalesActivity.findOne({
      creator: creatorId,
    });

    if (!salesActivity) {
      return res.json({
        success: true,
        data: {
          performance: {
            overallConversionRate: 0,
            avgResponseTime: 0,
            successRate: 0,
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        performance: salesActivity.performance,
        funnel: salesActivity.funnel,
        bestPerforming: {
          interactionType: Object.entries(
            salesActivity.performance.conversionRates
          ).sort((a, b) => b[1].rate - a[1].rate)[0],
          timeSlot: salesActivity.performance.bestTimeSlots[0],
          memberSegment: salesActivity.performance.bestSegments[0],
        },
      },
    });
  } catch (error) {
    console.error('Performance metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching performance metrics',
    });
  }
});

/**
 * @route   GET /api/creator/sales/performance/goals
 * @desc    Get and manage sales goals
 * @access  Creator (Verified)
 */
router.get('/performance/goals', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const CreatorSalesActivity = require('../models/CreatorSalesActivity');

    const salesActivity = await CreatorSalesActivity.findOne({
      creator: creatorId,
    });

    if (!salesActivity) {
      return res.json({
        success: true,
        data: { goals: [] },
      });
    }

    res.json({
      success: true,
      data: {
        goals: salesActivity.goals,
        suggestions: generateGoalSuggestions(salesActivity),
      },
    });
  } catch (error) {
    console.error('Goals error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching goals',
    });
  }
});

/**
 * @route   POST /api/creator/sales/performance/goals
 * @desc    Create or update sales goal
 * @access  Creator (Verified)
 */
router.post('/performance/goals', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { type, target, deadline } = req.body;

    const CreatorSalesActivity = require('../models/CreatorSalesActivity');
    let salesActivity = await CreatorSalesActivity.findOne({
      creator: creatorId,
    });

    if (!salesActivity) {
      salesActivity = new CreatorSalesActivity({ creator: creatorId });
    }

    salesActivity.goals.push({
      type,
      target,
      current: 0,
      deadline: new Date(deadline),
      status: 'active',
      createdAt: new Date(),
    });

    await salesActivity.save();

    res.json({
      success: true,
      data: {
        goal: salesActivity.goals[salesActivity.goals.length - 1],
      },
    });
  } catch (error) {
    console.error('Create goal error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating goal',
    });
  }
});

/**
 * @route   GET /api/creator/sales/performance/leaderboard
 * @desc    Get sales leaderboard position
 * @access  Creator (Verified)
 */
router.get(
  '/performance/leaderboard',
  verifiedCreatorOnly,
  async (req, res) => {
    try {
      const creatorId = req.user.id;
      const { period = 'month', metric = 'revenue' } = req.query;

      const CreatorSalesActivity = require('../models/CreatorSalesActivity');

      // Get all creators' performance
      const allCreators = await CreatorSalesActivity.find({})
        .populate('creator', 'username profileImage')
        .sort(`-metrics.last30Days.totalRevenue`)
        .limit(100);

      // Find current creator's position
      const position =
        allCreators.findIndex(c => c.creator._id.toString() === creatorId) + 1;

      // Get top performers
      const topPerformers = allCreators.slice(0, 10).map((creator, index) => ({
        rank: index + 1,
        creator: {
          id: creator.creator._id,
          username: creator.creator.username,
          profileImage: creator.creator.profileImage,
        },
        metrics: {
          revenue: creator.metrics.last30Days.totalRevenue,
          conversions: creator.metrics.last30Days.totalConversions,
          interactions: creator.metrics.last30Days.totalInteractions,
        },
      }));

      res.json({
        success: true,
        data: {
          yourRank: position || 'Unranked',
          totalCreators: allCreators.length,
          percentile: position
            ? Math.round((1 - position / allCreators.length) * 100)
            : 0,
          topPerformers,
          nearbyCreators: position
            ? allCreators
                .slice(
                  Math.max(0, position - 3),
                  Math.min(allCreators.length, position + 2)
                )
                .map((c, i) => ({
                  rank: Math.max(1, position - 2) + i,
                  creator: {
                    id: c.creator._id,
                    username: c.creator.username,
                  },
                  metrics: {
                    revenue: c.metrics.last30Days.totalRevenue,
                  },
                }))
            : [],
        },
      });
    } catch (error) {
      console.error('Leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching leaderboard',
      });
    }
  }
);

// ============================================
// MEMBER DISCOVERY & RECOMMENDATIONS
// ============================================

/**
 * @route   GET /api/creator/sales/discover
 * @desc    Discover high-value members
 * @access  Creator (Verified)
 */
router.get(
  '/discover',
  verifiedCreatorOnly,
  dataVisibilityRules,
  getMyHighValueMembers
);

/**
 * @route   GET /api/creator/sales/recommendations
 * @desc    Get personalized sales recommendations
 * @access  Creator (Verified)
 */
router.get('/recommendations', verifiedCreatorOnly, getSalesRecommendations);

/**
 * @route   GET /api/creator/sales/matchmaking
 * @desc    Get AI-powered member matches
 * @access  Creator (Premium)
 */
router.get(
  '/matchmaking',
  verifiedCreatorOnly,
  checkVerificationLevel('premium'),
  async (req, res) => {
    try {
      const creatorId = req.user.id;
      const {
        limit = 20,
        focusOn = 'balanced',
        excludeInteracted = false,
      } = req.query;

      const matches = await findIdealMembers(creatorId, {
        limit: parseInt(limit),
        focusOn,
        excludeInteracted: excludeInteracted === 'true',
      });

      res.json({
        success: true,
        data: matches,
      });
    } catch (error) {
      console.error('Matchmaking error:', error);
      res.status(500).json({
        success: false,
        message: 'Error finding matches',
      });
    }
  }
);

/**
 * @route   GET /api/creator/sales/offers/best
 * @desc    Get best performing offers
 * @access  Creator (Verified)
 */
router.get('/offers/best', verifiedCreatorOnly, getBestPerformingOffers);

// ============================================
// TEAM FEATURES (AGENCIES)
// ============================================

/**
 * @route   GET /api/creator/sales/team
 * @desc    Get team overview (for agencies)
 * @access  Creator (Agency)
 */
router.get(
  '/team',
  verifiedCreatorOnly,
  checkVerificationLevel('vip'), // Assuming VIP = Agency level
  async (req, res) => {
    try {
      const agencyId = req.user.id;

      // This would need an Agency model and team relationship
      res.json({
        success: true,
        data: {
          message: 'Team features coming soon',
          features: [
            'Team member management',
            'Performance tracking',
            'Commission splitting',
            'Bulk operations',
          ],
        },
      });
    } catch (error) {
      console.error('Team overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching team data',
      });
    }
  }
);

/**
 * @route   GET /api/creator/sales/team/members
 * @desc    Get team members performance
 * @access  Creator (Agency)
 */
router.get(
  '/team/members',
  verifiedCreatorOnly,
  checkVerificationLevel('vip'),
  async (req, res) => {
    try {
      const agencyId = req.user.id;

      // Placeholder for team member management
      res.json({
        success: true,
        data: {
          members: [],
          totalRevenue: 0,
          totalConversions: 0,
        },
      });
    } catch (error) {
      console.error('Team members error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching team members',
      });
    }
  }
);

/**
 * @route   POST /api/creator/sales/team/invite
 * @desc    Invite team member
 * @access  Creator (Agency)
 */
router.post(
  '/team/invite',
  verifiedCreatorOnly,
  checkVerificationLevel('vip'),
  async (req, res) => {
    try {
      const agencyId = req.user.id;
      const { email, role, permissions } = req.body;

      // Placeholder for team invitations
      res.json({
        success: true,
        data: {
          message: 'Invitation sent',
          invitedEmail: email,
        },
      });
    } catch (error) {
      console.error('Team invite error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending invitation',
      });
    }
  }
);

// ============================================
// GAMIFICATION & ACHIEVEMENTS
// ============================================

/**
 * @route   GET /api/creator/sales/achievements
 * @desc    Get creator achievements
 * @access  Creator (Verified)
 */
router.get('/achievements', verifiedCreatorOnly, async (req, res) => {
  try {
    const creatorId = req.user.id;
    const CreatorSalesActivity = require('../models/CreatorSalesActivity');

    const salesActivity = await CreatorSalesActivity.findOne({
      creator: creatorId,
    });

    if (!salesActivity) {
      return res.json({
        success: true,
        data: {
          achievements: [],
          points: 0,
          level: 1,
        },
      });
    }

    res.json({
      success: true,
      data: {
        achievements: salesActivity.gamification.achievements,
        points: salesActivity.gamification.points,
        level: salesActivity.gamification.level,
        streaks: salesActivity.gamification.streaks,
        nextMilestone: getNextMilestone(salesActivity.gamification),
      },
    });
  } catch (error) {
    console.error('Achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching achievements',
    });
  }
});

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * @route   POST /api/creator/sales/bulk/message
 * @desc    Send bulk messages to members
 * @access  Creator (Premium)
 */
router.post(
  '/bulk/message',
  verifiedCreatorOnly,
  checkVerificationLevel('premium'),
  bulkActionLimits,
  async (req, res) => {
    try {
      const creatorId = req.user.id;
      const { recipients, message, segmentId } = req.body;

      // Implementation would send bulk messages
      res.json({
        success: true,
        data: {
          sent: recipients?.length || 0,
          failed: 0,
          warning: req.bulkMessageWarning,
        },
      });
    } catch (error) {
      console.error('Bulk message error:', error);
      res.status(500).json({
        success: false,
        message: 'Error sending bulk messages',
      });
    }
  }
);

/**
 * @route   POST /api/creator/sales/bulk/offer
 * @desc    Create bulk special offers
 * @access  Creator (Premium)
 */
router.post(
  '/bulk/offer',
  verifiedCreatorOnly,
  checkVerificationLevel('premium'),
  bulkActionLimits,
  async (req, res) => {
    try {
      const creatorId = req.user.id;
      const { segmentId, offerDetails } = req.body;

      // Implementation would create bulk offers
      res.json({
        success: true,
        data: {
          offersCreated: 0,
          targetMembers: 0,
        },
      });
    } catch (error) {
      console.error('Bulk offer error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating bulk offers',
      });
    }
  }
);

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateGoalSuggestions(salesActivity) {
  const suggestions = [];

  // Based on current performance
  const currentRevenue = salesActivity.metrics.last30Days.totalRevenue;
  const currentConversions = salesActivity.metrics.last30Days.totalConversions;

  suggestions.push({
    type: 'revenue',
    target: Math.round(currentRevenue * 1.2),
    description: '20% revenue increase',
    difficulty: 'achievable',
  });

  suggestions.push({
    type: 'conversions',
    target: Math.round(currentConversions * 1.5),
    description: '50% more conversions',
    difficulty: 'challenging',
  });

  suggestions.push({
    type: 'interactions',
    target: 500,
    description: 'Daily interaction goal',
    difficulty: 'moderate',
  });

  return suggestions;
}

function getNextMilestone(gamification) {
  const points = gamification.points;
  const milestones = [
    { points: 100, name: 'Rising Star' },
    { points: 500, name: 'Sales Pro' },
    { points: 1000, name: 'Conversion Expert' },
    { points: 5000, name: 'Revenue Master' },
    { points: 10000, name: 'Sales Legend' },
  ];

  return (
    milestones.find(m => m.points > points) || {
      points: 999999,
      name: 'Ultimate Legend',
    }
  );
}

module.exports = router;
