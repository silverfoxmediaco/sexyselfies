// backend/src/utils/privacyFilters.js
// Utilities for privacy protection and sensitive data handling

const crypto = require('crypto');
const MemberAnalytics = require('../models/MemberAnalytics');
const Member = require('../models/Member');
const Creator = require('../models/Creator');

// ============================================
// CORE PRIVACY FUNCTIONS
// ============================================

/**
 * Anonymize spending data based on privacy level
 * @param {Object} spendingData - Raw spending data
 * @param {Object} options - Anonymization options
 * @returns {Object} Anonymized spending data
 */
exports.anonymizeSpendingData = (spendingData, options = {}) => {
  try {
    const {
      level = 'standard', // minimal, standard, strict, complete
      showTier = true,
      showTrend = true,
      showRange = false,
      requesterRole = 'creator',
      hasPermission = false,
    } = options;

    // Return full data if admin or has explicit permission
    if (requesterRole === 'admin' || hasPermission) {
      return spendingData;
    }

    // Deep clone to avoid modifying original
    const anonymized = JSON.parse(JSON.stringify(spendingData));

    // Apply anonymization based on level
    switch (level) {
      case 'minimal':
        // Show tier and trends only
        return {
          tier: showTier ? anonymized.tier : 'hidden',
          velocity: showTrend
            ? {
                trend: anonymized.velocity?.trend || 'stable',
                direction:
                  anonymized.velocity?.trend === 'increasing'
                    ? 'up'
                    : anonymized.velocity?.trend === 'decreasing'
                      ? 'down'
                      : 'stable',
              }
            : null,
          hasSpendingHistory: anonymized.lifetime > 0,
        };

      case 'standard':
        // Show tier, range, and trends
        return {
          tier: showTier ? anonymized.tier : 'hidden',
          last30DaysRange: showRange
            ? getSpendingRange(anonymized.last30Days)
            : null,
          lifetimeRange: showRange
            ? getLifetimeRange(anonymized.lifetime)
            : null,
          velocity: showTrend
            ? {
                trend: anonymized.velocity?.trend,
                percentageRange: getPercentageRange(
                  anonymized.velocity?.percentageChange
                ),
              }
            : null,
          averagePurchaseRange: getSpendingRange(anonymized.averagePurchase),
          hasRecentActivity: anonymized.last24Hours > 0,
        };

      case 'strict':
        // Only show tier category
        return {
          tier: showTier ? anonymized.tier : 'member',
          isActive: anonymized.last30Days > 0,
          hasHistory: anonymized.lifetime > 0,
        };

      case 'complete':
        // Hide all spending data
        return {
          dataProtected: true,
          message: 'Spending data is private',
        };

      default:
        // Default to standard
        return exports.anonymizeSpendingData(spendingData, {
          ...options,
          level: 'standard',
        });
    }
  } catch (error) {
    console.error('Error anonymizing spending data:', error);
    return {
      error: 'Unable to process spending data',
      dataProtected: true,
    };
  }
};

/**
 * Hide sensitive information from data objects
 * @param {Object} data - Data containing sensitive information
 * @param {Object} options - Configuration for what to hide
 * @returns {Object} Data with sensitive information hidden
 */
exports.hideSensitiveInfo = (data, options = {}) => {
  try {
    const {
      hideEmail = true,
      hidePhone = true,
      hidePayment = true,
      hideLocation = true,
      hidePersonal = true,
      hideDates = false,
      hideIds = false,
      requesterRole = 'public',
      requesterRelation = 'none', // none, matched, interacted, customer
    } = options;

    // Return full data for admins
    if (requesterRole === 'admin') {
      return data;
    }

    // Deep clone to avoid modifying original
    const sanitized = JSON.parse(JSON.stringify(data));

    // Recursive function to process nested objects
    const processObject = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') return obj;

      // Process arrays
      if (Array.isArray(obj)) {
        return obj.map((item, index) =>
          processObject(item, `${path}[${index}]`)
        );
      }

      // Process objects
      const processed = {};

      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        const lowerKey = key.toLowerCase();

        // Check if field should be hidden
        if (
          shouldHideField(lowerKey, value, {
            hideEmail,
            hidePhone,
            hidePayment,
            hideLocation,
            hidePersonal,
            hideDates,
            hideIds,
            requesterRelation,
          })
        ) {
          // Apply appropriate masking
          processed[key] = maskField(key, value, requesterRelation);
        } else if (typeof value === 'object') {
          // Recursively process nested objects
          processed[key] = processObject(value, currentPath);
        } else {
          // Keep original value
          processed[key] = value;
        }
      }

      return processed;
    };

    return processObject(sanitized);
  } catch (error) {
    console.error('Error hiding sensitive info:', error);
    return data; // Return original if error
  }
};

/**
 * Apply privacy settings to data based on member preferences
 * @param {Object} data - Data to filter
 * @param {String} memberId - Member whose privacy settings to apply
 * @param {Object} context - Request context
 * @returns {Object} Filtered data respecting privacy settings
 */
exports.applyPrivacySettings = async (data, memberId, context = {}) => {
  try {
    const {
      requesterId,
      requesterRole = 'public',
      dataType = 'profile', // profile, analytics, activity, interaction
      purpose = 'view', // view, contact, analyze, moderate
    } = context;

    // Get member's privacy settings
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });

    if (!memberAnalytics) {
      // No analytics means full privacy
      return {
        error: 'Member data not available',
        private: true,
      };
    }

    const privacy = memberAnalytics.privacy;

    // Check if requester is blocked
    if (privacy.blockedCreators?.includes(requesterId)) {
      return {
        error: 'Access denied',
        blocked: true,
      };
    }

    // Check discoverability
    if (
      !privacy.discoverable &&
      requesterRole !== 'admin' &&
      purpose !== 'moderate'
    ) {
      return {
        error: 'Profile is private',
        private: true,
      };
    }

    // Apply privacy rules based on data type
    let filteredData = JSON.parse(JSON.stringify(data));

    switch (dataType) {
      case 'profile':
        filteredData = applyProfilePrivacy(
          filteredData,
          privacy,
          requesterRole
        );
        break;

      case 'analytics':
        filteredData = applyAnalyticsPrivacy(
          filteredData,
          privacy,
          requesterRole
        );
        break;

      case 'activity':
        filteredData = applyActivityPrivacy(
          filteredData,
          privacy,
          requesterRole
        );
        break;

      case 'interaction':
        filteredData = applyInteractionPrivacy(
          filteredData,
          privacy,
          requesterRole
        );
        break;

      default:
        // Apply general privacy
        filteredData = applyGeneralPrivacy(
          filteredData,
          privacy,
          requesterRole
        );
    }

    // Add privacy notice
    filteredData._privacy = {
      level: privacy.level || 'standard',
      filtered: true,
      dataType,
      purpose,
    };

    return filteredData;
  } catch (error) {
    console.error('Error applying privacy settings:', error);
    return {
      error: 'Unable to process privacy settings',
      private: true,
    };
  }
};

/**
 * Check data access permissions
 * @param {String} requesterId - ID of user requesting access
 * @param {String} targetId - ID of target user/data
 * @param {Object} accessRequest - Details of access request
 * @returns {Object} Permission result with allowed actions
 */
exports.checkDataPermissions = async (
  requesterId,
  targetId,
  accessRequest = {}
) => {
  try {
    const {
      dataType = 'profile', // profile, spending, analytics, content, messages
      action = 'view', // view, edit, delete, export, share
      requesterRole = 'member',
      requesterRelation = 'none', // none, self, matched, customer, blocked
    } = accessRequest;

    // Initialize permission result
    const permission = {
      allowed: false,
      level: 'none',
      actions: [],
      restrictions: [],
      reason: '',
    };

    // Self access - full permissions
    if (requesterId === targetId || requesterRelation === 'self') {
      return {
        allowed: true,
        level: 'full',
        actions: ['view', 'edit', 'delete', 'export'],
        restrictions: [],
        reason: 'Self access',
      };
    }

    // Admin access - elevated permissions
    if (requesterRole === 'admin') {
      return {
        allowed: true,
        level: 'admin',
        actions: ['view', 'export', 'moderate'],
        restrictions: [
          'Cannot edit personal data',
          'Cannot delete without approval',
        ],
        reason: 'Administrative access',
      };
    }

    // Check if blocked
    if (requesterRelation === 'blocked') {
      return {
        allowed: false,
        level: 'none',
        actions: [],
        restrictions: ['User has blocked access'],
        reason: 'Blocked by user',
      };
    }

    // Get target's privacy settings
    const targetAnalytics = await MemberAnalytics.findOne({
      member: targetId,
    });

    if (!targetAnalytics) {
      return {
        allowed: false,
        level: 'none',
        actions: [],
        restrictions: ['Target user not found'],
        reason: 'User not found',
      };
    }

    const privacy = targetAnalytics.privacy;

    // Check specific data type permissions
    switch (dataType) {
      case 'profile':
        if (
          privacy.discoverable ||
          requesterRelation === 'matched' ||
          requesterRelation === 'customer'
        ) {
          permission.allowed = true;
          permission.level = 'basic';
          permission.actions = ['view'];
          permission.reason = 'Profile is discoverable';
        }
        break;

      case 'spending':
        if (requesterRole === 'creator' && privacy.showSpending) {
          permission.allowed = true;
          permission.level = 'limited';
          permission.actions = ['view'];
          permission.restrictions = ['Only tier and range visible'];
          permission.reason = 'Spending visibility enabled';
        }
        break;

      case 'analytics':
        if (
          requesterRole === 'creator' &&
          (requesterRelation === 'customer' || requesterRelation === 'matched')
        ) {
          permission.allowed = true;
          permission.level = 'aggregated';
          permission.actions = ['view'];
          permission.restrictions = ['Only aggregated data'];
          permission.reason = 'Existing relationship';
        }
        break;

      case 'content':
        if (requesterRelation === 'customer') {
          permission.allowed = true;
          permission.level = 'purchased';
          permission.actions = ['view', 'download'];
          permission.reason = 'Purchased content access';
        }
        break;

      case 'messages':
        if (
          requesterRelation === 'matched' ||
          requesterRelation === 'customer'
        ) {
          const interactionPrefs = privacy.interactionPreferences || {};
          if (interactionPrefs.messages !== false) {
            permission.allowed = true;
            permission.level = 'conversation';
            permission.actions = ['view', 'send'];
            permission.reason = 'Messaging enabled for matches';
          }
        }
        break;
    }

    // Apply action-specific checks
    if (permission.allowed && action !== 'view') {
      permission.actions = permission.actions.filter(a => {
        // Only allow specific actions based on relationship
        if (action === 'edit') return requesterRelation === 'self';
        if (action === 'delete')
          return requesterRelation === 'self' || requesterRole === 'admin';
        if (action === 'export')
          return requesterRelation === 'self' || requesterRole === 'admin';
        if (action === 'share') return false; // Never allow sharing others' data
        return false;
      });

      if (!permission.actions.includes(action)) {
        permission.allowed = false;
        permission.reason = `Action '${action}' not permitted`;
      }
    }

    // Add audit log
    await logDataAccess({
      requesterId,
      targetId,
      dataType,
      action,
      allowed: permission.allowed,
      timestamp: new Date(),
    });

    return permission;
  } catch (error) {
    console.error('Error checking data permissions:', error);
    return {
      allowed: false,
      level: 'none',
      actions: [],
      restrictions: ['Error checking permissions'],
      reason: 'System error',
    };
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get spending range category
 */
function getSpendingRange(amount) {
  if (!amount && amount !== 0) return 'Unknown';
  if (amount >= 1000) return '$1000+';
  if (amount >= 500) return '$500-999';
  if (amount >= 200) return '$200-499';
  if (amount >= 100) return '$100-199';
  if (amount >= 50) return '$50-99';
  if (amount >= 20) return '$20-49';
  if (amount >= 10) return '$10-19';
  if (amount > 0) return '$1-9';
  return '$0';
}

/**
 * Get lifetime value range
 */
function getLifetimeRange(amount) {
  if (!amount && amount !== 0) return 'Unknown';
  if (amount >= 10000) return '$10,000+';
  if (amount >= 5000) return '$5,000-9,999';
  if (amount >= 2500) return '$2,500-4,999';
  if (amount >= 1000) return '$1,000-2,499';
  if (amount >= 500) return '$500-999';
  if (amount >= 100) return '$100-499';
  if (amount > 0) return '$1-99';
  return '$0';
}

/**
 * Get percentage range
 */
function getPercentageRange(percentage) {
  if (!percentage && percentage !== 0) return 'Stable';
  if (percentage > 100) return '>100% increase';
  if (percentage > 50) return '50-100% increase';
  if (percentage > 25) return '25-50% increase';
  if (percentage > 10) return '10-25% increase';
  if (percentage > 0) return '0-10% increase';
  if (percentage > -10) return '0-10% decrease';
  if (percentage > -25) return '10-25% decrease';
  if (percentage > -50) return '25-50% decrease';
  return '>50% decrease';
}

/**
 * Check if field should be hidden
 */
function shouldHideField(fieldName, value, options) {
  const {
    hideEmail,
    hidePhone,
    hidePayment,
    hideLocation,
    hidePersonal,
    hideDates,
    hideIds,
    requesterRelation,
  } = options;

  // Email fields
  if (
    hideEmail &&
    (fieldName.includes('email') ||
      fieldName.includes('mail') ||
      isEmail(value))
  ) {
    return true;
  }

  // Phone fields
  if (
    hidePhone &&
    (fieldName.includes('phone') ||
      fieldName.includes('mobile') ||
      fieldName.includes('tel') ||
      isPhoneNumber(value))
  ) {
    return true;
  }

  // Payment fields
  if (
    hidePayment &&
    (fieldName.includes('payment') ||
      fieldName.includes('card') ||
      fieldName.includes('bank') ||
      fieldName.includes('stripe') ||
      fieldName.includes('account'))
  ) {
    return true;
  }

  // Location fields
  if (
    hideLocation &&
    (fieldName.includes('address') ||
      fieldName.includes('location') ||
      fieldName.includes('city') ||
      fieldName.includes('country') ||
      fieldName.includes('zip') ||
      fieldName.includes('postal'))
  ) {
    return true;
  }

  // Personal information
  if (
    hidePersonal &&
    (fieldName.includes('ssn') ||
      fieldName.includes('tax') ||
      fieldName.includes('passport') ||
      fieldName.includes('license') ||
      fieldName.includes('birth') ||
      fieldName === 'age')
  ) {
    return true;
  }

  // Date fields
  if (
    hideDates &&
    (fieldName.includes('date') ||
      fieldName.includes('time') ||
      fieldName.includes('created') ||
      fieldName.includes('updated'))
  ) {
    return true;
  }

  // ID fields
  if (
    hideIds &&
    (fieldName.includes('id') ||
      fieldName === '_id' ||
      fieldName === 'userId' ||
      fieldName === 'memberId' ||
      fieldName === 'creatorId')
  ) {
    return true;
  }

  return false;
}

/**
 * Mask sensitive field value
 */
function maskField(fieldName, value, requesterRelation) {
  const lowerField = fieldName.toLowerCase();

  // Email masking
  if (lowerField.includes('email') || isEmail(value)) {
    return maskEmail(value);
  }

  // Phone masking
  if (lowerField.includes('phone') || isPhoneNumber(value)) {
    return maskPhone(value);
  }

  // Card masking
  if (lowerField.includes('card') && typeof value === 'string') {
    return maskCard(value);
  }

  // SSN/Tax ID masking
  if (lowerField.includes('ssn') || lowerField.includes('tax')) {
    return '***-**-****';
  }

  // Date masking (show only year for birthdate)
  if (lowerField.includes('birth') && value) {
    const date = new Date(value);
    return date.getFullYear().toString();
  }

  // Address masking
  if (lowerField.includes('address')) {
    return typeof value === 'string'
      ? value.substring(0, 5) + '...'
      : '[Hidden]';
  }

  // ID masking (show partial)
  if (
    lowerField.includes('id') &&
    typeof value === 'string' &&
    value.length > 8
  ) {
    return value.substring(0, 4) + '...' + value.substring(value.length - 4);
  }

  // Default masking
  return '[Protected]';
}

/**
 * Check if value is email
 */
function isEmail(value) {
  if (typeof value !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

/**
 * Check if value is phone number
 */
function isPhoneNumber(value) {
  if (typeof value !== 'string') return false;
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(value) && value.replace(/\D/g, '').length >= 10;
}

/**
 * Mask email address
 */
function maskEmail(email) {
  if (!email || typeof email !== 'string') return '[Email Hidden]';
  const parts = email.split('@');
  if (parts.length !== 2) return '[Email Hidden]';

  const username = parts[0];
  const domain = parts[1];

  if (username.length <= 2) {
    return username[0] + '***@' + domain;
  }

  return username.substring(0, 2) + '***@' + domain;
}

/**
 * Mask phone number
 */
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '[Phone Hidden]';
  const digits = phone.replace(/\D/g, '');

  if (digits.length >= 10) {
    return '***-***-' + digits.substring(digits.length - 4);
  }

  return '[Phone Hidden]';
}

/**
 * Mask card number
 */
function maskCard(card) {
  if (!card || typeof card !== 'string') return '[Card Hidden]';
  const digits = card.replace(/\D/g, '');

  if (digits.length >= 12) {
    return '**** **** **** ' + digits.substring(digits.length - 4);
  }

  return '[Card Hidden]';
}

/**
 * Apply profile privacy rules
 */
function applyProfilePrivacy(data, privacy, requesterRole) {
  const filtered = { ...data };

  // Remove sensitive fields based on privacy level
  if (privacy.level === 'strict' || privacy.level === 'private') {
    delete filtered.email;
    delete filtered.phone;
    delete filtered.location;
    delete filtered.birthDate;
  }

  // Apply spending privacy
  if (filtered.spending && !privacy.showSpending) {
    filtered.spending = exports.anonymizeSpendingData(filtered.spending, {
      level: privacy.level || 'standard',
      requesterRole,
    });
  }

  // Hide activity details if not discoverable
  if (filtered.activity && !privacy.discoverable) {
    filtered.activity = {
      level: filtered.activity.level,
      isActive:
        filtered.activity.lastActive >
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    };
  }

  return filtered;
}

/**
 * Apply analytics privacy rules
 */
function applyAnalyticsPrivacy(data, privacy, requesterRole) {
  const filtered = { ...data };

  // Hide exact numbers
  if (filtered.spending) {
    filtered.spending = exports.anonymizeSpendingData(filtered.spending, {
      level: 'standard',
      showTier: true,
      showRange: privacy.showSpending,
      requesterRole,
    });
  }

  // Hide personal patterns
  if (filtered.preferences && privacy.level === 'strict') {
    filtered.preferences = {
      hasPreferences: true,
      categoriesCount: filtered.preferences.topCategories?.length || 0,
    };
  }

  // Hide engagement details
  if (filtered.engagement && !privacy.showEngagement) {
    filtered.engagement = {
      isEngaged: filtered.engagement.messageResponseRate > 0,
      activityLevel:
        filtered.engagement.messageResponseRate > 50 ? 'high' : 'normal',
    };
  }

  return filtered;
}

/**
 * Apply activity privacy rules
 */
function applyActivityPrivacy(data, privacy, requesterRole) {
  const filtered = { ...data };

  // Hide exact timestamps
  if (filtered.lastActive && privacy.level !== 'public') {
    const lastActive = new Date(filtered.lastActive);
    const now = new Date();
    const hoursSince = (now - lastActive) / (1000 * 60 * 60);

    if (hoursSince < 1) {
      filtered.lastActive = 'Recently active';
    } else if (hoursSince < 24) {
      filtered.lastActive = 'Active today';
    } else if (hoursSince < 168) {
      filtered.lastActive = 'Active this week';
    } else {
      filtered.lastActive = 'Active this month';
    }
  }

  // Hide session details
  if (filtered.sessions) {
    filtered.sessions = {
      hasActivity: filtered.sessions.length > 0,
      frequencyLevel: filtered.sessions.length > 10 ? 'high' : 'normal',
    };
  }

  return filtered;
}

/**
 * Apply interaction privacy rules
 */
function applyInteractionPrivacy(data, privacy, requesterRole) {
  const filtered = { ...data };

  // Check interaction preferences
  const prefs = privacy.interactionPreferences || {};

  // Hide based on preferences
  if (!prefs.messages && filtered.messages) {
    delete filtered.messages;
  }

  if (!prefs.pokes && filtered.pokes) {
    delete filtered.pokes;
  }

  if (!prefs.specialOffers && filtered.offers) {
    delete filtered.offers;
  }

  // Hide interaction history details
  if (filtered.history && privacy.level === 'strict') {
    filtered.history = {
      hasHistory: filtered.history.length > 0,
      interactionCount: filtered.history.length,
    };
  }

  return filtered;
}

/**
 * Apply general privacy rules
 */
function applyGeneralPrivacy(data, privacy, requesterRole) {
  // Start with sensitive info hidden
  let filtered = exports.hideSensitiveInfo(data, {
    requesterRole,
    hideEmail: privacy.level !== 'public',
    hidePhone: true,
    hidePayment: true,
    hideLocation: privacy.level === 'strict',
    hidePersonal: true,
  });

  // Apply spending anonymization if present
  if (filtered.spending) {
    filtered.spending = exports.anonymizeSpendingData(filtered.spending, {
      level: privacy.level || 'standard',
      requesterRole,
    });
  }

  return filtered;
}

/**
 * Log data access for audit
 */
async function logDataAccess(accessLog) {
  try {
    // This would log to a DataAccessLog model
    // For now, just console log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Data Access:', {
        ...accessLog,
        timestamp: new Date().toISOString(),
      });
    }

    // In production, save to database
    // const DataAccessLog = require('../models/DataAccessLog');
    // await DataAccessLog.create(accessLog);
  } catch (error) {
    console.error('Error logging data access:', error);
  }
}

// ============================================
// UTILITY EXPORTS
// ============================================

/**
 * Create a privacy-safe member summary
 */
exports.createSafeMemberSummary = (member, options = {}) => {
  const { includeStats = false, requesterRole = 'public' } = options;

  const summary = {
    id: member._id || member.id,
    username: member.username,
    avatar: member.avatar,
    isVerified: member.isVerified || false,
    joinDate: member.joinDate ? new Date(member.joinDate).getFullYear() : null,
  };

  if (includeStats && member.analytics) {
    summary.tier = member.analytics.spending?.tier || 'member';
    summary.activityLevel = member.analytics.activity?.level || 'normal';
    summary.badges = member.badges || [];
  }

  return summary;
};

/**
 * Filter array of members for privacy
 */
exports.filterMembersForPrivacy = async (
  members,
  requesterId,
  options = {}
) => {
  const filtered = [];

  for (const member of members) {
    const permission = await exports.checkDataPermissions(
      requesterId,
      member._id || member.id,
      {
        dataType: 'profile',
        action: 'view',
        ...options,
      }
    );

    if (permission.allowed) {
      const safe = await exports.applyPrivacySettings(
        member,
        member._id || member.id,
        {
          requesterId,
          ...options,
        }
      );

      filtered.push(safe);
    }
  }

  return filtered;
};

/**
 * Get privacy level from string
 */
exports.getPrivacyLevel = levelString => {
  const levels = {
    public: 0,
    minimal: 1,
    standard: 2,
    strict: 3,
    private: 4,
    complete: 5,
  };

  return levels[levelString] || 2; // Default to standard
};

/**
 * Check if data meets privacy requirements
 */
exports.meetsPrivacyRequirements = (data, requirements = {}) => {
  const {
    minPrivacyLevel = 'standard',
    requiresConsent = false,
    requiresVerification = false,
  } = requirements;

  if (requiresConsent && !data.consentGiven) {
    return false;
  }

  if (requiresVerification && !data.isVerified) {
    return false;
  }

  const dataLevel = exports.getPrivacyLevel(data.privacyLevel);
  const requiredLevel = exports.getPrivacyLevel(minPrivacyLevel);

  return dataLevel >= requiredLevel;
};

module.exports = exports;
