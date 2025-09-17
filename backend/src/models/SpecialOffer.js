// backend/src/models/SpecialOffer.js
// MongoDB model for special offers creators send to high-value members

const mongoose = require('mongoose');

const specialOfferSchema = new mongoose.Schema(
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

    // Target audience
    recipients: {
      // Specific members targeted
      members: [
        {
          member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
            required: true,
          },
          sentAt: {
            type: Date,
            default: Date.now,
          },
          viewedAt: Date,
          redeemedAt: Date,
          status: {
            type: String,
            enum: ['pending', 'viewed', 'redeemed', 'expired', 'declined'],
            default: 'pending',
          },
        },
      ],

      // Segment targeting
      segments: [
        {
          type: String,
          enum: [
            'whale',
            'vip',
            'regular',
            'potential',
            'at-risk',
            'returning',
            'new',
          ],
        },
      ],

      // Targeting criteria
      criteria: {
        minSpending30Days: Number,
        maxSpending30Days: Number,
        activityLevel: [String],
        lastPurchaseDaysAgo: Number,
        hasInteractedBefore: Boolean,
        customTags: [String],
      },

      // Recipient counts
      totalRecipients: {
        type: Number,
        default: 0,
        min: 0,
      },
      maxRecipients: {
        type: Number,
        default: 100, // Prevent spam
      },
    },

    // ============================================
    // OFFER DETAILS
    // ============================================
    offer: {
      // Offer identification
      name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100,
      },

      code: {
        type: String,
        unique: true,
        sparse: true,
        uppercase: true,
        trim: true,
      },

      // Offer type
      type: {
        type: String,
        enum: [
          'percentage_discount', // X% off
          'fixed_discount', // $X off
          'bundle_deal', // Multiple items
          'bogo', // Buy one get one
          'free_content', // Free access
          'exclusive_content', // VIP only content
          'early_access', // See content early
          'custom_content', // Personalized content
          'subscription_discount', // Recurring discount
          'tip_match', // Match tips up to X
        ],
        required: true,
        index: true,
      },

      // Discount details
      discount: {
        percentage: {
          type: Number,
          min: 0,
          max: 100,
        },
        fixedAmount: {
          type: Number,
          min: 0,
        },
        maxDiscountAmount: {
          type: Number,
          min: 0,
        },
      },

      // Content included in offer
      content: {
        // Specific content items
        items: [
          {
            contentId: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'Content',
            },
            contentType: {
              type: String,
              enum: [
                'photo',
                'video',
                'photoset',
                'videoset',
                'live',
                'message',
              ],
            },
            originalPrice: Number,
            offerPrice: Number,
            isFree: {
              type: Boolean,
              default: false,
            },
          },
        ],

        // Bundle details
        bundle: {
          name: String,
          totalValue: Number,
          bundlePrice: Number,
          savings: Number,
          itemCount: Number,
        },

        // Content categories included
        categories: [String],

        // Minimum purchase requirement
        minimumPurchase: {
          type: Number,
          default: 0,
          min: 0,
        },
      },

      // Custom message to members
      message: {
        subject: {
          type: String,
          maxlength: 100,
        },
        body: {
          type: String,
          required: true,
          maxlength: 1000,
        },
        callToAction: {
          type: String,
          default: 'Claim Offer',
          maxlength: 50,
        },
        preview: {
          type: String,
          maxlength: 200,
        },
      },

      // Visual elements
      media: {
        coverImage: String,
        thumbnail: String,
        previewImages: [String],
        teaser: {
          url: String,
          duration: Number, // For video teasers
        },
      },
    },

    // ============================================
    // VALIDITY & RESTRICTIONS
    // ============================================
    validity: {
      startDate: {
        type: Date,
        default: Date.now,
        index: true,
      },

      endDate: {
        type: Date,
        required: true,
        index: true,
      },

      // Usage limits
      usageLimit: {
        perMember: {
          type: Number,
          default: 1,
          min: 1,
        },
        total: {
          type: Number,
          min: 1,
        },
      },

      // Time restrictions
      timeRestrictions: {
        daysOfWeek: [Number], // 0-6, Sunday-Saturday
        hoursOfDay: [
          {
            start: Number, // 0-23
            end: Number,
          },
        ],
        timezone: {
          type: String,
          default: 'UTC',
        },
      },

      // Conditions
      conditions: {
        requiresNewPurchase: {
          type: Boolean,
          default: true,
        },
        requiresSubscription: {
          type: Boolean,
          default: false,
        },
        minimumMemberAge: {
          type: Number,
          default: 0, // Days since joining
        },
        excludesPreviousCustomers: {
          type: Boolean,
          default: false,
        },
      },
    },

    // ============================================
    // PERFORMANCE TRACKING
    // ============================================
    performance: {
      // Engagement metrics
      metrics: {
        sent: {
          type: Number,
          default: 0,
          min: 0,
        },
        delivered: {
          type: Number,
          default: 0,
          min: 0,
        },
        viewed: {
          type: Number,
          default: 0,
          min: 0,
        },
        clicked: {
          type: Number,
          default: 0,
          min: 0,
        },
        redeemed: {
          type: Number,
          default: 0,
          min: 0,
        },
        declined: {
          type: Number,
          default: 0,
          min: 0,
        },
      },

      // Conversion rates
      rates: {
        viewRate: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        clickRate: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
        conversionRate: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
      },

      // Revenue tracking
      revenue: {
        gross: {
          type: Number,
          default: 0,
          min: 0,
        },
        discountGiven: {
          type: Number,
          default: 0,
          min: 0,
        },
        net: {
          type: Number,
          default: 0,
          min: 0,
        },
        averageOrderValue: {
          type: Number,
          default: 0,
          min: 0,
        },
      },

      // ROI calculation
      roi: {
        cost: {
          type: Number,
          default: 0,
          min: 0,
        }, // Cost to create/send
        revenue: {
          type: Number,
          default: 0,
          min: 0,
        },
        percentage: Number,
        isPositive: {
          type: Boolean,
          default: false,
        },
      },

      // Best performing segments
      topSegments: [
        {
          segment: String,
          conversionRate: Number,
          revenue: Number,
        },
      ],
    },

    // ============================================
    // REDEMPTION TRACKING
    // ============================================
    redemptions: [
      {
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Member',
          required: true,
        },

        redeemedAt: {
          type: Date,
          default: Date.now,
        },

        // Transaction details
        transaction: {
          transactionId: String,
          originalAmount: Number,
          discountAmount: Number,
          finalAmount: Number,
          paymentMethod: String,
        },

        // Content accessed
        contentAccessed: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Content',
          },
        ],

        // Device/platform
        platform: {
          type: String,
          enum: ['web', 'ios', 'android'],
        },

        // Attribution
        source: {
          type: String,
          enum: ['email', 'push', 'in-app', 'direct'],
        },
      },
    ],

    // ============================================
    // A/B TESTING
    // ============================================
    testing: {
      isTest: {
        type: Boolean,
        default: false,
      },

      testGroup: {
        type: String,
        enum: ['control', 'variant_a', 'variant_b', 'variant_c'],
      },

      // What's being tested
      testVariables: [
        {
          variable: {
            type: String,
            enum: ['discount_amount', 'message', 'timing', 'content', 'cta'],
          },
          value: mongoose.Schema.Types.Mixed,
        },
      ],

      // Test results
      testResults: {
        winner: String,
        confidence: Number,
        notes: String,
      },
    },

    // ============================================
    // STATUS & WORKFLOW
    // ============================================
    status: {
      current: {
        type: String,
        enum: [
          'draft', // Being created
          'scheduled', // Ready to send
          'active', // Currently running
          'paused', // Temporarily stopped
          'completed', // Ended successfully
          'cancelled', // Manually stopped
          'expired', // Past end date
        ],
        default: 'draft',
        index: true,
      },

      // Approval workflow
      approval: {
        required: {
          type: Boolean,
          default: false,
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
        },
        approvedAt: Date,
        notes: String,
      },

      // Status history
      history: [
        {
          status: String,
          changedAt: {
            type: Date,
            default: Date.now,
          },
          changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'status.history.changedByModel',
          },
          changedByModel: {
            type: String,
            enum: ['Creator', 'Admin', 'System'],
          },
          reason: String,
        },
      ],
    },

    // ============================================
    // AUTOMATION & TRIGGERS
    // ============================================
    automation: {
      // Auto-send triggers
      triggers: [
        {
          type: {
            type: String,
            enum: [
              'member_inactive', // X days inactive
              'abandoned_cart', // Started purchase but didn't complete
              'birthday', // Member's birthday
              'anniversary', // Join anniversary
              'spending_milestone', // Reached spending level
              'content_viewed', // Viewed but didn't buy
              'competitor_active', // Active with similar creators
            ],
          },
          conditions: mongoose.Schema.Types.Mixed,
          delay: Number, // Hours to wait after trigger
        },
      ],

      // Follow-up actions
      followUp: {
        enabled: {
          type: Boolean,
          default: false,
        },
        actions: [
          {
            type: {
              type: String,
              enum: ['reminder', 'new_offer', 'thank_you', 'feedback_request'],
            },
            delay: Number, // Hours after redemption/expiry
            template: String,
          },
        ],
      },
    },

    // ============================================
    // METADATA
    // ============================================
    metadata: {
      // Creation context
      createdVia: {
        type: String,
        enum: ['manual', 'automated', 'bulk', 'api', 'scheduled'],
        default: 'manual',
      },

      // Template used
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'OfferTemplate',
      },

      // Campaign association
      campaignId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campaign',
      },

      // Tags for organization
      tags: [String],

      // Internal notes
      notes: {
        type: String,
        maxlength: 500,
      },

      // Analytics tracking
      analytics: {
        utmSource: String,
        utmMedium: String,
        utmCampaign: String,
        customParams: mongoose.Schema.Types.Mixed,
      },
    },
  },
  {
    timestamps: true,
    collection: 'special_offers',
  }
);

// ============================================
// INDEXES
// ============================================

// Compound indexes for queries
specialOfferSchema.index({
  creator: 1,
  'status.current': 1,
  'validity.endDate': -1,
});
specialOfferSchema.index({
  'recipients.members.member': 1,
  'status.current': 1,
});
specialOfferSchema.index({ 'offer.code': 1, 'validity.endDate': -1 });
specialOfferSchema.index({ creator: 1, 'performance.roi.percentage': -1 });

// ============================================
// VIRTUAL FIELDS
// ============================================

// Check if offer is currently valid
specialOfferSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.status.current === 'active' &&
    now >= this.validity.startDate &&
    now <= this.validity.endDate
  );
});

// Calculate days remaining
specialOfferSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const msRemaining = this.validity.endDate - now;
  return Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));
});

// Calculate actual discount percentage
specialOfferSchema.virtual('effectiveDiscount').get(function () {
  if (this.offer.type === 'percentage_discount') {
    return this.offer.discount.percentage;
  } else if (
    this.offer.type === 'fixed_discount' &&
    this.offer.content.bundle
  ) {
    return (
      (this.offer.discount.fixedAmount / this.offer.content.bundle.totalValue) *
      100
    );
  }
  return 0;
});

// ============================================
// METHODS
// ============================================

// Send offer to member
specialOfferSchema.methods.sendToMember = async function (memberId) {
  // Check if already sent
  const existing = this.recipients.members.find(
    r => r.member.toString() === memberId.toString()
  );

  if (existing) {
    return { success: false, message: 'Offer already sent to this member' };
  }

  // Check limits
  if (this.recipients.totalRecipients >= this.recipients.maxRecipients) {
    return { success: false, message: 'Recipient limit reached' };
  }

  // Add recipient
  this.recipients.members.push({
    member: memberId,
    sentAt: new Date(),
    status: 'pending',
  });

  this.recipients.totalRecipients += 1;
  this.performance.metrics.sent += 1;

  await this.save();

  // Trigger notification (would be actual notification service)
  await this.notifyMember(memberId);

  return { success: true, message: 'Offer sent successfully' };
};

// Record view
specialOfferSchema.methods.recordView = async function (memberId) {
  const recipient = this.recipients.members.find(
    r => r.member.toString() === memberId.toString()
  );

  if (recipient && !recipient.viewedAt) {
    recipient.viewedAt = new Date();
    recipient.status = 'viewed';
    this.performance.metrics.viewed += 1;
    this.performance.rates.viewRate =
      (this.performance.metrics.viewed / this.performance.metrics.sent) * 100;

    await this.save();
  }
};

// Record redemption
specialOfferSchema.methods.recordRedemption = async function (redemptionData) {
  const {
    memberId,
    transactionId,
    originalAmount,
    discountAmount,
    finalAmount,
  } = redemptionData;

  // Update recipient status
  const recipient = this.recipients.members.find(
    r => r.member.toString() === memberId.toString()
  );

  if (recipient) {
    recipient.redeemedAt = new Date();
    recipient.status = 'redeemed';
  }

  // Add redemption record
  this.redemptions.push({
    member: memberId,
    transaction: {
      transactionId,
      originalAmount,
      discountAmount,
      finalAmount,
    },
  });

  // Update metrics
  this.performance.metrics.redeemed += 1;
  this.performance.rates.conversionRate =
    (this.performance.metrics.redeemed / this.performance.metrics.sent) * 100;

  // Update revenue
  this.performance.revenue.gross += originalAmount;
  this.performance.revenue.discountGiven += discountAmount;
  this.performance.revenue.net += finalAmount;
  this.performance.revenue.averageOrderValue =
    this.performance.revenue.net / this.performance.metrics.redeemed;

  // Update ROI
  this.performance.roi.revenue = this.performance.revenue.net;
  if (this.performance.roi.cost > 0) {
    this.performance.roi.percentage =
      ((this.performance.roi.revenue - this.performance.roi.cost) /
        this.performance.roi.cost) *
      100;
    this.performance.roi.isPositive = this.performance.roi.percentage > 0;
  }

  await this.save();

  return { success: true };
};

// Calculate performance score
specialOfferSchema.methods.calculatePerformanceScore = function () {
  let score = 0;

  // Conversion rate (40% weight)
  score += (this.performance.rates.conversionRate || 0) * 0.4;

  // ROI (30% weight)
  if (this.performance.roi.isPositive) {
    score += Math.min(30, this.performance.roi.percentage * 0.3);
  }

  // View rate (20% weight)
  score += (this.performance.rates.viewRate || 0) * 0.2;

  // Average order value (10% weight)
  const aovScore = Math.min(
    10,
    (this.performance.revenue.averageOrderValue / 100) * 10
  );
  score += aovScore;

  return Math.round(score);
};

// Check if can be redeemed by member
specialOfferSchema.methods.canBeRedeemedBy = async function (memberId) {
  // Check if valid
  if (!this.isValid) {
    return { canRedeem: false, reason: 'Offer expired or inactive' };
  }

  // Check if sent to member
  const recipient = this.recipients.members.find(
    r => r.member.toString() === memberId.toString()
  );

  if (!recipient) {
    return { canRedeem: false, reason: 'Offer not available for this member' };
  }

  // Check if already redeemed
  if (recipient.status === 'redeemed') {
    const redemptionCount = this.redemptions.filter(
      r => r.member.toString() === memberId.toString()
    ).length;

    if (redemptionCount >= this.validity.usageLimit.perMember) {
      return { canRedeem: false, reason: 'Redemption limit reached' };
    }
  }

  // Check total usage limit
  if (
    this.validity.usageLimit.total &&
    this.performance.metrics.redeemed >= this.validity.usageLimit.total
  ) {
    return { canRedeem: false, reason: 'Offer fully redeemed' };
  }

  return { canRedeem: true };
};

// ============================================
// STATICS
// ============================================

// Get active offers for creator
specialOfferSchema.statics.getActiveOffers = function (creatorId) {
  const now = new Date();

  return this.find({
    creator: creatorId,
    'status.current': 'active',
    'validity.startDate': { $lte: now },
    'validity.endDate': { $gte: now },
  }).sort('-performance.rates.conversionRate');
};

// Get offers for member
specialOfferSchema.statics.getMemberOffers = function (memberId) {
  const now = new Date();

  return this.find({
    'recipients.members.member': memberId,
    'status.current': 'active',
    'validity.endDate': { $gte: now },
  })
    .populate('creator', 'username profileImage')
    .sort('-createdAt');
};

// Get best performing offers
specialOfferSchema.statics.getTopPerformers = async function (
  creatorId,
  limit = 10
) {
  return this.find({
    creator: creatorId,
    'performance.metrics.redeemed': { $gt: 0 },
  })
    .sort('-performance.roi.percentage -performance.rates.conversionRate')
    .limit(limit);
};

// Get offer templates for creator
specialOfferSchema.statics.getSuggestedOffers = async function (
  creatorId,
  memberSegment
) {
  // This would use ML to suggest best offers based on segment
  const suggestions = {
    whale: {
      type: 'exclusive_content',
      discount: { percentage: 20 },
      message: 'Exclusive VIP content just for you!',
    },
    vip: {
      type: 'bundle_deal',
      discount: { percentage: 30 },
      message: 'Special bundle deal for our valued members!',
    },
    at_risk: {
      type: 'percentage_discount',
      discount: { percentage: 50 },
      message: "We've missed you! Here's 50% off to welcome you back!",
    },
    new: {
      type: 'free_content',
      message: 'Welcome! Enjoy this free content on us!',
    },
  };

  return suggestions[memberSegment] || suggestions.new;
};

// ============================================
// HOOKS
// ============================================

// Before save - update status
specialOfferSchema.pre('save', function (next) {
  const now = new Date();

  // Auto-update status based on dates
  if (this.validity.endDate < now && this.status.current === 'active') {
    this.status.current = 'expired';
    this.status.history.push({
      status: 'expired',
      changedAt: now,
      changedByModel: 'System',
      reason: 'Validity period ended',
    });
  } else if (
    this.validity.startDate <= now &&
    this.validity.endDate >= now &&
    this.status.current === 'scheduled'
  ) {
    this.status.current = 'active';
    this.status.history.push({
      status: 'active',
      changedAt: now,
      changedByModel: 'System',
      reason: 'Scheduled start time reached',
    });
  }

  next();
});

// After save - schedule notifications
specialOfferSchema.post('save', async function (doc) {
  if (doc.status.current === 'active' && doc.recipients.members.length > 0) {
    // Schedule notifications for pending recipients
    const pendingRecipients = doc.recipients.members.filter(
      r => r.status === 'pending'
    );

    // This would integrate with notification service
    console.log(
      `Scheduling notifications for ${pendingRecipients.length} recipients`
    );
  }
});

// Method to notify member (placeholder)
specialOfferSchema.methods.notifyMember = async function (memberId) {
  // This would integrate with actual notification service
  console.log(`Notifying member ${memberId} about offer ${this._id}`);
  return true;
};

// Create model
const SpecialOffer = mongoose.model('SpecialOffer', specialOfferSchema);

module.exports = SpecialOffer;
