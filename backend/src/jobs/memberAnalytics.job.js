// backend/src/jobs/memberAnalytics.job.js
// Scheduled jobs for member analytics calculations and updates

const cron = require('node-cron');
const MemberAnalytics = require('../models/MemberAnalytics');
const Transaction = require('../models/Transaction');
const MemberInteraction = require('../models/MemberInteraction');
const { 
  calculateMemberScore, 
  determineSpendingTier,
  riskAssessment,
  predictLifetimeValue 
} = require('../services/memberScoring.service');
const { 
  segmentBySpending,
  segmentByActivity 
} = require('../utils/memberSegmentation');

let activeJobs = [];

/**
 * Initialize all member analytics jobs
 */
exports.initializeJobs = () => {
  console.log('📊 Initializing member analytics jobs...');
  
  // Schedule all jobs
  const jobs = [
    scheduleDailySpendingCalculations(),
    scheduleActivityLevelUpdates(),
    scheduleSegmentRecalculation(),
    scheduleChurnRiskAssessment()
  ];
  
  activeJobs = jobs;
  console.log(`✅ ${jobs.length} member analytics jobs scheduled`);
};

/**
 * Stop all member analytics jobs
 */
exports.stopJobs = () => {
  activeJobs.forEach(job => job.stop());
  activeJobs = [];
  console.log('🛑 Member analytics jobs stopped');
};

// ============================================
// DAILY SPENDING CALCULATIONS
// Runs daily at 2:00 AM
// ============================================
function scheduleDailySpendingCalculations() {
  return cron.schedule('0 2 * * *', async () => {
    console.log('💰 [JOB] Starting daily spending calculations...');
    const startTime = Date.now();
    
    try {
      let processed = 0;
      let errors = 0;
      const batchSize = 100;
      
      // Process in batches to avoid memory issues
      let skip = 0;
      let hasMore = true;
      
      while (hasMore) {
        const memberAnalytics = await MemberAnalytics.find({})
          .skip(skip)
          .limit(batchSize)
          .populate('member', '_id');
        
        if (memberAnalytics.length === 0) {
          hasMore = false;
          break;
        }
        
        // Process each member's spending
        for (const analytics of memberAnalytics) {
          try {
            await updateMemberSpending(analytics);
            processed++;
          } catch (error) {
            console.error(`Error updating spending for member ${analytics.member._id}:`, error.message);
            errors++;
          }
        }
        
        skip += batchSize;
        
        // Log progress
        if (processed % 500 === 0) {
          console.log(`  Processed ${processed} members...`);
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Spending calculations complete:`);
      console.log(`  - Processed: ${processed} members`);
      console.log(`  - Errors: ${errors}`);
      console.log(`  - Duration: ${duration}s`);
      
      // Log job execution
      await logJobExecution('daily_spending_calculation', {
        processed,
        errors,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Daily spending calculation failed:', error);
      await logJobError('daily_spending_calculation', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// ACTIVITY LEVEL UPDATES
// Runs every 6 hours
// ============================================
function scheduleActivityLevelUpdates() {
  return cron.schedule('0 */6 * * *', async () => {
    console.log('📈 [JOB] Starting activity level updates...');
    const startTime = Date.now();
    
    try {
      const now = new Date();
      let updated = 0;
      
      // Define activity thresholds
      const activityThresholds = {
        'very-active': { days: 1, sessions: 5 },  // Active in last day with 5+ sessions
        'active': { days: 3, sessions: 3 },       // Active in last 3 days with 3+ sessions
        'moderate': { days: 7, sessions: 2 },     // Active in last week with 2+ sessions
        'low': { days: 30, sessions: 1 },         // Active in last month
        'inactive': { days: 30, sessions: 0 }     // No activity in 30+ days
      };
      
      // Update activity levels based on recent activity
      for (const [level, threshold] of Object.entries(activityThresholds)) {
        const cutoffDate = new Date(now - threshold.days * 24 * 60 * 60 * 1000);
        
        const result = await MemberAnalytics.updateMany(
          {
            'activity.lastActive': level === 'inactive' ? 
              { $lt: cutoffDate } : 
              { $gte: cutoffDate },
            'activity.level': { $ne: level }
          },
          {
            $set: { 
              'activity.level': level,
              'activity.levelUpdatedAt': now
            }
          }
        );
        
        if (result.modifiedCount > 0) {
          updated += result.modifiedCount;
          console.log(`  Updated ${result.modifiedCount} members to ${level}`);
        }
      }
      
      // Update session counts
      await updateSessionCounts();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Activity level updates complete:`);
      console.log(`  - Updated: ${updated} members`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('activity_level_update', {
        updated,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Activity level update failed:', error);
      await logJobError('activity_level_update', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// SEGMENT RECALCULATION
// Runs daily at 3:00 AM
// ============================================
function scheduleSegmentRecalculation() {
  return cron.schedule('0 3 * * *', async () => {
    console.log('🎯 [JOB] Starting segment recalculation...');
    const startTime = Date.now();
    
    try {
      let processed = 0;
      let segmentChanges = 0;
      
      // Get all members for segmentation
      const memberAnalytics = await MemberAnalytics.find({});
      
      for (const analytics of memberAnalytics) {
        try {
          const oldTier = analytics.spending.tier;
          
          // Recalculate spending tier
          const newTier = determineSpendingTier(analytics.spending);
          
          if (oldTier !== newTier) {
            analytics.spending.tier = newTier;
            analytics.spending.tierChangedAt = new Date();
            segmentChanges++;
            
            // Track tier changes for notifications
            analytics.metadata.tierHistory = analytics.metadata.tierHistory || [];
            analytics.metadata.tierHistory.push({
              from: oldTier,
              to: newTier,
              changedAt: new Date()
            });
            
            // Notify creators if whale/VIP status changes
            if ((newTier === 'whale' || newTier === 'vip') && oldTier !== newTier) {
              await notifyCreatorsOfHighValueMember(analytics.member, newTier);
            }
          }
          
          // Recalculate value score
          const newScore = await calculateMemberScore(analytics.member);
          analytics.scoring.valueScore = newScore;
          
          // Update velocity trends
          await updateVelocityTrends(analytics);
          
          await analytics.save();
          processed++;
          
        } catch (error) {
          console.error(`Error recalculating segment for member ${analytics.member}:`, error.message);
        }
      }
      
      // Generate segment statistics
      const segmentStats = await generateSegmentStatistics();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Segment recalculation complete:`);
      console.log(`  - Processed: ${processed} members`);
      console.log(`  - Segment changes: ${segmentChanges}`);
      console.log(`  - Duration: ${duration}s`);
      console.log(`  - Segment distribution:`, segmentStats);
      
      await logJobExecution('segment_recalculation', {
        processed,
        segmentChanges,
        segmentStats,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Segment recalculation failed:', error);
      await logJobError('segment_recalculation', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// CHURN RISK ASSESSMENT
// Runs twice daily at 4:00 AM and 4:00 PM
// ============================================
function scheduleChurnRiskAssessment() {
  return cron.schedule('0 4,16 * * *', async () => {
    console.log('⚠️ [JOB] Starting churn risk assessment...');
    const startTime = Date.now();
    
    try {
      let assessed = 0;
      let highRisk = 0;
      let mediumRisk = 0;
      const alertsToSend = [];
      
      // Focus on previously active members
      const memberAnalytics = await MemberAnalytics.find({
        $or: [
          { 'spending.tier': { $in: ['whale', 'vip', 'regular'] } },
          { 'spending.lifetime': { $gte: 50 } }
        ]
      }).populate('member', 'username email');
      
      for (const analytics of memberAnalytics) {
        try {
          // Perform risk assessment
          const riskResult = await riskAssessment(analytics.member._id);
          
          // Update analytics with risk assessment
          analytics.scoring.churnRisk = {
            score: riskResult.score,
            level: riskResult.level,
            factors: riskResult.factors,
            retentionProbability: riskResult.retentionProbability,
            lastAssessed: new Date()
          };
          
          // Track risk changes
          const previousRisk = analytics.scoring.previousChurnRisk?.level;
          
          if (riskResult.level === 'high') {
            highRisk++;
            
            // Alert for new high-risk members
            if (previousRisk !== 'high') {
              alertsToSend.push({
                member: analytics.member,
                risk: riskResult,
                previousRisk,
                tier: analytics.spending.tier
              });
            }
          } else if (riskResult.level === 'medium') {
            mediumRisk++;
          }
          
          // Store previous risk for next comparison
          analytics.scoring.previousChurnRisk = {
            level: riskResult.level,
            score: riskResult.score
          };
          
          await analytics.save();
          assessed++;
          
        } catch (error) {
          console.error(`Error assessing risk for member ${analytics.member._id}:`, error.message);
        }
      }
      
      // Send alerts for high-risk valuable members
      if (alertsToSend.length > 0) {
        await sendChurnRiskAlerts(alertsToSend);
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Churn risk assessment complete:`);
      console.log(`  - Assessed: ${assessed} members`);
      console.log(`  - High risk: ${highRisk}`);
      console.log(`  - Medium risk: ${mediumRisk}`);
      console.log(`  - Alerts sent: ${alertsToSend.length}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('churn_risk_assessment', {
        assessed,
        highRisk,
        mediumRisk,
        alertsSent: alertsToSend.length,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Churn risk assessment failed:', error);
      await logJobError('churn_risk_assessment', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update member spending windows
 */
async function updateMemberSpending(analytics) {
  const now = new Date();
  const memberId = analytics.member._id;
  
  // Calculate spending for different time windows
  const windows = {
    last24Hours: new Date(now - 24 * 60 * 60 * 1000),
    last7Days: new Date(now - 7 * 24 * 60 * 60 * 1000),
    last30Days: new Date(now - 30 * 24 * 60 * 60 * 1000),
    last90Days: new Date(now - 90 * 24 * 60 * 60 * 1000)
  };
  
  // Get transactions for each window
  for (const [window, date] of Object.entries(windows)) {
    const transactions = await Transaction.aggregate([
      {
        $match: {
          member: memberId,
          status: 'completed',
          createdAt: { $gte: date }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avg: { $avg: '$amount' }
        }
      }
    ]);
    
    if (transactions.length > 0) {
      analytics.spending[window] = transactions[0].total || 0;
      
      if (window === 'last30Days') {
        analytics.spending.averagePurchase = transactions[0].avg || 0;
        analytics.metadata.totalPurchases = transactions[0].count || 0;
      }
    } else {
      analytics.spending[window] = 0;
    }
  }
  
  // Update lifetime spending
  const lifetimeTransactions = await Transaction.aggregate([
    {
      $match: {
        member: memberId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);
  
  if (lifetimeTransactions.length > 0) {
    analytics.spending.lifetime = lifetimeTransactions[0].total || 0;
    analytics.metadata.totalPurchases = lifetimeTransactions[0].count || 0;
  }
  
  // Update spending tier
  analytics.spending.tier = determineSpendingTier(analytics.spending);
  
  await analytics.save();
}

/**
 * Update session counts for activity tracking
 */
async function updateSessionCounts() {
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  
  // This would typically track actual session data
  // For now, we'll update based on interaction frequency
  const result = await MemberAnalytics.updateMany(
    {},
    [
      {
        $set: {
          'activity.sessionsLastMonth': '$activity.sessionsThisMonth',
          'activity.sessionsThisMonth': 0, // Reset for new month
          'activity.monthlyActivityUpdated': now
        }
      }
    ]
  );
  
  return result.modifiedCount;
}

/**
 * Update velocity trends
 */
async function updateVelocityTrends(analytics) {
  const current = analytics.spending.last30Days || 0;
  const previous = analytics.spending.last30DaysPrevious || 0;
  
  // Store previous value
  analytics.spending.last30DaysPrevious = current;
  
  // Calculate percentage change
  let percentageChange = 0;
  if (previous > 0) {
    percentageChange = ((current - previous) / previous) * 100;
  } else if (current > 0) {
    percentageChange = 100; // From 0 to something is 100% increase
  }
  
  // Determine trend
  let trend = 'stable';
  if (percentageChange > 10) {
    trend = 'increasing';
  } else if (percentageChange < -10) {
    trend = 'decreasing';
  }
  
  analytics.spending.velocity = {
    trend,
    percentageChange: Math.round(percentageChange),
    updatedAt: new Date()
  };
}

/**
 * Generate segment statistics
 */
async function generateSegmentStatistics() {
  const stats = await MemberAnalytics.aggregate([
    {
      $group: {
        _id: '$spending.tier',
        count: { $sum: 1 },
        totalSpending: { $sum: '$spending.last30Days' },
        avgSpending: { $avg: '$spending.last30Days' }
      }
    }
  ]);
  
  const segmentMap = {};
  stats.forEach(stat => {
    segmentMap[stat._id] = {
      count: stat.count,
      totalSpending: Math.round(stat.totalSpending),
      avgSpending: Math.round(stat.avgSpending)
    };
  });
  
  return segmentMap;
}

/**
 * Notify creators of new high-value members
 */
async function notifyCreatorsOfHighValueMember(memberId, tier) {
  const { sendNotification } = require('../services/notification.service');
  
  // Find creators who might be interested
  const Creator = require('../models/Creator');
  const creators = await Creator.find({
    isVerified: true,
    'preferences.notifyHighValueMembers': true
  }).limit(10);
  
  for (const creator of creators) {
    await sendNotification(creator.user, {
      type: 'high_value_member',
      title: `New ${tier} member available!`,
      body: `A ${tier}-tier member just became active. Don't miss this opportunity!`,
      priority: 'high',
      data: {
        memberId,
        tier,
        actionUrl: `/creator/members/discover`
      }
    });
  }
}

/**
 * Send churn risk alerts
 */
async function sendChurnRiskAlerts(alerts) {
  const { sendNotification } = require('../services/notification.service');
  
  for (const alert of alerts) {
    // Find creators who have interacted with this member
    const interactions = await MemberInteraction.find({
      member: alert.member._id
    }).distinct('creator');
    
    for (const creatorId of interactions) {
      const Creator = require('../models/Creator');
      const creator = await Creator.findById(creatorId);
      
      if (creator) {
        await sendNotification(creator.user, {
          type: 'churn_risk_alert',
          title: `⚠️ ${alert.tier} member at risk!`,
          body: `${alert.member.username} shows high churn risk. Take action now!`,
          priority: 'high',
          data: {
            memberId: alert.member._id,
            risk: alert.risk,
            tier: alert.tier,
            actionUrl: `/member/profile/${alert.member._id}`
          }
        });
      }
    }
  }
}

/**
 * Log job execution
 */
async function logJobExecution(jobName, metrics) {
  // This would typically save to a JobExecution model
  console.log(`📝 Job logged: ${jobName}`, metrics);
  
  // In production, save to database:
  // await JobExecution.create({
  //   jobName,
  //   executedAt: new Date(),
  //   metrics,
  //   status: 'success'
  // });
}

/**
 * Log job errors
 */
async function logJobError(jobName, error) {
  console.error(`❌ Job error logged: ${jobName}`, error.message);
  
  // In production, save to database and alert admins:
  // await JobExecution.create({
  //   jobName,
  //   executedAt: new Date(),
  //   error: error.message,
  //   stack: error.stack,
  //   status: 'failed'
  // });
}

module.exports = exports;