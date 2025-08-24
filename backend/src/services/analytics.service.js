// backend/src/services/analytics.service.js
// Service for tracking and analyzing all platform events

const AnalyticsEvent = require('../models/AnalyticsEvent');
const CreatorSalesActivity = require('../models/CreatorSalesActivity');
const MemberAnalytics = require('../models/MemberAnalytics');
const redis = require('redis');
const { promisify } = require('util');

// Redis client for real-time analytics
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

const incrAsync = promisify(redisClient.incr).bind(redisClient);
const getAsync = promisify(redisClient.get).bind(redisClient);
const setAsync = promisify(redisClient.set).bind(redisClient);
const expireAsync = promisify(redisClient.expire).bind(redisClient);

// ============================================
// CORE ANALYTICS TRACKING
// ============================================

/**
 * Track generic analytics event
 */
exports.trackEvent = async (eventData) => {
  try {
    const event = new AnalyticsEvent({
      category: eventData.category,
      action: eventData.action,
      label: eventData.label,
      value: eventData.value,
      userId: eventData.userId,
      userType: eventData.userType,
      metadata: eventData.metadata,
      timestamp: new Date(),
      sessionId: eventData.sessionId,
      platform: eventData.platform || 'web',
      deviceType: eventData.deviceType || 'unknown'
    });
    
    await event.save();
    
    // Update real-time counters
    await this.updateRealTimeMetrics(eventData);
    
    // Trigger any webhooks or integrations
    if (eventData.category === 'conversion') {
      await this.triggerConversionWebhooks(event);
    }
    
    return event;
    
  } catch (error) {
    console.error('Error tracking event:', error);
    throw error;
  }
};

/**
 * Track interaction ROI
 */
exports.trackInteractionROI = async (interactionId, creatorId, memberId, interactionType) => {
  try {
    const MemberInteraction = require('../models/MemberInteraction');
    const interaction = await MemberInteraction.findById(interactionId);
    
    if (!interaction) {
      throw new Error('Interaction not found');
    }
    
    // Calculate time to conversion
    const timeToConversion = interaction.conversion.resulted_in_purchase ? 
      (interaction.conversion.purchaseDate - interaction.createdAt) / 1000 / 60 : null; // in minutes
    
    // Calculate ROI
    const cost = calculateInteractionCost(interactionType);
    const revenue = interaction.conversion.purchaseAmount || 0;
    const roi = cost > 0 ? ((revenue - cost) / cost) * 100 : 0;
    
    // Track the event
    await this.trackEvent({
      category: 'interaction_roi',
      action: interactionType,
      label: `creator:${creatorId}_member:${memberId}`,
      value: roi,
      userId: creatorId,
      userType: 'creator',
      metadata: {
        interactionId,
        memberId,
        interactionType,
        resulted_in_purchase: interaction.conversion.resulted_in_purchase,
        purchase_amount: revenue,
        time_to_conversion: timeToConversion,
        roi_percentage: roi,
        effectiveness_score: interaction.effectiveness.score
      }
    });
    
    // Update creator's sales metrics
    await this.updateCreatorSalesMetrics(creatorId, {
      interactionType,
      roi,
      revenue,
      converted: interaction.conversion.resulted_in_purchase
    });
    
    return {
      roi,
      revenue,
      cost,
      timeToConversion,
      effectiveness: interaction.effectiveness.score
    };
    
  } catch (error) {
    console.error('Error tracking interaction ROI:', error);
    throw error;
  }
};

/**
 * Measure conversion rates
 */
exports.measureConversionRates = async (creatorId, period = 'last30Days') => {
  try {
    const dateRange = getDateRange(period);
    const MemberInteraction = require('../models/MemberInteraction');
    
    // Get all interactions in period
    const interactions = await MemberInteraction.find({
      creator: creatorId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    // Calculate conversion rates by type
    const conversionByType = {};
    const interactionTypes = ['poke', 'like', 'message', 'special_offer'];
    
    for (const type of interactionTypes) {
      const typeInteractions = interactions.filter(i => i.interactionType === type);
      const converted = typeInteractions.filter(i => i.conversion.resulted_in_purchase);
      
      conversionByType[type] = {
        total: typeInteractions.length,
        converted: converted.length,
        rate: typeInteractions.length > 0 ? 
          (converted.length / typeInteractions.length * 100).toFixed(2) : 0,
        revenue: converted.reduce((sum, i) => sum + (i.conversion.purchaseAmount || 0), 0)
      };
    }
    
    // Overall conversion rate
    const totalInteractions = interactions.length;
    const totalConverted = interactions.filter(i => i.conversion.resulted_in_purchase).length;
    const overallRate = totalInteractions > 0 ? 
      (totalConverted / totalInteractions * 100).toFixed(2) : 0;
    
    // Calculate average time to conversion
    const conversions = interactions.filter(i => i.conversion.resulted_in_purchase);
    const avgTimeToConversion = conversions.length > 0 ?
      conversions.reduce((sum, i) => {
        const time = (new Date(i.conversion.purchaseDate) - new Date(i.createdAt)) / 1000 / 60 / 60; // hours
        return sum + time;
      }, 0) / conversions.length : 0;
    
    return {
      period,
      overall: {
        totalInteractions,
        totalConverted,
        conversionRate: overallRate,
        totalRevenue: interactions.reduce((sum, i) => 
          sum + (i.conversion.purchaseAmount || 0), 0
        )
      },
      byType: conversionByType,
      avgTimeToConversion: Math.round(avgTimeToConversion),
      bestPerforming: Object.entries(conversionByType)
        .sort((a, b) => parseFloat(b[1].rate) - parseFloat(a[1].rate))[0]?.[0]
    };
    
  } catch (error) {
    console.error('Error measuring conversion rates:', error);
    throw error;
  }
};

/**
 * Sales funnel analysis
 */
exports.salesFunnelAnalysis = async (creatorId, period = 'last30Days') => {
  try {
    const dateRange = getDateRange(period);
    
    // Define funnel stages
    const funnel = {
      awareness: { count: 0, label: 'Profile Views' },
      interest: { count: 0, label: 'Interactions (Poke/Like)' },
      consideration: { count: 0, label: 'Messages Exchanged' },
      intent: { count: 0, label: 'Special Offers Viewed' },
      purchase: { count: 0, label: 'Conversions' },
      loyalty: { count: 0, label: 'Repeat Purchases' }
    };
    
    // Get profile views
    const profileViews = await AnalyticsEvent.countDocuments({
      userId: creatorId,
      category: 'profile_view',
      timestamp: { $gte: dateRange.start, $lte: dateRange.end }
    });
    funnel.awareness.count = profileViews;
    
    // Get interactions
    const MemberInteraction = require('../models/MemberInteraction');
    const interactions = await MemberInteraction.find({
      creator: creatorId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end }
    });
    
    funnel.interest.count = interactions.filter(i => 
      ['poke', 'like'].includes(i.interactionType)
    ).length;
    
    funnel.consideration.count = interactions.filter(i => 
      i.interactionType === 'message' && i.response.hasResponded
    ).length;
    
    funnel.intent.count = interactions.filter(i => 
      i.interactionType === 'special_offer'
    ).length;
    
    funnel.purchase.count = interactions.filter(i => 
      i.conversion.resulted_in_purchase
    ).length;
    
    // Get repeat purchases
    const memberPurchases = {};
    interactions.filter(i => i.conversion.resulted_in_purchase)
      .forEach(i => {
        memberPurchases[i.member] = (memberPurchases[i.member] || 0) + 1;
      });
    funnel.loyalty.count = Object.values(memberPurchases)
      .filter(count => count > 1).length;
    
    // Calculate conversion rates between stages
    const conversionRates = {
      viewToInteraction: funnel.awareness.count > 0 ? 
        (funnel.interest.count / funnel.awareness.count * 100).toFixed(2) : 0,
      interactionToMessage: funnel.interest.count > 0 ?
        (funnel.consideration.count / funnel.interest.count * 100).toFixed(2) : 0,
      messageToOffer: funnel.consideration.count > 0 ?
        (funnel.intent.count / funnel.consideration.count * 100).toFixed(2) : 0,
      offerToPurchase: funnel.intent.count > 0 ?
        (funnel.purchase.count / funnel.intent.count * 100).toFixed(2) : 0,
      purchaseToLoyalty: funnel.purchase.count > 0 ?
        (funnel.loyalty.count / funnel.purchase.count * 100).toFixed(2) : 0
    };
    
    // Identify bottlenecks
    const bottlenecks = identifyBottlenecks(conversionRates);
    
    return {
      period,
      funnel,
      conversionRates,
      bottlenecks,
      recommendations: getOptimizationRecommendations(bottlenecks)
    };
    
  } catch (error) {
    console.error('Error analyzing sales funnel:', error);
    throw error;
  }
};

/**
 * Revenue attribution
 */
exports.revenueAttribution = async (creatorId, period = 'last30Days') => {
  try {
    const dateRange = getDateRange(period);
    const Transaction = require('../models/Transaction');
    
    // Get all transactions in period
    const transactions = await Transaction.find({
      creator: creatorId,
      createdAt: { $gte: dateRange.start, $lte: dateRange.end },
      status: 'completed'
    }).populate('member', 'username');
    
    // Attribution by source
    const attribution = {
      direct: { revenue: 0, count: 0, percentage: 0 },
      discovery: { revenue: 0, count: 0, percentage: 0 },
      special_offer: { revenue: 0, count: 0, percentage: 0 },
      message: { revenue: 0, count: 0, percentage: 0 },
      poke: { revenue: 0, count: 0, percentage: 0 },
      organic: { revenue: 0, count: 0, percentage: 0 }
    };
    
    // Track revenue by member tier
    const revenueByTier = {
      whale: { revenue: 0, count: 0, members: new Set() },
      vip: { revenue: 0, count: 0, members: new Set() },
      regular: { revenue: 0, count: 0, members: new Set() },
      casual: { revenue: 0, count: 0, members: new Set() },
      new: { revenue: 0, count: 0, members: new Set() }
    };
    
    for (const transaction of transactions) {
      const source = transaction.metadata?.source || 'organic';
      const amount = transaction.amount;
      
      // Update attribution
      if (attribution[source]) {
        attribution[source].revenue += amount;
        attribution[source].count += 1;
      } else {
        attribution.organic.revenue += amount;
        attribution.organic.count += 1;
      }
      
      // Get member tier
      const memberAnalytics = await MemberAnalytics.findOne({ 
        member: transaction.member 
      });
      const tier = memberAnalytics?.spending.tier || 'new';
      
      revenueByTier[tier].revenue += amount;
      revenueByTier[tier].count += 1;
      revenueByTier[tier].members.add(transaction.member.toString());
    }
    
    // Calculate total revenue
    const totalRevenue = Object.values(attribution)
      .reduce((sum, source) => sum + source.revenue, 0);
    
    // Calculate percentages
    Object.keys(attribution).forEach(source => {
      attribution[source].percentage = totalRevenue > 0 ?
        (attribution[source].revenue / totalRevenue * 100).toFixed(2) : 0;
    });
    
    // Convert member sets to counts
    Object.keys(revenueByTier).forEach(tier => {
      revenueByTier[tier].uniqueMembers = revenueByTier[tier].members.size;
      delete revenueByTier[tier].members;
    });
    
    return {
      period,
      totalRevenue,
      totalTransactions: transactions.length,
      averageTransactionValue: totalRevenue / (transactions.length || 1),
      attribution,
      revenueByTier,
      topRevenueSources: Object.entries(attribution)
        .sort((a, b) => b[1].revenue - a[1].revenue)
        .slice(0, 3)
        .map(([source, data]) => ({ source, ...data }))
    };
    
  } catch (error) {
    console.error('Error analyzing revenue attribution:', error);
    throw error;
  }
};

// ============================================
// REAL-TIME METRICS
// ============================================

/**
 * Update real-time metrics in Redis
 */
exports.updateRealTimeMetrics = async (eventData) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Increment counters
    await incrAsync(`metrics:${eventData.category}:${today}`);
    await incrAsync(`metrics:${eventData.category}:${today}:${hour}`);
    
    if (eventData.userId) {
      await incrAsync(`metrics:user:${eventData.userId}:${eventData.category}:${today}`);
    }
    
    // Set expiration
    await expireAsync(`metrics:${eventData.category}:${today}`, 86400 * 7); // 7 days
    
  } catch (error) {
    console.error('Error updating real-time metrics:', error);
  }
};

/**
 * Get real-time dashboard metrics
 */
exports.getRealTimeMetrics = async (creatorId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const hour = new Date().getHours();
    
    // Get today's metrics
    const metrics = {
      profileViews: await getAsync(`metrics:user:${creatorId}:profile_view:${today}`) || 0,
      interactions: await getAsync(`metrics:user:${creatorId}:interaction:${today}`) || 0,
      conversions: await getAsync(`metrics:user:${creatorId}:conversion:${today}`) || 0,
      revenue: await getAsync(`metrics:user:${creatorId}:revenue:${today}`) || 0,
      activeNow: await getAsync(`metrics:active_users:${hour}`) || 0
    };
    
    // Get hourly trend
    const hourlyTrend = [];
    for (let i = 0; i < 24; i++) {
      hourlyTrend.push({
        hour: i,
        views: await getAsync(`metrics:user:${creatorId}:profile_view:${today}:${i}`) || 0,
        interactions: await getAsync(`metrics:user:${creatorId}:interaction:${today}:${i}`) || 0
      });
    }
    
    return {
      current: metrics,
      hourlyTrend,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error getting real-time metrics:', error);
    throw error;
  }
};

// ============================================
// CREATOR SALES METRICS
// ============================================

/**
 * Update creator sales metrics
 */
exports.updateCreatorSalesMetrics = async (creatorId, data) => {
  try {
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    
    if (!salesActivity) {
      return;
    }
    
    // Update daily metrics
    const today = new Date().toISOString().split('T')[0];
    
    if (data.converted) {
      salesActivity.daily.conversions += 1;
      salesActivity.daily.revenue += data.revenue;
    }
    
    // Update conversion rates by type
    if (!salesActivity.performance.conversionRates[data.interactionType]) {
      salesActivity.performance.conversionRates[data.interactionType] = {
        attempts: 0,
        conversions: 0,
        rate: 0
      };
    }
    
    const typeStats = salesActivity.performance.conversionRates[data.interactionType];
    typeStats.attempts += 1;
    if (data.converted) {
      typeStats.conversions += 1;
    }
    typeStats.rate = (typeStats.conversions / typeStats.attempts * 100).toFixed(2);
    
    await salesActivity.save();
    
  } catch (error) {
    console.error('Error updating creator sales metrics:', error);
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get date range for period
 */
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

/**
 * Calculate interaction cost
 */
function calculateInteractionCost(interactionType) {
  // Estimated costs per interaction type
  const costs = {
    poke: 0.01,
    like: 0.01,
    message: 0.05,
    special_offer: 0.10,
    bulk_message: 0.02
  };
  
  return costs[interactionType] || 0;
}

/**
 * Identify bottlenecks in funnel
 */
function identifyBottlenecks(conversionRates) {
  const bottlenecks = [];
  const threshold = 10; // Consider < 10% conversion a bottleneck
  
  Object.entries(conversionRates).forEach(([stage, rate]) => {
    if (parseFloat(rate) < threshold) {
      bottlenecks.push({
        stage,
        rate: parseFloat(rate),
        severity: parseFloat(rate) < 5 ? 'critical' : 'moderate'
      });
    }
  });
  
  return bottlenecks;
}

/**
 * Get optimization recommendations
 */
function getOptimizationRecommendations(bottlenecks) {
  const recommendations = [];
  
  bottlenecks.forEach(bottleneck => {
    switch (bottleneck.stage) {
      case 'viewToInteraction':
        recommendations.push('Improve profile appeal and call-to-action');
        recommendations.push('Add more engaging profile content');
        break;
      case 'interactionToMessage':
        recommendations.push('Send more personalized initial messages');
        recommendations.push('Improve response time to interactions');
        break;
      case 'messageToOffer':
        recommendations.push('Build better rapport before making offers');
        recommendations.push('Segment offers based on member preferences');
        break;
      case 'offerToPurchase':
        recommendations.push('Improve offer relevance and timing');
        recommendations.push('Test different discount levels');
        break;
      case 'purchaseToLoyalty':
        recommendations.push('Implement loyalty rewards program');
        recommendations.push('Send exclusive content to repeat buyers');
        break;
    }
  });
  
  return recommendations;
}

/**
 * Trigger conversion webhooks
 */
exports.triggerConversionWebhooks = async (event) => {
  // Implement webhook logic here if needed
  // This would integrate with external analytics platforms
};

module.exports = exports;