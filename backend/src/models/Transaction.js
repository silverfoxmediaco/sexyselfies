// backend/src/models/Transaction.js
// Transaction model for micro-transaction system (no subscriptions)

const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    // Core transaction info
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Users involved
    memberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member',
      required: true,
      index: true,
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator',
      required: true,
      index: true,
    },

    // Transaction type - NO SUBSCRIPTIONS
    type: {
      type: String,
      required: true,
      enum: [
        'content_unlock', // Single content piece (creator sets price)
        'profile_unlock', // Unlock full profile content
        'message_unlock', // Paid message content (creator sets price)
        'bundle_unlock', // Multiple content bundle
        'tip', // Direct tip to creator
        'special_offer', // Redeemed special offer
        'custom_content', // Custom content request
        'video_call', // Video call session
        'priority_message', // Priority DM
        'super_like', // Super like on profile
        'profile_boost', // Creator profile boost
        'wallet_topup', // Add credits to wallet
        'payout', // Creator payout (negative amount)
      ],
      index: true,
    },

    // Content reference (if applicable)
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
      sparse: true,
    },
    messageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      sparse: true,
    },
    bundleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bundle',
      sparse: true,
    },
    offerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SpecialOffer',
      sparse: true,
    },

    // Financial details
    amount: {
      type: Number,
      required: true,
      min: 0,
      get: v => parseFloat(v.toFixed(2)),
      set: v => parseFloat(v.toFixed(2)),
    },
    originalPrice: {
      type: Number, // Before discount
      get: v => (v ? parseFloat(v.toFixed(2)) : v),
      set: v => (v ? parseFloat(v.toFixed(2)) : v),
    },
    discount: {
      type: Number, // Discount percentage
      min: 0,
      max: 100,
    },
    platformFee: {
      type: Number, // 20% platform fee
      default: 0.2,
      get: v => parseFloat(v.toFixed(2)),
      set: v => parseFloat(v.toFixed(2)),
    },
    creatorEarnings: {
      type: Number, // 80% to creator
      get: v => parseFloat(v.toFixed(2)),
      set: v => parseFloat(v.toFixed(2)),
    },

    // Payment method
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'ccbill', 'paypal', 'crypto'],
      default: 'ccbill',
    },
    paymentDetails: {
      last4: String,
      brand: String,
      ccbillId: String,
      walletBalanceBefore: Number,
      walletBalanceAfter: Number,
    },

    // Transaction status
    status: {
      type: String,
      required: true,
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'refunded',
        'disputed',
      ],
      default: 'pending',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: Date,
        reason: String,
      },
    ],

    // Unlock details
    unlockDetails: {
      unlockedAt: Date,
      expiresAt: Date, // For temporary unlocks (rare)
      viewCount: { type: Number, default: 0 },
      lastViewedAt: Date,
      deviceInfo: {
        ip: String,
        userAgent: String,
        deviceType: String,
      },
    },

    // Bundle details (if bundle unlock)
    bundleDetails: {
      contentIds: [mongoose.Schema.Types.ObjectId],
      totalPieces: Number,
      individualValue: Number,
      savingsAmount: Number,
      savingsPercentage: Number,
    },

    // Special offer details (if from offer)
    offerDetails: {
      offerCode: String,
      offerType: String,
      originalAmount: Number,
      discountAmount: Number,
    },

    // Refund information
    refund: {
      requested: { type: Boolean, default: false },
      requestedAt: Date,
      reason: String,
      approved: Boolean,
      processedAt: Date,
      refundAmount: Number,
      refundId: String,
    },

    // Analytics & tracking
    analytics: {
      source: String, // 'swipe', 'profile', 'message', 'offer'
      campaign: String,
      referrer: String,
      timeToUnlock: Number, // Seconds from view to purchase
      memberSegment: String, // 'whale', 'vip', 'regular', 'new'
      creatorTier: String,
    },

    // Payout tracking
    payoutProcessed: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Metadata
    metadata: {
      ip: String,
      userAgent: String,
      deviceType: String,
      country: String,
      notes: String,
    },
  },
  {
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Indexes for performance
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ memberId: 1, creatorId: 1 });
transactionSchema.index({ memberId: 1, type: 1, status: 1 });
transactionSchema.index({ creatorId: 1, status: 1, createdAt: -1 });
transactionSchema.index({ contentId: 1, memberId: 1 }, { sparse: true });
transactionSchema.index({ messageId: 1, memberId: 1 }, { sparse: true });

// Calculate creator earnings before saving
transactionSchema.pre('save', function (next) {
  if (this.isModified('amount') || this.isNew) {
    // Platform takes 20%, creator gets 80%
    this.creatorEarnings = this.amount * 0.8;

    // Track original price if discount applied
    if (this.discount && !this.originalPrice) {
      this.originalPrice = this.amount / (1 - this.discount / 100);
    }
  }
  next();
});

// Static methods for analytics
transactionSchema.statics.getDailyRevenue = async function (
  creatorId,
  date = new Date()
) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const result = await this.aggregate([
    {
      $match: {
        creatorId: mongoose.Types.ObjectId(creatorId),
        status: 'completed',
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        creatorEarnings: { $sum: '$creatorEarnings' },
        transactionCount: { $sum: 1 },
        uniqueMembers: { $addToSet: '$memberId' },
      },
    },
  ]);

  return (
    result[0] || {
      totalRevenue: 0,
      creatorEarnings: 0,
      transactionCount: 0,
      uniqueMembers: [],
    }
  );
};

// Check if content is unlocked by member
transactionSchema.statics.isContentUnlocked = async function (
  memberId,
  contentId
) {
  const unlock = await this.findOne({
    memberId,
    contentId,
    type: 'content_unlock',
    status: 'completed',
  });
  return !!unlock;
};

// Get member's unlock history with creator
transactionSchema.statics.getMemberUnlocks = async function (
  memberId,
  creatorId
) {
  return await this.find({
    memberId,
    creatorId,
    type: { $in: ['content_unlock', 'message_unlock', 'bundle_unlock'] },
    status: 'completed',
  })
    .sort('-createdAt')
    .populate('contentId', 'title type thumbnailUrl')
    .limit(50);
};

// Instance method to process refund
transactionSchema.methods.processRefund = async function (reason) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed transactions');
  }

  if (this.refund.processed) {
    throw new Error('Transaction already refunded');
  }

  this.refund = {
    requested: true,
    requestedAt: new Date(),
    reason,
    approved: false,
    refundAmount: this.amount,
  };

  this.status = 'refunded';
  this.statusHistory.push({
    status: 'refunded',
    timestamp: new Date(),
    reason,
  });

  return await this.save();
};

// Virtual for display amount
transactionSchema.virtual('displayAmount').get(function () {
  return `$${this.amount.toFixed(2)}`;
});

// Virtual for savings display (for bundles/offers)
transactionSchema.virtual('savingsDisplay').get(function () {
  if (this.originalPrice && this.originalPrice > this.amount) {
    const saved = this.originalPrice - this.amount;
    const percent = ((saved / this.originalPrice) * 100).toFixed(0);
    return `Save $${saved.toFixed(2)} (${percent}% off)`;
  }
  return null;
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
