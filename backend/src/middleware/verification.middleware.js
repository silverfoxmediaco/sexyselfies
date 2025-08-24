// backend/src/middleware/verification.middleware.js
// Middleware for handling creator verification requirements

const Creator = require('../models/Creator');
const CreatorSalesActivity = require('../models/CreatorSalesActivity');

// ============================================
// VERIFICATION LEVEL CHECKS
// ============================================

/**
 * Ensure only verified creators can access certain features
 */
exports.verifiedCreatorOnly = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    
    const creator = await Creator.findById(creatorId)
      .select('isVerified verificationLevel verificationStatus');
    
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found'
      });
    }
    
    if (!creator.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'This feature requires verification',
        requiresVerification: true,
        verificationStatus: creator.verificationStatus,
        redirectTo: '/creator/verify'
      });
    }
    
    // Attach creator to request for use in controllers
    req.creator = creator;
    next();
    
  } catch (error) {
    console.error('Verification middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification status'
    });
  }
};

/**
 * Check specific verification level
 */
exports.checkVerificationLevel = (requiredLevel) => {
  return async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      
      const creator = await Creator.findById(creatorId)
        .select('isVerified verificationLevel');
      
      if (!creator) {
        return res.status(404).json({
          success: false,
          message: 'Creator profile not found'
        });
      }
      
      const levels = {
        'basic': 1,
        'standard': 2,
        'premium': 3,
        'vip': 4
      };
      
      const creatorLevel = levels[creator.verificationLevel] || 0;
      const required = levels[requiredLevel] || 0;
      
      if (creatorLevel < required) {
        return res.status(403).json({
          success: false,
          message: `This feature requires ${requiredLevel} verification`,
          currentLevel: creator.verificationLevel,
          requiredLevel: requiredLevel,
          upgradeUrl: '/creator/verification/upgrade'
        });
      }
      
      req.creator = creator;
      next();
      
    } catch (error) {
      console.error('Verification level check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking verification level'
      });
    }
  };
};

/**
 * Verification tier access control
 */
exports.verificationTierAccess = (allowedTiers) => {
  return async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      
      const creator = await Creator.findById(creatorId)
        .select('isVerified verificationLevel subscriptionTier');
      
      if (!creator) {
        return res.status(404).json({
          success: false,
          message: 'Creator profile not found'
        });
      }
      
      if (!creator.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Verification required',
          requiresVerification: true
        });
      }
      
      const tier = creator.subscriptionTier || 'free';
      
      if (!allowedTiers.includes(tier)) {
        return res.status(403).json({
          success: false,
          message: 'Your subscription tier does not have access to this feature',
          currentTier: tier,
          requiredTiers: allowedTiers,
          upgradeUrl: '/creator/subscription/upgrade'
        });
      }
      
      req.creator = creator;
      next();
      
    } catch (error) {
      console.error('Tier access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking tier access'
      });
    }
  };
};

// ============================================
// PROGRESSIVE FEATURE UNLOCKING
// ============================================

/**
 * Check if creator has unlocked a specific feature
 */
exports.featureUnlocked = (featureName) => {
  return async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      
      const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
      
      if (!salesActivity) {
        return res.status(403).json({
          success: false,
          message: 'Feature not yet unlocked',
          feature: featureName,
          requirements: getFeatureRequirements(featureName)
        });
      }
      
      const isUnlocked = checkFeatureUnlock(featureName, salesActivity);
      
      if (!isUnlocked) {
        const requirements = getFeatureRequirements(featureName);
        const progress = getFeatureProgress(featureName, salesActivity);
        
        return res.status(403).json({
          success: false,
          message: `Feature "${featureName}" not yet unlocked`,
          feature: featureName,
          requirements,
          progress,
          percentComplete: Math.round((progress.current / progress.required) * 100)
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Feature unlock check error:', error);
      res.status(500).json({
        success: false,
        message: 'Error checking feature access'
      });
    }
  };
};

/**
 * Batch verification status check
 */
exports.batchVerificationCheck = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    
    const creator = await Creator.findById(creatorId)
      .select('isVerified verificationLevel verificationStatus verificationDocuments');
    
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found'
      });
    }
    
    // Attach verification info to request
    req.verificationInfo = {
      isVerified: creator.isVerified,
      level: creator.verificationLevel,
      status: creator.verificationStatus,
      hasDocuments: creator.verificationDocuments?.length > 0,
      canAccessMemberProfiles: creator.isVerified,
      canSendBulkMessages: creator.verificationLevel === 'premium' || creator.verificationLevel === 'vip',
      canCreateSpecialOffers: creator.isVerified,
      dailyLimits: getDailyLimits(creator.verificationLevel)
    };
    
    next();
    
  } catch (error) {
    console.error('Batch verification check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking verification'
    });
  }
};

// ============================================
// VERIFICATION HELPERS
// ============================================

/**
 * Check if a feature is unlocked based on sales activity
 */
function checkFeatureUnlock(featureName, salesActivity) {
  const unlockRequirements = {
    'bulk_messaging': {
      interactions: 100,
      conversions: 5
    },
    'advanced_analytics': {
      interactions: 200,
      conversions: 10,
      revenue: 500
    },
    'ai_recommendations': {
      interactions: 500,
      conversions: 25,
      revenue: 1000
    },
    'api_access': {
      interactions: 1000,
      conversions: 50,
      revenue: 5000
    }
  };
  
  const requirements = unlockRequirements[featureName];
  if (!requirements) return true; // Feature has no requirements
  
  const stats = salesActivity.metrics.allTime;
  
  return (
    stats.totalInteractions >= requirements.interactions &&
    stats.totalConversions >= requirements.conversions &&
    (requirements.revenue ? stats.totalRevenue >= requirements.revenue : true)
  );
}

/**
 * Get feature requirements
 */
function getFeatureRequirements(featureName) {
  const requirements = {
    'bulk_messaging': {
      description: 'Send messages to multiple members at once',
      interactions: 100,
      conversions: 5
    },
    'advanced_analytics': {
      description: 'Access detailed sales analytics and insights',
      interactions: 200,
      conversions: 10,
      revenue: 500
    },
    'ai_recommendations': {
      description: 'Get AI-powered member targeting suggestions',
      interactions: 500,
      conversions: 25,
      revenue: 1000
    },
    'api_access': {
      description: 'Access API for third-party integrations',
      interactions: 1000,
      conversions: 50,
      revenue: 5000
    }
  };
  
  return requirements[featureName] || null;
}

/**
 * Get feature progress
 */
function getFeatureProgress(featureName, salesActivity) {
  const requirements = getFeatureRequirements(featureName);
  if (!requirements) return null;
  
  const stats = salesActivity.metrics.allTime;
  
  return {
    interactions: {
      current: stats.totalInteractions,
      required: requirements.interactions
    },
    conversions: {
      current: stats.totalConversions,
      required: requirements.conversions
    },
    revenue: requirements.revenue ? {
      current: stats.totalRevenue,
      required: requirements.revenue
    } : null
  };
}

/**
 * Get daily limits based on verification level
 */
function getDailyLimits(verificationLevel) {
  const limits = {
    'basic': {
      profileViews: 50,
      pokes: 25,
      messages: 50,
      specialOffers: 5,
      bulkMessages: 0
    },
    'standard': {
      profileViews: 100,
      pokes: 50,
      messages: 100,
      specialOffers: 10,
      bulkMessages: 1
    },
    'premium': {
      profileViews: 500,
      pokes: 100,
      messages: 250,
      specialOffers: 25,
      bulkMessages: 3
    },
    'vip': {
      profileViews: -1, // Unlimited
      pokes: 200,
      messages: 500,
      specialOffers: 50,
      bulkMessages: 10
    }
  };
  
  return limits[verificationLevel] || limits['basic'];
}

module.exports = exports;