// backend/src/services/connections.service.js
// Service for intelligent connection matching between creators and members

const MemberAnalytics = require('../models/MemberAnalytics');
const Creator = require('../models/Creator');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');
const Content = require('../models/Content');
const { calculateMemberScore } = require('./memberScoring.service');

// ============================================
// CORE CONNECTION MATCHING FUNCTIONS
// ============================================

/**
 * Find ideal members for a creator
 */
exports.findIdealMembers = async (creatorId, options = {}) => {
  try {
    const {
      limit = 20,
      excludeInteracted = false,
      minScore = 60,
      focusOn = 'balanced' // balanced, spending, engagement, potential
    } = options;
    
    // Get creator profile and preferences
    const creator = await Creator.findById(creatorId)
      .populate('categories')
      .populate('contentTypes');
    
    if (!creator) {
      throw new Error('Creator not found');
    }
    
    // Build base query
    let query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId },
      'scoring.valueScore': { $gte: minScore }
    };
    
    // Exclude already interacted members if requested
    if (excludeInteracted) {
      const interactedMembers = await MemberInteraction.distinct('member', {
        creator: creatorId
      });
      query['member'] = { $nin: interactedMembers };
    }
    
    // Add category matching if creator has specific categories
    if (creator.categories && creator.categories.length > 0) {
      const categoryNames = creator.categories.map(c => c.name);
      query['preferences.topCategories.category'] = { $in: categoryNames };
    }
    
    // Get potential connections
    const potentialConnections = await MemberAnalytics.find(query)
      .populate('member', 'username avatar joinDate lastActive location')
      .limit(limit * 3); // Get more to filter down
    
    // Calculate compatibility scores for each connection
    const scoredConnections = await Promise.all(
      potentialConnections.map(async (memberAnalytics) => {
        const compatibilityScore = await this.compatibilityScore(
          creatorId,
          memberAnalytics.member._id,
          focusOn
        );
        
        return {
          member: memberAnalytics.member,
          analytics: {
            tier: memberAnalytics.spending.tier,
            valueScore: memberAnalytics.scoring.valueScore,
            activityLevel: memberAnalytics.activity.level,
            last30DaySpend: memberAnalytics.spending.last30Days,
            lifetimeSpend: memberAnalytics.spending.lifetime,
            preferences: memberAnalytics.preferences,
            churnRisk: memberAnalytics.scoring.churnRisk.level
          },
          compatibility: compatibilityScore,
          connectionReason: getConnectionReason(memberAnalytics, compatibilityScore, creator)
        };
      })
    );
    
    // Sort by compatibility score and limit
    const idealConnections = scoredConnections
      .sort((a, b) => b.compatibility.overall - a.compatibility.overall)
      .slice(0, limit);
    
    // Get recommendations for each connection
    const connectionsWithStrategy = idealConnections.map(connection => ({
      ...connection,
      strategy: this.suggestOutreachStrategy(connection.analytics, connection.compatibility),
      timing: this.optimalTimingRecommendation(connection.member, connection.analytics)
    }));
    
    return {
      connections: connectionsWithStrategy,
      summary: {
        totalFound: connectionsWithStrategy.length,
        avgCompatibility: connectionsWithStrategy.reduce((sum, c) => 
          sum + c.compatibility.overall, 0) / connectionsWithStrategy.length,
        tierBreakdown: getTierBreakdown(connectionsWithStrategy)
      }
    };
    
  } catch (error) {
    console.error('Find ideal members error:', error);
    throw error;
  }
};

/**
 * Calculate compatibility score between creator and member
 */
exports.compatibilityScore = async (creatorId, memberId, focusOn = 'balanced') => {
  try {
    // Get creator data
    const creator = await Creator.findById(creatorId)
      .populate('categories');
    
    // Get member analytics
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });
    
    if (!creator || !memberAnalytics) {
      return { overall: 0, breakdown: {} };
    }
    
    // Calculate different compatibility factors
    const factors = {
      spending: calculateSpendingCompatibility(memberAnalytics),
      engagement: calculateEngagementCompatibility(memberAnalytics),
      preferences: await calculatePreferenceCompatibility(creator, memberAnalytics),
      timing: calculateTimingCompatibility(memberAnalytics),
      potential: calculatePotentialCompatibility(memberAnalytics),
      history: await calculateHistoryCompatibility(creatorId, memberId)
    };
    
    // Apply weights based on focus
    const weights = getCompatibilityWeights(focusOn);
    
    // Calculate overall score
    const overall = Object.entries(factors).reduce((sum, [key, value]) => {
      return sum + (value * weights[key]);
    }, 0);
    
    return {
      overall: Math.round(overall),
      breakdown: factors,
      focusArea: focusOn,
      confidence: calculateConfidence(memberAnalytics)
    };
    
  } catch (error) {
    console.error('Compatibility score error:', error);
    return { overall: 0, breakdown: {} };
  }
};

/**
 * Suggest outreach strategy based on member profile
 */
exports.suggestOutreachStrategy = (memberAnalytics, compatibility) => {
  const strategies = [];
  const tier = memberAnalytics.tier;
  const activityLevel = memberAnalytics.activityLevel;
  const churnRisk = memberAnalytics.churnRisk;
  
  // Primary strategy based on tier
  if (tier === 'whale') {
    strategies.push({
      type: 'vip_treatment',
      priority: 'immediate',
      approach: 'Personalized VIP introduction with exclusive perks',
      firstMessage: 'Hi! I noticed you\'re one of our VIP members. I\'d love to offer you exclusive access to my premium content...',
      offerSuggestion: '30% VIP discount on bundles',
      followUpTiming: '24 hours'
    });
  } else if (tier === 'vip') {
    strategies.push({
      type: 'premium_engagement',
      priority: 'high',
      approach: 'Quality-focused engagement with special attention',
      firstMessage: 'Hey there! I create content I think you\'d really enjoy. Would love to share some previews with you...',
      offerSuggestion: '20% loyalty discount',
      followUpTiming: '48 hours'
    });
  } else if (memberAnalytics.last30DaySpend > 0) {
    strategies.push({
      type: 'nurture_active',
      priority: 'medium',
      approach: 'Build relationship with consistent value',
      firstMessage: 'Hi! Thanks for being active on the platform. I\'d love to connect and share what I\'m creating...',
      offerSuggestion: '15% welcome offer',
      followUpTiming: '72 hours'
    });
  } else {
    strategies.push({
      type: 'warm_introduction',
      priority: 'normal',
      approach: 'Friendly introduction with free preview',
      firstMessage: 'Hey! Welcome to my profile. Here\'s a free preview of what I create...',
      offerSuggestion: 'Free preview content',
      followUpTiming: '5 days'
    });
  }
  
  // Secondary strategies based on other factors
  if (churnRisk === 'high') {
    strategies.push({
      type: 'retention_urgent',
      priority: 'immediate',
      approach: 'Re-engagement with compelling offer',
      firstMessage: 'Hey! I miss having you around. Here\'s something special just for you...',
      offerSuggestion: '40% win-back offer',
      followUpTiming: '12 hours'
    });
  }
  
  if (activityLevel === 'very-active') {
    strategies.push({
      type: 'capitalize_activity',
      priority: 'high',
      approach: 'Strike while engagement is hot',
      firstMessage: 'I see you\'re online! Perfect timing - check out my latest content...',
      offerSuggestion: 'Limited-time flash sale',
      followUpTiming: 'immediate'
    });
  }
  
  // Content strategy based on preferences
  const contentStrategy = {
    recommendedContent: memberAnalytics.preferences?.topCategories[0]?.category || 'variety',
    format: memberAnalytics.preferences?.contentTypes[0]?.type || 'mixed',
    pricePoint: determinePricePoint(memberAnalytics),
    frequency: determineContactFrequency(memberAnalytics)
  };
  
  return {
    primary: strategies[0],
    alternatives: strategies.slice(1),
    contentStrategy,
    estimatedResponseRate: estimateResponseRate(memberAnalytics, compatibility),
    estimatedConversionRate: estimateConversionRate(memberAnalytics, compatibility)
  };
};

/**
 * Determine optimal timing for outreach
 */
exports.optimalTimingRecommendation = (member, memberAnalytics) => {
  const lastActive = new Date(member.lastActive || memberAnalytics.activity.lastActive);
  const currentTime = new Date();
  const hoursSinceActive = (currentTime - lastActive) / (1000 * 60 * 60);
  
  // Get member's typical active hours
  const activeHours = analyzeActiveHours(memberAnalytics.activity.hourlyActivity);
  
  // Determine urgency
  let urgency = 'normal';
  if (memberAnalytics.tier === 'whale') urgency = 'high';
  if (memberAnalytics.churnRisk === 'high') urgency = 'immediate';
  if (hoursSinceActive < 1) urgency = 'immediate';
  
  // Calculate best time to reach out
  const recommendations = {
    urgency,
    isOnlineNow: hoursSinceActive < 0.25, // Active in last 15 minutes
    bestTimeToday: getNextActiveWindow(activeHours, currentTime),
    bestDayOfWeek: getBestDayOfWeek(memberAnalytics.activity.weeklyPattern),
    timeZoneConsideration: member.location?.timezone || 'UTC',
    recommendations: []
  };
  
  // Specific recommendations
  if (recommendations.isOnlineNow) {
    recommendations.recommendations.push({
      action: 'message_now',
      reason: 'Member is currently online',
      expectedResponse: 'high'
    });
  } else if (hoursSinceActive < 24) {
    recommendations.recommendations.push({
      action: 'message_soon',
      reason: 'Member was recently active',
      expectedResponse: 'medium',
      suggestedTime: recommendations.bestTimeToday
    });
  } else {
    recommendations.recommendations.push({
      action: 'schedule_outreach',
      reason: 'Plan for optimal engagement time',
      expectedResponse: 'medium',
      suggestedTime: recommendations.bestTimeToday,
      suggestedDay: recommendations.bestDayOfWeek
    });
  }
  
  // Add special timing for different tiers
  if (memberAnalytics.tier === 'whale' || memberAnalytics.tier === 'vip') {
    recommendations.recommendations.unshift({
      action: 'prioritize',
      reason: 'High-value member requires immediate attention',
      expectedResponse: 'high'
    });
  }
  
  return recommendations;
};

// ============================================
// COMPATIBILITY CALCULATION HELPERS
// ============================================

/**
 * Calculate spending compatibility
 */
function calculateSpendingCompatibility(memberAnalytics) {
  const spending = memberAnalytics.spending;
  let score = 0;
  
  // Base score on tier
  const tierScores = {
    'whale': 100,
    'vip': 80,
    'regular': 60,
    'casual': 40,
    'new': 20
  };
  score = tierScores[spending.tier] || 0;
  
  // Adjust for velocity
  if (spending.velocity.trend === 'increasing') {
    score = Math.min(100, score * 1.2);
  } else if (spending.velocity.trend === 'decreasing') {
    score = score * 0.8;
  }
  
  // Adjust for recency
  const daysSinceLastPurchase = Math.floor(
    (new Date() - new Date(memberAnalytics.metadata.lastPurchase)) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceLastPurchase <= 7) {
    score = Math.min(100, score + 10);
  } else if (daysSinceLastPurchase > 30) {
    score = Math.max(0, score - 20);
  }
  
  return Math.round(score);
}

/**
 * Calculate engagement compatibility
 */
function calculateEngagementCompatibility(memberAnalytics) {
  const engagement = memberAnalytics.engagement;
  let score = 0;
  
  // Response rate component (40%)
  score += (engagement.messageResponseRate || 0) * 0.4;
  
  // Activity level component (30%)
  const activityScores = {
    'very-active': 30,
    'active': 20,
    'moderate': 10,
    'low': 5
  };
  score += activityScores[memberAnalytics.activity.level] || 0;
  
  // Conversion rate component (30%)
  score += Math.min(30, (engagement.conversionRate || 0) * 3);
  
  return Math.round(score);
}

/**
 * Calculate preference compatibility
 */
async function calculatePreferenceCompatibility(creator, memberAnalytics) {
  let score = 0;
  const maxScore = 100;
  
  // Category matching (50 points)
  if (creator.categories && memberAnalytics.preferences.topCategories) {
    const creatorCategories = creator.categories.map(c => c.name || c);
    const memberCategories = memberAnalytics.preferences.topCategories.map(c => c.category);
    
    const matchingCategories = creatorCategories.filter(c => 
      memberCategories.includes(c)
    );
    
    score += (matchingCategories.length / Math.max(creatorCategories.length, 1)) * 50;
  }
  
  // Content type matching (30 points)
  if (creator.contentTypes && memberAnalytics.preferences.contentTypes) {
    const creatorTypes = creator.contentTypes.map(t => t.type || t);
    const memberTypes = memberAnalytics.preferences.contentTypes.map(t => t.type);
    
    const matchingTypes = creatorTypes.filter(t => 
      memberTypes.includes(t)
    );
    
    score += (matchingTypes.length / Math.max(creatorTypes.length, 1)) * 30;
  }
  
  // Price range matching (20 points)
  const creatorAvgPrice = creator.averageContentPrice || 10;
  const memberAvgPurchase = memberAnalytics.spending.averagePurchase || 10;
  
  const priceDifference = Math.abs(creatorAvgPrice - memberAvgPurchase);
  const priceScore = Math.max(0, 20 - (priceDifference / creatorAvgPrice * 20));
  score += priceScore;
  
  return Math.min(maxScore, Math.round(score));
}

/**
 * Calculate timing compatibility
 */
function calculateTimingCompatibility(memberAnalytics) {
  const activity = memberAnalytics.activity;
  const lastActive = new Date(activity.lastActive);
  const now = new Date();
  const hoursSinceActive = (now - lastActive) / (1000 * 60 * 60);
  
  let score = 0;
  
  // Recency score
  if (hoursSinceActive < 1) {
    score = 100; // Online now
  } else if (hoursSinceActive < 24) {
    score = 80; // Active today
  } else if (hoursSinceActive < 72) {
    score = 60; // Active this week
  } else if (hoursSinceActive < 168) {
    score = 40; // Active this week
  } else {
    score = 20; // Inactive
  }
  
  // Adjust for activity pattern
  if (activity.level === 'very-active') {
    score = Math.min(100, score * 1.1);
  }
  
  return Math.round(score);
}

/**
 * Calculate potential compatibility
 */
function calculatePotentialCompatibility(memberAnalytics) {
  const scoring = memberAnalytics.scoring;
  const spending = memberAnalytics.spending;
  
  let score = scoring.potentialScore || 50;
  
  // Adjust for growth indicators
  if (spending.velocity.trend === 'increasing') {
    score = Math.min(100, score + 20);
  }
  
  // Adjust for churn risk
  if (scoring.churnRisk.level === 'high') {
    score = Math.max(0, score - 30);
  } else if (scoring.churnRisk.level === 'low') {
    score = Math.min(100, score + 10);
  }
  
  return Math.round(score);
}

/**
 * Calculate history compatibility
 */
async function calculateHistoryCompatibility(creatorId, memberId) {
  // Check if they have interacted before
  const interactions = await MemberInteraction.find({
    creator: creatorId,
    member: memberId
  }).limit(10);
  
  if (interactions.length === 0) {
    return 50; // Neutral - no history
  }
  
  let score = 0;
  
  // Calculate based on past interactions
  const hasResponded = interactions.some(i => i.response.hasResponded);
  const hasPurchased = interactions.some(i => i.conversion.resulted_in_purchase);
  const avgResponseTime = interactions
    .filter(i => i.response.hasResponded)
    .reduce((sum, i) => sum + (i.response.responseTime || 0), 0) / 
    (interactions.filter(i => i.response.hasResponded).length || 1);
  
  if (hasPurchased) {
    score = 90; // Previous customer
  } else if (hasResponded) {
    score = 70; // Engaged but not converted
    // Adjust for response time
    if (avgResponseTime < 60) { // Responded within an hour
      score += 10;
    }
  } else {
    score = 30; // No engagement
  }
  
  return Math.round(score);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get compatibility weights based on focus
 */
function getCompatibilityWeights(focusOn) {
  const weights = {
    balanced: {
      spending: 0.25,
      engagement: 0.20,
      preferences: 0.20,
      timing: 0.15,
      potential: 0.10,
      history: 0.10
    },
    spending: {
      spending: 0.50,
      engagement: 0.15,
      preferences: 0.10,
      timing: 0.10,
      potential: 0.10,
      history: 0.05
    },
    engagement: {
      spending: 0.15,
      engagement: 0.40,
      preferences: 0.15,
      timing: 0.15,
      potential: 0.05,
      history: 0.10
    },
    potential: {
      spending: 0.20,
      engagement: 0.20,
      preferences: 0.15,
      timing: 0.10,
      potential: 0.30,
      history: 0.05
    }
  };
  
  return weights[focusOn] || weights.balanced;
}

/**
 * Calculate confidence in compatibility score
 */
function calculateConfidence(memberAnalytics) {
  let confidence = 0;
  const factors = [];
  
  // Check data completeness
  if (memberAnalytics.metadata.totalPurchases > 5) {
    confidence += 25;
    factors.push('sufficient_purchase_history');
  }
  
  if (memberAnalytics.activity.lastActive > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    confidence += 25;
    factors.push('recent_activity');
  }
  
  if (memberAnalytics.preferences.topCategories.length > 0) {
    confidence += 25;
    factors.push('known_preferences');
  }
  
  if (memberAnalytics.engagement.messageResponseRate > 0) {
    confidence += 25;
    factors.push('engagement_history');
  }
  
  return {
    score: confidence,
    level: confidence >= 75 ? 'high' : confidence >= 50 ? 'medium' : 'low',
    factors
  };
}

/**
 * Get connection reason explanation
 */
function getConnectionReason(memberAnalytics, compatibilityScore, creator) {
  const reasons = [];
  
  if (memberAnalytics.spending.tier === 'whale' || memberAnalytics.spending.tier === 'vip') {
    reasons.push(`High-value ${memberAnalytics.spending.tier} member`);
  }
  
  if (compatibilityScore.breakdown.preferences >= 70) {
    reasons.push('Strong preference alignment');
  }
  
  if (memberAnalytics.spending.velocity.trend === 'increasing') {
    reasons.push('Increasing spend trend');
  }
  
  if (memberAnalytics.activity.level === 'very-active') {
    reasons.push('Highly active on platform');
  }
  
  if (compatibilityScore.overall >= 80) {
    reasons.push('Excellent compatibility score');
  }
  
  return reasons.join(' • ');
}

/**
 * Get tier breakdown of connections
 */
function getTierBreakdown(connections) {
  const breakdown = {
    whale: 0,
    vip: 0,
    regular: 0,
    casual: 0,
    new: 0
  };
  
  connections.forEach(connection => {
    breakdown[connection.analytics.tier]++;
  });
  
  return breakdown;
}

/**
 * Determine optimal price point
 */
function determinePricePoint(memberAnalytics) {
  const avgPurchase = memberAnalytics.spending.averagePurchase;
  
  if (avgPurchase >= 50) return 'premium';
  if (avgPurchase >= 20) return 'standard';
  if (avgPurchase >= 10) return 'value';
  return 'budget';
}

/**
 * Determine contact frequency
 */
function determineContactFrequency(memberAnalytics) {
  const tier = memberAnalytics.spending.tier;
  const activity = memberAnalytics.activity.level;
  
  if (tier === 'whale') return 'daily';
  if (tier === 'vip') return 'every-other-day';
  if (activity === 'very-active') return 'twice-weekly';
  return 'weekly';
}

/**
 * Estimate response rate
 */
function estimateResponseRate(memberAnalytics, compatibility) {
  const baseRate = memberAnalytics.engagement.messageResponseRate || 20;
  const compatibilityBonus = compatibility.overall / 100 * 30;
  
  return Math.min(90, baseRate + compatibilityBonus);
}

/**
 * Estimate conversion rate
 */
function estimateConversionRate(memberAnalytics, compatibility) {
  const baseRate = memberAnalytics.engagement.conversionRate || 5;
  const tierMultiplier = memberAnalytics.spending.tier === 'whale' ? 2 :
                         memberAnalytics.spending.tier === 'vip' ? 1.5 : 1;
  const compatibilityBonus = compatibility.overall / 100 * 10;
  
  return Math.min(50, baseRate * tierMultiplier + compatibilityBonus);
}

/**
 * Analyze active hours pattern
 */
function analyzeActiveHours(hourlyActivity) {
  if (!hourlyActivity || hourlyActivity.length === 0) {
    // Default pattern if no data
    return {
      morning: { start: 9, end: 12, likelihood: 'medium' },
      afternoon: { start: 14, end: 17, likelihood: 'medium' },
      evening: { start: 20, end: 23, likelihood: 'high' }
    };
  }
  
  // Analyze actual data
  // Implementation would depend on hourlyActivity structure
  return {
    morning: { start: 9, end: 12, likelihood: 'medium' },
    afternoon: { start: 14, end: 17, likelihood: 'medium' },
    evening: { start: 20, end: 23, likelihood: 'high' }
  };
}

/**
 * Get next active window
 */
function getNextActiveWindow(activeHours, currentTime) {
  const currentHour = currentTime.getHours();
  
  // Check each time window
  for (const [period, window] of Object.entries(activeHours)) {
    if (currentHour < window.start) {
      return {
        time: `${window.start}:00`,
        period,
        likelihood: window.likelihood
      };
    }
  }
  
  // If past all windows today, return tomorrow's first window
  return {
    time: 'Tomorrow at 9:00 AM',
    period: 'morning',
    likelihood: activeHours.morning.likelihood
  };
}

/**
 * Get best day of week
 */
function getBestDayOfWeek(weeklyPattern) {
  if (!weeklyPattern) {
    return 'Friday'; // Default to Friday
  }
  
  // Find day with highest activity
  // Implementation would depend on weeklyPattern structure
  return 'Friday';
}

module.exports = exports;