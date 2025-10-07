const express = require('express');
const router = express.Router();

// Import controllers that exist
const creatorMessageController = require('../controllers/creator.message.controller');
const creatorEarningsController = require('../controllers/creator.earnings.controller');
const creatorAnalyticsController = require('../controllers/creator.analytics.controller');
const creatorProfileController = require('../controllers/creator.profile.controller');
const creatorContentController = require('../controllers/creator.content.controller');
const creatorConnectionController = require('../controllers/creator.connection.controller');
const creatorMembersController = require('../controllers/creator.members.controller');
const notificationController = require('../controllers/notification.controller');
const uploadController = require('../controllers/upload.controller');
const giftController = require('../controllers/gift.controller');

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
let profileImageUpload,
  contentImagesUpload,
  contentVideoUpload,
  contentWithThumbnailUpload;
try {
  const uploadMiddleware = require('../middleware/upload.middleware');
  profileImageUpload = uploadMiddleware.profileImageUpload;
  contentImagesUpload = uploadMiddleware.contentImagesUpload;
  contentVideoUpload = uploadMiddleware.contentVideoUpload;
  contentWithThumbnailUpload = uploadMiddleware.contentWithThumbnailUpload;
} catch (e) {
  console.log('Warning: upload.middleware not loading properly');
  // Create dummy middleware functions
  profileImageUpload = (req, res, next) => next();
  contentImagesUpload = (req, res, next) => next();
  contentVideoUpload = (req, res, next) => next();
  contentWithThumbnailUpload = (req, res, next) => next();
}

// ==========================================
// PUBLIC ROUTES (No authentication required)
// ==========================================

// Health check for creators route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Creator routes are working',
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
  router.get('/profile', creatorProfileController.getProfile);
} else {
  router.get('/profile', (req, res) => {
    res.status(501).json({ message: 'Profile routes coming soon' });
  });
}

// Update creator profile
if (creatorProfileController.updateProfile) {
  router.put('/profile', creatorProfileController.updateProfile);
} else {
  router.put('/profile', (req, res) => {
    res.status(501).json({ message: 'Profile update coming soon' });
  });
}

// Profile image upload with correct middleware
router.post('/profile/avatar', profileImageUpload, (req, res) => {
  res.status(501).json({ message: 'Avatar upload coming soon' });
});

// Profile photo upload - FIXED: removed duplicate 'protect' middleware
router.post(
  '/profile/photo',
  profileImageUpload,
  creatorProfileController.updateProfilePhoto
);

// Cover image upload
router.post('/profile/cover', profileImageUpload, creatorProfileController.updateCoverImage);

// Combined profile images upload (profile + cover)
router.post('/profile/images', profileImageUpload, creatorProfileController.updateProfileImages);


router.put('/profile/settings', (req, res) => {
  res.status(501).json({ message: 'Settings update coming soon' });
});

router.put('/profile/privacy', (req, res) => {
  res.status(501).json({ message: 'Privacy settings coming soon' });
});

// Profile setup endpoint - Initial profile creation with images
router.post(
  '/profile/setup',
  profileImageUpload,
  creatorProfileController.setupProfile
);

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
  router.post(
    '/content/images',
    contentImagesUpload,
    creatorContentController.uploadContent
  );
} else {
  router.post('/content/images', contentImagesUpload, (req, res) => {
    res.status(501).json({ message: 'Content image upload coming soon' });
  });
}

// Add the route that frontend expects - using upload controller with custom thumbnail support
router.post(
  '/content/upload',
  contentWithThumbnailUpload,
  uploadController.uploadContent
);

// Content upload with correct middleware for video
router.post('/content/video', contentVideoUpload, (req, res) => {
  res.status(501).json({ message: 'Content video upload coming soon' });
});

// Update content
if (creatorContentController.updateContent) {
  router.put('/content/:contentId', creatorContentController.updateContent);
} else {
  router.put('/content/:contentId', (req, res) => {
    res.status(501).json({ message: 'Content update coming soon' });
  });
}

// Delete content
if (creatorContentController.deleteContent) {
  router.delete('/content/:contentId', creatorContentController.deleteContent);
} else {
  router.delete('/content/:contentId', (req, res) => {
    res.status(501).json({ message: 'Content deletion coming soon' });
  });
}

// Update content pricing
if (creatorContentController.updateContentPricing) {
  router.patch(
    '/content/:contentId/price',
    creatorContentController.updateContentPricing
  );
} else {
  router.patch('/content/:contentId/price', (req, res) => {
    res.status(501).json({ message: 'Price update coming soon' });
  });
}

// Content analytics
if (creatorContentController.getContentAnalytics) {
  router.get(
    '/content/:contentId/analytics',
    creatorContentController.getContentAnalytics
  );
} else {
  router.get('/content/:contentId/analytics', (req, res) => {
    res.status(501).json({ message: 'Content analytics coming soon' });
  });
}

// ==========================================
// GIFT SYSTEM
// ==========================================

// Get creator's content library available for gifting
router.get('/content/giftable', protect, authorize('creator'), giftController.getCreatorContentLibrary);

// Get gift analytics
router.get('/gifts/analytics', protect, authorize('creator'), (req, res, next) => {
  if (giftController.getGiftAnalytics) {
    return giftController.getGiftAnalytics(req, res, next);
  } else {
    return res.status(501).json({ error: 'Gift analytics not available' });
  }
});

// ==========================================
// MESSAGING SYSTEM
// ==========================================

// Get all message threads
if (creatorMessageController.getMessageThreads) {
  router.get('/messages', creatorMessageController.getMessageThreads);
}

// IMPORTANT: Specific routes must come before parameterized routes

// Get message analytics (MUST be before /messages/:connectionId)
if (creatorMessageController.getMessageAnalytics) {
  router.get(
    '/messages/analytics',
    creatorMessageController.getMessageAnalytics
  );
}

// Send bulk message (MUST be before /messages/:connectionId)
if (creatorMessageController.sendBulkMessage) {
  router.post('/messages/bulk', creatorMessageController.sendBulkMessage);
}

// Upload message media (MUST be before /messages/:connectionId)
if (creatorMessageController.uploadMessageMedia) {
  // For messages, we'll use the content image upload middleware
  router.post(
    '/messages/media',
    contentImagesUpload,
    creatorMessageController.uploadMessageMedia
  );
}

// Get messages for specific connection (parameterized route - must come after specific routes)
if (creatorMessageController.getMessages) {
  router.get('/messages/:connectionId', creatorMessageController.getMessages);
}

// Send message
router.post('/messages', protect, authorize('creator'), (req, res, next) => {
  if (creatorMessageController.sendMessage) {
    return creatorMessageController.sendMessage(req, res, next);
  } else {
    return res.status(501).json({ error: 'Send message functionality not available' });
  }
});

// Mark message as read
if (creatorMessageController.markAsRead) {
  router.put('/messages/:messageId/read', creatorMessageController.markAsRead);
}

// Delete message
if (creatorMessageController.deleteMessage) {
  router.delete('/messages/:messageId', creatorMessageController.deleteMessage);
}

// Get message stats
if (creatorMessageController.getMessageStats) {
  router.get('/messages/stats', protect, authorize('creator'), creatorMessageController.getMessageStats);
}

// ==========================================
// CONNECTION MANAGEMENT
// ==========================================

// Get connection stack
if (creatorConnectionController.getConnectionStack) {
  router.get(
    '/connections/stack',
    creatorConnectionController.getConnectionStack
  );
} else {
  router.get('/connections/stack', (req, res) => {
    res.status(501).json({ message: 'Connection stack coming soon' });
  });
}

router.post('/connections/swipe', (req, res) => {
  res.status(501).json({ message: 'Swipe functionality coming soon' });
});

// Find or create connection for messaging
if (creatorConnectionController.findOrCreateConnection) {
  router.post('/connections/find-or-create', protect, authorize('creator'), creatorConnectionController.findOrCreateConnection);
} else {
  router.post('/connections/find-or-create', (req, res) => {
    res.status(501).json({ message: 'Find or create connection not available' });
  });
}

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
  router.get(
    '/earnings/transactions',
    creatorEarningsController.getTransactions
  );
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
  router.get(
    '/earnings/insights',
    creatorEarningsController.getEarningsInsights
  );
}

// ==========================================
// ANALYTICS
// ==========================================

// Get comprehensive analytics dashboard
if (creatorAnalyticsController.getAnalyticsDashboard) {
  router.get('/analytics', creatorAnalyticsController.getAnalyticsDashboard);
}

// Get content analytics - added missing route
if (creatorAnalyticsController.getContentAnalytics) {
  router.get(
    '/analytics/content',
    creatorAnalyticsController.getContentAnalytics
  );
} else {
  router.get('/analytics/content', (req, res) => {
    res.status(501).json({ message: 'Content analytics coming soon' });
  });
}

// Get real-time analytics
if (creatorAnalyticsController.getRealTimeAnalytics) {
  router.get(
    '/analytics/realtime',
    creatorAnalyticsController.getRealTimeAnalytics
  );
}

// Get traffic analytics
if (creatorAnalyticsController.getTrafficAnalytics) {
  router.get(
    '/analytics/traffic',
    creatorAnalyticsController.getTrafficAnalytics
  );
}

// Get funnel analytics
if (creatorAnalyticsController.getFunnelAnalytics) {
  router.get(
    '/analytics/funnel',
    creatorAnalyticsController.getFunnelAnalytics
  );
}

// Get heatmap data
if (creatorAnalyticsController.getHeatmapData) {
  router.get('/analytics/heatmap', creatorAnalyticsController.getHeatmapData);
}

// Get competitor analysis
if (creatorAnalyticsController.getCompetitorAnalysis) {
  router.get(
    '/analytics/competitors',
    creatorAnalyticsController.getCompetitorAnalysis
  );
}

// Get A/B test results
if (creatorAnalyticsController.getABTestResults) {
  router.get(
    '/analytics/experiments',
    creatorAnalyticsController.getABTestResults
  );
}

// Create new A/B test
if (creatorAnalyticsController.createABTest) {
  router.post(
    '/analytics/experiments',
    creatorAnalyticsController.createABTest
  );
}

// Get predictive analytics
if (creatorAnalyticsController.getPredictiveAnalytics) {
  router.get(
    '/analytics/predictions',
    creatorAnalyticsController.getPredictiveAnalytics
  );
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
// MEMBER DISCOVERY & MANAGEMENT
// ==========================================

// Discover high-value members for active sales
router.get('/members/discover', creatorMembersController.discoverMembers);

// OLD IMPLEMENTATION - REPLACED WITH CONTROLLER
/*
router.get('/members/discover-old', async (req, res) => {
  try {
    // Import models (require here to avoid circular dependency)
    const Member = require('../models/Member');
    const MemberProfile = require('../models/MemberProfile');
    const Creator = require('../models/Creator');
    const User = require('../models/User');

    // Get the requesting creator's information and preferences
    const creatorId = req.user.id; // Assuming auth middleware provides user ID
    const creator = await Creator.findOne({ user: creatorId }).populate(
      'user',
      'email'
    );

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    console.log(
      `🎯 Creator ${creator.username || creator.displayName} browsing members`
    );
    console.log(
      `📋 Creator browsing all available members (no preference filtering)`
    );

    // Helper function to check compatibility
    const isCompatible = (member, creator) => {
      // Creators want maximum exposure - no filtering by creator preferences
      // Only check if member is active and has completed profile
      return member.profileComplete && member.user?.isActive;
    };

    // Get all members first, with preference filtering
    const allMembers = await Member.find({ profileComplete: true }) // Only show completed profiles
      .populate('user', 'email lastLogin createdAt isActive')
      .sort({ lastActive: -1 })
      .limit(50); // Get more members

    // Filter members based on compatibility
    const compatibleMembers = allMembers.filter(member =>
      isCompatible(member, creator)
    );

    console.log(
      `📊 Found ${allMembers.length} total members, ${compatibleMembers.length} compatible members`
    );

    if (compatibleMembers.length === 0) {
      return res.json({
        success: true,
        members: [],
        total: 0,
        message: 'No compatible members found based on preferences',
        filters: {
          spendingTiers: ['whale', 'high', 'medium', 'low', 'new'],
          activityLevels: ['very-active', 'active', 'moderate', 'inactive'],
          timeframes: ['today', 'week', 'month', 'all'],
        },
      });
    }

    // Get member profiles for compatible members only
    const compatibleMemberIds = compatibleMembers.map(m => m._id);
    const memberProfiles = await MemberProfile.find()
      .populate('member')
      .sort({ 'spending.totalSpent': -1 });

    // Filter profiles to only include compatible members
    const compatibleProfiles = memberProfiles.filter(
      profile =>
        profile.member &&
        compatibleMemberIds.some(id => id.equals(profile.member._id))
    );

    // Create a map of member profiles by member ID for quick lookup
    const profileMap = new Map();
    compatibleProfiles.forEach(profile => {
      if (profile.member && profile.member._id) {
        profileMap.set(profile.member._id.toString(), profile);
      }
    });

    // Transform compatible members, using profile data when available
    const members = compatibleMembers.map(member => {
      const profile = profileMap.get(member._id.toString());
      const user = member.user;

      if (profile) {
        // Member has a profile - use rich data
        return {
          id: member._id,
          username:
            member.username || `Member_${member._id.toString().slice(-4)}`,
          isOnline: false, // Would need real-time tracking for this
          lastActive: member.lastActive || user?.lastLogin || new Date(),
          joinDate: user?.createdAt || new Date(),
          spendingTier: profile.spending.tier,
          stats: {
            totalSpent: profile.spending.totalSpent,
            last30DaySpend: profile.spending.last30DaySpend,
            averagePurchase: profile.spending.averagePurchase,
            contentPurchases: profile.activity.contentPurchases,
            messagesExchanged: profile.activity.messagesExchanged,
            tipsGiven: profile.activity.tipsGiven,
          },
          activity: {
            lastPurchase: profile.spending.lastPurchaseDate || new Date(),
            purchaseFrequency: profile.spending.purchaseFrequency,
            engagementLevel: profile.activity.engagementLevel,
            hasSubscribed: profile.subscription.hasSubscribed,
            subscriptionTier: profile.subscription.subscriptionTier,
          },
          badges: profile.badges || [],
        };
      } else {
        // Member has no profile - use basic data
        return {
          id: member._id,
          username:
            member.username || `Member_${member._id.toString().slice(-4)}`,
          isOnline: false,
          lastActive: member.lastActive || user?.lastLogin || new Date(),
          joinDate: user?.createdAt || new Date(),
          spendingTier: 'new', // Default for members without profiles
          stats: {
            totalSpent: 0,
            last30DaySpend: 0,
            averagePurchase: 0,
            contentPurchases: member.purchasedContent?.length || 0,
            messagesExchanged: 0,
            tipsGiven: 0,
          },
          activity: {
            lastPurchase:
              member.purchasedContent && member.purchasedContent.length > 0
                ? member.purchasedContent[member.purchasedContent.length - 1]
                    .purchaseDate
                : null,
            purchaseFrequency: 'inactive',
            engagementLevel: 'inactive',
            hasSubscribed: false,
            subscriptionTier: null,
          },
          badges: ['newcomer'],
        };
      }
    });

    // Sort members: those with profiles (by spending) first, then basic members by activity
    members.sort((a, b) => {
      // Prioritize members with spending data
      if (a.stats.totalSpent > 0 && b.stats.totalSpent === 0) return -1;
      if (a.stats.totalSpent === 0 && b.stats.totalSpent > 0) return 1;

      // Both have spending data - sort by total spent
      if (a.stats.totalSpent > 0 && b.stats.totalSpent > 0) {
        return b.stats.totalSpent - a.stats.totalSpent;
      }

      // Both have no spending - sort by last active
      return new Date(b.lastActive) - new Date(a.lastActive);
    });

    res.json({
      success: true,
      members: members,
      total: members.length,
      filters: {
        spendingTiers: ['whale', 'high', 'medium', 'low', 'new'],
        activityLevels: ['very-active', 'active', 'moderate', 'inactive'],
        timeframes: ['today', 'week', 'month', 'all'],
      },
    });
  } catch (error) {
    console.error('Error fetching members for discovery:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load members',
      error: error.message,
    });
  }
}); // END OF OLD IMPLEMENTATION
*/

// Search members with filters
router.post('/members/search', (req, res) => {
  res.status(501).json({ message: 'Member search coming soon' });
});

// Get specific member profile for creators
router.get('/members/profile/:memberId', creatorMembersController.getMemberProfile);

// Send message to member
router.post('/members/:memberId/message', (req, res) => {
  res.status(501).json({ message: 'Send member message coming soon' });
});

// Send special offer to member
router.post('/members/:memberId/special-offer', (req, res) => {
  res.status(501).json({ message: 'Special offers coming soon' });
});

// Get sales dashboard
router.get('/sales/dashboard', (req, res) => {
  res.status(501).json({ message: 'Sales dashboard coming soon' });
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
