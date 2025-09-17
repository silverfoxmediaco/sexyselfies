// models/MemberAnalytics.js
// MongoDB model for tracking member spending patterns, activity, and value metrics

const mongoose = require('mongoose');

const memberAnalyticsSchema = new mongoose.Schema(
  {
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      unique: true,
      index: true,
    },

    // ============================================
    // SPENDING METRICS
    // ============================================
    spending: {
      // Current period metrics
      last24Hours: {
        type: Number,
        default: 0,
        min: 0,
      },
      last7Days: {
        type: Number,
        default: 0,
        min: 0,
      },
      last30Days: {
        type: Number,
        default: 0,
        min: 0,
        index: true, // Index for quick whale identification
      },
      last90Days: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Lifetime metrics
      lifetime: {
        type: Number,
        default: 0,
        min: 0,
        index: true,
      },

      // Spending patterns
      averagePurchase: {
        type: Number,
        default: 0,
        min: 0,
      },
      highestPurchase: {
        type: Number,
        default: 0,
        min: 0,
      },
      lowestPurchase: {
        type: Number,
        default: 0,
        min: 0,
      },

      // Spending tier (calculated field)
      tier: {
        type: String,
        enum: ['whale', 'vip', 'regular', 'occasional', 'new'],
        default: 'new',
        index: true,
      },

      // Spending velocity (trending up/down)
      velocity: {
        trend: {
          type: String,
          enum: ['increasing', 'stable', 'decreasing', 'inactive'],
          default: 'stable',
        },
        percentageChange: {
          type: Number,
          default: 0,
        },
        lastCalculated: {
          type: Date,
          default: Date.now,
        },
      },
    },

    // ============================================
    // ACTIVITY METRICS
    // ============================================
    activity: {
      lastActive: {
        type: Date,
        default: Date.now,
        index: true,
      },
      lastPurchase: {
        type: Date,
        index: true,
      },

      // Activity frequency
      dailyAvgSessions: {
        type: Number,
        default: 0,
        min: 0,
      },
      weeklyActiveDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 7,
      },
      monthlyActiveDays: {
        type: Number,
        default: 0,
        min: 0,
        max: 31,
      },

      // Activity level classification
      level: {
        type: String,
        enum: ['very-active', 'active', 'regular', 'occasional', 'dormant'],
        default: 'regular',
        index: true,
      },

      // Session metrics
      avgSessionDuration: {
        type: Number, // in minutes
        default: 0,
        min: 0,
      },
      totalSessions: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // ============================================
    // CONTENT PREFERENCES
    // ============================================
    preferences: {
      // Primary content categories purchased
      topCategories: [
        {
          category: {
            type: String,
            required: true,
          },
          purchaseCount: {
            type: Number,
            default: 0,
          },
          totalSpent: {
            type: Number,
            default: 0,
          },
          lastPurchase: Date,
        },
      ],

      // Content type preferences
      contentTypes: {
        photos: {
          count: { type: Number, default: 0 },
          spent: { type: Number, default: 0 },
        },
        videos: {
          count: { type: Number, default: 0 },
          spent: { type: Number, default: 0 },
        },
        messages: {
          count: { type: Number, default: 0 },
          spent: { type: Number, default: 0 },
        },
        tips: {
          count: { type: Number, default: 0 },
          spent: { type: Number, default: 0 },
        },
        subscriptions: {
          count: { type: Number, default: 0 },
          spent: { type: Number, default: 0 },
        },
      },

      // Preferred price range
      priceRange: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
        sweet_spot: { type: Number, default: 0 }, // Most common purchase amount
      },

      // Purchase timing patterns
      purchaseTiming: {
        preferredDayOfWeek: {
          type: Number,
          min: 0,
          max: 6,
        },
        preferredTimeOfDay: {
          type: String,
          enum: ['morning', 'afternoon', 'evening', 'night'],
        },
        timezone: String,
      },
    },

    // ============================================
    // ENGAGEMENT METRICS
    // ============================================
    engagement: {
      // Creator interactions
      totalCreatorsEngaged: {
        type: Number,
        default: 0,
        min: 0,
      },
      favoriteCreators: [
        {
          creator: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Creator',
          },
          purchaseCount: {
            type: Number,
            default: 0,
          },
          totalSpent: {
            type: Number,
            default: 0,
          },
          lastInteraction: Date,
        },
      ],

      // Response metrics
      messageResponseRate: {
        type: Number,
        default: 0,
        min: 0,
        max: 100,
      },
      avgResponseTime: {
        type: Number, // in minutes
        default: 0,
        min: 0,
      },

      // Interaction counts
      interactions: {
        likes: { type: Number, default: 0 },
        comments: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        tips: { type: Number, default: 0 },
        messages: { type: Number, default: 0 },
      },
    },

    // ============================================
    // VALUE SCORING
    // ============================================
    scoring: {
      // Lifetime value prediction
      lifetimeValue: {
        predicted: {
          type: Number,
          default: 0,
        },
        confidence: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        lastCalculated: {
          type: Date,
          default: Date.now,
        },
      },

      // Churn risk assessment
      churnRisk: {
        score: {
          type: Number,
          min: 0,
          max: 100,
          default: 50,
        },
        level: {
          type: String,
          enum: ['very-low', 'low', 'medium', 'high', 'very-high'],
          default: 'medium',
        },
        factors: [String], // Reasons for score
        lastCalculated: {
          type: Date,
          default: Date.now,
        },
      },

      // Overall value score (0-100)
      valueScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
        index: true,
      },

      // Engagement score (0-100)
      engagementScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
    },

    // ============================================
    // SEGMENTATION
    // ============================================
    segments: {
      primary: {
        type: String,
        enum: [
          'whale',
          'vip',
          'regular',
          'potential',
          'at-risk',
          'dormant',
          'new',
        ],
        default: 'new',
        index: true,
      },
      secondary: [String], // Additional segments

      // Custom segments defined by creators
      custom: [
        {
          name: String,
          addedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Creator',
          },
          addedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },

    // ============================================
    // PRIVACY & SETTINGS
    // ============================================
    privacy: {
      discoverable: {
        type: Boolean,
        default: true,
      },
      showSpendingTier: {
        type: Boolean,
        default: true,
      },
      showActivity: {
        type: Boolean,
        default: true,
      },
      blockedCreators: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Creator',
        },
      ],
      allowBulkMessages: {
        type: Boolean,
        default: true,
      },
      allowSpecialOffers: {
        type: Boolean,
        default: true,
      },
    },

    // ============================================
    // METADATA
    // ============================================
    metadata: {
      firstPurchase: Date,
      lastPurchase: Date,
      totalPurchases: {
        type: Number,
        default: 0,
        min: 0,
      },
      lastUpdated: {
        type: Date,
        default: Date.now,
      },
      calculationVersion: {
        type: String,
        default: '1.0.0',
      },
    },
  },
  {
    timestamps: true,
    collection: 'member_analytics',
  }
);

// ============================================
// INDEXES
// ============================================

// Compound indexes for common queries
memberAnalyticsSchema.index({ 'spending.tier': 1, 'activity.level': 1 });
memberAnalyticsSchema.index({
  'segments.primary': 1,
  'spending.last30Days': -1,
});
memberAnalyticsSchema.index({
  'scoring.valueScore': -1,
  'privacy.discoverable': 1,
});
memberAnalyticsSchema.index({ member: 1, 'privacy.discoverable': 1 });

// ============================================
// METHODS
// ============================================

// Calculate spending tier based on last 30 days
memberAnalyticsSchema.methods.calculateSpendingTier = function () {
  const spending = this.spending.last30Days;

  if (spending >= 300) return 'whale';
  if (spending >= 100) return 'vip';
  if (spending >= 50) return 'regular';
  if (spending >= 10) return 'occasional';
  return 'new';
};

// Calculate activity level
memberAnalyticsSchema.methods.calculateActivityLevel = function () {
  const lastActive = this.activity.lastActive;
  const daysSinceActive = (Date.now() - lastActive) / (1000 * 60 * 60 * 24);
  const monthlyDays = this.activity.monthlyActiveDays;

  if (daysSinceActive <= 1 && monthlyDays >= 20) return 'very-active';
  if (daysSinceActive <= 7 && monthlyDays >= 10) return 'active';
  if (daysSinceActive <= 14 && monthlyDays >= 5) return 'regular';
  if (daysSinceActive <= 30) return 'occasional';
  return 'dormant';
};

// Calculate value score
memberAnalyticsSchema.methods.calculateValueScore = function () {
  const spendingWeight = 0.4;
  const activityWeight = 0.3;
  const engagementWeight = 0.3;

  // Normalize spending (0-100)
  const spendingScore = Math.min(100, (this.spending.last30Days / 500) * 100);

  // Normalize activity (0-100)
  const activityScore = Math.min(
    100,
    (this.activity.monthlyActiveDays / 30) * 100
  );

  // Normalize engagement (0-100)
  const engagementScore = this.scoring.engagementScore || 50;

  return Math.round(
    spendingScore * spendingWeight +
      activityScore * activityWeight +
      engagementScore * engagementWeight
  );
};

// Update spending metrics
memberAnalyticsSchema.methods.updateSpending = async function (
  amount,
  period = 'all'
) {
  const now = Date.now();

  // Update all time periods
  this.spending.lifetime += amount;
  this.spending.last24Hours += amount;
  this.spending.last7Days += amount;
  this.spending.last30Days += amount;
  this.spending.last90Days += amount;

  // Update average
  this.metadata.totalPurchases += 1;
  this.spending.averagePurchase =
    this.spending.lifetime / this.metadata.totalPurchases;

  // Update tier
  this.spending.tier = this.calculateSpendingTier();

  // Update metadata
  this.metadata.lastPurchase = now;
  if (!this.metadata.firstPurchase) {
    this.metadata.firstPurchase = now;
  }

  return this.save();
};

// ============================================
// STATICS
// ============================================

// Get high value members (whales and VIPs)
memberAnalyticsSchema.statics.getHighValueMembers = function (filters = {}) {
  const query = {
    'privacy.discoverable': true,
    'spending.tier': { $in: ['whale', 'vip'] },
    ...filters,
  };

  return this.find(query)
    .populate('member', 'username avatar')
    .sort('-spending.last30Days')
    .limit(filters.limit || 50);
};

// Get members by segment
memberAnalyticsSchema.statics.getBySegment = function (
  segment,
  creatorId = null
) {
  const query = {
    'privacy.discoverable': true,
    'segments.primary': segment,
  };

  if (creatorId) {
    query['privacy.blockedCreators'] = { $ne: creatorId };
  }

  return this.find(query)
    .populate('member', 'username avatar')
    .sort('-scoring.valueScore');
};

// Bulk update spending periods (scheduled job)
memberAnalyticsSchema.statics.updateSpendingPeriods = async function () {
  const now = new Date();
  const day24Ago = new Date(now - 24 * 60 * 60 * 1000);
  const days7Ago = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const days30Ago = new Date(now - 30 * 24 * 60 * 60 * 1000);
  const days90Ago = new Date(now - 90 * 24 * 60 * 60 * 1000);

  // This would aggregate from transaction history
  // Placeholder for the actual implementation
  console.log('Updating spending periods for all members...');
};

// ============================================
// HOOKS
// ============================================

// Auto-update calculations before save
memberAnalyticsSchema.pre('save', function (next) {
  this.spending.tier = this.calculateSpendingTier();
  this.activity.level = this.calculateActivityLevel();
  this.scoring.valueScore = this.calculateValueScore();
  this.metadata.lastUpdated = Date.now();
  next();
});

// Create model
const MemberAnalytics = mongoose.model(
  'MemberAnalytics',
  memberAnalyticsSchema
);

module.exports = MemberAnalytics;
