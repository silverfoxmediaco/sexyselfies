// backend/src/models/MemberInteraction.js
// MongoDB model for tracking all interactions between creators and members

const mongoose = require('mongoose');

const memberInteractionSchema = new mongoose.Schema(
  {
    // ============================================
    // CORE RELATIONSHIPS
    // ============================================
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
      index: true,
    },

    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },

    // ============================================
    // INTERACTION TYPE & DETAILS
    // ============================================
    interactionType: {
      type: String,
      enum: [
        'poke', // Gentle nudge
        'like', // Liked member profile
        'message', // Direct message sent
        'special_offer', // Special offer sent
        'profile_view', // Viewed member profile
        'bulk_message', // Part of bulk outreach
        'response', // Member responded
        'purchase', // Member made purchase after interaction
        'tip_received', // Member sent tip after interaction
      ],
      required: true,
      index: true,
    },

    // ============================================
    // MESSAGE DETAILS (if applicable)
    // ============================================
    message: {
      content: {
        type: String,
        maxlength: 1000,
      },

      // Message metadata
      isPersonalized: {
        type: Boolean,
        default: false,
      },

      // Template used (if any)
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MessageTemplate',
      },

      // Attachments
      attachments: [
        {
          type: {
            type: String,
            enum: ['photo', 'video', 'audio'],
            required: true,
          },
          url: String,
          thumbnail: String,
          duration: Number, // For video/audio
          size: Number, // In bytes
        },
      ],

      // Call to action included
      callToAction: {
        type: String,
        enum: [
          'none',
          'view_profile',
          'check_content',
          'special_offer',
          'subscribe',
        ],
        default: 'none',
      },
    },

    // ============================================
    // SPECIAL OFFER DETAILS (if applicable)
    // ============================================
    specialOffer: {
      offerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SpecialOffer',
      },

      offerType: {
        type: String,
        enum: [
          'discount',
          'bundle',
          'exclusive',
          'free_preview',
          'time_limited',
        ],
      },

      // Discount details
      discount: {
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        amount: {
          type: Number,
          min: 0,
        },
      },

      // Content included
      contentIds: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Content',
        },
      ],

      // Offer expiration
      expiresAt: Date,

      // Redemption tracking
      wasRedeemed: {
        type: Boolean,
        default: false,
      },
      redeemedAt: Date,
      redemptionValue: Number,
    },

    // ============================================
    // RESPONSE & ENGAGEMENT
    // ============================================
    response: {
      // Member's response
      hasResponded: {
        type: Boolean,
        default: false,
        index: true,
      },

      respondedAt: Date,

      responseType: {
        type: String,
        enum: ['message', 'like_back', 'purchase', 'tip', 'ignore', 'block'],
      },

      responseMessage: String,

      // Response sentiment (if analyzed)
      sentiment: {
        type: String,
        enum: ['positive', 'neutral', 'negative'],
        default: 'neutral',
      },

      // Time to response (in minutes)
      responseTime: {
        type: Number,
        min: 0,
      },
    },

    // ============================================
    // CONVERSION TRACKING
    // ============================================
    conversion: {
      // Did this interaction lead to a purchase?
      resulted_in_purchase: {
        type: Boolean,
        default: false,
        index: true,
      },

      // Purchase details
      purchaseAmount: {
        type: Number,
        min: 0,
      },

      purchaseDate: Date,

      // Content purchased
      purchasedContent: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Content',
        },
      ],

      // Time from interaction to purchase (in hours)
      timeToConversion: {
        type: Number,
        min: 0,
      },

      // Attribution confidence (0-100)
      attributionConfidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },
    },

    // ============================================
    // CONTEXT & TIMING
    // ============================================
    context: {
      // Where/how was member discovered
      source: {
        type: String,
        enum: [
          'member_discovery', // Active sales browse
          'analytics_suggestion', // AI recommended
          'high_value_alert', // System alert for whale
          'returning_member', // Previous customer
          'at_risk_alert', // Churn prevention
          'manual_search', // Creator searched
          'bulk_campaign', // Part of campaign
        ],
        default: 'member_discovery',
      },

      // Member's state when contacted
      memberState: {
        spendingTier: {
          type: String,
          enum: ['whale', 'vip', 'regular', 'occasional', 'new'],
        },
        activityLevel: {
          type: String,
          enum: ['very-active', 'active', 'regular', 'occasional', 'dormant'],
        },
        lastActiveHours: Number,
        previousPurchases: Number,
        lifetimeValue: Number,
      },

      // Campaign tracking
      campaign: {
        campaignId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Campaign',
        },
        campaignName: String,
        variant: String, // A/B testing
      },
    },

    // ============================================
    // EFFECTIVENESS SCORING
    // ============================================
    effectiveness: {
      // Interaction quality score (0-100)
      qualityScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50,
      },

      // Factors affecting effectiveness
      factors: {
        timing: {
          type: Number,
          min: 0,
          max: 100,
        }, // Was timing good?
        personalization: {
          type: Number,
          min: 0,
          max: 100,
        }, // How personalized?
        relevance: {
          type: Number,
          min: 0,
          max: 100,
        }, // Content relevance
        frequency: {
          type: Number,
          min: 0,
          max: 100,
        }, // Not too many/few interactions
      },

      // ROI calculation
      roi: {
        investment: Number, // Cost of interaction (time, credits, etc.)
        return: Number, // Revenue generated
        percentage: Number, // ROI percentage
      },
    },

    // ============================================
    // LIMITS & COMPLIANCE
    // ============================================
    compliance: {
      // Rate limiting
      dailyInteractionNumber: {
        type: Number,
        default: 1,
      },

      // Member preferences respected
      respectedOptOut: {
        type: Boolean,
        default: true,
      },

      // Spam score (0-100, lower is better)
      spamScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0,
      },

      // Compliance flags
      flags: [
        {
          type: String,
          enum: [
            'too_frequent',
            'ignored_opt_out',
            'inappropriate_content',
            'reported_spam',
          ],
        },
      ],
    },

    // ============================================
    // METADATA
    // ============================================
    metadata: {
      // Device/platform info
      platform: {
        type: String,
        enum: ['web', 'ios', 'android', 'api'],
        default: 'web',
      },

      // IP for rate limiting (hashed)
      ipHash: String,

      // User agent for analytics
      userAgent: String,

      // Version tracking
      appVersion: String,

      // Custom tracking data
      customData: mongoose.Schema.Types.Mixed,
    },

    // ============================================
    // STATUS & WORKFLOW
    // ============================================
    status: {
      current: {
        type: String,
        enum: [
          'sent', // Initial state
          'delivered', // Confirmed delivered
          'read', // Member viewed
          'responded', // Member responded
          'converted', // Led to purchase
          'expired', // Offer expired
          'failed', // Delivery failed
          'blocked', // Member blocked creator
        ],
        default: 'sent',
        index: true,
      },

      // Status history
      history: [
        {
          status: String,
          timestamp: {
            type: Date,
            default: Date.now,
          },
          notes: String,
        },
      ],

      // Delivery confirmation
      deliveredAt: Date,
      readAt: Date,

      // Error handling
      error: {
        hasError: {
          type: Boolean,
          default: false,
        },
        errorMessage: String,
        errorCode: String,
        retryCount: {
          type: Number,
          default: 0,
        },
        lastRetry: Date,
      },
    },
  },
  {
    timestamps: true,
    collection: 'member_interactions',
  }
);

// ============================================
// INDEXES
// ============================================

// Compound indexes for common queries
memberInteractionSchema.index({ creator: 1, member: 1, createdAt: -1 });
memberInteractionSchema.index({ member: 1, interactionType: 1, createdAt: -1 });
memberInteractionSchema.index({
  creator: 1,
  'status.current': 1,
  createdAt: -1,
});
memberInteractionSchema.index({
  creator: 1,
  'conversion.resulted_in_purchase': 1,
});
memberInteractionSchema.index({
  'specialOffer.expiresAt': 1,
  'specialOffer.wasRedeemed': 1,
});

// Text index for message search
memberInteractionSchema.index({ 'message.content': 'text' });

// ============================================
// METHODS
// ============================================

// Mark as read
memberInteractionSchema.methods.markAsRead = function () {
  this.status.current = 'read';
  this.status.readAt = new Date();
  this.status.history.push({
    status: 'read',
    timestamp: new Date(),
  });
  return this.save();
};

// Record response
memberInteractionSchema.methods.recordResponse = function (
  responseType,
  message = null
) {
  const now = new Date();
  const responseTimeMinutes = Math.round((now - this.createdAt) / 60000);

  this.response = {
    hasResponded: true,
    respondedAt: now,
    responseType: responseType,
    responseMessage: message,
    responseTime: responseTimeMinutes,
  };

  this.status.current = 'responded';
  this.status.history.push({
    status: 'responded',
    timestamp: now,
  });

  return this.save();
};

// Record conversion
memberInteractionSchema.methods.recordConversion = function (purchaseData) {
  const now = new Date();
  const hoursToConversion = Math.round((now - this.createdAt) / 3600000);

  this.conversion = {
    resulted_in_purchase: true,
    purchaseAmount: purchaseData.amount,
    purchaseDate: now,
    purchasedContent: purchaseData.contentIds,
    timeToConversion: hoursToConversion,
    attributionConfidence: purchaseData.confidence || 75,
  };

  this.status.current = 'converted';
  this.status.history.push({
    status: 'converted',
    timestamp: now,
    notes: `Purchase of $${purchaseData.amount}`,
  });

  // Update ROI
  if (this.effectiveness.roi.investment) {
    this.effectiveness.roi.return = purchaseData.amount;
    this.effectiveness.roi.percentage =
      ((purchaseData.amount - this.effectiveness.roi.investment) /
        this.effectiveness.roi.investment) *
      100;
  }

  return this.save();
};

// Calculate effectiveness score
memberInteractionSchema.methods.calculateEffectiveness = function () {
  let score = 50; // Base score

  // Increase for response
  if (this.response.hasResponded) {
    score += 20;
    if (
      this.response.responseType === 'message' ||
      this.response.responseType === 'purchase'
    ) {
      score += 10;
    }
  }

  // Increase for conversion
  if (this.conversion.resulted_in_purchase) {
    score += 30;
  }

  // Decrease for being marked as spam
  if (this.compliance.spamScore > 50) {
    score -= 20;
  }

  // Factor in response time (faster is better)
  if (this.response.responseTime && this.response.responseTime < 60) {
    score += 5;
  }

  this.effectiveness.qualityScore = Math.min(100, Math.max(0, score));
  return this.effectiveness.qualityScore;
};

// ============================================
// STATICS
// ============================================

// Get creator's recent interactions
memberInteractionSchema.statics.getCreatorInteractions = function (
  creatorId,
  options = {}
) {
  const query = { creator: creatorId };

  if (options.type) {
    query.interactionType = options.type;
  }

  if (options.status) {
    query['status.current'] = options.status;
  }

  if (options.converted !== undefined) {
    query['conversion.resulted_in_purchase'] = options.converted;
  }

  return this.find(query)
    .populate('member', 'username avatar')
    .sort('-createdAt')
    .limit(options.limit || 50);
};

// Get member's interaction history
memberInteractionSchema.statics.getMemberHistory = function (
  memberId,
  creatorId = null
) {
  const query = { member: memberId };

  if (creatorId) {
    query.creator = creatorId;
  }

  return this.find(query)
    .populate('creator', 'username profileImage')
    .sort('-createdAt');
};

// Calculate creator's conversion rate
memberInteractionSchema.statics.getConversionRate = async function (
  creatorId,
  days = 30
) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        creator: mongoose.Types.ObjectId(creatorId),
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        conversions: {
          $sum: { $cond: ['$conversion.resulted_in_purchase', 1, 0] },
        },
        revenue: {
          $sum: { $ifNull: ['$conversion.purchaseAmount', 0] },
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return { rate: 0, total: 0, conversions: 0, revenue: 0 };
  }

  const { total, conversions, revenue } = stats[0];
  return {
    rate: (conversions / total) * 100,
    total,
    conversions,
    revenue,
  };
};

// Get best performing interaction types
memberInteractionSchema.statics.getBestPerformingTypes = async function (
  creatorId
) {
  return this.aggregate([
    {
      $match: {
        creator: mongoose.Types.ObjectId(creatorId),
        'conversion.resulted_in_purchase': true,
      },
    },
    {
      $group: {
        _id: '$interactionType',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$conversion.purchaseAmount' },
        avgRevenue: { $avg: '$conversion.purchaseAmount' },
        avgTimeToConversion: { $avg: '$conversion.timeToConversion' },
      },
    },
    {
      $sort: { totalRevenue: -1 },
    },
  ]);
};

// Check daily interaction limit
memberInteractionSchema.statics.checkDailyLimit = async function (
  creatorId,
  limit = 100
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const count = await this.countDocuments({
    creator: creatorId,
    createdAt: { $gte: today },
  });

  return {
    used: count,
    remaining: Math.max(0, limit - count),
    exceeded: count >= limit,
  };
};

// ============================================
// HOOKS
// ============================================

// Before save - calculate effectiveness
memberInteractionSchema.pre('save', function (next) {
  if (this.isModified('response') || this.isModified('conversion')) {
    this.calculateEffectiveness();
  }
  next();
});

// After save - update member analytics
memberInteractionSchema.post('save', async function (doc) {
  // Update member's analytics based on interaction
  const MemberAnalytics = require('./MemberAnalytics');

  try {
    const analytics = await MemberAnalytics.findOne({ member: doc.member });
    if (analytics) {
      // Update engagement metrics
      analytics.engagement.interactions[doc.interactionType] =
        (analytics.engagement.interactions[doc.interactionType] || 0) + 1;

      // Update favorite creators if converted
      if (doc.conversion.resulted_in_purchase) {
        const creatorIndex = analytics.engagement.favoriteCreators.findIndex(
          fc => fc.creator.toString() === doc.creator.toString()
        );

        if (creatorIndex >= 0) {
          analytics.engagement.favoriteCreators[creatorIndex].purchaseCount +=
            1;
          analytics.engagement.favoriteCreators[creatorIndex].totalSpent +=
            doc.conversion.purchaseAmount;
        } else {
          analytics.engagement.favoriteCreators.push({
            creator: doc.creator,
            purchaseCount: 1,
            totalSpent: doc.conversion.purchaseAmount,
            lastInteraction: new Date(),
          });
        }
      }

      await analytics.save();
    }
  } catch (error) {
    console.error('Error updating member analytics:', error);
  }
});

// Create model
const MemberInteraction = mongoose.model(
  'MemberInteraction',
  memberInteractionSchema
);

module.exports = MemberInteraction;
