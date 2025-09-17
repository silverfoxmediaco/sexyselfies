// backend/src/routes/memberPrivacy.routes.js
// Routes for member privacy settings, visibility controls, and data access

const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  auditDataAccess,
  handleGDPRRequest,
} = require('../middleware/privacy.middleware');

// Import models
const MemberAnalytics = require('../models/MemberAnalytics');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const MemberInteraction = require('../models/MemberInteraction');

// Import privacy utilities
const {
  applyPrivacySettings,
  checkDataPermissions,
  hideSensitiveInfo,
  anonymizeSpendingData,
} = require('../utils/privacyFilters');

// Apply authentication to all routes
router.use(protect);
router.use(authorize('member'));

// ============================================
// PRIVACY SETTINGS MANAGEMENT
// ============================================

/**
 * @route   GET /api/member/privacy/settings
 * @desc    Get current privacy settings
 * @access  Member only
 */
router.get('/settings', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;

    // Get member analytics with privacy settings
    let analytics = await MemberAnalytics.findOne({ member: memberId });

    if (!analytics) {
      // Create default privacy settings
      analytics = new MemberAnalytics({
        member: memberId,
        privacy: {
          level: 'standard',
          discoverable: true,
          showSpending: false,
          allowBulkMessages: false,
          blockedCreators: [],
          interactionPreferences: {
            messages: true,
            pokes: true,
            likes: true,
            specialOffers: true,
          },
        },
      });
      await analytics.save();
    }

    res.json({
      success: true,
      data: {
        privacy: analytics.privacy,
        recommendations: getPrivacyRecommendations(analytics.privacy),
      },
    });
  } catch (error) {
    console.error('Get privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching privacy settings',
    });
  }
});

/**
 * @route   PUT /api/member/privacy/settings
 * @desc    Update privacy settings
 * @access  Member only
 */
router.put('/settings', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const updates = req.body;

    // Validate privacy level
    const validLevels = ['public', 'minimal', 'standard', 'strict', 'private'];
    if (updates.level && !validLevels.includes(updates.level)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid privacy level',
      });
    }

    // Update privacy settings
    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      {
        $set: {
          'privacy.level': updates.level,
          'privacy.discoverable': updates.discoverable,
          'privacy.showSpending': updates.showSpending,
          'privacy.allowBulkMessages': updates.allowBulkMessages,
          'privacy.updatedAt': new Date(),
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: {
        privacy: analytics.privacy,
        message: 'Privacy settings updated successfully',
      },
    });
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating privacy settings',
    });
  }
});

/**
 * @route   GET /api/member/privacy/levels
 * @desc    Get available privacy levels and their descriptions
 * @access  Member only
 */
router.get('/levels', async (req, res) => {
  res.json({
    success: true,
    data: {
      levels: [
        {
          value: 'public',
          name: 'Public',
          description:
            'Your profile is fully discoverable with basic info visible',
          features: [
            'Discoverable by all creators',
            'Basic spending tier visible',
            'Can receive all interaction types',
          ],
        },
        {
          value: 'minimal',
          name: 'Minimal Privacy',
          description: 'Limited visibility with essential protections',
          features: [
            'Discoverable by verified creators only',
            'Spending shown as ranges',
            'Activity patterns hidden',
          ],
        },
        {
          value: 'standard',
          name: 'Standard Privacy',
          description: 'Balanced privacy and discoverability',
          features: [
            'Selective discoverability',
            'Spending tier only',
            'Control over interaction types',
            'Bulk messages blocked',
          ],
          recommended: true,
        },
        {
          value: 'strict',
          name: 'Strict Privacy',
          description: 'High privacy with limited visibility',
          features: [
            'Limited discoverability',
            'All spending data hidden',
            'Minimal profile information',
            'Enhanced blocking controls',
          ],
        },
        {
          value: 'private',
          name: 'Private',
          description: 'Maximum privacy - not discoverable',
          features: [
            'Not discoverable',
            'All data protected',
            'Only direct interactions allowed',
            'Complete anonymization',
          ],
        },
      ],
    },
  });
});

// ============================================
// OPT-IN/OPT-OUT CONTROLS
// ============================================

/**
 * @route   POST /api/member/privacy/opt-out
 * @desc    Opt out of specific features
 * @access  Member only
 */
router.post('/opt-out', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { feature } = req.body;

    const validFeatures = [
      'discovery',
      'bulk_messages',
      'spending_visibility',
      'special_offers',
      'analytics_tracking',
      'recommendations',
    ];

    if (!validFeatures.includes(feature)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid feature',
      });
    }

    // Update opt-out settings
    const updateField = getOptOutField(feature);
    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      { $set: { [updateField]: false } },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        feature,
        status: 'opted_out',
        privacy: analytics.privacy,
      },
    });
  } catch (error) {
    console.error('Opt-out error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing opt-out request',
    });
  }
});

/**
 * @route   POST /api/member/privacy/opt-in
 * @desc    Opt in to specific features
 * @access  Member only
 */
router.post('/opt-in', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { feature } = req.body;

    // Update opt-in settings
    const updateField = getOptOutField(feature);
    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      { $set: { [updateField]: true } },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        feature,
        status: 'opted_in',
        privacy: analytics.privacy,
      },
    });
  } catch (error) {
    console.error('Opt-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing opt-in request',
    });
  }
});

// ============================================
// VISIBILITY CONTROLS
// ============================================

/**
 * @route   GET /api/member/privacy/visibility
 * @desc    Get current visibility settings
 * @access  Member only
 */
router.get('/visibility', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;

    const analytics = await MemberAnalytics.findOne({ member: memberId });

    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Privacy settings not found',
      });
    }

    // Check who can see the member
    const visibilityStatus = {
      discoverable: analytics.privacy.discoverable,
      visibleTo: analytics.privacy.discoverable
        ? analytics.privacy.level === 'public'
          ? 'all_creators'
          : 'verified_creators'
        : 'none',
      spendingVisible: analytics.privacy.showSpending,
      activityVisible:
        analytics.privacy.level !== 'strict' &&
        analytics.privacy.level !== 'private',
      profileCompleteness: calculateProfileCompleteness(analytics),
    };

    res.json({
      success: true,
      data: visibilityStatus,
    });
  } catch (error) {
    console.error('Get visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching visibility settings',
    });
  }
});

/**
 * @route   PUT /api/member/privacy/visibility
 * @desc    Update visibility settings
 * @access  Member only
 */
router.put('/visibility', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { discoverable, showSpending, showActivity, showPreferences } =
      req.body;

    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      {
        $set: {
          'privacy.discoverable': discoverable,
          'privacy.showSpending': showSpending,
          'privacy.showActivity': showActivity,
          'privacy.showPreferences': showPreferences,
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        visibility: {
          discoverable: analytics.privacy.discoverable,
          showSpending: analytics.privacy.showSpending,
          showActivity: analytics.privacy.showActivity,
          showPreferences: analytics.privacy.showPreferences,
        },
      },
    });
  } catch (error) {
    console.error('Update visibility error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating visibility settings',
    });
  }
});

// ============================================
// BLOCK LIST MANAGEMENT
// ============================================

/**
 * @route   GET /api/member/privacy/blocked
 * @desc    Get list of blocked creators
 * @access  Member only
 */
router.get('/blocked', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;

    const analytics = await MemberAnalytics.findOne({
      member: memberId,
    }).populate({
      path: 'privacy.blockedCreators',
      select: 'username profileImage createdAt',
    });

    if (!analytics) {
      return res.json({
        success: true,
        data: { blockedCreators: [] },
      });
    }

    res.json({
      success: true,
      data: {
        blockedCreators: analytics.privacy.blockedCreators,
        count: analytics.privacy.blockedCreators.length,
      },
    });
  } catch (error) {
    console.error('Get blocked list error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching blocked list',
    });
  }
});

/**
 * @route   POST /api/member/privacy/block
 * @desc    Block a creator
 * @access  Member only
 */
router.post('/block', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { creatorId, reason } = req.body;

    if (!creatorId) {
      return res.status(400).json({
        success: false,
        message: 'Creator ID is required',
      });
    }

    // Add to blocked list
    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      {
        $addToSet: { 'privacy.blockedCreators': creatorId },
        $push: {
          'privacy.blockHistory': {
            creator: creatorId,
            blockedAt: new Date(),
            reason,
          },
        },
      },
      { new: true, upsert: true }
    );

    // Also remove any existing interactions
    await MemberInteraction.updateMany(
      { member: memberId, creator: creatorId },
      { $set: { status: 'blocked' } }
    );

    res.json({
      success: true,
      data: {
        message: 'Creator blocked successfully',
        blockedCount: analytics.privacy.blockedCreators.length,
      },
    });
  } catch (error) {
    console.error('Block creator error:', error);
    res.status(500).json({
      success: false,
      message: 'Error blocking creator',
    });
  }
});

/**
 * @route   DELETE /api/member/privacy/block/:creatorId
 * @desc    Unblock a creator
 * @access  Member only
 */
router.delete('/block/:creatorId', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { creatorId } = req.params;

    // Remove from blocked list
    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      {
        $pull: { 'privacy.blockedCreators': creatorId },
        $push: {
          'privacy.unblockHistory': {
            creator: creatorId,
            unblockedAt: new Date(),
          },
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      data: {
        message: 'Creator unblocked successfully',
        blockedCount: analytics.privacy.blockedCreators.length,
      },
    });
  } catch (error) {
    console.error('Unblock creator error:', error);
    res.status(500).json({
      success: false,
      message: 'Error unblocking creator',
    });
  }
});

// ============================================
// INTERACTION PREFERENCES
// ============================================

/**
 * @route   GET /api/member/privacy/interactions
 * @desc    Get interaction preferences
 * @access  Member only
 */
router.get('/interactions', async (req, res) => {
  try {
    const memberId = req.user.memberId;

    const analytics = await MemberAnalytics.findOne({ member: memberId });

    if (!analytics) {
      return res.json({
        success: true,
        data: {
          preferences: {
            messages: true,
            pokes: true,
            likes: true,
            specialOffers: true,
          },
        },
      });
    }

    res.json({
      success: true,
      data: {
        preferences: analytics.privacy.interactionPreferences,
        limits: {
          dailyMessages: 100,
          dailyPokes: 50,
          dailyOffers: 10,
        },
      },
    });
  } catch (error) {
    console.error('Get interaction preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interaction preferences',
    });
  }
});

/**
 * @route   PUT /api/member/privacy/interactions
 * @desc    Update interaction preferences
 * @access  Member only
 */
router.put('/interactions', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const preferences = req.body;

    const analytics = await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      {
        $set: {
          'privacy.interactionPreferences': {
            messages: preferences.messages !== false,
            pokes: preferences.pokes !== false,
            likes: preferences.likes !== false,
            specialOffers: preferences.specialOffers !== false,
          },
        },
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      data: {
        preferences: analytics.privacy.interactionPreferences,
      },
    });
  } catch (error) {
    console.error('Update interaction preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating interaction preferences',
    });
  }
});

// ============================================
// DATA ACCESS REQUESTS (GDPR)
// ============================================

/**
 * @route   GET /api/member/privacy/data
 * @desc    Request copy of personal data (GDPR)
 * @access  Member only
 */
router.get('/data', handleGDPRRequest, auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { format = 'json' } = req.query;

    // Collect all member data
    const memberData = await collectMemberData(memberId);

    // Apply privacy filters to own data
    const sanitizedData = hideSensitiveInfo(memberData, {
      hidePayment: true,
      hideIds: false,
      requesterRole: 'self',
    });

    if (format === 'csv') {
      // Convert to CSV format
      // Implementation would use a CSV library
      return res.status(501).json({
        success: false,
        message: 'CSV export coming soon',
      });
    }

    res.json({
      success: true,
      data: {
        exportDate: new Date(),
        format,
        data: sanitizedData,
      },
    });
  } catch (error) {
    console.error('Data export error:', error);
    res.status(500).json({
      success: false,
      message: 'Error exporting data',
    });
  }
});

/**
 * @route   POST /api/member/privacy/data/delete
 * @desc    Request account deletion (GDPR)
 * @access  Member only
 */
router.post(
  '/data/delete',
  handleGDPRRequest,
  auditDataAccess,
  async (req, res) => {
    try {
      const memberId = req.user.memberId;
      const userId = req.user.id;
      const { confirmDelete, reason } = req.body;

      if (!confirmDelete) {
        return res.status(400).json({
          success: false,
          message: 'Please confirm deletion request',
        });
      }

      // Create deletion request (processed after 30 days)
      const DeletionRequest = require('../models/DeletionRequest');

      await DeletionRequest.create({
        userId,
        memberId,
        reason,
        requestedAt: new Date(),
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'pending',
      });

      // Send confirmation email
      // await sendDeletionConfirmationEmail(userId);

      res.json({
        success: true,
        data: {
          message:
            'Account deletion requested. Your account will be deleted in 30 days.',
          scheduledDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          canCancel: true,
        },
      });
    } catch (error) {
      console.error('Deletion request error:', error);
      res.status(500).json({
        success: false,
        message: 'Error processing deletion request',
      });
    }
  }
);

/**
 * @route   DELETE /api/member/privacy/data/delete
 * @desc    Cancel account deletion request
 * @access  Member only
 */
router.delete('/data/delete', auditDataAccess, async (req, res) => {
  try {
    const userId = req.user.id;

    const DeletionRequest = require('../models/DeletionRequest');

    const request = await DeletionRequest.findOneAndUpdate(
      { userId, status: 'pending' },
      {
        status: 'cancelled',
        cancelledAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'No pending deletion request found',
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Account deletion request cancelled successfully',
      },
    });
  } catch (error) {
    console.error('Cancel deletion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling deletion request',
    });
  }
});

/**
 * @route   POST /api/member/privacy/data/correct
 * @desc    Request data correction (GDPR)
 * @access  Member only
 */
router.post(
  '/data/correct',
  handleGDPRRequest,
  auditDataAccess,
  async (req, res) => {
    try {
      const memberId = req.user.memberId;
      const { corrections } = req.body;

      // Apply corrections to member profile
      const member = await Member.findByIdAndUpdate(
        memberId,
        { $set: corrections },
        { new: true, runValidators: true }
      );

      res.json({
        success: true,
        data: {
          message: 'Data corrections applied successfully',
          updated: Object.keys(corrections),
        },
      });
    } catch (error) {
      console.error('Data correction error:', error);
      res.status(500).json({
        success: false,
        message: 'Error correcting data',
      });
    }
  }
);

// ============================================
// PRIVACY REPORTS & ANALYTICS
// ============================================

/**
 * @route   GET /api/member/privacy/report
 * @desc    Get privacy report showing who accessed data
 * @access  Member only
 */
router.get('/report', auditDataAccess, async (req, res) => {
  try {
    const memberId = req.user.memberId;
    const { days = 30 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get interactions and profile views
    const interactions = await MemberInteraction.find({
      member: memberId,
      createdAt: { $gte: startDate },
    })
      .populate('creator', 'username profileImage')
      .sort('-createdAt')
      .limit(100);

    // Group by interaction type
    const report = {
      profileViews: interactions.filter(
        i => i.interactionType === 'profile_view'
      ),
      messages: interactions.filter(i => i.interactionType === 'message'),
      pokes: interactions.filter(i => i.interactionType === 'poke'),
      specialOffers: interactions.filter(
        i => i.interactionType === 'special_offer'
      ),
    };

    res.json({
      success: true,
      data: {
        period: `Last ${days} days`,
        report,
        summary: {
          totalInteractions: interactions.length,
          uniqueCreators: new Set(
            interactions.map(i => i.creator._id.toString())
          ).size,
          mostActiveCreator: getMostActiveCreator(interactions),
        },
      },
    });
  } catch (error) {
    console.error('Privacy report error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating privacy report',
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPrivacyRecommendations(privacy) {
  const recommendations = [];

  if (privacy.level === 'public') {
    recommendations.push({
      type: 'warning',
      message:
        'Your profile is fully public. Consider increasing privacy for better protection.',
    });
  }

  if (privacy.showSpending) {
    recommendations.push({
      type: 'info',
      message:
        'Your spending data is visible to creators. You can hide this in visibility settings.',
    });
  }

  if (privacy.allowBulkMessages) {
    recommendations.push({
      type: 'info',
      message:
        'You are receiving bulk messages. You can opt out in interaction preferences.',
    });
  }

  if (privacy.blockedCreators.length === 0) {
    recommendations.push({
      type: 'tip',
      message: 'You can block creators who make you uncomfortable.',
    });
  }

  return recommendations;
}

function getOptOutField(feature) {
  const fieldMap = {
    discovery: 'privacy.discoverable',
    bulk_messages: 'privacy.allowBulkMessages',
    spending_visibility: 'privacy.showSpending',
    special_offers: 'privacy.interactionPreferences.specialOffers',
    analytics_tracking: 'privacy.allowAnalytics',
    recommendations: 'privacy.allowRecommendations',
  };

  return fieldMap[feature] || null;
}

function calculateProfileCompleteness(analytics) {
  let completeness = 0;
  const checks = [
    analytics.member,
    analytics.preferences?.topCategories?.length > 0,
    analytics.privacy?.level,
    analytics.privacy?.interactionPreferences,
  ];

  checks.forEach(check => {
    if (check) completeness += 25;
  });

  return completeness;
}

async function collectMemberData(memberId) {
  // Collect all data related to member
  const data = {};

  // Basic profile
  data.profile = await Member.findById(memberId).populate('user', '-password');

  // Analytics
  data.analytics = await MemberAnalytics.findOne({ member: memberId });

  // Recent interactions
  data.interactions = await MemberInteraction.find({ member: memberId })
    .sort('-createdAt')
    .limit(100);

  // Transactions
  const Transaction = require('../models/Transaction');
  data.transactions = await Transaction.find({ member: memberId })
    .sort('-createdAt')
    .limit(100);

  return data;
}

function getMostActiveCreator(interactions) {
  if (interactions.length === 0) return null;

  const creatorCounts = {};
  interactions.forEach(i => {
    const creatorId = i.creator._id.toString();
    creatorCounts[creatorId] = (creatorCounts[creatorId] || 0) + 1;
  });

  const mostActiveId = Object.entries(creatorCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0];

  if (!mostActiveId) return null;

  const creator = interactions.find(
    i => i.creator._id.toString() === mostActiveId
  )?.creator;

  return {
    creator,
    interactionCount: creatorCounts[mostActiveId],
  };
}

module.exports = router;
