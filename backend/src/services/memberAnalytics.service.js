// Member Analytics Service - Updates analytics on purchases and activities
const MemberAnalytics = require('../models/MemberAnalytics');
const Member = require('../models/Member');

/**
 * Update member analytics after a successful purchase
 * @param {String} memberId - Member who made the purchase
 * @param {Number} amount - Purchase amount in USD
 * @param {String} transactionType - Type: content_unlock, message_unlock, tip, credits
 * @param {String} creatorId - Creator who received the payment (if applicable)
 */
async function updateMemberPurchaseAnalytics(
  memberId,
  amount,
  transactionType,
  creatorId = null
) {
  try {
    console.log(
      `📊 Updating analytics for member ${memberId}: $${amount} ${transactionType}`
    );

    // Find or create MemberAnalytics document
    let analytics = await MemberAnalytics.findOne({ member: memberId });

    if (!analytics) {
      // Create new analytics entry for first-time purchaser
      const member = await Member.findById(memberId);
      if (!member) {
        console.error('Member not found:', memberId);
        return;
      }

      analytics = new MemberAnalytics({
        member: memberId,
        activity: {
          lastActive: new Date(),
          level: 'new',
          sessionsThisMonth: 1,
          totalSessions: 1,
        },
        spending: {
          last30Days: 0,
          last7Days: 0,
          lifetime: 0,
          averagePurchase: 0,
          tier: 'new',
          firstPurchaseDate: new Date(),
          lastPurchaseDate: new Date(),
          totalTransactions: 0,
        },
        engagement: {
          messageResponseRate: 0,
          averageSessionDuration: 0,
          contentUnlocks: 0,
          tipsGiven: 0,
        },
        metadata: {
          totalPurchases: 0,
          favoriteCreators: [],
          joinDate: member.joinDate || member.createdAt,
          lastActivityType: 'purchase',
        },
        preferences: {
          topCategories: member.preferences?.contentTypes
            ? Object.keys(member.preferences.contentTypes)
                .filter(key => member.preferences.contentTypes[key])
                .map(cat => ({ category: cat, weight: 1 }))
            : [{ category: 'photos', weight: 1 }],
          spendingPattern: 'new',
          activityTimes: [],
        },
        scoring: {
          valueScore: 25,
          engagementScore: 10,
          loyaltyScore: 5,
          overallRank: 'new',
        },
      });
    }

    // Update spending analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    // Update current purchase
    analytics.spending.lifetime += amount;
    analytics.spending.totalTransactions += 1;
    analytics.spending.lastPurchaseDate = now;
    analytics.metadata.totalPurchases += 1;
    analytics.activity.lastActive = now;
    analytics.metadata.lastActivityType = 'purchase';

    // Calculate average purchase
    analytics.spending.averagePurchase =
      analytics.spending.lifetime / analytics.spending.totalTransactions;

    // Update recent spending (this is simplified - in production you'd track individual transactions)
    analytics.spending.last30Days += amount;
    analytics.spending.last7Days += amount;

    // Update engagement based on transaction type
    switch (transactionType) {
      case 'content_unlock':
        analytics.engagement.contentUnlocks += 1;
        break;
      case 'tip':
        analytics.engagement.tipsGiven += 1;
        break;
      case 'message_unlock':
        // Could track message engagement here
        break;
    }

    // Update favorite creators if applicable
    if (creatorId) {
      const existingFavorite = analytics.metadata.favoriteCreators.find(
        fav => fav.creator.toString() === creatorId.toString()
      );

      if (existingFavorite) {
        existingFavorite.totalSpent += amount;
        existingFavorite.purchaseCount += 1;
        existingFavorite.lastPurchase = now;
      } else {
        analytics.metadata.favoriteCreators.push({
          creator: creatorId,
          totalSpent: amount,
          purchaseCount: 1,
          firstPurchase: now,
          lastPurchase: now,
        });
      }

      // Keep only top 10 favorite creators
      analytics.metadata.favoriteCreators.sort(
        (a, b) => b.totalSpent - a.totalSpent
      );
      analytics.metadata.favoriteCreators =
        analytics.metadata.favoriteCreators.slice(0, 10);
    }

    // Calculate new tier based on spending
    analytics.spending.tier = calculateSpendingTier(
      analytics.spending.last30Days
    );

    // Calculate new activity level
    analytics.activity.level = calculateActivityLevel(analytics);

    // Calculate value score
    analytics.scoring = calculateMemberScoring(analytics);

    // Save updated analytics
    await analytics.save();

    console.log(
      `✅ Updated analytics for ${memberId}: Tier ${analytics.spending.tier}, Score ${analytics.scoring.valueScore}`
    );

    return analytics;
  } catch (error) {
    console.error('Error updating member analytics:', error);
    // Don't throw - analytics failure shouldn't break payment flow
  }
}

/**
 * Calculate spending tier based on 30-day spending
 * @param {Number} last30Days - Amount spent in last 30 days
 * @returns {String} Tier: new, standard, high, whale, vip
 */
function calculateSpendingTier(last30Days) {
  if (last30Days >= 1000) return 'vip';
  if (last30Days >= 500) return 'whale';
  if (last30Days >= 100) return 'high';
  if (last30Days >= 20) return 'standard';
  return 'new';
}

/**
 * Calculate activity level based on engagement metrics
 * @param {Object} analytics - Member analytics object
 * @returns {String} Level: new, low, medium, high
 */
function calculateActivityLevel(analytics) {
  const { totalTransactions } = analytics.spending;
  const { contentUnlocks, tipsGiven } = analytics.engagement;
  const daysSinceJoin =
    (Date.now() - new Date(analytics.metadata.joinDate)) /
    (1000 * 60 * 60 * 24);

  // Calculate activity score
  let activityScore = 0;
  activityScore += totalTransactions * 10; // 10 points per transaction
  activityScore += contentUnlocks * 5; // 5 points per unlock
  activityScore += tipsGiven * 15; // 15 points per tip (higher value action)

  // Normalize by days since joining (avoid penalizing new users too much)
  const normalizedScore = activityScore / Math.max(daysSinceJoin, 1);

  if (normalizedScore >= 50) return 'high';
  if (normalizedScore >= 20) return 'medium';
  if (normalizedScore >= 5) return 'low';
  return 'new';
}

/**
 * Calculate comprehensive member scoring
 * @param {Object} analytics - Member analytics object
 * @returns {Object} Scoring object with various scores
 */
function calculateMemberScoring(analytics) {
  const { last30Days, lifetime, averagePurchase, totalTransactions } =
    analytics.spending;
  const { contentUnlocks, tipsGiven } = analytics.engagement;

  // Value Score (0-100) - Based on spending
  let valueScore = 0;
  valueScore += Math.min(last30Days / 10, 50); // Up to 50 points for recent spending
  valueScore += Math.min(lifetime / 50, 30); // Up to 30 points for lifetime spending
  valueScore += Math.min(averagePurchase * 2, 20); // Up to 20 points for purchase size

  // Engagement Score (0-100) - Based on activity
  let engagementScore = 0;
  engagementScore += Math.min(totalTransactions * 5, 40); // Up to 40 points for transaction frequency
  engagementScore += Math.min(contentUnlocks * 2, 30); // Up to 30 points for content engagement
  engagementScore += Math.min(tipsGiven * 10, 30); // Up to 30 points for tipping behavior

  // Loyalty Score (0-100) - Based on consistency and longevity
  const daysSinceJoin =
    (Date.now() - new Date(analytics.metadata.joinDate)) /
    (1000 * 60 * 60 * 24);
  const daysSinceLastPurchase =
    (Date.now() - new Date(analytics.spending.lastPurchaseDate)) /
    (1000 * 60 * 60 * 24);

  let loyaltyScore = 0;
  loyaltyScore += Math.min((daysSinceJoin / 30) * 20, 40); // Up to 40 points for tenure
  loyaltyScore += Math.max(30 - daysSinceLastPurchase, 0); // Up to 30 points for recent activity
  loyaltyScore += Math.min(analytics.metadata.favoriteCreators.length * 5, 30); // Up to 30 points for creator diversity

  // Overall Rank
  const overallScore = (valueScore + engagementScore + loyaltyScore) / 3;
  let overallRank = 'new';
  if (overallScore >= 80) overallRank = 'elite';
  else if (overallScore >= 60) overallRank = 'premium';
  else if (overallScore >= 40) overallRank = 'active';
  else if (overallScore >= 20) overallRank = 'standard';

  return {
    valueScore: Math.round(valueScore),
    engagementScore: Math.round(engagementScore),
    loyaltyScore: Math.round(loyaltyScore),
    overallRank,
  };
}

/**
 * Update member activity (for non-purchase activities)
 * @param {String} memberId - Member ID
 * @param {String} activityType - Type of activity
 */
async function updateMemberActivity(memberId, activityType) {
  try {
    const analytics = await MemberAnalytics.findOne({ member: memberId });

    if (analytics) {
      analytics.activity.lastActive = new Date();
      analytics.metadata.lastActivityType = activityType;

      // Could add specific activity tracking here
      await analytics.save();
    }
  } catch (error) {
    console.error('Error updating member activity:', error);
  }
}

module.exports = {
  updateMemberPurchaseAnalytics,
  updateMemberActivity,
  calculateSpendingTier,
  calculateActivityLevel,
  calculateMemberScoring,
};
