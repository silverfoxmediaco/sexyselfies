// backend/src/jobs/cleanup.job.js
// Scheduled jobs for system cleanup and maintenance

const cron = require('node-cron');
const mongoose = require('mongoose');
const SpecialOffer = require('../models/SpecialOffer');
const MemberInteraction = require('../models/MemberInteraction');
const MemberAnalytics = require('../models/MemberAnalytics');
const CreatorSalesActivity = require('../models/CreatorSalesActivity');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

let activeJobs = [];

/**
 * Initialize all cleanup jobs
 */
exports.initializeJobs = () => {
  console.log('🧹 Initializing cleanup jobs...');
  
  const jobs = [
    scheduleExpiredOffersCleanup(),
    scheduleOldInteractionsArchive(),
    scheduleAbandonedSessionsCleanup(),
    scheduleMemberStatusUpdates(),
    scheduleDatabaseOptimization()
  ];
  
  activeJobs = jobs;
  console.log(`✅ ${jobs.length} cleanup jobs scheduled`);
};

/**
 * Stop all cleanup jobs
 */
exports.stopJobs = () => {
  activeJobs.forEach(job => job.stop());
  activeJobs = [];
  console.log('🛑 Cleanup jobs stopped');
};

// ============================================
// REMOVE EXPIRED OFFERS
// Runs daily at 1:00 AM
// ============================================
function scheduleExpiredOffersCleanup() {
  return cron.schedule('0 1 * * *', async () => {
    console.log('🗑️ [JOB] Cleaning up expired offers...');
    const startTime = Date.now();
    
    try {
      const now = new Date();
      let expiredCount = 0;
      let archivedCount = 0;
      
      // Find all expired active offers
      const expiredOffers = await SpecialOffer.find({
        'status.current': 'active',
        'validity.endDate': { $lt: now }
      });
      
      for (const offer of expiredOffers) {
        try {
          // Update status to expired
          offer.status.current = 'expired';
          offer.status.expiredAt = now;
          
          // Calculate final performance metrics
          if (offer.performance) {
            offer.performance.finalRedemptionRate = offer.performance.redemptionRate;
            offer.performance.finalRevenue = offer.performance.totalRevenue;
            offer.performance.finalROI = calculateOfferROI(offer);
          }
          
          await offer.save();
          expiredCount++;
          
          // Notify creator of offer expiration with results
          await notifyOfferExpiration(offer);
          
        } catch (error) {
          console.error(`Error expiring offer ${offer._id}:`, error.message);
        }
      }
      
      // Archive very old offers (older than 90 days)
      const archiveDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
      
      const oldOffers = await SpecialOffer.find({
        'status.current': { $in: ['expired', 'cancelled'] },
        'validity.endDate': { $lt: archiveDate }
      });
      
      for (const offer of oldOffers) {
        try {
          // Move to archive collection
          await archiveOffer(offer);
          
          // Remove from active collection
          await SpecialOffer.deleteOne({ _id: offer._id });
          archivedCount++;
          
        } catch (error) {
          console.error(`Error archiving offer ${offer._id}:`, error.message);
        }
      }
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Expired offers cleanup complete:`);
      console.log(`  - Expired: ${expiredCount} offers`);
      console.log(`  - Archived: ${archivedCount} offers`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('expired_offers_cleanup', {
        expired: expiredCount,
        archived: archivedCount,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Expired offers cleanup failed:', error);
      await logJobError('expired_offers_cleanup', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// ARCHIVE OLD INTERACTIONS
// Runs weekly on Sunday at 3:00 AM
// ============================================
function scheduleOldInteractionsArchive() {
  return cron.schedule('0 3 * * 0', async () => {
    console.log('📦 [JOB] Archiving old interactions...');
    const startTime = Date.now();
    
    try {
      let archivedCount = 0;
      let compressedCount = 0;
      
      // Archive interactions older than 6 months
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      
      // Process in batches to avoid memory issues
      const batchSize = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const oldInteractions = await MemberInteraction.find({
          createdAt: { $lt: sixMonthsAgo },
          archived: { $ne: true }
        }).limit(batchSize);
        
        if (oldInteractions.length === 0) {
          hasMore = false;
          break;
        }
        
        // Archive to separate collection
        const ArchivedInteraction = require('../models/ArchivedInteraction');
        
        for (const interaction of oldInteractions) {
          try {
            // Create archived version with compressed data
            await ArchivedInteraction.create({
              originalId: interaction._id,
              creator: interaction.creator,
              member: interaction.member,
              interactionType: interaction.interactionType,
              createdAt: interaction.createdAt,
              summary: {
                hasResponse: interaction.response.hasResponded,
                resulted_in_purchase: interaction.conversion.resulted_in_purchase,
                purchaseAmount: interaction.conversion.purchaseAmount,
                effectiveness: interaction.effectiveness.score
              }
            });
            
            // Mark as archived
            interaction.archived = true;
            interaction.archivedAt = new Date();
            
            // Clear detailed data to save space
            interaction.message = undefined;
            interaction.specialOffer = undefined;
            interaction.metadata = undefined;
            
            await interaction.save();
            archivedCount++;
            
          } catch (error) {
            console.error(`Error archiving interaction ${interaction._id}:`, error.message);
          }
        }
        
        console.log(`  Archived batch of ${oldInteractions.length} interactions...`);
      }
      
      // Compress message content for 3-6 month old interactions
      const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const compressResult = await MemberInteraction.updateMany(
        {
          createdAt: { $lt: threeMonthsAgo, $gte: sixMonthsAgo },
          'message.content': { $exists: true },
          compressed: { $ne: true }
        },
        {
          $set: { 
            compressed: true,
            'message.compressed': true
          },
          $unset: { 
            'message.attachments': '',
            'metadata.debug': ''
          }
        }
      );
      
      compressedCount = compressResult.modifiedCount;
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Interactions archive complete:`);
      console.log(`  - Archived: ${archivedCount} interactions`);
      console.log(`  - Compressed: ${compressedCount} interactions`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('interactions_archive', {
        archived: archivedCount,
        compressed: compressedCount,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Interactions archive failed:', error);
      await logJobError('interactions_archive', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// CLEAN UP ABANDONED SESSIONS
// Runs every 2 hours
// ============================================
function scheduleAbandonedSessionsCleanup() {
  return cron.schedule('0 */2 * * *', async () => {
    console.log('🔄 [JOB] Cleaning up abandoned sessions...');
    const startTime = Date.now();
    
    try {
      let sessionsCleared = 0;
      let cartsRecovered = 0;
      
      // Clear Redis sessions older than 24 hours (with graceful degradation)
      try {
        const redis = require('redis');
        const redisClient = redis.createClient({
          host: process.env.REDIS_HOST || 'localhost',
          port: process.env.REDIS_PORT || 6379,
          socket: {
            connectTimeout: 5000 // 5 second timeout
          }
        });
        
        // Add error handler
        redisClient.on('error', (err) => {
          console.log('Redis not available for session cleanup:', err.message);
          redisClient.disconnect();
        });
        
        // Only proceed if Redis is available
        await redisClient.connect();
        
        // Pattern for session keys
        const sessionPattern = 'sess:*';
        const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
        
        // Get all session keys
        try {
          const keys = await redisClient.keys(sessionPattern);
          
          for (const key of keys) {
            try {
              const session = await redisClient.get(key);
              if (!session) continue;
              
              const sessionData = JSON.parse(session);
              const lastActivity = sessionData.lastActivity || sessionData.cookie?.expires;
              
              if (lastActivity && new Date(lastActivity) < twentyFourHoursAgo) {
                // Check for abandoned cart
                if (sessionData.cart && sessionData.cart.items?.length > 0) {
                  // Send abandoned cart notification
                  sendAbandonedCartNotification(sessionData);
                  cartsRecovered++;
                }
                
                // Delete expired session
                await redisClient.del(key);
                sessionsCleared++;
              }
            } catch (parseError) {
              // Invalid session data, delete it
              await redisClient.del(key);
              sessionsCleared++;
            }
          }
          
          await redisClient.disconnect();
        } catch (keysError) {
          console.log('Redis keys operation failed, skipping Redis cleanup:', keysError.message);
          await redisClient.disconnect();
        }
        
      } catch (redisError) {
        console.log('Redis not available for cleanup, skipping Redis session cleanup:', redisError.message);
      }
      
      // Clean up database sessions
      const UserSession = require('../models/UserSession');
      const dbResult = await UserSession.deleteMany({
        expires: { $lt: new Date() }
      });
      
      sessionsCleared += dbResult.deletedCount;
      
      // Reset daily limits that are stuck
      await resetStuckDailyLimits();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Session cleanup complete:`);
      console.log(`  - Sessions cleared: ${sessionsCleared}`);
      console.log(`  - Abandoned carts recovered: ${cartsRecovered}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('session_cleanup', {
        cleared: sessionsCleared,
        cartsRecovered,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Session cleanup failed:', error);
      await logJobError('session_cleanup', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// UPDATE MEMBER STATUSES
// Runs every hour
// ============================================
function scheduleMemberStatusUpdates() {
  return cron.schedule('0 * * * *', async () => {
    console.log('👤 [JOB] Updating member statuses...');
    const startTime = Date.now();
    
    try {
      let statusUpdates = 0;
      let onlineUpdates = 0;
      let inactiveMarked = 0;
      
      const now = new Date();
      
      // Update online status based on last activity
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      const thirtyMinutesAgo = new Date(now - 30 * 60 * 1000);
      
      // Mark members as online if active in last 5 minutes
      const onlineResult = await MemberAnalytics.updateMany(
        {
          'activity.lastActive': { $gte: fiveMinutesAgo },
          'activity.isOnline': false
        },
        {
          $set: { 
            'activity.isOnline': true,
            'activity.onlineStatusUpdated': now
          }
        }
      );
      onlineUpdates += onlineResult.modifiedCount;
      
      // Mark members as offline if inactive for 30+ minutes
      const offlineResult = await MemberAnalytics.updateMany(
        {
          'activity.lastActive': { $lt: thirtyMinutesAgo },
          'activity.isOnline': true
        },
        {
          $set: { 
            'activity.isOnline': false,
            'activity.onlineStatusUpdated': now
          }
        }
      );
      statusUpdates += offlineResult.modifiedCount;
      
      // Update inactive status for members with no activity in 60 days
      const sixtyDaysAgo = new Date(now - 60 * 24 * 60 * 60 * 1000);
      
      const inactiveResult = await MemberAnalytics.updateMany(
        {
          'activity.lastActive': { $lt: sixtyDaysAgo },
          'activity.status': { $ne: 'inactive' }
        },
        {
          $set: { 
            'activity.status': 'inactive',
            'activity.statusChangedAt': now
          }
        }
      );
      inactiveMarked = inactiveResult.modifiedCount;
      
      // Update member lifecycle stages
      await updateMemberLifecycleStages();
      
      // Clean up orphaned analytics records
      await cleanupOrphanedAnalytics();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Member status updates complete:`);
      console.log(`  - Online status updated: ${onlineUpdates}`);
      console.log(`  - Offline status updated: ${statusUpdates}`);
      console.log(`  - Marked as inactive: ${inactiveMarked}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('member_status_updates', {
        onlineUpdates,
        offlineUpdates: statusUpdates,
        inactiveMarked,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Member status updates failed:', error);
      await logJobError('member_status_updates', error);
    }
  }, {
    scheduled: true,
    timezone: "America/Chicago"
  });
}

// ============================================
// DATABASE OPTIMIZATION
// Runs daily at 4:00 AM
// ============================================
function scheduleDatabaseOptimization() {
  return cron.schedule('0 4 * * *', async () => {
    console.log('⚡ [JOB] Running database optimization...');
    const startTime = Date.now();
    
    try {
      let optimizations = 0;
      
      // 1. Clean up old notifications
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      const notificationResult = await Notification.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true
      });
      
      console.log(`  Deleted ${notificationResult.deletedCount} old read notifications`);
      optimizations++;
      
      // 2. Clean up expired password reset tokens
      const User = require('../models/User');
      await User.updateMany(
        {
          resetPasswordExpires: { $lt: new Date() }
        },
        {
          $unset: {
            resetPasswordToken: '',
            resetPasswordExpires: ''
          }
        }
      );
      optimizations++;
      
      // 3. Aggregate and store daily statistics
      await aggregateDailyStatistics();
      optimizations++;
      
      // 4. Clean up failed transactions older than 90 days
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      
      const transactionResult = await Transaction.deleteMany({
        status: 'failed',
        createdAt: { $lt: ninetyDaysAgo }
      });
      
      console.log(`  Deleted ${transactionResult.deletedCount} old failed transactions`);
      optimizations++;
      
      // 5. Rebuild indexes if needed
      await rebuildIndexesIfNeeded();
      optimizations++;
      
      // 6. Update creator rankings
      await updateCreatorRankings();
      optimizations++;
      
      // 7. Clean up empty creator sales activities
      const emptySalesResult = await CreatorSalesActivity.deleteMany({
        'metrics.allTime.totalInteractions': 0,
        createdAt: { $lt: thirtyDaysAgo }
      });
      
      console.log(`  Deleted ${emptySalesResult.deletedCount} empty sales activities`);
      optimizations++;
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [JOB] Database optimization complete:`);
      console.log(`  - Optimizations run: ${optimizations}`);
      console.log(`  - Duration: ${duration}s`);
      
      await logJobExecution('database_optimization', {
        optimizations,
        duration: parseFloat(duration)
      });
      
    } catch (error) {
      console.error('❌ [JOB] Database optimization failed:', error);
      await logJobError('database_optimization', error);
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
 * Calculate offer ROI
 */
function calculateOfferROI(offer) {
  const cost = offer.offer.discount.percentage ? 
    (offer.performance.totalRevenue * offer.offer.discount.percentage / 100) : 
    offer.offer.discount.fixedAmount * offer.redemption.totalRedemptions;
  
  const revenue = offer.performance.totalRevenue;
  
  if (cost === 0) return 0;
  return ((revenue - cost) / cost * 100).toFixed(2);
}

/**
 * Notify creator of offer expiration
 */
async function notifyOfferExpiration(offer) {
  const { sendNotification } = require('../services/notification.service');
  
  await sendNotification(offer.creator, {
    type: 'offer_expired',
    title: `Offer "${offer.offer.name}" has expired`,
    body: `Final results: ${offer.redemption.totalRedemptions} redemptions, ${offer.performance.totalRevenue} revenue`,
    data: {
      offerId: offer._id,
      performance: offer.performance
    }
  });
}

/**
 * Archive offer to separate collection
 */
async function archiveOffer(offer) {
  const ArchivedOffer = require('../models/ArchivedOffer');
  
  await ArchivedOffer.create({
    originalId: offer._id,
    creator: offer.creator,
    offerData: offer.toObject(),
    archivedAt: new Date()
  });
}

/**
 * Send abandoned cart notification
 */
async function sendAbandonedCartNotification(sessionData) {
  if (!sessionData.userId) return;
  
  const { sendNotification } = require('../services/notification.service');
  
  await sendNotification(sessionData.userId, {
    type: 'abandoned_cart',
    title: 'You left something behind!',
    body: `You have ${sessionData.cart.items.length} items in your cart. Complete your purchase and save 10%!`,
    data: {
      cartItems: sessionData.cart.items,
      discountCode: 'RETURN10'
    }
  });
}

/**
 * Reset stuck daily limits
 */
async function resetStuckDailyLimits() {
  try {
    const redis = require('redis');
    const redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      socket: {
        connectTimeout: 5000 // 5 second timeout
      }
    });
    
    // Add error handler
    redisClient.on('error', (err) => {
      console.log('Redis not available for daily limits cleanup:', err.message);
    });
    
    // Only proceed if Redis is available
    await redisClient.connect();
    
    // Get yesterday's date string
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayString = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
    
    // Delete all limit keys from yesterday
    const pattern = `limit:*:*:${yesterdayString}`;
    
    try {
      const keys = await redisClient.keys(pattern);
      
      if (keys.length > 0) {
        const numDeleted = await redisClient.del(keys);
        console.log(`  Cleared ${numDeleted} stuck daily limits`);
      }
    } catch (keysError) {
      console.log('Redis daily limits cleanup failed:', keysError.message);
    }
    
    await redisClient.disconnect();
    
  } catch (redisError) {
    console.log('Redis not available for daily limits cleanup, skipping:', redisError.message);
  }
}

/**
 * Update member lifecycle stages
 */
async function updateMemberLifecycleStages() {
  const stages = [
    { name: 'new', condition: { 'metadata.totalPurchases': 0 } },
    { name: 'activated', condition: { 'metadata.totalPurchases': { $gte: 1, $lt: 3 } } },
    { name: 'engaged', condition: { 'metadata.totalPurchases': { $gte: 3, $lt: 10 } } },
    { name: 'loyal', condition: { 'metadata.totalPurchases': { $gte: 10 } } }
  ];
  
  for (const stage of stages) {
    await MemberAnalytics.updateMany(
      {
        ...stage.condition,
        'metadata.lifecycleStage': { $ne: stage.name }
      },
      {
        $set: { 
          'metadata.lifecycleStage': stage.name,
          'metadata.stageUpdatedAt': new Date()
        }
      }
    );
  }
}

/**
 * Clean up orphaned analytics records
 */
async function cleanupOrphanedAnalytics() {
  const Member = require('../models/Member');
  
  // Find analytics records without corresponding member
  const analytics = await MemberAnalytics.find({}).select('member');
  const memberIds = analytics.map(a => a.member);
  
  const existingMembers = await Member.find({
    _id: { $in: memberIds }
  }).select('_id');
  
  const existingMemberIds = new Set(existingMembers.map(m => m._id.toString()));
  
  const orphanedAnalytics = analytics.filter(a => 
    !existingMemberIds.has(a.member.toString())
  );
  
  if (orphanedAnalytics.length > 0) {
    await MemberAnalytics.deleteMany({
      _id: { $in: orphanedAnalytics.map(a => a._id) }
    });
    
    console.log(`  Deleted ${orphanedAnalytics.length} orphaned analytics records`);
  }
}

/**
 * Aggregate daily statistics
 */
async function aggregateDailyStatistics() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Aggregate transaction statistics
  const transactionStats = await Transaction.aggregate([
    {
      $match: {
        createdAt: { $gte: yesterday, $lt: today },
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgTransactionValue: { $avg: '$amount' },
        uniqueMembers: { $addToSet: '$member' },
        uniqueCreators: { $addToSet: '$creator' }
      }
    }
  ]);
  
  // Store in AnalyticsEvent collection as daily stats
  const AnalyticsEvent = require('../models/AnalyticsEvent');
  
  if (transactionStats.length > 0) {
    await AnalyticsEvent.create({
      category: 'daily_statistics',
      action: 'transaction_summary',
      label: yesterday.toISOString().split('T')[0], // YYYY-MM-DD format
      value: transactionStats[0].totalRevenue,
      userId: new mongoose.Types.ObjectId(), // System generated
      userType: 'admin',
      metadata: {
        total: transactionStats[0].totalTransactions,
        revenue: transactionStats[0].totalRevenue,
        avgValue: transactionStats[0].avgTransactionValue,
        uniqueMembers: transactionStats[0].uniqueMembers.length,
        uniqueCreators: transactionStats[0].uniqueCreators.length,
        date: yesterday
      }
    });
  }
}

/**
 * Rebuild indexes if needed
 */
async function rebuildIndexesIfNeeded() {
  // Check index health
  const collections = [
    MemberAnalytics,
    MemberInteraction,
    Transaction,
    SpecialOffer
  ];
  
  for (const Model of collections) {
    try {
      const indexes = await Model.collection.getIndexes();
      const indexCount = Object.keys(indexes).length;
      
      if (indexCount < 2) { // Only has _id index
        console.log(`  Rebuilding indexes for ${Model.collection.name}...`);
        await Model.createIndexes();
      }
    } catch (error) {
      console.error(`  Error checking indexes for ${Model.collection.name}:`, error.message);
    }
  }
}

/**
 * Update creator rankings
 */
async function updateCreatorRankings() {
  // Calculate creator rankings based on last 30 days performance
  const rankings = await CreatorSalesActivity.aggregate([
    {
      $project: {
        creator: 1,
        score: {
          $add: [
            { $multiply: ['$metrics.last30Days.totalRevenue', 0.5] },
            { $multiply: ['$metrics.last30Days.totalConversions', 10] },
            { $multiply: ['$performance.overallConversionRate', 5] }
          ]
        }
      }
    },
    {
      $sort: { score: -1 }
    }
  ]);
  
  // Update rankings
  for (let i = 0; i < rankings.length; i++) {
    await CreatorSalesActivity.updateOne(
      { creator: rankings[i].creator },
      { 
        $set: { 
          'metrics.ranking': i + 1,
          'metrics.rankingScore': rankings[i].score,
          'metrics.rankingUpdated': new Date()
        }
      }
    );
  }
  
  console.log(`  Updated rankings for ${rankings.length} creators`);
}

/**
 * Log job execution
 */
async function logJobExecution(jobName, metrics) {
  console.log(`📝 Job logged: ${jobName}`, metrics);
  
  // In production, save to database:
  // const JobExecution = require('../models/JobExecution');
  // await JobExecution.create({
  //   jobName,
  //   executedAt: new Date(),
  //   metrics,
  //   status: 'success'
  // });
}

/**
 * Log job error
 */
async function logJobError(jobName, error) {
  console.error(`❌ Job error logged: ${jobName}`, error.message);
  
  // In production, save to database and alert admins:
  // const JobExecution = require('../models/JobExecution');
  // await JobExecution.create({
  //   jobName,
  //   executedAt: new Date(),
  //   error: error.message,
  //   stack: error.stack,
  //   status: 'failed'
  // });
}

module.exports = exports;