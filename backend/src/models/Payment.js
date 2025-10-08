const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  // User who made the payment
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Member who made the payment
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    index: true
  },

  // Creator receiving the payment
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    index: true
  },

  // Payment amount
  amount: {
    type: Number,
    required: true,
    min: 0
  },

  // Currency (default USD)
  currency: {
    type: String,
    default: 'USD',
    uppercase: true
  },

  // Payment type
  type: {
    type: String,
    enum: ['tip', 'subscription', 'ppv', 'unlock'],
    required: true,
    index: true
  },

  // Payment status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending',
    index: true
  },

  // CCBill transaction ID
  ccbillTransactionId: {
    type: String,
    index: true,
    sparse: true
  },

  // CCBill subscription ID (for recurring payments)
  ccbillSubscriptionId: {
    type: String,
    index: true,
    sparse: true
  },

  // Payment method used
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },

  // Content reference (for PPV/unlock)
  content: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content'
  },

  // Message reference (for paid DMs)
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },

  // Platform fee amount
  platformFee: {
    type: Number,
    default: 0
  },

  // Creator earnings (after platform fee)
  creatorEarnings: {
    type: Number,
    required: true
  },

  // Payment metadata
  metadata: {
    ipAddress: String,
    userAgent: String,
    deviceType: String
  },

  // Error details (if failed)
  errorCode: String,
  errorMessage: String,

  // Refund information
  refundedAt: Date,
  refundReason: String,
  refundAmount: Number,

  // Processing timestamps
  processedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

// Indexes for queries
paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ creator: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ type: 1, status: 1 });

// Calculate platform fee and creator earnings before save
paymentSchema.pre('save', function(next) {
  if (this.isNew && !this.creatorEarnings) {
    const platformFeeRate = 0.20; // 20% platform fee
    this.platformFee = this.amount * platformFeeRate;
    this.creatorEarnings = this.amount * (1 - platformFeeRate);
  }
  next();
});

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${this.amount.toFixed(2)}`;
});

// Method to mark payment as completed
paymentSchema.methods.markCompleted = function(transactionId) {
  this.status = 'completed';
  this.ccbillTransactionId = transactionId;
  this.completedAt = new Date();
  return this.save();
};

// Method to mark payment as failed
paymentSchema.methods.markFailed = function(errorCode, errorMessage) {
  this.status = 'failed';
  this.errorCode = errorCode;
  this.errorMessage = errorMessage;
  return this.save();
};

// Method to process refund
paymentSchema.methods.processRefund = function(reason) {
  this.status = 'refunded';
  this.refundedAt = new Date();
  this.refundReason = reason;
  this.refundAmount = this.amount;
  return this.save();
};

// Static method to get user payment history
paymentSchema.statics.getUserHistory = function(userId, options = {}) {
  const query = { user: userId };

  if (options.type) {
    query.type = options.type;
  }

  if (options.status) {
    query.status = options.status;
  }

  return this.find(query)
    .populate('creator', 'username displayName profilePicture')
    .populate('content', 'title thumbnailUrl')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50);
};

// Static method to get creator earnings
paymentSchema.statics.getCreatorEarnings = function(creatorId, startDate, endDate) {
  const query = {
    creator: creatorId,
    status: 'completed'
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  return this.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$creatorEarnings' },
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        totalPlatformFee: { $sum: '$platformFee' }
      }
    }
  ]);
};

module.exports = mongoose.model('Payment', paymentSchema);
