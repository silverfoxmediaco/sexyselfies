// backend/src/services/memberScoring.service.js
// Service for calculating member value scores and segmentation

const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');
const Purchase = require('../models/Purchase');

// ============================================
// CORE SCORING FUNCTIONS
// ============================================

/**
 * Calculate comprehensive member score (0-100)
 */
exports.calculateMemberScore = async (memberId) => {
  try {
    const analytics = await MemberAnalytics.findOne({ member: memberId });
    if (!analytics) {
      return 0;
    }
    
    // Weight factors for scoring
    const weights = {
      spending: 0.40,      // 40% - How much they spend
      activity: 0.25,      // 25% - How active they are
      engagement: 0.20,    // 20% - How engaged they are
      loyalty: 0.10,       // 10% - How long they've been active
      potential: 0.05      // 5%  - Growth potential
    };
    
    // Calculate individual scores
    const spendingScore = calculateSpendingScore(analytics.spending);
    const activityScore = calculateActivityScore(analytics.activity);
    const engagementScore = calculateEngagementScore(analytics.engagement);
    const loyaltyScore = calculateLoyaltyScore(analytics.metadata);
    const potentialScore = calculatePotentialScore(analytics);
    
    // Calculate weighted total
    const totalScore = Math.round(
      spendingScore * weights.spending +
      activityScore * weights.activity +
      engagementScore * weights.engagement +
      loyaltyScore * weights.loyalty +
      potentialScore * weights.potential
    );
    
    // Update analytics with new score
    analytics.scoring.valueScore = totalScore;
    analytics.scoring.components = {
      spending: spendingScore,
      activity: activityScore,
      engagement: engagementScore,
      loyalty: loyaltyScore,
      potential: potentialScore
    };
    analytics.scoring.lastCalculated = new Date();
    
    await analytics.save();
    
    return totalScore;
    
  } catch (error) {
    console.error('Error calculating member score:', error);
    throw error;
  }
};

/**
 * Determine spending tier
 */
exports.determineSpendingTier = (spending) => {
  // Based on last 30 days spending
  if (spending.last30Days >= 1000) return 'whale';
  if (spending.last30Days >= 500) return 'vip';
  if (spending.last30Days >= 100) return 'regular';
  if (spending.last30Days > 0) return 'casual';
  return 'new';
};

/**
 * Predict lifetime value (LTV)
 */
exports.predictLifetimeValue = async (memberId) => {
  try {
    const analytics = await MemberAnalytics.findOne({ member: memberId });
    if (!analytics) {
      return { ltv: 0, confidence: 0 };
    }
    
    const memberAge = Math.max(1, daysBetween(analytics.metadata.joinDate, new Date()));
    const dailyAverage = analytics.spending.lifetime / memberAge;
    
    // Factors affecting LTV
    const retentionRate = calculateRetentionProbability(analytics);
    const growthRate = calculateGrowthRate(analytics.spending.velocity);
    const engagementMultiplier = analytics.engagement.messageResponseRate / 100;
    
    // Predict days member will remain active
    const predictedActiveDays = estimateActiveDays(retentionRate, analytics.activity);
    
    // Calculate LTV with growth factor
    const baseLTV = dailyAverage * predictedActiveDays;
    const growthAdjustedLTV = baseLTV * (1 + growthRate);
    const engagementAdjustedLTV = growthAdjustedLTV * (1 + engagementMultiplier * 0.5);
    
    // Calculate confidence score based on data quality
    const confidence = calculatePredictionConfidence(analytics);
    
    return {
      ltv: Math.round(engagementAdjustedLTV),
      confidence: Math.round(confidence),
      breakdown: {
        currentDailyAverage: dailyAverage,
        predictedActiveDays,
        retentionRate,
        growthRate,
        baselineLTV: Math.round(baseLTV),
        adjustedLTV: Math.round(engagementAdjustedLTV)
      }
    };
    
  } catch (error) {
    console.error('Error predicting LTV:', error);
    throw error;
  }
};

/**
 * Identify high potential members
 */
exports.identifyHighPotential = async (filters = {}) => {
  try {
    const query = {
      'scoring.valueScore': { $gte: 60 },
      'spending.velocity.trend': 'increasing',
      'activity.level': { $in: ['active', 'very-active'] },
      'scoring.churnRisk.level': { $ne: 'high' }
    };
    
    // Apply additional filters
    if (filters.minSpending) {
      query['spending.last30Days'] = { $gte: filters.minSpending };
    }
    
    if (filters.category) {
      query['preferences.topCategories.category'] = filters.category;
    }
    
    const highPotentialMembers = await MemberAnalytics.find(query)
      .populate('member', 'username avatar')
      .sort('-scoring.potentialScore')
      .limit(filters.limit || 50);
    
    // Calculate opportunity score for each
    const membersWithOpportunity = await Promise.all(
      highPotentialMembers.map(async (member) => {
        const opportunityScore = await calculateOpportunityScore(member);
        return {
          ...member.toObject(),
          opportunityScore,
          recommendedAction: getRecommendedAction(member)
        };
      })
    );
    
    return membersWithOpportunity;
    
  } catch (error) {
    console.error('Error identifying high potential members:', error);
    throw error;
  }
};

/**
 * Risk assessment
 */
exports.riskAssessment = async (memberId) => {
  try {
    const analytics = await MemberAnalytics.findOne({ member: memberId });
    if (!analytics) {
      return { level: 'unknown', score: 0 };
    }
    
    // Risk factors
    const factors = {
      inactivityDays: daysBetween(analytics.activity.lastActive, new Date()),
      spendingDecline: analytics.spending.velocity.trend === 'decreasing',
      lowEngagement: analytics.engagement.messageResponseRate < 20,
      noRecentPurchases: daysBetween(analytics.metadata.lastPurchase, new Date()) > 30,
      decliningFrequency: analytics.activity.sessionsThisMonth < analytics.activity.sessionsLastMonth * 0.5
    };
    
    // Calculate risk score (0-100, higher = more risk)
    let riskScore = 0;
    
    if (factors.inactivityDays > 30) riskScore += 30;
    else if (factors.inactivityDays > 14) riskScore += 20;
    else if (factors.inactivityDays > 7) riskScore += 10;
    
    if (factors.spendingDecline) riskScore += 25;
    if (factors.lowEngagement) riskScore += 15;
    if (factors.noRecentPurchases) riskScore += 20;
    if (factors.decliningFrequency) riskScore += 10;
    
    // Determine risk level
    let level;
    if (riskScore >= 70) level = 'high';
    else if (riskScore >= 40) level = 'medium';
    else if (riskScore >= 20) level = 'low';
    else level = 'minimal';
    
    // Calculate retention probability
    const retentionProbability = 100 - riskScore;
    
    // Update analytics
    analytics.scoring.churnRisk = {
      score: riskScore,
      level,
      factors: factors,
      retentionProbability,
      lastAssessed: new Date()
    };
    
    await analytics.save();
    
    return {
      level,
      score: riskScore,
      retentionProbability,
      factors,
      recommendations: getRetentionRecommendations(level, factors)
    };
    
  } catch (error) {
    console.error('Error assessing risk:', error);
    throw error;
  }
};

// ============================================
// SCORING COMPONENTS
// ============================================

/**
 * Calculate spending score (0-100)
 */
function calculateSpendingScore(spending) {
  // Logarithmic scale for spending score
  const last30Days = spending.last30Days || 0;
  
  if (last30Days >= 5000) return 100;
  if (last30Days >= 2000) return 90;
  if (last30Days >= 1000) return 80;
  if (last30Days >= 500) return 70;
  if (last30Days >= 250) return 60;
  if (last30Days >= 100) return 50;
  if (last30Days >= 50) return 40;
  if (last30Days >= 25) return 30;
  if (last30Days >= 10) return 20;
  if (last30Days > 0) return 10;
  return 0;
}

/**
 * Calculate activity score (0-100)
 */
function calculateActivityScore(activity) {
  const daysSinceActive = daysBetween(activity.lastActive, new Date());
  const level = activity.level;
  
  let baseScore = 0;
  if (level === 'very-active') baseScore = 80;
  else if (level === 'active') baseScore = 60;
  else if (level === 'moderate') baseScore = 40;
  else if (level === 'low') baseScore = 20;
  
  // Decay based on inactivity
  if (daysSinceActive > 30) baseScore *= 0.3;
  else if (daysSinceActive > 14) baseScore *= 0.5;
  else if (daysSinceActive > 7) baseScore *= 0.7;
  else if (daysSinceActive > 3) baseScore *= 0.9;
  
  // Boost for daily active users
  if (daysSinceActive === 0) baseScore = Math.min(100, baseScore * 1.2);
  
  return Math.round(baseScore);
}

/**
 * Calculate engagement score (0-100)
 */
function calculateEngagementScore(engagement) {
  const responseRate = engagement.messageResponseRate || 0;
  const purchaseRate = engagement.conversionRate || 0;
  const interactionDiversity = Object.keys(engagement.interactions || {}).length;
  
  // Weighted components
  const responseScore = responseRate; // Already 0-100
  const conversionScore = Math.min(100, purchaseRate * 10); // 10% conversion = 100 score
  const diversityScore = Math.min(100, interactionDiversity * 20); // 5 types = 100 score
  
  return Math.round(
    responseScore * 0.4 +
    conversionScore * 0.4 +
    diversityScore * 0.2
  );
}

/**
 * Calculate loyalty score (0-100)
 */
function calculateLoyaltyScore(metadata) {
  const accountAge = daysBetween(metadata.joinDate, new Date());
  const purchaseCount = metadata.totalPurchases || 0;
  const consistency = metadata.purchaseConsistency || 0;
  
  // Age score (max 40 points)
  let ageScore = Math.min(40, accountAge / 365 * 40); // 1 year = 40 points
  
  // Purchase frequency score (max 40 points)
  let frequencyScore = Math.min(40, purchaseCount / 50 * 40); // 50 purchases = 40 points
  
  // Consistency score (max 20 points)
  let consistencyScore = consistency * 20; // 0-1 scale
  
  return Math.round(ageScore + frequencyScore + consistencyScore);
}

/**
 * Calculate potential score (0-100)
 */
function calculatePotentialScore(analytics) {
  const velocityTrend = analytics.spending.velocity.trend;
  const currentTier = analytics.spending.tier;
  const engagementTrend = analytics.engagement.trend || 'stable';
  
  let score = 50; // Base score
  
  // Spending velocity
  if (velocityTrend === 'increasing') score += 30;
  else if (velocityTrend === 'stable') score += 10;
  else score -= 20;
  
  // Room for growth based on tier
  if (currentTier === 'new') score += 20;
  else if (currentTier === 'casual') score += 15;
  else if (currentTier === 'regular') score += 10;
  else if (currentTier === 'vip') score += 5;
  
  // Engagement trend
  if (engagementTrend === 'improving') score += 20;
  else if (engagementTrend === 'declining') score -= 10;
  
  return Math.max(0, Math.min(100, score));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1, date2) {
  if (!date1 || !date2) return 0;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round(Math.abs((new Date(date2) - new Date(date1)) / oneDay));
}

/**
 * Calculate retention probability
 */
function calculateRetentionProbability(analytics) {
  const factors = {
    engagement: analytics.engagement.messageResponseRate / 100,
    spending: analytics.spending.tier === 'whale' ? 0.9 : 
              analytics.spending.tier === 'vip' ? 0.7 : 0.5,
    activity: analytics.activity.level === 'very-active' ? 0.8 : 0.5,
    loyalty: Math.min(1, daysBetween(analytics.metadata.joinDate, new Date()) / 365)
  };
  
  return (
    factors.engagement * 0.3 +
    factors.spending * 0.3 +
    factors.activity * 0.2 +
    factors.loyalty * 0.2
  );
}

/**
 * Calculate growth rate
 */
function calculateGrowthRate(velocity) {
  if (velocity.trend === 'increasing') {
    return velocity.percentageChange / 100;
  }
  return 0;
}

/**
 * Estimate active days
 */
function estimateActiveDays(retentionRate, activity) {
  const baselineDays = 365; // 1 year baseline
  const activityMultiplier = 
    activity.level === 'very-active' ? 2 :
    activity.level === 'active' ? 1.5 : 1;
  
  return Math.round(baselineDays * retentionRate * activityMultiplier);
}

/**
 * Calculate prediction confidence
 */
function calculatePredictionConfidence(analytics) {
  const dataPoints = {
    hasSufficientHistory: daysBetween(analytics.metadata.joinDate, new Date()) > 30,
    hasRegularActivity: analytics.metadata.totalPurchases > 5,
    hasRecentActivity: daysBetween(analytics.activity.lastActive, new Date()) < 7,
    hasConsistentPattern: analytics.metadata.purchaseConsistency > 0.5
  };
  
  const confidence = Object.values(dataPoints).filter(Boolean).length * 25;
  return Math.min(100, confidence);
}

/**
 * Calculate opportunity score
 */
async function calculateOpportunityScore(memberAnalytics) {
  const spending = memberAnalytics.spending.last30Days;
  const potential = memberAnalytics.scoring.potentialScore || 50;
  const engagement = memberAnalytics.engagement.messageResponseRate || 50;
  
  return Math.round(
    (spending / 10) * 0.4 +  // Normalize spending to 0-100
    potential * 0.4 +
    engagement * 0.2
  );
}

/**
 * Get recommended action for member
 */
function getRecommendedAction(memberAnalytics) {
  const tier = memberAnalytics.spending.tier;
  const activity = memberAnalytics.activity.level;
  const lastActive = daysBetween(memberAnalytics.activity.lastActive, new Date());
  
  if (tier === 'whale' && lastActive > 7) {
    return 'Send personalized re-engagement offer';
  }
  
  if (tier === 'vip' && activity === 'very-active') {
    return 'Offer exclusive content or early access';
  }
  
  if (memberAnalytics.spending.velocity.trend === 'increasing') {
    return 'Nurture with special attention - rising spender';
  }
  
  if (lastActive > 14) {
    return 'Send win-back campaign';
  }
  
  return 'Regular engagement';
}

/**
 * Get retention recommendations
 */
function getRetentionRecommendations(riskLevel, factors) {
  const recommendations = [];
  
  if (riskLevel === 'high') {
    recommendations.push('Immediate intervention required');
    recommendations.push('Send personalized win-back offer');
    recommendations.push('Direct message from creator');
  }
  
  if (factors.inactivityDays > 14) {
    recommendations.push('Re-engagement campaign needed');
  }
  
  if (factors.spendingDecline) {
    recommendations.push('Offer limited-time discount');
  }
  
  if (factors.lowEngagement) {
    recommendations.push('Try different content types');
    recommendations.push('Ask for feedback');
  }
  
  return recommendations;
}

module.exports = exports;