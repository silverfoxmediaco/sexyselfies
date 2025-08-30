const express = require('express');
const router = express.Router();

// Import controllers that exist
const creatorMessageController = require('../controllers/creator.message.controller');
const creatorEarningsController = require('../controllers/creator.earnings.controller');
const creatorAnalyticsController = require('../controllers/creator.analytics.controller');
const creatorProfileController = require('../controllers/creator.profile.controller');
const creatorContentController = require('../controllers/creator.content.controller');
const creatorConnectionController = require('../controllers/creator.connection.controller');
const notificationController = require('../controllers/notification.controller');

// Import middleware with error handling
let protect, authorize;
try {
  const auth = require('../middleware/auth.middleware');
  protect = auth.protect;
  authorize = auth.authorize;
} catch (e) {
  console.log('Warning: auth.middleware not found, using dummy middleware');
  protect = (req, res, next) => next();
  authorize = () => (req, res, next) => next();
}

// Import upload middleware with correct exports
let profileImageUpload, contentImagesUpload, contentVideoUpload;
try {
  const uploadMiddleware = require('../middleware/upload.middleware');
  profileImageUpload = uploadMiddleware.profileImageUpload;
  contentImagesUpload = uploadMiddleware.contentImagesUpload;
  contentVideoUpload = uploadMiddleware.contentVideoUpload;
} catch (e) {
  console.log('Warning: upload.middleware not loading properly');
  // Create dummy middleware functions
  profileImageUpload = (req, res, next) => next();
  contentImagesUpload = (req, res, next) => next();
  contentVideoUpload = (req, res, next) => next();
}

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// Health check for creators route
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Creator routes are working'
  });
});

// ==========================================
// AUTHENTICATED ROUTES (Creator must be logged in)
// ==========================================

// All routes below require authentication
router.use(protect);
router.use(authorize('creator'));

// ==========================================
// PROFILE MANAGEMENT
// ==========================================

// Get creator profile
if (creatorProfileController.getProfile) {
  router.get('/profile', protect, creatorProfileController.getProfile);
} else {
  router.get('/profile', protect, (req, res) => {
    res.status(501).json({ message: 'Profile routes coming soon' });
  });
}

// Update creator profile
if (creatorProfileController.updateProfile) {
  router.put('/profile', protect, creatorProfileController.updateProfile);
} else {
  router.put('/profile', protect, (req, res) => {
    res.status(501).json({ message: 'Profile update coming soon' });
  });
}

// Profile image upload with correct middleware
router.post('/profile/avatar', profileImageUpload, (req, res) => {
  res.status(501).json({ message: 'Avatar upload coming soon' });
});

// Cover image upload (using same profile image middleware)
router.post('/profile/cover', profileImageUpload, (req, res) => {
  res.status(501).json({ message: 'Cover upload coming soon' });
});

router.put('/profile/settings', (req, res) => {
  res.status(501).json({ message: 'Settings update coming soon' });
});

router.put('/profile/privacy', (req, res) => {
  res.status(501).json({ message: 'Privacy settings coming soon' });
});

// ==========================================
// CONTENT MANAGEMENT
// ==========================================

// Get creator content
if (creatorContentController.getContent) {
  router.get('/content', creatorContentController.getContent);
} else {
  router.get('/content', (req, res) => {
    res.status(501).json({ message: 'Content routes coming soon' });
  });
}

router.get('/content/:contentId', (req, res) => {
  res.status(501).json({ message: 'Content details coming soon' });
});

// Content upload with correct middleware for images
if (creatorContentController.uploadContent) {
  router.post('/content/images', contentImagesUpload, creatorContentController.uploadContent);
} else {
  router.post('/content/images', contentImagesUpload, (req, res) => {
    res.status(501).json({ message: 'Content image upload coming soon' });
  });
}

// Content upload with correct middleware for video
router.post('/content/video', contentVideoUpload, (req, res) => {
  res.status(501).json({ message: 'Content video upload coming soon' });
});

router.put('/content/:contentId', (req, res) => {
  res.status(501).json({ message: 'Content update coming soon' });
});

router.delete('/content/:contentId', (req, res) => {
  res.status(501).json({ message: 'Content deletion coming soon' });
});

router.get('/content/:contentId/analytics', (req, res) => {
  res.status(501).json({ message: 'Content analytics coming soon' });
});

// ==========================================
// MESSAGING SYSTEM
// ==========================================

// Get all message threads
if (creatorMessageController.getMessageThreads) {
  router.get('/messages', creatorMessageController.getMessageThreads);
}

// Get messages for specific connection
if (creatorMessageController.getMessages) {
  router.get('/messages/:connectionId', creatorMessageController.getMessages);
}

// Send message
if (creatorMessageController.sendMessage) {
  router.post('/messages', creatorMessageController.sendMessage);
}

// Send bulk message
if (creatorMessageController.sendBulkMessage) {
  router.post('/messages/bulk', creatorMessageController.sendBulkMessage);
}

// Mark message as read
if (creatorMessageController.markAsRead) {
  router.put('/messages/:messageId/read', creatorMessageController.markAsRead);
}

// Delete message
if (creatorMessageController.deleteMessage) {
  router.delete('/messages/:messageId', creatorMessageController.deleteMessage);
}

// Upload message media (can be image or video)
if (creatorMessageController.uploadMessageMedia) {
  // For messages, we'll use the content image upload middleware
  router.post('/messages/media', contentImagesUpload, creatorMessageController.uploadMessageMedia);
}

// Get message analytics
if (creatorMessageController.getMessageAnalytics) {
  router.get('/messages/analytics', creatorMessageController.getMessageAnalytics);
}

// ==========================================
// CONNECTION MANAGEMENT
// ==========================================

// Get connection stack
if (creatorConnectionController.getConnectionStack) {
  router.get('/connections/stack', creatorConnectionController.getConnectionStack);
} else {
  router.get('/connections/stack', (req, res) => {
    res.status(501).json({ message: 'Connection stack coming soon' });
  });
}

router.post('/connections/swipe', (req, res) => {
  res.status(501).json({ message: 'Swipe functionality coming soon' });
});

// Get creator connections
if (creatorConnectionController.getConnections) {
  router.get('/connections', creatorConnectionController.getConnections);
} else {
  router.get('/connections', (req, res) => {
    res.status(501).json({ message: 'Connections list coming soon' });
  });
}

router.get('/connections/:connectionId', (req, res) => {
  res.status(501).json({ message: 'Connection details coming soon' });
});

router.delete('/connections/:connectionId', (req, res) => {
  res.status(501).json({ message: 'Disconnect functionality coming soon' });
});

router.post('/connections/:connectionId/block', (req, res) => {
  res.status(501).json({ message: 'Block functionality coming soon' });
});

router.get('/connections/blocked', (req, res) => {
  res.status(501).json({ message: 'Blocked list coming soon' });
});

router.delete('/connections/blocked/:memberId', (req, res) => {
  res.status(501).json({ message: 'Unblock functionality coming soon' });
});

// ==========================================
// EARNINGS & PAYOUTS
// ==========================================

// Get earnings dashboard
if (creatorEarningsController.getEarningsDashboard) {
  router.get('/earnings', creatorEarningsController.getEarningsDashboard);
}

// Get transaction history
if (creatorEarningsController.getTransactions) {
  router.get('/earnings/transactions', creatorEarningsController.getTransactions);
}

// Request payout
if (creatorEarningsController.requestPayout) {
  router.post('/earnings/payout', creatorEarningsController.requestPayout);
}

// Get payout history
if (creatorEarningsController.getPayoutHistory) {
  router.get('/earnings/payouts', creatorEarningsController.getPayoutHistory);
}

// Get tax documents
if (creatorEarningsController.getTaxDocuments) {
  router.get('/earnings/tax', creatorEarningsController.getTaxDocuments);
}

// Update financial goals
if (creatorEarningsController.updateFinancialGoals) {
  router.put('/earnings/goals', creatorEarningsController.updateFinancialGoals);
}

// Get earnings insights
if (creatorEarningsController.getEarningsInsights) {
  router.get('/earnings/insights', creatorEarningsController.getEarningsInsights);
}

// ==========================================
// ANALYTICS
// ==========================================

// Get comprehensive analytics dashboard
if (creatorAnalyticsController.getAnalyticsDashboard) {
  router.get('/analytics', creatorAnalyticsController.getAnalyticsDashboard);
}

// Get real-time analytics
if (creatorAnalyticsController.getRealTimeAnalytics) {
  router.get('/analytics/realtime', creatorAnalyticsController.getRealTimeAnalytics);
}

// Get traffic analytics
if (creatorAnalyticsController.getTrafficAnalytics) {
  router.get('/analytics/traffic', creatorAnalyticsController.getTrafficAnalytics);
}

// Get funnel analytics
if (creatorAnalyticsController.getFunnelAnalytics) {
  router.get('/analytics/funnel', creatorAnalyticsController.getFunnelAnalytics);
}

// Get heatmap data
if (creatorAnalyticsController.getHeatmapData) {
  router.get('/analytics/heatmap', creatorAnalyticsController.getHeatmapData);
}

// Get competitor analysis
if (creatorAnalyticsController.getCompetitorAnalysis) {
  router.get('/analytics/competitors', creatorAnalyticsController.getCompetitorAnalysis);
}

// Get A/B test results
if (creatorAnalyticsController.getABTestResults) {
  router.get('/analytics/experiments', creatorAnalyticsController.getABTestResults);
}

// Create new A/B test
if (creatorAnalyticsController.createABTest) {
  router.post('/analytics/experiments', creatorAnalyticsController.createABTest);
}

// Get predictive analytics
if (creatorAnalyticsController.getPredictiveAnalytics) {
  router.get('/analytics/predictions', creatorAnalyticsController.getPredictiveAnalytics);
}

// Export analytics data
if (creatorAnalyticsController.exportAnalytics) {
  router.get('/analytics/export', creatorAnalyticsController.exportAnalytics);
}

// ==========================================
// NOTIFICATIONS
// ==========================================

// Get creator notifications
if (notificationController.getCreatorNotifications) {
  router.get('/notifications', notificationController.getCreatorNotifications);
} else {
  router.get('/notifications', (req, res) => {
    res.status(501).json({ message: 'Notifications coming soon' });
  });
}

router.put('/notifications/:notificationId/read', (req, res) => {
  res.status(501).json({ message: 'Mark notification as read coming soon' });
});

router.put('/notifications/preferences', (req, res) => {
  res.status(501).json({ message: 'Notification preferences coming soon' });
});

// ==========================================
// SEARCH & BROWSE
// ==========================================

// Search connections
router.get('/search/connections', (req, res) => {
  res.status(501).json({ message: 'Search connections coming soon' });
});

// Browse trending creators
router.get('/trending', (req, res) => {
  res.status(501).json({ message: 'Trending creators coming soon' });
});

// Get recommendations
router.get('/recommendations', (req, res) => {
  res.status(501).json({ message: 'Recommendations coming soon' });
});

module.exports = router;