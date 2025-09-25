const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema(
  {
    // Core relationships
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
    },
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      required: true,
    },

    // Enhanced tracking (team suggestions)
    contentType: {
      type: String,
      enum: ['image', 'video', 'audio', 'text'],
      required: true,
    },
    originalPrice: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // Gift details
    message: {
      type: String,
      maxlength: 500,
      default: 'Here\'s a special gift just for you! 🎁',
    },
    personalizedMessage: {
      type: Boolean,
      default: false, // Track if creator customized the message
    },

    // Timestamps and status
    giftedAt: {
      type: Date,
      default: Date.now,
    },
    viewedAt: {
      type: Date,
      default: null,
    },

    // Analytics tracking (team suggestions)
    clickedThrough: {
      type: Boolean,
      default: false,
    },
    clickedThroughAt: {
      type: Date,
      default: null,
    },
    ledToConnection: {
      type: Boolean,
      default: false,
    },
    ledToPurchase: {
      type: Boolean,
      default: false,
    },
    purchaseAmount: {
      type: Number,
      default: 0,
    },
    memberResponse: {
      type: String,
      enum: ['none', 'viewed', 'liked', 'messaged', 'connected', 'purchased'],
      default: 'none',
    },

    // Status and moderation
    status: {
      type: String,
      enum: ['sent', 'viewed', 'blocked', 'reported'],
      default: 'sent',
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Security and compliance
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      default: null,
    },
    reportReason: {
      type: String,
      default: null,
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    // Source tracking
    sourceContext: {
      source: {
        type: String,
        enum: ['browse_members', 'member_profile', 'analytics_suggestion'],
        default: 'browse_members',
      },
      memberTier: {
        type: String,
        enum: ['new', 'low', 'medium', 'high', 'whale', 'vip'],
        default: 'new',
      },
      campaignId: {
        type: String,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
giftSchema.index({ creator: 1, giftedAt: -1 }); // Creator's gift history
giftSchema.index({ member: 1, status: 1 }); // Member's received gifts
giftSchema.index({ content: 1 }); // Popular gifted content
giftSchema.index({ creator: 1, member: 1 }); // Prevent duplicate gifts

// Compound index for analytics
giftSchema.index({
  creator: 1,
  giftedAt: -1,
  memberResponse: 1,
  ledToConnection: 1
});


// Virtual for gift conversion rate (per creator)
giftSchema.statics.getCreatorConversionRate = async function(creatorId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const stats = await this.aggregate([
    {
      $match: {
        creator: creatorId,
        giftedAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: null,
        totalGifts: { $sum: 1 },
        viewedGifts: {
          $sum: { $cond: [{ $ne: ['$viewedAt', null] }, 1, 0] },
        },
        connectionsFromGifts: {
          $sum: { $cond: ['$ledToConnection', 1, 0] },
        },
        purchasesFromGifts: {
          $sum: { $cond: ['$ledToPurchase', 1, 0] },
        },
        totalRevenue: { $sum: '$purchaseAmount' },
      },
    },
  ]);

  return stats[0] || {
    totalGifts: 0,
    viewedGifts: 0,
    connectionsFromGifts: 0,
    purchasesFromGifts: 0,
    totalRevenue: 0,
  };
};

// Method to mark gift as viewed
giftSchema.methods.markAsViewed = function() {
  if (!this.viewedAt) {
    this.viewedAt = new Date();
    this.status = 'viewed';
    this.memberResponse = 'viewed';
  }
  return this.save();
};

// Method to track click-through
giftSchema.methods.trackClickThrough = function() {
  if (!this.clickedThrough) {
    this.clickedThrough = true;
    this.clickedThroughAt = new Date();
    if (this.memberResponse === 'viewed') {
      this.memberResponse = 'liked';
    }
  }
  return this.save();
};

// Pre-save middleware to prevent spam
giftSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Check daily limit per creator (security feature from team feedback)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const todayGifts = await this.constructor.countDocuments({
      creator: this.creator,
      giftedAt: { $gte: startOfDay },
    });

    if (todayGifts >= 10) { // Daily limit from team feedback
      throw new Error('Daily gift limit reached (10 gifts per day)');
    }

    // Check if creator already gifted this member today (prevent spam)
    const existingGift = await this.constructor.findOne({
      creator: this.creator,
      member: this.member,
      giftedAt: { $gte: startOfDay },
    });

    if (existingGift) {
      throw new Error('Already sent a gift to this member today');
    }
  }

  next();
});


module.exports = mongoose.model('Gift', giftSchema);