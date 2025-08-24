// backend/src/controllers/creatorSales.controller.js
// Controller for creator sales dashboard and performance tracking

const CreatorSalesActivity = require('../models/CreatorSalesActivity');
const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const SpecialOffer = require('../models/SpecialOffer');
const Transaction = require('../models/Transaction');
const { 
  identifyHighPotential,
  predictLifetimeValue 
} = require('../services/memberScoring.service');
const { 
  measureConversionRates,
  salesFunnelAnalysis,
  revenueAttribution,
  getRealTimeMetrics
} = require('../services/analytics.service');

// ============================================
// HIGH VALUE MEMBERS DISCOVERY
// ============================================

/**
 * Get creator's high-value member recommendations
 * @route GET /api/creator/sales/high-value-members
 */
exports.getMyHighValueMembers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      limit = 20,
      sortBy = 'value', // value, potential, recent
      filterBy = 'all' // all, untapped, engaged, at-risk
    } = req.query;
    
    // Get creator's sales activity
    let salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    
    if (!salesActivity) {
      // Initialize sales activity if doesn't exist
      salesActivity = new CreatorSalesActivity({
        creator: creatorId,
        daily: { date: new Date() }
      });
      await salesActivity.save();
    }
    
    // Build query based on filter
    let query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId }
    };
    
    switch (filterBy) {
      case 'untapped':
        // High-value members not yet engaged
        const engagedMembers = await MemberInteraction.distinct('member', {
          creator: creatorId
        });
        query['member'] = { $nin: engagedMembers };
        query['spending.tier'] = { $in: ['whale', 'vip'] };
        break;
        
      case 'engaged':
        // Members who have interacted but not purchased
        const interactedNoPurchase = await MemberInteraction.aggregate([
          { $match: { creator: creatorId } },
          {
            $group: {
              _id: '$member',
              hasPurchased: { $max: '$conversion.resulted_in_purchase' }
            }
          },
          { $match: { hasPurchased: false } },
          { $project: { _id: 1 } }
        ]);
        query['member'] = { $in: interactedNoPurchase.map(m => m._id) };
        break;
        
      case 'at-risk':
        // Previously active members showing decline
        query['scoring.churnRisk.level'] = { $in: ['medium', 'high'] };
        const previousBuyers = await Transaction.distinct('member', {
          creator: creatorId,
          status: 'completed'
        });
        query['member'] = { $in: previousBuyers };
        break;
    }
    
    // Determine sort criteria
    let sort = {};
    switch (sortBy) {
      case 'potential':
        sort = { 'scoring.potentialScore': -1 };
        break;
      case 'recent':
        sort = { 'activity.lastActive': -1 };
        break;
      case 'value':
      default:
        sort = { 'scoring.valueScore': -1, 'spending.last30Days': -1 };
    }
    
    // Get members with analytics
    const members = await MemberAnalytics.find(query)
      .populate('member', 'username avatar joinDate lastActive')
      .sort(sort)
      .limit(parseInt(limit));
    
    // Enhance with interaction history and recommendations
    const enhancedMembers = await Promise.all(
      members.map(async (memberAnalytics) => {
        // Get interaction history
        const lastInteraction = await MemberInteraction.findOne({
          creator: creatorId,
          member: memberAnalytics.member._id
        }).sort('-createdAt');
        
        // Predict LTV
        const ltv = await predictLifetimeValue(memberAnalytics.member._id);
        
        // Get personalized approach recommendation
        const approach = getPersonalizedApproach(memberAnalytics, lastInteraction);
        
        return {
          member: {
            id: memberAnalytics.member._id,
            username: memberAnalytics.member.username,
            avatar: memberAnalytics.member.avatar,
            isOnline: isOnlineNow(memberAnalytics.member.lastActive)
          },
          analytics: {
            tier: memberAnalytics.spending.tier,
            valueScore: memberAnalytics.scoring.valueScore,
            last30DaySpend: memberAnalytics.spending.last30Days,
            lifetimeValue: ltv.ltv,
            activityLevel: memberAnalytics.activity.level,
            lastActive: memberAnalytics.activity.lastActive,
            churnRisk: memberAnalytics.scoring.churnRisk.level,
            preferredContent: memberAnalytics.preferences.topCategories[0]?.category
          },
          interaction: {
            hasInteracted: !!lastInteraction,
            lastInteractionDate: lastInteraction?.createdAt,
            lastInteractionType: lastInteraction?.interactionType,
            hasConverted: lastInteraction?.conversion.resulted_in_purchase
          },
          recommendation: approach
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        members: enhancedMembers,
        total: members.length,
        filterApplied: filterBy,
        sortedBy: sortBy
      }
    });
    
  } catch (error) {
    console.error('Get high-value members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching high-value members'
    });
  }
};

/**
 * Track sales activity
 * @route POST /api/creator/sales/track-activity
 */
exports.trackSalesActivity = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      activityType, // interaction, conversion, milestone
      data
    } = req.body;
    
    let salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    
    if (!salesActivity) {
      salesActivity = new CreatorSalesActivity({
        creator: creatorId,
        daily: { date: new Date() }
      });
    }
    
    // Update based on activity type
    switch (activityType) {
      case 'interaction':
        await salesActivity.recordInteraction(
          data.interactionType,
          data.memberId,
          data.memberTier
        );
        break;
        
      case 'conversion':
        await salesActivity.recordConversion(
          data.memberId,
          data.amount,
          data.interactionType
        );
        break;
        
      case 'milestone':
        await salesActivity.checkAndUnlockAchievements();
        break;
    }
    
    await salesActivity.save();
    
    res.json({
      success: true,
      data: {
        daily: salesActivity.daily,
        metrics: salesActivity.metrics,
        achievements: salesActivity.gamification.achievements
          .filter(a => a.unlockedAt)
          .slice(-5) // Last 5 unlocked
      }
    });
    
  } catch (error) {
    console.error('Track sales activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking sales activity'
    });
  }
};

/**
 * Get conversion metrics
 * @route GET /api/creator/sales/conversion-metrics
 */
exports.getConversionMetrics = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = 'last30Days' } = req.query;
    
    // Get conversion rates
    const conversionRates = await measureConversionRates(creatorId, period);
    
    // Get sales funnel
    const funnel = await salesFunnelAnalysis(creatorId, period);
    
    // Get revenue attribution
    const revenue = await revenueAttribution(creatorId, period);
    
    // Get real-time metrics
    const realTime = await getRealTimeMetrics(creatorId);
    
    res.json({
      success: true,
      data: {
        period,
        conversionRates,
        funnel,
        revenue,
        realTime,
        timestamp: new Date()
      }
    });
    
  } catch (error) {
    console.error('Get conversion metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching conversion metrics'
    });
  }
};

/**
 * Get sales recommendations
 * @route GET /api/creator/sales/recommendations
 */
exports.getSalesRecommendations = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    // Get creator's sales activity
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    
    if (!salesActivity) {
      return res.json({
        success: true,
        data: {
          recommendations: [
            {
              type: 'getting_started',
              priority: 'high',
              title: 'Start Your Sales Journey',
              description: 'Begin by browsing high-value members and sending your first interaction',
              action: 'Browse Members',
              actionUrl: '/creator/members/discover'
            }
          ]
        }
      });
    }
    
    // Generate AI recommendations based on performance
    const recommendations = await generateSalesRecommendations(salesActivity);
    
    // Get opportunities
    const opportunities = await identifyOpportunities(creatorId);
    
    res.json({
      success: true,
      data: {
        recommendations,
        opportunities,
        coachingTips: salesActivity.gamification.aiCoaching
      }
    });
    
  } catch (error) {
    console.error('Get sales recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations'
    });
  }
};

/**
 * Get best performing offers
 * @route GET /api/creator/sales/best-offers
 */
exports.getBestPerformingOffers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { limit = 10 } = req.query;
    
    // Get offers sorted by performance
    const offers = await SpecialOffer.find({
      creator: creatorId,
      'performance.redemptionRate': { $gt: 0 }
    })
    .sort('-performance.roi')
    .limit(parseInt(limit));
    
    // Analyze what makes them successful
    const analysis = offers.map(offer => ({
      offerId: offer._id,
      name: offer.offer.name,
      type: offer.offer.type,
      discount: offer.offer.discount,
      performance: {
        redemptionRate: offer.performance.redemptionRate,
        totalRevenue: offer.performance.totalRevenue,
        roi: offer.performance.roi,
        avgOrderValue: offer.performance.avgOrderValue
      },
      targeting: {
        targetType: offer.recipients.targetType,
        segments: offer.recipients.segments
      },
      successFactors: analyzeOfferSuccess(offer)
    }));
    
    // Get offer templates based on best performers
    const templates = generateOfferTemplates(analysis);
    
    res.json({
      success: true,
      data: {
        bestOffers: analysis,
        templates,
        insights: getOfferInsights(offers)
      }
    });
    
  } catch (error) {
    console.error('Get best performing offers error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching best offers'
    });
  }
};

// ============================================
// SALES DASHBOARD DATA
// ============================================

/**
 * Get comprehensive sales dashboard data
 * @route GET /api/creator/sales/dashboard
 */
exports.getSalesDashboard = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = 'today' } = req.query;
    
    // Get sales activity
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    
    if (!salesActivity) {
      return res.json({
        success: true,
        data: {
          message: 'No sales activity yet. Start engaging with members!',
          quickStats: {
            todayInteractions: 0,
            todayConversions: 0,
            todayRevenue: 0,
            conversionRate: 0
          }
        }
      });
    }
    
    // Get period metrics
    const metrics = period === 'today' ? salesActivity.daily :
                   period === 'week' ? salesActivity.metrics.last7Days :
                   period === 'month' ? salesActivity.metrics.last30Days :
                   salesActivity.metrics.allTime;
    
    // Get recent interactions
    const recentInteractions = await MemberInteraction.find({
      creator: creatorId
    })
    .populate('member', 'username avatar')
    .sort('-createdAt')
    .limit(10);
    
    // Get leaderboard position
    const leaderboardPosition = await getLeaderboardPosition(creatorId);
    
    // Get active goals
    const activeGoals = salesActivity.goals.filter(g => 
      g.status === 'active' && new Date() <= new Date(g.deadline)
    );
    
    res.json({
      success: true,
      data: {
        quickStats: {
          todayInteractions: salesActivity.daily.totalInteractions,
          todayConversions: salesActivity.daily.conversions,
          todayRevenue: salesActivity.daily.revenue,
          conversionRate: salesActivity.performance.overallConversionRate
        },
        metrics,
        recentInteractions: recentInteractions.map(i => ({
          member: {
            id: i.member._id,
            username: i.member.username,
            avatar: i.member.avatar
          },
          type: i.interactionType,
          time: i.createdAt,
          converted: i.conversion.resulted_in_purchase,
          amount: i.conversion.purchaseAmount
        })),
        leaderboard: leaderboardPosition,
        activeGoals,
        achievements: {
          total: salesActivity.gamification.achievements.length,
          unlocked: salesActivity.gamification.achievements.filter(a => a.unlockedAt).length,
          recent: salesActivity.gamification.achievements
            .filter(a => a.unlockedAt)
            .sort((a, b) => b.unlockedAt - a.unlockedAt)
            .slice(0, 3)
        },
        streaks: {
          current: salesActivity.gamification.streaks.currentStreak,
          longest: salesActivity.gamification.streaks.longestStreak
        }
      }
    });
    
  } catch (error) {
    console.error('Get sales dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard data'
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isOnlineNow(lastActive) {
  if (!lastActive) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActive) > fiveMinutesAgo;
}

function getPersonalizedApproach(memberAnalytics, lastInteraction) {
  const tier = memberAnalytics.spending.tier;
  const activity = memberAnalytics.activity.level;
  const hasInteracted = !!lastInteraction;
  
  if (tier === 'whale') {
    if (!hasInteracted) {
      return {
        strategy: 'vip_introduction',
        message: 'Introduce yourself with exclusive VIP perks',
        suggestedOffer: '20% off VIP bundle',
        priority: 'high'
      };
    } else {
      return {
        strategy: 'maintain_whale',
        message: 'Send exclusive content and personal attention',
        suggestedOffer: 'Early access to new content',
        priority: 'high'
      };
    }
  }
  
  if (memberAnalytics.spending.velocity.trend === 'increasing') {
    return {
      strategy: 'nurture_growth',
      message: 'Capitalize on increasing spend trend',
      suggestedOffer: 'Limited time upgrade offer',
      priority: 'medium'
    };
  }
  
  if (activity === 'very-active' && !hasInteracted) {
    return {
      strategy: 'engage_active',
      message: 'Highly active member - engage now!',
      suggestedOffer: 'Free preview to start conversation',
      priority: 'medium'
    };
  }
  
  return {
    strategy: 'standard_approach',
    message: 'Build relationship with personalized content',
    suggestedOffer: '10% welcome discount',
    priority: 'normal'
  };
}

async function generateSalesRecommendations(salesActivity) {
  const recommendations = [];
  
  // Check conversion rate
  if (salesActivity.performance.overallConversionRate < 5) {
    recommendations.push({
      type: 'improve_conversion',
      priority: 'high',
      title: 'Boost Your Conversion Rate',
      description: 'Your conversion rate is below average. Try more personalized messages.',
      action: 'View Tips',
      metrics: {
        current: salesActivity.performance.overallConversionRate,
        target: 10
      }
    });
  }
  
  // Check daily activity
  if (salesActivity.daily.totalInteractions < 10) {
    recommendations.push({
      type: 'increase_activity',
      priority: 'medium',
      title: 'Increase Daily Interactions',
      description: 'Engage with more members to increase your chances of conversion.',
      action: 'Browse Members',
      metrics: {
        current: salesActivity.daily.totalInteractions,
        target: 20
      }
    });
  }
  
  // Check special offers usage
  const offersToday = salesActivity.daily.segments.specialOffers || 0;
  if (offersToday === 0) {
    recommendations.push({
      type: 'use_offers',
      priority: 'medium',
      title: 'Try Special Offers',
      description: 'Special offers have 3x higher conversion rates.',
      action: 'Create Offer'
    });
  }
  
  return recommendations;
}

async function identifyOpportunities(creatorId) {
  const opportunities = [];
  
  // Find inactive whales
  const inactiveWhales = await MemberAnalytics.find({
    'spending.tier': 'whale',
    'activity.lastActive': { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }).limit(5);
  
  if (inactiveWhales.length > 0) {
    opportunities.push({
      type: 'inactive_whales',
      title: `${inactiveWhales.length} Inactive Whales`,
      description: 'High-value members who haven\'t been active recently',
      action: 'Re-engage',
      potential: inactiveWhales.reduce((sum, w) => sum + w.spending.last30Days, 0)
    });
  }
  
  // Find members with increasing spend
  const risingSpenders = await MemberAnalytics.find({
    'spending.velocity.trend': 'increasing',
    'spending.tier': { $in: ['regular', 'casual'] }
  }).limit(10);
  
  if (risingSpenders.length > 0) {
    opportunities.push({
      type: 'rising_spenders',
      title: `${risingSpenders.length} Rising Spenders`,
      description: 'Members showing increased spending patterns',
      action: 'Nurture',
      potential: risingSpenders.length * 100 // Estimated
    });
  }
  
  return opportunities;
}

function analyzeOfferSuccess(offer) {
  const factors = [];
  
  if (offer.offer.discount.percentage >= 20) {
    factors.push('Attractive discount percentage');
  }
  
  if (offer.validity.endDate - offer.validity.startDate <= 48 * 60 * 60 * 1000) {
    factors.push('Urgency from short validity');
  }
  
  if (offer.recipients.targetType === 'specific') {
    factors.push('Personalized targeting');
  }
  
  if (offer.offer.type === 'bundle') {
    factors.push('Bundle value proposition');
  }
  
  return factors;
}

function generateOfferTemplates(bestOffers) {
  const templates = [];
  
  // Find most successful discount level
  const avgDiscount = bestOffers.reduce((sum, o) => 
    sum + (o.discount.percentage || 0), 0) / bestOffers.length;
  
  templates.push({
    name: 'Proven Winner',
    type: 'percentage_discount',
    discount: Math.round(avgDiscount),
    duration: 48,
    targeting: 'high_value',
    estimatedConversion: 15
  });
  
  templates.push({
    name: 'VIP Exclusive',
    type: 'bundle',
    discount: 25,
    duration: 72,
    targeting: 'whale',
    estimatedConversion: 20
  });
  
  templates.push({
    name: 'Win-Back Special',
    type: 'percentage_discount',
    discount: 30,
    duration: 24,
    targeting: 'inactive',
    estimatedConversion: 10
  });
  
  return templates;
}

function getOfferInsights(offers) {
  if (offers.length === 0) {
    return {
      bestDiscountRange: 'No data',
      optimalDuration: 'No data',
      bestTargeting: 'No data'
    };
  }
  
  const insights = {
    bestDiscountRange: '20-30%',
    optimalDuration: '24-48 hours',
    bestTargeting: 'Specific members',
    avgRedemptionRate: offers.reduce((sum, o) => 
      sum + parseFloat(o.performance.redemptionRate), 0) / offers.length
  };
  
  return insights;
}

async function getLeaderboardPosition(creatorId) {
  // Get creator's rank
  const allCreators = await CreatorSalesActivity.find({})
    .sort('-metrics.last30Days.totalRevenue')
    .limit(100);
  
  const position = allCreators.findIndex(c => 
    c.creator.toString() === creatorId
  ) + 1;
  
  const topPerformers = allCreators.slice(0, 5).map((c, index) => ({
    rank: index + 1,
    creatorId: c.creator,
    revenue: c.metrics.last30Days.totalRevenue,
    conversions: c.metrics.last30Days.totalConversions
  }));
  
  return {
    yourRank: position || 'Unranked',
    totalCreators: allCreators.length,
    topPerformers,
    percentile: position ? Math.round((1 - position / allCreators.length) * 100) : 0
  };
}

module.exports = exports;