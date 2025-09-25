const mongoose = require('mongoose');

const creatorMessageSchema = new mongoose.Schema(
  {
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

    connection: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CreatorConnection',
      required: true,
    },

    // MESSAGE CONTENT
    content: {
      type: {
        type: String,
        enum: [
          'text',
          'photo',
          'video',
          'audio',
          'gif',
          'voice',
          'tip',
          'system',
        ],
        required: true,
      },

      text: String, // For text messages

      media: {
        url: String, // CDN URL for media
        thumbnailUrl: String, // Blurred preview
        duration: Number, // For video/audio in seconds
        dimensions: {
          width: Number,
          height: Number,
        },
        size: Number, // File size in bytes
        mimeType: String,
      },

      tip: {
        amount: Number,
        message: String,
        processed: Boolean,
      },

      system: {
        type: String, // welcome, re-engagement, milestone
        template: String,
        variables: Map, // Dynamic content
      },
    },

    // MONETIZATION
    pricing: {
      isPaid: {
        type: Boolean,
        default: false,
      },

      price: {
        type: Number,
        min: 0,
        max: 99.99,
        default: 0,
      },

      currency: {
        type: String,
        default: 'USD',
      },

      // Dynamic pricing
      originalPrice: Number,
      discountApplied: Boolean,
      discountReason: String, // loyalty, promotion, bundle

      // Expiring content
      expiringContent: {
        enabled: { type: Boolean, default: false },
        expiresAt: Date,
        duration: Number, // Hours after purchase
      },

      // Bundle info
      partOfBundle: {
        bundleId: mongoose.Schema.Types.ObjectId,
        bundlePrice: Number,
        bundleSize: Number,
      },
    },

    // PURCHASE STATUS
    purchase: {
      status: {
        type: String,
        enum: ['locked', 'unlocked', 'expired', 'refunded'],
        default: 'locked',
      },

      purchasedAt: Date,
      purchasedBy: mongoose.Schema.Types.ObjectId,

      transactionId: String,
      paymentMethod: String,

      unlockCount: { type: Number, default: 0 }, // How many times viewed
      firstViewAt: Date,
      lastViewAt: Date,

      expired: {
        at: Date,
        reason: String, // time_limit, creator_removed, policy_violation
      },

      refund: {
        requested: Boolean,
        requestedAt: Date,
        approved: Boolean,
        approvedAt: Date,
        reason: String,
        amount: Number,
      },
    },

    // MESSAGE STATUS
    status: {
      sent: {
        type: Boolean,
        default: false,
      },
      delivered: {
        type: Boolean,
        default: false,
      },
      read: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      deliveredAt: Date,
      readAt: Date,

      edited: {
        type: Boolean,
        default: false,
      },
      editedAt: Date,
      editHistory: [
        {
          content: String,
          editedAt: Date,
        },
      ],

      deleted: {
        type: Boolean,
        default: false,
      },
      deletedAt: Date,
      deletedBy: String, // creator, member, system, moderation
    },

    // ENGAGEMENT METRICS
    engagement: {
      reactions: [
        {
          type: String, // like, love, fire, wow, etc
          by: mongoose.Schema.Types.ObjectId,
          at: Date,
        },
      ],

      reply: {
        to: mongoose.Schema.Types.ObjectId, // Reply to another message
        quotedText: String,
      },

      saves: {
        count: { type: Number, default: 0 },
        savedBy: [mongoose.Schema.Types.ObjectId],
      },

      shares: {
        count: { type: Number, default: 0 },
        lastSharedAt: Date,
      },

      reports: [
        {
          by: mongoose.Schema.Types.ObjectId,
          reason: String,
          at: Date,
          reviewed: Boolean,
        },
      ],
    },

    // SENDER INFO
    sender: {
      type: {
        type: String,
        enum: ['creator', 'member'],
        required: true,
      },

      id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'sender.type',
      },

      username: String, // Cached for performance
      profileImage: String, // Cached for performance
    },

    // AI ANALYSIS
    ai: {
      // Content moderation
      moderation: {
        scanned: { type: Boolean, default: false },
        safe: { type: Boolean, default: true },
        flags: [String], // nudity, violence, hate_speech
        confidence: Number,
        scannedAt: Date,
      },

      // Sentiment analysis
      sentiment: {
        score: Number, // -1 to 1
        magnitude: Number,
        emotion: String, // happy, flirty, neutral, upset
      },

      // Content quality
      quality: {
        score: Number, // 0-100
        factors: {
          lighting: Number,
          composition: Number,
          resolution: Number,
          appeal: Number,
        },
      },

      // Predictive
      predictions: {
        likelyToPurchase: Number, // 0-100
        expectedRevenue: Number,
        optimalPrice: Number,
        bestSendTime: String,
      },

      // Auto-categorization
      tags: [String], // selfie, lingerie, workout, etc
      autoGenerated: {
        caption: String,
        hashTags: [String],
      },
    },

    // CONVERSATION CONTEXT
    conversation: {
      threadId: String, // Group related messages
      position: Number, // Message position in thread

      context: {
        previousMessage: mongoose.Schema.Types.ObjectId,
        nextMessage: mongoose.Schema.Types.ObjectId,
        isFirstMessage: Boolean,
        isLastMessage: Boolean,
      },

      session: {
        sessionId: String,
        device: String,
        ip: String,
        location: {
          country: String,
          city: String,
        },
      },
    },

    // AUTOMATION
    automation: {
      isAutomated: { type: Boolean, default: false },

      trigger: {
        type: String, // welcome, re-engagement, milestone, schedule
        condition: String,
        executedAt: Date,
      },

      campaign: {
        id: String,
        name: String,
        variant: String, // A/B test variant
      },

      performance: {
        opened: Boolean,
        clicked: Boolean,
        converted: Boolean,
        revenue: Number,
      },
    },

    // NOTIFICATIONS
    notifications: {
      push: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        delivered: Boolean,
        clicked: Boolean,
      },

      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        opened: Boolean,
        clicked: Boolean,
      },

      inApp: {
        shown: { type: Boolean, default: false },
        shownAt: Date,
        dismissed: Boolean,
      },
    },

    // METADATA
    metadata: {
      clientVersion: String,
      platform: String, // ios, android, web
      experiment: String, // A/B test tracking
      source: String, // manual, automated, api

      performance: {
        renderTime: Number, // ms to display
        downloadTime: Number, // ms to download media
        processingTime: Number, // ms to process
      },
    },
  },
  {
    timestamps: true,
    indexes: [
      { creator: 1, member: 1, createdAt: -1 }, // Conversation view
      { 'pricing.isPaid': 1, 'purchase.status': 1 }, // Paid content
      { 'sender.type': 1, 'sender.id': 1 }, // Sender queries
      { 'conversation.threadId': 1, 'conversation.position': 1 }, // Thread ordering
      { 'purchase.purchasedAt': -1 }, // Recent purchases
      { 'ai.predictions.expectedRevenue': -1 }, // High value messages
      { 'status.sent': 1, 'status.delivered': 1, 'status.read': 1 }, // Delivery tracking
    ],
  }
);

// METHODS

// Check if message can be viewed
creatorMessageSchema.methods.canView = function (userId) {
  // Free content or sender can always view
  if (!this.pricing.isPaid || this.sender.id.toString() === userId.toString()) {
    return true;
  }

  // Check if purchased and not expired
  if (this.purchase.status === 'unlocked') {
    if (this.pricing.expiringContent.enabled) {
      return (
        this.purchase.purchasedAt &&
        Date.now() <
          new Date(this.purchase.purchasedAt).getTime() +
            this.pricing.expiringContent.duration * 60 * 60 * 1000
      );
    }
    return true;
  }

  return false;
};

// Calculate message value
creatorMessageSchema.methods.calculateValue = function () {
  let value = this.pricing.price || 0;

  // Adjust based on content type
  const multipliers = {
    photo: 1,
    video: 2,
    audio: 0.5,
    text: 0.1,
  };

  value *= multipliers[this.content.type] || 1;

  // Adjust based on AI quality score
  if (this.ai.quality.score) {
    value *= this.ai.quality.score / 100;
  }

  return Math.round(value * 100) / 100; // Round to cents
};

// Mark as read
creatorMessageSchema.methods.markAsRead = function (userId) {
  if (!this.status.read && this.sender.id.toString() !== userId.toString()) {
    this.status.read = true;
    this.status.readAt = new Date();

    // Update unlock count if paid content
    if (this.pricing.isPaid && this.purchase.status === 'unlocked') {
      this.purchase.unlockCount++;
      this.purchase.lastViewAt = new Date();
      if (!this.purchase.firstViewAt) {
        this.purchase.firstViewAt = new Date();
      }
    }
  }
};

// Process purchase
creatorMessageSchema.methods.processPurchase = async function (
  buyerId,
  transactionId
) {
  if (this.purchase.status === 'unlocked') {
    throw new Error('Content already unlocked');
  }

  this.purchase.status = 'unlocked';
  this.purchase.purchasedAt = new Date();
  this.purchase.purchasedBy = buyerId;
  this.purchase.transactionId = transactionId;

  // Set expiration if applicable
  if (this.pricing.expiringContent.enabled) {
    const expirationMs = this.pricing.expiringContent.duration * 60 * 60 * 1000;
    this.pricing.expiringContent.expiresAt = new Date(
      Date.now() + expirationMs
    );
  }

  await this.save();
  return this;
};

// STATICS

// Get conversation between creator and member
creatorMessageSchema.statics.getConversation = function (
  creatorId,
  memberId,
  options = {}
) {
  const query = {
    $or: [
      { creator: creatorId, member: memberId },
      { creator: memberId, member: creatorId },
    ],
    'status.deleted': false,
  };

  const limit = options.limit || 50;
  const skip = options.skip || 0;

  return this.find(query)
    .sort('-createdAt')
    .limit(limit)
    .skip(skip)
    .populate('sender.id', 'username profileImage');
};

// Get paid content summary for creator
creatorMessageSchema.statics.getPaidContentStats = async function (creatorId) {
  const stats = await this.aggregate([
    {
      $match: {
        creator: creatorId,
        'pricing.isPaid': true,
      },
    },
    {
      $group: {
        _id: '$content.type',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.price' },
        purchased: {
          $sum: {
            $cond: [{ $eq: ['$purchase.status', 'unlocked'] }, 1, 0],
          },
        },
        avgPrice: { $avg: '$pricing.price' },
      },
    },
  ]);

  return stats;
};

// Find high-value messages
creatorMessageSchema.statics.findHighValueMessages = function (
  creatorId,
  minValue = 5
) {
  return this.find({
    creator: creatorId,
    'pricing.price': { $gte: minValue },
    'purchase.status': 'locked',
  })
    .sort('-ai.predictions.likelyToPurchase')
    .populate('member', 'username profileImage');
};

// Get automation performance
creatorMessageSchema.statics.getAutomationPerformance = async function (
  creatorId,
  campaignId
) {
  const stats = await this.aggregate([
    {
      $match: {
        creator: creatorId,
        'automation.isAutomated': true,
        'automation.campaign.id': campaignId,
      },
    },
    {
      $group: {
        _id: '$automation.campaign.variant',
        sent: { $sum: 1 },
        opened: {
          $sum: { $cond: ['$status.read', 1, 0] },
        },
        converted: {
          $sum: { $cond: ['$automation.performance.converted', 1, 0] },
        },
        revenue: { $sum: '$automation.performance.revenue' },
      },
    },
  ]);

  return stats;
};

module.exports = mongoose.model('CreatorMessage', creatorMessageSchema);
