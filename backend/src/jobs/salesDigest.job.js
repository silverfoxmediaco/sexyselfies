// backend/src/jobs/salesDigest.job.js
// Scheduled jobs for sales reports and opportunity notifications

const cron = require('node-cron');
const CreatorSalesActivity = require('../models/CreatorSalesActivity');
const Creator = require('../models/Creator');
const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');
const { sendNotification } = require('../services/notification.service');
const { findIdealMembers } = require('../services/connections.service');

let activeJobs = [];

/**
 * Initialize all sales digest jobs
 */
exports.initializeJobs = () => {
  console.log('📧 Initializing sales digest jobs...');
  
  const jobs = [
    scheduleDailySalesReport(),
    scheduleWeeklyPerformanceSummary(),
    scheduleHighValueMemberAlerts(),
    scheduleOpportunityNotifications()
  ];
  
  activeJobs = jobs;
  console.log(`✅ ${jobs.length} sales digest jobs scheduled`);
};

/**
 * Stop all sales digest jobs
 */
exports.stopJobs = () => {
  activeJobs.forEach(job => job.stop());
  activeJobs = [];
  console.log('🛑 Sales digest jobs stopped');
};

// ============================================
// DAILY SALES REPORT
// Runs daily at 9:00 AM
// ============================================
function scheduleDailySalesReport() {
  return cron.schedule('0 9 * * *', async () => {
    console.log('📊 [JOB] Generating daily sales reports...');
    const startTime = Date.now();
    
    try {
      let reportsSent = 0;
      let errors = 0;
      
      // Get all active creators with sales activity
      const creators = await Creator.find({
        isVerified: true,
        'preferences.dailyReports': { $ne: false }
      }).populate('user', 'email');
      
      for (const creator of creators) {
        try {
          // Get yesterday's performance
          const salesActivity = await CreatorSalesActivity.findOne({ 
            creator: creator._id 
          });
          
          if (!salesActivity || salesActivity.daily.totalInteractions === 0) {
            continue; // Skip if no activity
          }
          
          // Generate report data
          const report = await generateDailyReport(creator._id, salesActivity);
          
          // Send notification with report
          await sendNotification(creator.user._id, {
            type: 'daily_sales_report',
            title: '📊 Your Daily Sales Report',
            body: formatDailyReportSummary(report),
            category: 'report',
            data: {
              report,
              actionUrl: '/creator/sales/dashboard'
            }
          });
          
          // Send email if enabled
          if (creator.preferences?.emailReports) {
            await sendDailyReportEmail(creator.user.email, report);
          }
          
          reportsSent++;
          
        } catch (error) {
          console.error(`Error generating report for creator ${creator._id}:`, error.message);
          errors++;
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Daily sales reports complete:`);
      console.log(`  - Reports sent: ${reportsSent}`);
      console.log(`  - Errors: ${errors}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('daily_sales_report', {
        reportsSent,
        errors,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Daily sales report failed:', error);
      await logJobError('daily_sales_report', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// WEEKLY PERFORMANCE SUMMARY
// Runs every Monday at 10:00 AM
// ============================================
function scheduleWeeklyPerformanceSummary() {
  return cron.schedule('0 10 * * 1', async () => {
    console.log('📈 [JOB] Generating weekly performance summaries...');
    const startTime = Date.now();
    
    try {
      let summariesSent = 0;
      
      // Get all active creators
      const salesActivities = await CreatorSalesActivity.find({})
        .populate('creator', 'username user preferences');
      
      for (const activity of salesActivities) {
        try {
          if (!activity.creator.preferences?.weeklyReports) {
            continue;
          }
          
          // Generate weekly summary
          const summary = await generateWeeklySummary(activity);
          
          // Compare to previous week
          const comparison = compareWeeklyPerformance(activity);
          
          // Generate insights and recommendations
          const insights = generateWeeklyInsights(activity, comparison);
          
          // Send notification
          await sendNotification(activity.creator.user, {
            type: 'weekly_performance_summary',
            title: '📈 Your Weekly Performance Summary',
            body: formatWeeklySummary(summary, comparison),
            category: 'report',
            priority: 'normal',
            data: {
              summary,
              comparison,
              insights,
              actionUrl: '/creator/sales/analytics'
            }
          });
          
          // Reset weekly metrics
          await resetWeeklyMetrics(activity);
          
          summariesSent++;
          
        } catch (error) {
          console.error(`Error generating weekly summary for creator ${activity.creator._id}:`, error.message);
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Weekly performance summaries complete:`);
      console.log(`  - Summaries sent: ${summariesSent}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('weekly_performance_summary', {
        summariesSent,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Weekly performance summary failed:', error);
      await logJobError('weekly_performance_summary', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// HIGH-VALUE MEMBER ALERTS
// Runs every 3 hours
// ============================================
function scheduleHighValueMemberAlerts() {
  return cron.schedule('0 */3 * * *', async () => {
    console.log('🐋 [JOB] Checking for high-value member activity...');
    const startTime = Date.now();
    
    try {
      let alertsSent = 0;
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
      
      // Find recently active high-value members
      const highValueMembers = await MemberAnalytics.find({
        'spending.tier': { $in: ['whale', 'vip'] },
        'activity.lastActive': { $gte: threeHoursAgo },
        'privacy.discoverable': true
      }).populate('member', 'username avatar');
      
      if (highValueMembers.length === 0) {
        console.log('  No high-value members active in the last 3 hours');
        return;
      }
      
      // Find creators to notify
      const verifiedCreators = await Creator.find({
        isVerified: true,
        'preferences.highValueAlerts': { $ne: false }
      }).limit(50);
      
      for (const creator of verifiedCreators) {
        try {
          // Check if creator has already been notified about these members
          const recentAlerts = await getRecentAlerts(creator._id, 24); // Last 24 hours
          
          // Filter out members already alerted
          const newHighValueMembers = highValueMembers.filter(m => 
            !recentAlerts.includes(m.member._id.toString())
          );
          
          if (newHighValueMembers.length === 0) {
            continue;
          }
          
          // Send alert for new high-value members
          await sendNotification(creator.user, {
            type: 'high_value_member_alert',
            title: `🐋 ${newHighValueMembers.length} High-Value Member${newHighValueMembers.length > 1 ? 's' : ''} Active Now!`,
            body: generateHighValueAlertMessage(newHighValueMembers),
            category: 'opportunity',
            priority: 'high',
            data: {
              members: newHighValueMembers.map(m => ({
                id: m.member._id,
                username: m.member.username,
                tier: m.spending.tier,
                last30DaySpend: m.spending.last30Days
              })),
              actionUrl: '/creator/sales/discover'
            }
          });
          
          // Record alert to prevent duplicates
          await recordAlert(creator._id, newHighValueMembers.map(m => m.member._id));
          
          alertsSent++;
          
        } catch (error) {
          console.error(`Error sending high-value alert to creator ${creator._id}:`, error.message);
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] High-value member alerts complete:`);
      console.log(`  - Alerts sent: ${alertsSent}`);
      console.log(`  - High-value members found: ${highValueMembers.length}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('high_value_member_alerts', {
        alertsSent,
        membersFound: highValueMembers.length,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] High-value member alerts failed:', error);
      await logJobError('high_value_member_alerts', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// OPPORTUNITY NOTIFICATIONS
// Runs every hour
// ============================================
function scheduleOpportunityNotifications() {
  return cron.schedule('0 * * * *', async () => {
    console.log('💡 [JOB] Identifying sales opportunities...');
    const startTime = Date.now();
    
    try {
      let notificationsSent = 0;
      const opportunities = [];
      
      // Get all active creators
      const creators = await Creator.find({
        isVerified: true,
        'preferences.opportunityAlerts': { $ne: false }
      });
      
      for (const creator of creators) {
        try {
          // Identify various opportunity types
          const creatorOpportunities = await identifyOpportunities(creator._id);
          
          if (creatorOpportunities.length === 0) {
            continue;
          }
          
          // Filter to high-priority opportunities
          const highPriority = creatorOpportunities.filter(o => 
            o.priority === 'high' || o.priority === 'urgent'
          );
          
          if (highPriority.length > 0) {
            // Send notification for high-priority opportunities
            await sendNotification(creator.user, {
              type: 'sales_opportunity',
              title: '💡 New Sales Opportunities Available!',
              body: formatOpportunityMessage(highPriority),
              category: 'opportunity',
              priority: 'normal',
              data: {
                opportunities: highPriority,
                actionUrl: '/creator/sales/recommendations'
              }
            });
            
            notificationsSent++;
            opportunities.push(...highPriority);
          }
          
          // Update creator's opportunity feed
          await updateOpportunityFeed(creator._id, creatorOpportunities);
          
        } catch (error) {
          console.error(`Error identifying opportunities for creator ${creator._id}:`, error.message);
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Opportunity notifications complete:`);
      console.log(`  - Notifications sent: ${notificationsSent}`);
      console.log(`  - Opportunities identified: ${opportunities.length}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('opportunity_notifications', {
        notificationsSent,
        opportunitiesFound: opportunities.length,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Opportunity notifications failed:', error);
      await logJobError('opportunity_notifications', error);
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
 * Generate daily report data
 */
async function generateDailyReport(creatorId, salesActivity) {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Get yesterday's transactions
  const transactions = await Transaction.aggregate([
    {
      $match: {
        creator: creatorId,
        createdAt: { $gte: yesterday, $lt: today },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        revenue: { $sum: '$amount' },
        count: { $sum: 1 },
        avgValue: { $avg: '$amount' }
      }
    }
  ]);
  
  // Get interaction metrics
  const interactions = await MemberInteraction.aggregate([
    {
      $match: {
        creator: creatorId,
        createdAt: { $gte: yesterday, $lt: today }
      }
    },
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 },
        conversions: {
          $sum: { $cond: ['$conversion.resulted_in_purchase', 1, 0] }
        }
      }
    }
  ]);
  
  return {
    date: yesterday,
    revenue: transactions[0]?.revenue || 0,
    transactions: transactions[0]?.count || 0,
    avgTransactionValue: transactions[0]?.avgValue || 0,
    interactions: salesActivity.daily.totalInteractions,
    conversions: salesActivity.daily.conversions,
    conversionRate: salesActivity.daily.totalInteractions > 0 ? 
      (salesActivity.daily.conversions / salesActivity.daily.totalInteractions * 100).toFixed(2) : 0,
    interactionBreakdown: interactions,
    topPerformingContent: await getTopPerformingContent(creatorId, yesterday, today),
    comparison: {
      revenueTrend: calculateTrend(transactions[0]?.revenue || 0, salesActivity.daily.previousRevenue || 0),
      conversionTrend: calculateTrend(salesActivity.daily.conversions, salesActivity.daily.previousConversions || 0)
    }
  };
}

/**
 * Generate weekly summary
 */
async function generateWeeklySummary(activity) {
  return {
    totalRevenue: activity.metrics.last7Days.totalRevenue,
    totalConversions: activity.metrics.last7Days.totalConversions,
    totalInteractions: activity.metrics.last7Days.totalInteractions,
    conversionRate: activity.performance.overallConversionRate,
    bestDay: activity.performance.bestDays?.[0],
    bestTimeSlot: activity.performance.bestTimeSlots?.[0],
    topSegment: activity.performance.bestSegments?.[0],
    achievements: activity.gamification.achievements.filter(a => {
      const unlockedDate = new Date(a.unlockedAt);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return unlockedDate >= weekAgo;
    })
  };
}

/**
 * Compare weekly performance
 */
function compareWeeklyPerformance(activity) {
  const current = activity.metrics.last7Days;
  const previous = activity.metrics.previous7Days || {};
  
  return {
    revenueChange: calculatePercentageChange(current.totalRevenue, previous.totalRevenue),
    conversionChange: calculatePercentageChange(current.totalConversions, previous.totalConversions),
    interactionChange: calculatePercentageChange(current.totalInteractions, previous.totalInteractions),
    trends: {
      revenue: current.totalRevenue > previous.totalRevenue ? 'up' : 'down',
      conversions: current.totalConversions > previous.totalConversions ? 'up' : 'down',
      interactions: current.totalInteractions > previous.totalInteractions ? 'up' : 'down'
    }
  };
}

/**
 * Generate weekly insights
 */
function generateWeeklyInsights(activity, comparison) {
  const insights = [];
  
  // Revenue insights
  if (comparison.revenueChange > 20) {
    insights.push({
      type: 'success',
      message: `Revenue up ${comparison.revenueChange}%! Keep up the great work!`,
      recommendation: 'Consider increasing your daily interaction targets'
    });
  } else if (comparison.revenueChange < -20) {
    insights.push({
      type: 'warning',
      message: `Revenue down ${Math.abs(comparison.revenueChange)}% this week`,
      recommendation: 'Focus on re-engaging high-value members'
    });
  }
  
  // Conversion insights
  if (activity.performance.overallConversionRate < 5) {
    insights.push({
      type: 'improvement',
      message: 'Conversion rate below 5%',
      recommendation: 'Try more personalized messages and special offers'
    });
  }
  
  // Activity insights
  if (activity.metrics.last7Days.totalInteractions < 100) {
    insights.push({
      type: 'action',
      message: 'Low interaction volume',
      recommendation: 'Aim for at least 20 interactions per day'
    });
  }
  
  return insights;
}

/**
 * Identify opportunities for a creator
 */
async function identifyOpportunities(creatorId) {
  const opportunities = [];
  
  // 1. Inactive high-value members
  const inactiveWhales = await MemberAnalytics.find({
    'spending.tier': { $in: ['whale', 'vip'] },
    'activity.lastActive': { 
      $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    },
    'privacy.discoverable': true,
    'privacy.blockedCreators': { $ne: creatorId }
  }).limit(5);
  
  if (inactiveWhales.length > 0) {
    opportunities.push({
      type: 'inactive_whales',
      priority: 'high',
      title: `${inactiveWhales.length} Inactive High-Value Members`,
      description: 'These whales haven\'t been active recently',
      action: 'Send re-engagement offers',
      members: inactiveWhales.map(m => m.member),
      potentialValue: inactiveWhales.reduce((sum, m) => sum + m.spending.last30Days, 0)
    });
  }
  
  // 2. Rising spenders
  const risingSpenders = await MemberAnalytics.find({
    'spending.velocity.trend': 'increasing',
    'spending.tier': { $in: ['regular', 'casual'] },
    'privacy.discoverable': true,
    'privacy.blockedCreators': { $ne: creatorId }
  }).limit(10);
  
  if (risingSpenders.length > 0) {
    opportunities.push({
      type: 'rising_spenders',
      priority: 'medium',
      title: `${risingSpenders.length} Rising Spenders Identified`,
      description: 'Members showing increased spending patterns',
      action: 'Nurture with special attention',
      members: risingSpenders.map(m => m.member),
      potentialValue: risingSpenders.length * 50 // Estimated
    });
  }
  
  // 3. Perfect matches from AI
  const matches = await findIdealMembers(creatorId, {
    limit: 5,
    excludeInteracted: true,
    minScore: 80
  });
  
  if (matches.matches && matches.matches.length > 0) {
    opportunities.push({
      type: 'perfect_matches',
      priority: 'high',
      title: `${matches.matches.length} Perfect Matches Found`,
      description: 'AI identified highly compatible members',
      action: 'Reach out with personalized messages',
      members: matches.matches.map(m => m.member.id),
      avgCompatibility: matches.summary.avgCompatibility
    });
  }
  
  // 4. Time-sensitive opportunities
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const isEvening = now.getHours() >= 20 || now.getHours() < 2;
  
  if (isWeekend || isEvening) {
    const activeNow = await MemberAnalytics.find({
      'activity.lastActive': { $gte: new Date(Date.now() - 15 * 60 * 1000) }, // Active in last 15 mins
      'spending.tier': { $in: ['whale', 'vip', 'regular'] },
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId }
    }).limit(10);
    
    if (activeNow.length > 0) {
      opportunities.push({
        type: 'active_now',
        priority: 'urgent',
        title: `${activeNow.length} High-Value Members Online Now!`,
        description: 'Strike while they\'re active',
        action: 'Send immediate engagement',
        members: activeNow.map(m => m.member),
        timeWindow: '15 minutes'
      });
    }
  }
  
  return opportunities;
}

/**
 * Format daily report summary
 */
function formatDailyReportSummary(report) {
  return `Yesterday's Performance:
💰 Revenue: $${report.revenue.toFixed(2)}
📈 Conversions: ${report.conversions} (${report.conversionRate}% rate)
💬 Interactions: ${report.interactions}
📊 Avg Transaction: $${report.avgTransactionValue.toFixed(2)}

${report.comparison.revenueTrend > 0 ? '🟢' : '🔴'} Revenue ${report.comparison.revenueTrend > 0 ? 'up' : 'down'} ${Math.abs(report.comparison.revenueTrend)}% from previous day`;
}

/**
 * Format weekly summary
 */
function formatWeeklySummary(summary, comparison) {
  return `Weekly Performance:
💰 Total Revenue: $${summary.totalRevenue.toFixed(2)} (${comparison.revenueChange > 0 ? '+' : ''}${comparison.revenueChange}%)
📈 Conversions: ${summary.totalConversions} (${comparison.conversionChange > 0 ? '+' : ''}${comparison.conversionChange}%)
💬 Interactions: ${summary.totalInteractions}
🎯 Conversion Rate: ${summary.conversionRate}%

${summary.achievements.length > 0 ? `🏆 ${summary.achievements.length} achievements unlocked!` : ''}`;
}

/**
 * Generate high-value alert message
 */
function generateHighValueAlertMessage(members) {
  const whales = members.filter(m => m.spending.tier === 'whale').length;
  const vips = members.filter(m => m.spending.tier === 'vip').length;
  
  let message = '';
  if (whales > 0) {
    message += `${whales} whale${whales > 1 ? 's' : ''}`;
  }
  if (vips > 0) {
    message += `${whales > 0 ? ' and ' : ''}${vips} VIP${vips > 1 ? 's' : ''}`;
  }
  
  message += ' active now! Don\'t miss this opportunity to engage.';
  return message;
}

/**
 * Format opportunity message
 */
function formatOpportunityMessage(opportunities) {
  const urgent = opportunities.filter(o => o.priority === 'urgent').length;
  const high = opportunities.filter(o => o.priority === 'high').length;
  
  let message = `${opportunities.length} new opportunit${opportunities.length > 1 ? 'ies' : 'y'} identified`;
  
  if (urgent > 0) {
    message += ` (${urgent} urgent!)`;
  } else if (high > 0) {
    message += ` (${high} high priority)`;
  }
  
  const totalValue = opportunities.reduce((sum, o) => sum + (o.potentialValue || 0), 0);
  if (totalValue > 0) {
    message += ` - Potential value: $${totalValue.toFixed(0)}`;
  }
  
  return message;
}

/**
 * Calculate trend
 */
function calculateTrend(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Calculate percentage change
 */
function calculatePercentageChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Get top performing content
 */
async function getTopPerformingContent(creatorId, startDate, endDate) {
  // This would analyze content performance
  // Placeholder implementation
  return [];
}

/**
 * Get recent alerts sent to creator
 */
async function getRecentAlerts(creatorId, hours) {
  // This would query an AlertHistory collection
  // Placeholder implementation
  return [];
}

/**
 * Record alert to prevent duplicates
 */
async function recordAlert(creatorId, memberIds) {
  // This would save to AlertHistory collection
  // Placeholder implementation
}

/**
 * Update opportunity feed
 */
async function updateOpportunityFeed(creatorId, opportunities) {
  // This would update the creator's opportunity feed
  // Placeholder implementation
}

/**
 * Reset weekly metrics
 */
async function resetWeeklyMetrics(activity) {
  // Move current week to previous week
  activity.metrics.previous7Days = { ...activity.metrics.last7Days };
  
  // Reset current week
  activity.metrics.last7Days = {
    totalInteractions: 0,
    totalConversions: 0,
    totalRevenue: 0
  };
  
  await activity.save();
}

/**
 * Send daily report email
 */
async function sendDailyReportEmail(email, report) {
  // This would send an actual email using the email service
  console.log(`📧 Sending daily report email to ${email}`);
}

/**
 * Log job execution
 */
async function logJobExecution(jobName, metrics) {
  console.log(`📝 Job logged: ${jobName}`, metrics);
}

/**
 * Log job error
 */
async function logJobError(jobName, error) {
  console.error(`❌ Job error logged: ${jobName}`, error.message);
}

module.exports = exports;