// backend/src/models/UserSession.js
// Comprehensive session tracking model for both members and creators

const mongoose = require('mongoose');

const UserSessionSchema = new mongoose.Schema({
  // User identification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session identification
  sessionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  userType: {
    type: String,
    enum: ['member', 'creator', 'admin'],
    required: true
  },
  
  // Device and browser information
  deviceInfo: {
    userAgent: {
      type: String,
      required: true
    },
    deviceType: {
      type: String,
      enum: ['mobile', 'desktop', 'tablet', 'unknown'],
      default: 'unknown'
    },
    browser: String,
    os: String,
    deviceModel: String,
    screenResolution: String
  },
  
  // Location and network
  location: {
    ipAddress: {
      type: String,
      required: true
    },
    country: String,
    city: String,
    timezone: String,
    isp: String
  },
  
  // Session timing
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  lastActiveAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  
  // Session status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  endedAt: Date,
  
  logoutReason: {
    type: String,
    enum: ['manual', 'expired', 'security', 'inactivity', 'admin_terminated'],
    default: null
  },
  
  // Activity tracking within session
  activities: [{
    type: {
      type: String,
      enum: [
        // General activities
        'login', 'logout', 'profile_update', 'settings_change',
        
        // Member activities
        'browse_creators', 'swipe_like', 'swipe_pass', 'swipe_superlike',
        'content_purchase', 'message_sent', 'message_read',
        'content_view', 'profile_view', 'search_performed',
        
        // Creator activities
        'browse_members', 'content_upload', 'member_message',
        'special_offer_sent', 'analytics_view', 'earnings_check',
        'profile_edit', 'content_edit', 'member_interaction',
        
        // Admin activities
        'admin_dashboard', 'user_management', 'content_moderation',
        'verification_review', 'payout_processing'
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  
  // Session-specific metrics
  metrics: {
    // General metrics
    totalActivities: {
      type: Number,
      default: 0
    },
    
    // Member-specific metrics
    creatorsViewed: {
      type: Number,
      default: 0
    },
    
    swipes: {
      likes: { type: Number, default: 0 },
      passes: { type: Number, default: 0 },
      superLikes: { type: Number, default: 0 }
    },
    
    purchases: {
      count: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 }
    },
    
    messages: {
      sent: { type: Number, default: 0 },
      received: { type: Number, default: 0 }
    },
    
    // Creator-specific metrics
    membersViewed: {
      type: Number,
      default: 0
    },
    
    contentUploaded: {
      type: Number,
      default: 0
    },
    
    specialOffersSent: {
      type: Number,
      default: 0
    },
    
    sessionRevenue: {
      type: Number,
      default: 0
    },
    
    memberInteractions: {
      type: Number,
      default: 0
    }
  },
  
  // Security and anomaly detection
  security: {
    ipChanges: [{
      fromIp: String,
      toIp: String,
      timestamp: Date,
      flagged: { type: Boolean, default: false }
    }],
    
    suspiciousActivity: [{
      type: String,
      description: String,
      timestamp: Date,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      }
    }],
    
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }
}, {
  timestamps: true,
  collection: 'user_sessions'
});

// Indexes for performance
UserSessionSchema.index({ user: 1, isActive: 1 });
UserSessionSchema.index({ sessionId: 1 });
UserSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-cleanup expired sessions
UserSessionSchema.index({ userType: 1, isActive: 1 });
UserSessionSchema.index({ 'location.ipAddress': 1 });
UserSessionSchema.index({ createdAt: -1 });

// Virtual for session duration
UserSessionSchema.virtual('duration').get(function() {
  const endTime = this.endedAt || this.lastActiveAt || new Date();
  return Math.round((endTime - this.createdAt) / 1000 / 60); // Duration in minutes
});

// Virtual for time since last activity
UserSessionSchema.virtual('inactiveMinutes').get(function() {
  return Math.round((new Date() - this.lastActiveAt) / 1000 / 60);
});

// Methods
UserSessionSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

UserSessionSchema.methods.addActivity = async function(activityType, metadata = {}) {
  this.activities.push({
    type: activityType,
    timestamp: new Date(),
    metadata
  });
  
  this.metrics.totalActivities += 1;
  this.lastActiveAt = new Date();
  
  // Update type-specific metrics
  this.updateMetricsForActivity(activityType, metadata);
  
  return this.save();
};

UserSessionSchema.methods.updateMetricsForActivity = function(activityType, metadata) {
  switch (activityType) {
    // Member activities
    case 'browse_creators':
    case 'profile_view':
      this.metrics.creatorsViewed += 1;
      break;
      
    case 'swipe_like':
      this.metrics.swipes.likes += 1;
      break;
      
    case 'swipe_pass':
      this.metrics.swipes.passes += 1;
      break;
      
    case 'swipe_superlike':
      this.metrics.swipes.superLikes += 1;
      break;
      
    case 'content_purchase':
      this.metrics.purchases.count += 1;
      this.metrics.purchases.totalAmount += metadata.amount || 0;
      break;
      
    case 'message_sent':
      this.metrics.messages.sent += 1;
      break;
      
    // Creator activities
    case 'browse_members':
      this.metrics.membersViewed += 1;
      break;
      
    case 'content_upload':
      this.metrics.contentUploaded += 1;
      break;
      
    case 'special_offer_sent':
      this.metrics.specialOffersSent += 1;
      break;
      
    case 'member_message':
      this.metrics.memberInteractions += 1;
      break;
  }
};

UserSessionSchema.methods.endSession = async function(reason = 'manual') {
  this.isActive = false;
  this.endedAt = new Date();
  this.logoutReason = reason;
  return this.save();
};

UserSessionSchema.methods.flagSuspiciousActivity = function(type, description, severity = 'medium') {
  this.security.suspiciousActivity.push({
    type,
    description,
    timestamp: new Date(),
    severity
  });
  
  // Increase risk score based on severity
  const scoreIncrease = {
    'low': 5,
    'medium': 15,
    'high': 30,
    'critical': 50
  }[severity] || 10;
  
  this.security.riskScore = Math.min(100, this.security.riskScore + scoreIncrease);
  
  return this.save();
};

// Static methods
UserSessionSchema.statics.createSession = async function(userId, userType, deviceInfo, location, expirationHours = 168) {
  const { v4: uuidv4 } = require('uuid');
  
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + expirationHours * 60 * 60 * 1000);
  
  const session = await this.create({
    user: userId,
    sessionId,
    userType,
    deviceInfo,
    location,
    expiresAt
  });
  
  return session;
};

UserSessionSchema.statics.getActiveSessions = function(userId) {
  return this.find({
    user: userId,
    isActive: true,
    expiresAt: { $gt: new Date() }
  }).sort({ lastActiveAt: -1 });
};

UserSessionSchema.statics.endAllUserSessions = function(userId, reason = 'security') {
  return this.updateMany(
    { user: userId, isActive: true },
    { 
      isActive: false, 
      endedAt: new Date(), 
      logoutReason: reason 
    }
  );
};

UserSessionSchema.statics.cleanupExpiredSessions = function() {
  return this.updateMany(
    { 
      isActive: true, 
      expiresAt: { $lt: new Date() } 
    },
    { 
      isActive: false, 
      endedAt: new Date(), 
      logoutReason: 'expired' 
    }
  );
};

UserSessionSchema.statics.getSessionAnalytics = async function(timeframe = 30) {
  const startDate = new Date(Date.now() - timeframe * 24 * 60 * 60 * 1000);
  
  const analytics = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        activeSessions: {
          $sum: {
            $cond: [{ $eq: ['$isActive', true] }, 1, 0]
          }
        },
        avgDuration: { $avg: '$duration' },
        totalActivities: { $sum: '$metrics.totalActivities' },
        totalRevenue: { $sum: '$metrics.sessionRevenue' },
        uniqueUsers: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        totalSessions: 1,
        activeSessions: 1,
        avgDurationMinutes: { $round: ['$avgDuration', 2] },
        totalActivities: 1,
        totalRevenue: { $round: ['$totalRevenue', 2] },
        uniqueUsers: { $size: '$uniqueUsers' }
      }
    }
  ]);
  
  return analytics[0] || {};
};

module.exports = mongoose.model('UserSession', UserSessionSchema);