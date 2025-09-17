// backend/src/jobs/index.js
// Main jobs initialization file

const cleanupJobs = require('./cleanup.job');
const memberAnalyticsJobs = require('./memberAnalytics.job');
const salesDigestJobs = require('./salesDigest.job');

/**
 * Initialize all scheduled jobs
 */
exports.initializeScheduledJobs = () => {
  console.log('🚀 Initializing all scheduled jobs...');

  try {
    // Initialize cleanup jobs
    cleanupJobs.initializeJobs();

    // Initialize member analytics jobs
    memberAnalyticsJobs.initializeJobs();

    // Initialize sales digest jobs
    salesDigestJobs.initializeJobs();

    console.log('✅ All scheduled jobs initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing jobs:', error);
    throw error;
  }
};

/**
 * Stop all scheduled jobs
 */
exports.stopAllJobs = () => {
  console.log('🛑 Stopping all scheduled jobs...');

  try {
    cleanupJobs.stopJobs();
    memberAnalyticsJobs.stopJobs();
    salesDigestJobs.stopJobs();

    console.log('✅ All scheduled jobs stopped');
  } catch (error) {
    console.error('❌ Error stopping jobs:', error);
  }
};
