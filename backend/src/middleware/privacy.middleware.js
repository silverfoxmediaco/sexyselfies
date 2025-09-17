// backend/src/middleware/privacy.middleware.js
// Middleware for enforcing privacy settings and data protection

const MemberAnalytics = require('../models/MemberAnalytics');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const MemberInteraction = require('../models/MemberInteraction');

// ============================================
// MEMBER DATA PRIVACY
// ============================================

/**
 * Anonymize member data based on privacy settings
 */
exports.anonymizeMemberData = async (req, res, next) => {
  try {
    // Check if response contains member data
    const originalJson = res.json;

    res.json = function (data) {
      if (data && data.data) {
        // Recursively anonymize member data
        data.data = anonymizeData(data.data, req.user.role);
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Anonymize member data error:', error);
    next();
  }
};

/**
 * Check if member has opted in for discovery
 */
exports.checkMemberOptIn = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    const creatorId = req.user.id;

    if (!memberId) {
      return next();
    }

    // Get member's privacy settings
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });

    if (!memberAnalytics) {
      return res.status(404).json({
        success: false,
        message: 'Member not found',
      });
    }

    // Check if member is discoverable
    if (!memberAnalytics.privacy.discoverable) {
      return res.status(403).json({
        success: false,
        message: 'This member has opted out of discovery',
        code: 'MEMBER_NOT_DISCOVERABLE',
      });
    }

    // Check if member has blocked this creator
    if (memberAnalytics.privacy.blockedCreators.includes(creatorId)) {
      return res.status(403).json({
        success: false,
        message: 'You cannot interact with this member',
        code: 'CREATOR_BLOCKED',
      });
    }

    // Check interaction preferences
    const interactionType = getInteractionType(req.route.path);

    if (interactionType && memberAnalytics.privacy.interactionPreferences) {
      const allowed =
        memberAnalytics.privacy.interactionPreferences[interactionType];

      if (allowed === false) {
        return res.status(403).json({
          success: false,
          message: `Member does not accept ${interactionType} interactions`,
          code: 'INTERACTION_NOT_ALLOWED',
        });
      }
    }

    // Attach privacy info to request
    req.memberPrivacy = {
      discoverable: memberAnalytics.privacy.discoverable,
      showSpending: memberAnalytics.privacy.showSpending,
      allowBulkMessages: memberAnalytics.privacy.allowBulkMessages,
      interactionPreferences: memberAnalytics.privacy.interactionPreferences,
    };

    next();
  } catch (error) {
    console.error('Check member opt-in error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking member privacy settings',
    });
  }
};

/**
 * Respect block list
 */
exports.respectBlockList = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params || req.body;

    if (!memberId) {
      return next();
    }

    // Check if creator is blocked by member
    const memberAnalytics = await MemberAnalytics.findOne({
      member: memberId,
      'privacy.blockedCreators': creatorId,
    });

    if (memberAnalytics) {
      return res.status(403).json({
        success: false,
        message: 'You are blocked by this member',
        code: 'BLOCKED_BY_MEMBER',
      });
    }

    // Check if member is blocked by creator
    const creator = await Creator.findById(creatorId);

    if (creator.blockedMembers && creator.blockedMembers.includes(memberId)) {
      return res.status(403).json({
        success: false,
        message: 'You have blocked this member',
        code: 'MEMBER_BLOCKED',
      });
    }

    next();
  } catch (error) {
    console.error('Respect block list error:', error);
    next();
  }
};

/**
 * Data visibility rules
 */
exports.dataVisibilityRules = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const creatorId = req.user.id;

    // Define visibility rules by role
    const visibilityRules = {
      creator: {
        canSeeExactSpending: false,
        canSeeSpendingTier: true,
        canSeePersonalInfo: false,
        canSeeEmail: false,
        canSeePaymentMethods: false,
        canSeeFullHistory: false,
      },
      admin: {
        canSeeExactSpending: true,
        canSeeSpendingTier: true,
        canSeePersonalInfo: true,
        canSeeEmail: true,
        canSeePaymentMethods: false,
        canSeeFullHistory: true,
      },
      member: {
        canSeeExactSpending: false,
        canSeeSpendingTier: false,
        canSeePersonalInfo: false,
        canSeeEmail: false,
        canSeePaymentMethods: false,
        canSeeFullHistory: false,
      },
    };

    req.visibilityRules = visibilityRules[userRole] || visibilityRules.member;

    // Override response to apply visibility rules
    const originalJson = res.json;

    res.json = function (data) {
      if (data && data.data) {
        data.data = applyVisibilityRules(data.data, req.visibilityRules);
      }

      return originalJson.call(this, data);
    };

    next();
  } catch (error) {
    console.error('Data visibility rules error:', error);
    next();
  }
};

// ============================================
// BULK MESSAGE PRIVACY
// ============================================

/**
 * Check bulk message permissions
 */
exports.checkBulkMessagePermissions = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const { recipients } = req.body;

    if (!recipients || recipients.length === 0) {
      return next();
    }

    // Check each recipient's bulk message preference
    const blockedRecipients = [];

    for (const memberId of recipients) {
      const memberAnalytics = await MemberAnalytics.findOne({
        member: memberId,
      });

      if (memberAnalytics && !memberAnalytics.privacy.allowBulkMessages) {
        blockedRecipients.push(memberId);
      }
    }

    // Remove blocked recipients
    if (blockedRecipients.length > 0) {
      req.body.recipients = recipients.filter(
        id => !blockedRecipients.includes(id)
      );

      // Add warning to response
      req.bulkMessageWarning = {
        totalRecipients: recipients.length,
        blockedRecipients: blockedRecipients.length,
        allowedRecipients: req.body.recipients.length,
        message: `${blockedRecipients.length} recipients have opted out of bulk messages`,
      };
    }

    next();
  } catch (error) {
    console.error('Check bulk message permissions error:', error);
    next();
  }
};

// ============================================
// GDPR COMPLIANCE
// ============================================

/**
 * Handle GDPR data requests
 */
exports.handleGDPRRequest = async (req, res, next) => {
  try {
    const requestType = req.query.gdpr_request;

    if (!requestType) {
      return next();
    }

    const userId = req.user.id;
    const userRole = req.user.role;

    switch (requestType) {
      case 'export':
        // Export user data
        const userData = await exportUserData(userId, userRole);
        return res.json({
          success: true,
          data: userData,
          exportedAt: new Date(),
        });

      case 'delete':
        // Request account deletion
        await requestAccountDeletion(userId, userRole);
        return res.json({
          success: true,
          message:
            'Account deletion requested. Will be processed within 30 days.',
        });

      case 'rectify':
        // Update incorrect data
        const updates = req.body;
        await rectifyUserData(userId, userRole, updates);
        return res.json({
          success: true,
          message: 'Data updated successfully',
        });

      default:
        next();
    }
  } catch (error) {
    console.error('GDPR request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing GDPR request',
    });
  }
};

/**
 * Audit data access
 */
exports.auditDataAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const accessedResource = req.originalUrl;
    const method = req.method;

    // Log data access for audit trail
    const DataAccessLog = require('../models/DataAccessLog');

    await DataAccessLog.create({
      userId,
      userRole: req.user.role,
      resource: accessedResource,
      method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date(),
    });

    next();
  } catch (error) {
    console.error('Audit data access error:', error);
    next(); // Don't block request on audit failure
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Anonymize sensitive data
 */
function anonymizeData(data, userRole) {
  if (!data) return data;

  // Recursively process arrays
  if (Array.isArray(data)) {
    return data.map(item => anonymizeData(item, userRole));
  }

  // Process objects
  if (typeof data === 'object') {
    const anonymized = {};

    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive fields for non-admin users
      if (userRole !== 'admin') {
        if (shouldAnonymizeField(key)) {
          if (key === 'spending' && value) {
            // Show tier instead of exact amounts
            anonymized[key] = {
              tier: value.tier,
              trend: value.velocity?.trend,
            };
          } else if (key === 'email') {
            // Partially hide email
            anonymized[key] = hideEmail(value);
          } else if (key === 'phone') {
            // Hide phone number
            anonymized[key] = '***-***-****';
          } else {
            // Skip other sensitive fields
            continue;
          }
        } else {
          anonymized[key] = anonymizeData(value, userRole);
        }
      } else {
        anonymized[key] = value;
      }
    }

    return anonymized;
  }

  return data;
}

/**
 * Check if field should be anonymized
 */
function shouldAnonymizeField(fieldName) {
  const sensitiveFields = [
    'email',
    'phone',
    'paymentMethod',
    'stripeCustomerId',
    'bankAccount',
    'ssn',
    'taxId',
    'spending',
    'revenue',
    'earnings',
    'balance',
  ];

  return sensitiveFields.some(field =>
    fieldName.toLowerCase().includes(field.toLowerCase())
  );
}

/**
 * Hide email address
 */
function hideEmail(email) {
  if (!email) return null;
  const [username, domain] = email.split('@');
  const hiddenUsername = username.substring(0, 2) + '***';
  return `${hiddenUsername}@${domain}`;
}

/**
 * Get interaction type from route
 */
function getInteractionType(routePath) {
  if (routePath.includes('poke')) return 'pokes';
  if (routePath.includes('like')) return 'likes';
  if (routePath.includes('message')) return 'messages';
  if (routePath.includes('special-offer')) return 'specialOffers';
  return null;
}

/**
 * Apply visibility rules to data
 */
function applyVisibilityRules(data, rules) {
  if (!data || !rules) return data;

  // Recursively apply rules
  if (Array.isArray(data)) {
    return data.map(item => applyVisibilityRules(item, rules));
  }

  if (typeof data === 'object') {
    const filtered = {};

    for (const [key, value] of Object.entries(data)) {
      // Check specific rules
      if (
        !rules.canSeeExactSpending &&
        key.includes('spending') &&
        typeof value === 'number'
      ) {
        // Convert to tier or range
        filtered[key] = getSpendingRange(value);
      } else if (!rules.canSeeEmail && key === 'email') {
        filtered[key] = hideEmail(value);
      } else if (!rules.canSeePaymentMethods && key.includes('payment')) {
        continue; // Skip payment fields
      } else {
        filtered[key] = applyVisibilityRules(value, rules);
      }
    }

    return filtered;
  }

  return data;
}

/**
 * Convert spending amount to range
 */
function getSpendingRange(amount) {
  if (amount >= 1000) return '$1000+';
  if (amount >= 500) return '$500-999';
  if (amount >= 100) return '$100-499';
  if (amount >= 50) return '$50-99';
  if (amount > 0) return '$1-49';
  return '$0';
}

/**
 * Export user data for GDPR
 */
async function exportUserData(userId, userRole) {
  const userData = {};

  if (userRole === 'member') {
    const member = await Member.findOne({ user: userId }).populate(
      'user',
      '-password'
    );
    userData.profile = member;

    const analytics = await MemberAnalytics.findOne({ member: member._id });
    userData.analytics = analytics;

    const interactions = await MemberInteraction.find({
      member: member._id,
    }).limit(100);
    userData.recentInteractions = interactions;
  } else if (userRole === 'creator') {
    const creator = await Creator.findOne({ user: userId }).populate(
      'user',
      '-password'
    );
    userData.profile = creator;

    const salesActivity = await CreatorSalesActivity.findOne({
      creator: creator._id,
    });
    userData.salesActivity = salesActivity;
  }

  return userData;
}

/**
 * Request account deletion
 */
async function requestAccountDeletion(userId, userRole) {
  const DeletionRequest = require('../models/DeletionRequest');

  await DeletionRequest.create({
    userId,
    userRole,
    requestedAt: new Date(),
    scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    status: 'pending',
  });
}

/**
 * Rectify user data
 */
async function rectifyUserData(userId, userRole, updates) {
  if (userRole === 'member') {
    const member = await Member.findOne({ user: userId });
    if (member && updates.profile) {
      Object.assign(member, updates.profile);
      await member.save();
    }
  } else if (userRole === 'creator') {
    const creator = await Creator.findOne({ user: userId });
    if (creator && updates.profile) {
      Object.assign(creator, updates.profile);
      await creator.save();
    }
  }
}

module.exports = exports;
