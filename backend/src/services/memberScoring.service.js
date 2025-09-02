// backend/src/services/memberScoring.service.js

const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction'); // Changed from Purchase to Transaction
const Member = require('../models/Member');

/**
 * Member Scoring Service
 * Calculates member value scores, predicts lifetime value, and identifies high-potential members
 */
class MemberScoringService {
  /**
   * Calculate comprehensive member score
   */
  static async calculateMemberScore(memberId, options = {}) {
    try {
      const {
        includeInteractions = true,
        includePurchases = true,
        includeActivity = true,
        creatorId = null
      } = options;

      // Get member analytics
      let analytics = await MemberAnalytics.findOne({ member: memberId });
      
      if (!analytics) {
        // Create new analytics if doesn't exist
        analytics = await MemberAnalytics.create({
          member: memberId,
          spending: {
            tier: 'new',
            last24Hours: 0,
            last7Days: 0,
            last30Days: 0,
            last90Days: 0,
            lifetime: 0
          }
        });
      }

      let score = 0;
      const scoreBreakdown = {};

      // 1. Spending Score (40% weight)
      if (includePurchases) {
        const spendingScore = this._calculateSpendingScore(analytics.spending);
        score += spendingScore * 0.4;
        scoreBreakdown.spending = spendingScore;
      }

      // 2. Activity Score (30% weight)
      if (includeActivity) {
        const activityScore = this._calculateActivityScore(analytics.activity);
        score += activityScore * 0.3;
        scoreBreakdown.activity = activityScore;
      }

      // 3. Interaction Score (20% weight)
      if (includeInteractions && creatorId) {
        const interactionScore = await this._calculateInteractionScore(memberId, creatorId);
        score += interactionScore * 0.2;
        scoreBreakdown.interaction = interactionScore;
      }

      // 4. Growth Score (10% weight)
      const growthScore = this._calculateGrowthScore(analytics.spending);
      score += growthScore * 0.1;
      scoreBreakdown.growth = growthScore;

      // Update analytics with new score
      analytics.valueScore = Math.round(score);
      analytics.lastCalculated = new Date();
      await analytics.save();

      return {
        score: Math.round(score),
        breakdown: scoreBreakdown,
        tier: analytics.spending.tier,
        lastCalculated: new Date()
      };
    } catch (error) {
      console.error('Error calculating member score:', error);
      throw error;
    }
  }

  /**
   * Determine spending tier based on spending patterns
   */
  static async determineSpendingTier(memberId, period = 'last30Days') {
    try {
      const analytics = await MemberAnalytics.findOne({ member: memberId });
      
      if (!analytics) {
        return 'new';
      }

      const spending = analytics.spending[period] || 0;

      // Define tier thresholds
      if (spending >= 1000) return 'whale';
      if (spending >= 500) return 'vip';
      if (spending >= 100) return 'regular';
      if (spending >= 10) return 'occasional';
      if (spending > 0) return 'casual';
      return 'new';
    } catch (error) {
      console.error('Error determining spending tier:', error);
      return 'new';
    }
  }

  /**
   * Predict lifetime value of a member
   */
  static async predictLifetimeValue(memberId) {
    try {
      const analytics = await MemberAnalytics.findOne({ member: memberId });
      
      if (!analytics) {
        return {
          predicted: 0,
          confidence: 0,
          factors: []
        };
      }

      // Get purchase history - NO SUBSCRIPTIONS in this platform
      const purchases = await Transaction.find({
        member: memberId,
        status: 'completed',
        type: { $in: ['purchase', 'tip', 'unlock'] }
      }).sort({ createdAt: 1 });

      if (purchases.length === 0) {
        return {
          predicted: 0,
          confidence: 0,
          factors: ['No purchase history']
        };
      }

      // Calculate key metrics
      const firstPurchase = purchases[0].createdAt;
      const lastPurchase = purchases[purchases.length - 1].createdAt;
      const membershipDays = Math.max(1, (lastPurchase - firstPurchase) / (1000 * 60 * 60 * 24));
      const purchaseFrequency = purchases.length / membershipDays;
      const avgPurchaseValue = analytics.spending.lifetime / purchases.length;
      
      // Calculate velocity
      const recentSpending = analytics.spending.last30Days;
      const previousSpending = analytics.spending.last90Days - recentSpending;
      const velocity = previousSpending > 0 ? (recentSpending - previousSpending) / previousSpending : 0;

      // Predict based on patterns
      let predicted = 0;
      let confidence = 0;
      const factors = [];

      // Base prediction on current run rate
      const dailyRunRate = analytics.spending.last30Days / 30;
      const projectedYearlyValue = dailyRunRate * 365;
      
      // Adjust based on tier
      let tierMultiplier = 1;
      switch (analytics.spending.tier) {
        case 'whale':
          tierMultiplier = 1.5;
          factors.push('Whale status');
          break;
        case 'vip':
          tierMultiplier = 1.3;
          factors.push('VIP status');
          break;
        case 'regular':
          tierMultiplier = 1.1;
          factors.push('Regular customer');
          break;
      }

      // Adjust based on velocity
      let velocityMultiplier = 1;
      if (velocity > 0.5) {
        velocityMultiplier = 1.3;
        factors.push('Rapidly increasing spend');
      } else if (velocity > 0) {
        velocityMultiplier = 1.1;
        factors.push('Growing spend');
      } else if (velocity < -0.3) {
        velocityMultiplier = 0.7;
        factors.push('Declining spend');
      }

      // Adjust based on activity
      let activityMultiplier = 1;
      if (analytics.activity.level === 'very-active') {
        activityMultiplier = 1.2;
        factors.push('Very active user');
      } else if (analytics.activity.level === 'active') {
        activityMultiplier = 1.1;
        factors.push('Active user');
      }

      // Calculate final prediction
      predicted = projectedYearlyValue * tierMultiplier * velocityMultiplier * activityMultiplier;

      // Calculate confidence based on data quality
      if (purchases.length >= 10 && membershipDays >= 30) {
        confidence = 85;
      } else if (purchases.length >= 5 && membershipDays >= 14) {
        confidence = 70;
      } else if (purchases.length >= 3) {
        confidence = 50;
      } else {
        confidence = 30;
      }

      // Adjust confidence based on consistency
      const purchaseConsistency = this._calculatePurchaseConsistency(purchases);
      confidence = Math.min(95, confidence + (purchaseConsistency * 10));

      return {
        predicted: Math.round(predicted),
        confidence: Math.round(confidence),
        factors,
        metrics: {
          dailyRunRate: Math.round(dailyRunRate * 100) / 100,
          avgPurchaseValue: Math.round(avgPurchaseValue * 100) / 100,
          purchaseFrequency: Math.round(purchaseFrequency * 100) / 100,
          velocity: Math.round(velocity * 100) / 100,
          membershipDays: Math.round(membershipDays)
        }
      };
    } catch (error) {
      console.error('Error predicting lifetime value:', error);
      return {
        predicted: 0,
        confidence: 0,
        factors: ['Error calculating prediction']
      };
    }
  }

  /**
   * Identify high-potential members
   */
  static async identifyHighPotential(creatorId, options = {}) {
    try {
      const {
        limit = 20,
        minScore = 60,
        includeNew = true,
        includeRising = true,
        includeWhales = true
      } = options;

      const highPotentialMembers = [];

      // 1. Find whales and VIPs
      if (includeWhales) {
        const whales = await MemberAnalytics.find({
          'spending.tier': { $in: ['whale', 'vip'] },
          'privacy.discoverable': true,
          'privacy.blockedCreators': { $ne: creatorId }
        })
        .limit(Math.floor(limit / 3))
        .populate('member', 'username email');

        highPotentialMembers.push(...whales.map(m => ({
          ...m.toObject(),
          reason: 'High spender',
          priority: 'critical'
        })));
      }

      // 2. Find rising stars (increasing velocity)
      if (includeRising) {
        const risingStars = await MemberAnalytics.find({
          'spending.velocity.trend': 'increasing',
          'spending.last30Days': { $gte: 50 },
          'privacy.discoverable': true,
          'privacy.blockedCreators': { $ne: creatorId }
        })
        .limit(Math.floor(limit / 3))
        .populate('member', 'username email');

        highPotentialMembers.push(...risingStars.map(m => ({
          ...m.toObject(),
          reason: 'Rising spender',
          priority: 'high'
        })));
      }

      // 3. Find engaged new members
      if (includeNew) {
        const engagedNew = await MemberAnalytics.find({
          'spending.tier': 'new',
          'activity.level': { $in: ['active', 'very-active'] },
          'privacy.discoverable': true,
          'privacy.blockedCreators': { $ne: creatorId },
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        })
        .limit(Math.floor(limit / 3))
        .populate('member', 'username email');

        highPotentialMembers.push(...engagedNew.map(m => ({
          ...m.toObject(),
          reason: 'Engaged newcomer',
          priority: 'medium'
        })));
      }

      // Calculate scores for all
      const scoredMembers = await Promise.all(
        highPotentialMembers.map(async (member) => {
          const score = await this.calculateMemberScore(member.member._id, {
            creatorId
          });
          return {
            ...member,
            score: score.score,
            scoreBreakdown: score.breakdown
          };
        })
      );

      // Filter by minimum score and sort
      return scoredMembers
        .filter(m => m.score >= minScore)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error identifying high potential members:', error);
      return [];
    }
  }

  /**
   * Assess churn risk for a member
   */
  static async assessChurnRisk(memberId) {
    try {
      const analytics = await MemberAnalytics.findOne({ member: memberId });
      
      if (!analytics) {
        return {
          risk: 'unknown',
          score: 0,
          factors: ['No analytics data']
        };
      }

      let riskScore = 0;
      const factors = [];

      // Check activity decline
      const lastActive = new Date(analytics.activity.lastActive);
      const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
      
      if (daysSinceActive > 30) {
        riskScore += 40;
        factors.push('Inactive for 30+ days');
      } else if (daysSinceActive > 14) {
        riskScore += 25;
        factors.push('Inactive for 2+ weeks');
      } else if (daysSinceActive > 7) {
        riskScore += 15;
        factors.push('Inactive for 1+ week');
      }

      // Check spending decline
      if (analytics.spending.velocity.trend === 'decreasing') {
        riskScore += 30;
        factors.push('Decreasing spend');
      }

      // Check engagement metrics
      if (analytics.engagement.responseRate < 20) {
        riskScore += 20;
        factors.push('Low engagement');
      }

      // Check purchase recency
      const lastPurchase = await Transaction.findOne({
        member: memberId,
        status: 'completed'
      }).sort({ createdAt: -1 });

      if (lastPurchase) {
        const daysSincePurchase = (Date.now() - lastPurchase.createdAt) / (1000 * 60 * 60 * 24);
        if (daysSincePurchase > 60) {
          riskScore += 30;
          factors.push('No purchase in 60+ days');
        } else if (daysSincePurchase > 30) {
          riskScore += 20;
          factors.push('No purchase in 30+ days');
        }
      }

      // Determine risk level
      let risk = 'low';
      if (riskScore >= 70) {
        risk = 'critical';
      } else if (riskScore >= 50) {
        risk = 'high';
      } else if (riskScore >= 30) {
        risk = 'medium';
      }

      // Add retention suggestions
      const suggestions = [];
      if (risk === 'critical' || risk === 'high') {
        suggestions.push('Send win-back offer (40-50% discount)');
        suggestions.push('Personal message from creator');
        suggestions.push('Exclusive content preview');
      } else if (risk === 'medium') {
        suggestions.push('Send special offer (20-30% discount)');
        suggestions.push('Engagement campaign');
      }

      return {
        risk,
        score: riskScore,
        factors,
        suggestions,
        lastActive: analytics.activity.lastActive,
        spending: {
          tier: analytics.spending.tier,
          last30Days: analytics.spending.last30Days,
          trend: analytics.spending.velocity.trend
        }
      };
    } catch (error) {
      console.error('Error assessing churn risk:', error);
      return {
        risk: 'unknown',
        score: 0,
        factors: ['Error calculating risk']
      };
    }
  }

  // Private helper methods
  static _calculateSpendingScore(spending) {
    let score = 0;
    
    // Tier-based scoring
    const tierScores = {
      whale: 100,
      vip: 80,
      regular: 60,
      occasional: 40,
      casual: 20,
      new: 10
    };
    score = tierScores[spending.tier] || 0;

    // Adjust for recent activity
    if (spending.last30Days > 500) score = Math.min(100, score + 20);
    else if (spending.last30Days > 200) score = Math.min(100, score + 10);
    else if (spending.last30Days > 50) score = Math.min(100, score + 5);

    return score;
  }

  static _calculateActivityScore(activity) {
    const levelScores = {
      'very-active': 100,
      'active': 75,
      'moderate': 50,
      'low': 25,
      'inactive': 0
    };
    
    let score = levelScores[activity.level] || 0;

    // Adjust for recency
    const lastActive = new Date(activity.lastActive);
    const hoursSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60);
    
    if (hoursSinceActive < 1) score = Math.min(100, score + 20);
    else if (hoursSinceActive < 24) score = Math.min(100, score + 10);
    else if (hoursSinceActive > 168) score = Math.max(0, score - 20);

    return score;
  }

  static async _calculateInteractionScore(memberId, creatorId) {
    try {
      const interactions = await MemberInteraction.find({
        member: memberId,
        creator: creatorId,
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      });

      if (interactions.length === 0) return 0;

      let score = 50; // Base score for having interactions

      // Response rate
      const responses = interactions.filter(i => i.response.responded);
      const responseRate = (responses.length / interactions.length) * 100;
      score += responseRate * 0.3;

      // Conversion rate
      const conversions = interactions.filter(i => i.conversion.converted);
      const conversionRate = (conversions.length / interactions.length) * 100;
      score += conversionRate * 0.2;

      return Math.min(100, score);
    } catch (error) {
      console.error('Error calculating interaction score:', error);
      return 0;
    }
  }

  static _calculateGrowthScore(spending) {
    if (!spending.velocity) return 50;

    const trendScores = {
      'rapid-growth': 100,
      'increasing': 80,
      'stable': 50,
      'decreasing': 20,
      'rapid-decline': 0
    };

    return trendScores[spending.velocity.trend] || 50;
  }

  static _calculatePurchaseConsistency(purchases) {
    if (purchases.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < purchases.length; i++) {
      const days = (purchases[i].createdAt - purchases[i-1].createdAt) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => {
      return sum + Math.pow(interval - avgInterval, 2);
    }, 0) / intervals.length;

    const stdDev = Math.sqrt(variance);
    const consistency = Math.max(0, 1 - (stdDev / avgInterval));

    return consistency;
  }
}

module.exports = MemberScoringService;