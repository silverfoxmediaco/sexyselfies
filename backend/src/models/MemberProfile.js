const mongoose = require('mongoose');

const memberProfileSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    unique: true
  },
  
  // SPENDING & ANALYTICS DATA (for Creator CRM)
  spending: {
    tier: {
      type: String,
      enum: ['whale', 'high', 'medium', 'low', 'new'],
      default: 'new'
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0
    },
    last30DaySpend: {
      type: Number,
      default: 0,
      min: 0
    },
    last7DaySpend: {
      type: Number,
      default: 0,
      min: 0
    },
    averagePurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    largestPurchase: {
      type: Number,
      default: 0,
      min: 0
    },
    firstPurchaseDate: Date,
    lastPurchaseDate: Date,
    purchaseFrequency: {
      type: String,
      enum: ['daily', 'weekly', 'bi-weekly', 'monthly', 'rare', 'inactive'],
      default: 'inactive'
    }
  },
  
  // ACTIVITY & ENGAGEMENT METRICS
  activity: {
    engagementLevel: {
      type: String,
      enum: ['very-active', 'active', 'moderate', 'inactive'],
      default: 'inactive'
    },
    contentPurchases: {
      type: Number,
      default: 0,
      min: 0
    },
    tipsGiven: {
      type: Number,
      default: 0,
      min: 0
    },
    messagesExchanged: {
      type: Number,
      default: 0,
      min: 0
    },
    responseRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    averageSessionLength: {
      type: Number, // in minutes
      default: 0
    },
    loginStreak: {
      current: {
        type: Number,
        default: 0
      },
      longest: {
        type: Number,
        default: 0
      }
    }
  },
  
  // SUBSCRIPTION & MEMBERSHIP DATA
  subscription: {
    hasSubscribed: {
      type: Boolean,
      default: false
    },
    subscriptionTier: {
      type: String,
      enum: ['basic', 'premium', 'vip', 'elite'],
      default: null
    },
    subscriptionStartDate: Date,
    subscriptionEndDate: Date,
    autoRenew: {
      type: Boolean,
      default: false
    },
    subscriptionValue: {
      type: Number,
      default: 0
    }
  },
  
  // PREFERENCES & INTERESTS
  preferences: {
    categories: [{
      type: String,
      enum: ['Fitness', 'Lifestyle', 'Fashion', 'Art', 'Photography', 'Travel', 
             'Gaming', 'Anime', 'Music', 'Exclusive', 'VIP', 'Premium', 
             'Beginner', 'Explore', 'Live Shows', 'Educational', 'Comedy']
    }],
    contentTypes: [{
      type: String,
      enum: ['photos', 'videos', 'messages', 'live', 'stories']
    }],
    priceRange: {
      min: {
        type: Number,
        default: 1
      },
      max: {
        type: Number,
        default: 100
      }
    },
    favoriteContentType: {
      type: String,
      enum: ['Photos', 'Videos', 'Messages', 'Live Shows', 'Stories'],
      default: 'Photos'
    },
    communicationStyle: {
      type: String,
      enum: ['frequent', 'occasional', 'minimal'],
      default: 'occasional'
    }
  },
  
  // LOCATION & DEMOGRAPHICS
  demographics: {
    age: {
      type: Number,
      min: 18,
      max: 99
    },
    location: {
      city: String,
      state: String,
      country: {
        type: String,
        default: 'US'
      },
      coordinates: [Number] // [longitude, latitude]
    },
    timezone: String,
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // BADGES & ACHIEVEMENTS
  badges: [{
    type: String,
    enum: ['whale', 'big-spender', 'vip', 'loyal-fan', 'top-supporter', 
           'newcomer', 'supporter', 'engaged', 'night-owl', 'regular',
           'early-adopter', 'collector', 'generous-tipper', 'conversation-starter']
  }],
  
  // CRM NOTES & TAGS (for creators)
  crm: {
    notes: [{
      note: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator'
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      isPrivate: {
        type: Boolean,
        default: true
      }
    }],
    tags: [{
      type: String,
      enum: ['high-value', 'potential-churner', 'loyal', 'new-member', 
             'price-sensitive', 'quality-focused', 'frequent-buyer', 
             'tip-generous', 'chatty', 'quiet', 'weekend-active', 'night-owl']
    }],
    lastContactedBy: {
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator'
      },
      date: Date,
      method: {
        type: String,
        enum: ['message', 'offer', 'tip-request', 'custom-content']
      }
    },
    followUpReminders: [{
      creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Creator'
      },
      reminderDate: Date,
      reason: String,
      completed: {
        type: Boolean,
        default: false
      }
    }]
  },
  
  // RISK & RETENTION ANALYTICS
  analytics: {
    churnRisk: {
      level: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
      },
      reasons: [String],
      lastCalculated: Date
    },
    ltv: {
      estimated: Number, // Lifetime Value
      confidence: Number // 0-100
    },
    segments: [{
      type: String,
      enum: ['high-value', 'growth-potential', 'at-risk', 'new-member', 
             'loyal-customer', 'price-conscious', 'premium-seeker']
    }],
    predictedActions: [{
      action: String,
      probability: Number, // 0-100
      timeframe: String // 'week', 'month', etc.
    }]
  },
  
  // PRIVACY & SETTINGS
  privacy: {
    allowDataTracking: {
      type: Boolean,
      default: true
    },
    allowPersonalizedOffers: {
      type: Boolean,
      default: true
    },
    allowCommunication: {
      type: Boolean,
      default: true
    }
  },
  
  // PAYMENT & BILLING INFO
  billing: {
    preferredPaymentMethod: {
      type: String,
      enum: ['credit-card', 'paypal', 'crypto', 'bank-transfer']
    },
    billingCountry: String,
    hasPaymentIssues: {
      type: Boolean,
      default: false
    },
    lastPaymentDate: Date,
    failedPaymentAttempts: {
      type: Number,
      default: 0
    }
  }
  
}, {
  timestamps: true
});

// Indexes for creator CRM queries
memberProfileSchema.index({ 'spending.tier': 1 });
memberProfileSchema.index({ 'spending.totalSpent': -1 });
memberProfileSchema.index({ 'spending.last30DaySpend': -1 });
memberProfileSchema.index({ 'activity.engagementLevel': 1 });
memberProfileSchema.index({ 'activity.lastActive': -1 });
memberProfileSchema.index({ 'subscription.hasSubscribed': 1 });
memberProfileSchema.index({ 'analytics.churnRisk.level': 1 });
memberProfileSchema.index({ 'demographics.location.coordinates': '2dsphere' });

// Methods for CRM functionality
memberProfileSchema.methods.calculateSpendingTier = function() {
  const monthlySpend = this.spending.last30DaySpend;
  
  if (monthlySpend >= 500) {
    this.spending.tier = 'whale';
  } else if (monthlySpend >= 200) {
    this.spending.tier = 'high';
  } else if (monthlySpend >= 50) {
    this.spending.tier = 'medium';
  } else if (monthlySpend > 0) {
    this.spending.tier = 'low';
  } else {
    this.spending.tier = 'new';
  }
  
  return this.spending.tier;
};

memberProfileSchema.methods.calculateEngagementLevel = function() {
  const purchases = this.activity.contentPurchases;
  const messages = this.activity.messagesExchanged;
  const tips = this.activity.tipsGiven;
  
  const score = (purchases * 10) + (messages * 2) + (tips * 5);
  
  if (score >= 500) {
    this.activity.engagementLevel = 'very-active';
  } else if (score >= 200) {
    this.activity.engagementLevel = 'active';
  } else if (score >= 50) {
    this.activity.engagementLevel = 'moderate';
  } else {
    this.activity.engagementLevel = 'inactive';
  }
  
  return this.activity.engagementLevel;
};

memberProfileSchema.methods.assignBadges = function() {
  const badges = [];
  
  // Spending badges
  if (this.spending.tier === 'whale') badges.push('whale', 'big-spender');
  if (this.spending.tier === 'high') badges.push('vip', 'supporter');
  if (this.spending.totalSpent >= 1000) badges.push('loyal-fan');
  if (this.spending.totalSpent >= 5000) badges.push('top-supporter');
  
  // Activity badges
  if (this.activity.tipsGiven >= 20) badges.push('generous-tipper');
  if (this.activity.messagesExchanged >= 100) badges.push('conversation-starter');
  if (this.activity.engagementLevel === 'very-active') badges.push('engaged');
  
  // Time-based badges
  const memberAge = Date.now() - new Date(this.createdAt).getTime();
  const daysOld = memberAge / (1000 * 60 * 60 * 24);
  
  if (daysOld <= 7) badges.push('newcomer');
  if (daysOld >= 365) badges.push('loyal-fan');
  
  // Behavior badges
  if (this.activity.responseRate >= 90) badges.push('engaged');
  if (this.spending.purchaseFrequency === 'daily') badges.push('frequent-buyer');
  
  this.badges = [...new Set(badges)]; // Remove duplicates
  return this.badges;
};

memberProfileSchema.methods.calculateChurnRisk = function() {
  const daysSinceLastActive = (Date.now() - new Date(this.member.lastActive).getTime()) / (1000 * 60 * 60 * 24);
  const daysSinceLastPurchase = this.spending.lastPurchaseDate ? 
    (Date.now() - new Date(this.spending.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24) : 999;
  
  const reasons = [];
  let risk = 'low';
  
  if (daysSinceLastActive > 14) {
    reasons.push('Inactive for 2+ weeks');
    risk = 'medium';
  }
  
  if (daysSinceLastPurchase > 60) {
    reasons.push('No purchases in 60+ days');
    risk = 'high';
  }
  
  if (this.activity.engagementLevel === 'inactive') {
    reasons.push('Low engagement');
    risk = 'medium';
  }
  
  this.analytics.churnRisk = {
    level: risk,
    reasons: reasons,
    lastCalculated: new Date()
  };
  
  return this.analytics.churnRisk;
};

module.exports = mongoose.model('MemberProfile', memberProfileSchema);