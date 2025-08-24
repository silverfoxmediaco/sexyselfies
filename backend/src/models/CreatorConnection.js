const mongoose = require('mongoose');

const creatorConnectionSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    index: true
  },
  
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },
  
  // CONNECTION STATUS
  status: {
    type: String,
    enum: ['pending', 'connected', 'disconnected', 'blocked'],
    default: 'pending'
  },
  
  connectedAt: Date,
  disconnectedAt: Date,
  
  // SWIPE TRACKING
  swipeData: {
    memberSwiped: {
      direction: {
        type: String,
        enum: ['right', 'left', 'super'],
        required: true
      },
      swipedAt: {
        type: Date,
        default: Date.now
      },
      superLike: {
        type: Boolean,
        default: false
      },
      sessionTime: Number, // How long they viewed before swiping
      viewedPhotos: Number, // How many photos they looked at
      readBio: Boolean
    },
    
    creatorSwiped: {
      direction: {
        type: String,
        enum: ['right', 'left', null]
      },
      swipedAt: Date,
      autoConnected: Boolean // If creator has auto-connect enabled
    }
  },
  
  // BROWSE CONTEXT (renamed from DISCOVERY CONTEXT)
  browseContext: {
    filters: {
      orientation: String, // What filter was active
      ageRange: [Number],
      distance: Number,
      bodyType: [String],
      ethnicity: [String]
    },
    
    algorithm: {
      score: Number, // Connection algorithm score
      reason: String, // Why shown (location, preferences, trending)
      position: Number, // Position in stack when shown
      experiment: String // A/B test variant
    },
    
    searchSession: {
      sessionId: String,
      totalSwipes: Number,
      rightSwipes: Number,
      leftSwipes: Number
    }
  },
  
  // ENGAGEMENT METRICS
  engagement: {
    firstMessageSent: {
      by: {
        type: String,
        enum: ['creator', 'member', null]
      },
      at: Date,
      message: String
    },
    
    totalMessages: {
      fromCreator: { type: Number, default: 0 },
      fromMember: { type: Number, default: 0 }
    },
    
    lastMessageAt: Date,
    lastActiveAt: Date,
    
    contentUnlocked: {
      count: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      firstUnlockAt: Date,
      lastUnlockAt: Date
    },
    
    dmContentPurchased: {
      count: { type: Number, default: 0 },
      totalSpent: { type: Number, default: 0 },
      averagePrice: { type: Number, default: 0 }
    },
    
    tips: {
      count: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      largest: { type: Number, default: 0 }
    }
  },
  
  // RELATIONSHIP QUALITY
  relationship: {
    memberScore: {
      engagementLevel: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      spendingLevel: {
        type: String,
        enum: ['free', 'casual', 'regular', 'vip', 'whale'],
        default: 'free'
      },
      loyaltyScore: {
        type: Number,
        default: 0
      },
      lifetime: {
        spent: { type: Number, default: 0 },
        messages: { type: Number, default: 0 },
        daysActive: { type: Number, default: 0 }
      }
    },
    
    creatorScore: {
      responseRate: { type: Number, default: 0 },
      avgResponseTime: { type: Number, default: 0 }, // in minutes
      initiatedChats: { type: Number, default: 0 },
      sentFreeContent: { type: Number, default: 0 }
    },
    
    compatibility: {
      score: { type: Number, min: 0, max: 100 },
      factors: {
        orientationConnection: Boolean, // renamed from orientationMatch
        locationConnection: Boolean,    // renamed from locationMatch
        ageConnection: Boolean,         // renamed from ageMatch
        interestOverlap: Number,
        activityAlignment: Number // Active at same times
      }
    },
    
    health: {
      status: {
        type: String,
        enum: ['thriving', 'active', 'cooling', 'dormant', 'at_risk'],
        default: 'active'
      },
      lastInteraction: Date,
      daysSinceLastInteraction: Number,
      churnRisk: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      reEngagementSent: Date
    }
  },
  
  // MONETIZATION TRACKING
  monetization: {
    profileContentUnlocks: [{
      contentId: mongoose.Schema.Types.ObjectId,
      price: Number,
      unlockedAt: Date,
      contentType: String
    }],
    
    dmPurchases: [{
      messageId: mongoose.Schema.Types.ObjectId,
      price: Number,
      purchasedAt: Date,
      contentType: String, // photo, video, audio
      expiringContent: Boolean
    }],
    
    subscriptionOffers: [{
      offered: Date,
      accepted: Boolean,
      price: Number,
      duration: String
    }],
    
    totalRevenue: { type: Number, default: 0 },
    avgTransactionValue: { type: Number, default: 0 },
    lastPurchaseAt: Date,
    purchaseFrequency: String, // daily, weekly, monthly, rare
    
    projectedLTV: { type: Number, default: 0 } // Lifetime value prediction
  },
  
  // NOTIFICATIONS & PREFERENCES
  notifications: {
    memberPreferences: {
      newMessage: { type: Boolean, default: true },
      contentPost: { type: Boolean, default: true },
      price_drop: { type: Boolean, default: true },
      goLive: { type: Boolean, default: true }
    },
    
    creatorPreferences: {
      newConnection: { type: Boolean, default: true }, // renamed from newMatch
      firstMessage: { type: Boolean, default: true },
      contentUnlock: { type: Boolean, default: true },
      tip: { type: Boolean, default: true }
    },
    
    pushTokens: {
      member: String,
      creator: String
    }
  },
  
  // AI INSIGHTS
  ai: {
    predictedSpend: {
      nextWeek: Number,
      nextMonth: Number,
      confidence: Number
    },
    
    contentPreferences: {
      preferredType: String, // photos, videos, live
      preferredStyle: [String], // casual, professional, artistic
      bestPostTime: String,
      priceElasticity: Number // How price sensitive
    },
    
    engagementPrediction: {
      likelyToMessage: Number,
      likelyToPurchase: Number,
      likelyToTip: Number,
      likelyToChurn: Number
    },
    
    suggestions: [{
      type: String, // send_message, offer_discount, share_content
      reason: String,
      priority: Number,
      suggestedAt: Date,
      acted: Boolean
    }]
  },
  
  // FLAGS & MODERATION
  flags: {
    inappropriate: { type: Boolean, default: false },
    reported: { type: Boolean, default: false },
    verified: { type: Boolean, default: false },
    vip: { type: Boolean, default: false }
  },
  
  // METADATA
  metadata: {
    source: String, // browse, search, direct_link, referral (updated from discover)
    campaign: String,
    referrer: String,
    device: String,
    location: {
      country: String,
      state: String,
      city: String
    }
  }
}, {
  timestamps: true,
  indexes: [
    { creator: 1, member: 1 }, // Unique connection pair
    { status: 1, connectedAt: -1 }, // Active connections
    { 'relationship.health.status': 1 }, // Health monitoring
    { 'monetization.totalRevenue': -1 }, // Top spenders
    { 'engagement.lastActiveAt': -1 }, // Recent activity
    { 'relationship.health.churnRisk': -1 } // At-risk relationships
  ]
});

// Compound unique index
creatorConnectionSchema.index({ creator: 1, member: 1 }, { unique: true });

// METHODS

// Check if users can message
creatorConnectionSchema.methods.canMessage = function() {
  return this.status === 'connected';
};

// Calculate relationship strength
creatorConnectionSchema.methods.calculateRelationshipStrength = function() {
  const factors = {
    messages: Math.min(this.engagement.totalMessages.fromMember / 100, 1) * 0.2,
    spending: Math.min(this.monetization.totalRevenue / 100, 1) * 0.3,
    frequency: Math.min(this.engagement.contentUnlocked.count / 20, 1) * 0.2,
    recency: this.engagement.lastActiveAt > Date.now() - 7*24*60*60*1000 ? 0.2 : 0,
    tips: this.engagement.tips.count > 0 ? 0.1 : 0
  };
  
  return Object.values(factors).reduce((a, b) => a + b, 0) * 100;
};

// Update engagement metrics
creatorConnectionSchema.methods.updateEngagement = function(action, data) {
  switch(action) {
    case 'message_sent':
      if (data.sender === 'creator') {
        this.engagement.totalMessages.fromCreator++;
      } else {
        this.engagement.totalMessages.fromMember++;
      }
      this.engagement.lastMessageAt = new Date();
      this.engagement.lastActiveAt = new Date();
      break;
      
    case 'content_unlocked':
      this.engagement.contentUnlocked.count++;
      this.engagement.contentUnlocked.totalSpent += data.price;
      this.engagement.contentUnlocked.lastUnlockAt = new Date();
      this.monetization.totalRevenue += data.price;
      break;
      
    case 'dm_purchased':
      this.engagement.dmContentPurchased.count++;
      this.engagement.dmContentPurchased.totalSpent += data.price;
      this.monetization.totalRevenue += data.price;
      break;
      
    case 'tip_sent':
      this.engagement.tips.count++;
      this.engagement.tips.total += data.amount;
      if (data.amount > this.engagement.tips.largest) {
        this.engagement.tips.largest = data.amount;
      }
      this.monetization.totalRevenue += data.amount;
      break;
  }
  
  // Update relationship health
  this.updateRelationshipHealth();
};

// Update relationship health status
creatorConnectionSchema.methods.updateRelationshipHealth = function() {
  const daysSinceInteraction = (Date.now() - this.engagement.lastActiveAt) / (1000 * 60 * 60 * 24);
  
  if (daysSinceInteraction < 3) {
    this.relationship.health.status = 'thriving';
    this.relationship.health.churnRisk = 0;
  } else if (daysSinceInteraction < 7) {
    this.relationship.health.status = 'active';
    this.relationship.health.churnRisk = 10;
  } else if (daysSinceInteraction < 14) {
    this.relationship.health.status = 'cooling';
    this.relationship.health.churnRisk = 40;
  } else if (daysSinceInteraction < 30) {
    this.relationship.health.status = 'dormant';
    this.relationship.health.churnRisk = 70;
  } else {
    this.relationship.health.status = 'at_risk';
    this.relationship.health.churnRisk = 90;
  }
  
  this.relationship.health.daysSinceLastInteraction = Math.floor(daysSinceInteraction);
};

// STATICS

// Find connections for a creator
creatorConnectionSchema.statics.findCreatorConnections = function(creatorId, options = {}) {
  const query = { creator: creatorId, status: 'connected' };
  
  if (options.active) {
    query['relationship.health.status'] = { $in: ['thriving', 'active'] };
  }
  
  return this.find(query)
    .populate('member', 'username profileImage lastActive')
    .sort('-engagement.lastActiveAt');
};

// Find top spenders for creator
creatorConnectionSchema.statics.findTopSpenders = function(creatorId, limit = 10) {
  return this.find({ 
    creator: creatorId, 
    'monetization.totalRevenue': { $gt: 0 } 
  })
    .sort('-monetization.totalRevenue')
    .limit(limit)
    .populate('member', 'username profileImage');
};

// Find at-risk relationships
creatorConnectionSchema.statics.findAtRiskConnections = function(creatorId) {
  return this.find({
    creator: creatorId,
    'relationship.health.churnRisk': { $gte: 70 }
  })
    .populate('member', 'username profileImage lastActive');
};

module.exports = mongoose.model('CreatorConnection', creatorConnectionSchema);