const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  // Member who subscribed
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true,
    index: true
  },

  // User reference
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Creator being subscribed to
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    index: true
  },

  // Subscription tier/plan
  tier: {
    type: String,
    required: true
  },

  // Subscription amount
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

  // Billing cycle
  billingCycle: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },

  // Subscription status
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired', 'suspended', 'pending'],
    default: 'pending',
    index: true
  },

  // CCBill subscription ID
  ccbillSubscriptionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Payment method used
  paymentMethod: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },

  // Billing dates
  startDate: {
    type: Date,
    default: Date.now
  },

  nextBillingDate: {
    type: Date,
    required: true,
    index: true
  },

  lastBillingDate: Date,

  // Cancellation details
  cancelledAt: Date,
  cancellationReason: String,
  cancelledBy: {
    type: String,
    enum: ['user', 'creator', 'admin', 'system']
  },

  // Expiration
  expiresAt: Date,

  // Suspension details
  suspendedAt: Date,
  suspensionReason: String,

  // Trial period
  isTrialPeriod: {
    type: Boolean,
    default: false
  },

  trialEndsAt: Date,

  // Billing history
  billingHistory: [{
    date: Date,
    amount: Number,
    status: {
      type: String,
      enum: ['success', 'failed', 'refunded']
    },
    transactionId: String,
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment'
    }
  }],

  // Failed payment tracking
  failedPaymentCount: {
    type: Number,
    default: 0
  },

  lastFailedPaymentAt: Date,

  // Metadata
  metadata: {
    signupSource: String,
    campaignId: String,
    promoCode: String
  }
}, {
  timestamps: true
});

// Compound indexes
subscriptionSchema.index({ member: 1, creator: 1 });
subscriptionSchema.index({ creator: 1, status: 1 });
subscriptionSchema.index({ status: 1, nextBillingDate: 1 });

// Virtual for active status
subscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

// Virtual for days until next billing
subscriptionSchema.virtual('daysUntilBilling').get(function() {
  if (!this.nextBillingDate) return null;
  const now = new Date();
  const diff = this.nextBillingDate - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Method to activate subscription
subscriptionSchema.methods.activate = function() {
  this.status = 'active';
  this.startDate = new Date();
  return this.save();
};

// Method to cancel subscription
subscriptionSchema.methods.cancel = function(reason, cancelledBy = 'user') {
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.cancelledBy = cancelledBy;
  return this.save();
};

// Method to suspend subscription
subscriptionSchema.methods.suspend = function(reason) {
  this.status = 'suspended';
  this.suspendedAt = new Date();
  this.suspensionReason = reason;
  return this.save();
};

// Method to record successful billing
subscriptionSchema.methods.recordBilling = function(amount, transactionId, paymentId) {
  this.billingHistory.push({
    date: new Date(),
    amount,
    status: 'success',
    transactionId,
    paymentId
  });

  this.lastBillingDate = new Date();
  this.failedPaymentCount = 0;

  // Calculate next billing date based on cycle
  const nextDate = new Date(this.nextBillingDate);
  if (this.billingCycle === 'monthly') {
    nextDate.setMonth(nextDate.getMonth() + 1);
  } else if (this.billingCycle === 'quarterly') {
    nextDate.setMonth(nextDate.getMonth() + 3);
  } else if (this.billingCycle === 'yearly') {
    nextDate.setFullYear(nextDate.getFullYear() + 1);
  }
  this.nextBillingDate = nextDate;

  return this.save();
};

// Method to record failed billing
subscriptionSchema.methods.recordFailedBilling = function(reason) {
  this.billingHistory.push({
    date: new Date(),
    amount: this.amount,
    status: 'failed'
  });

  this.failedPaymentCount += 1;
  this.lastFailedPaymentAt = new Date();

  // Suspend after 3 failed attempts
  if (this.failedPaymentCount >= 3) {
    this.suspend('Multiple failed payment attempts');
  }

  return this.save();
};

// Static method to get user's active subscriptions
subscriptionSchema.statics.getUserSubscriptions = function(userId, status = 'active') {
  const query = { user: userId };
  if (status) query.status = status;

  return this.find(query)
    .populate('creator', 'username displayName profilePicture')
    .populate('paymentMethod', 'last4 cardType')
    .sort({ createdAt: -1 });
};

// Static method to get creator's subscribers
subscriptionSchema.statics.getCreatorSubscribers = function(creatorId, status = 'active') {
  const query = { creator: creatorId };
  if (status) query.status = status;

  return this.find(query)
    .populate('member', 'username displayName profilePicture')
    .populate('user', 'email')
    .sort({ createdAt: -1 });
};

// Static method to check if user is subscribed to creator
subscriptionSchema.statics.isUserSubscribed = async function(userId, creatorId) {
  const subscription = await this.findOne({
    user: userId,
    creator: creatorId,
    status: 'active'
  });
  return !!subscription;
};

// Static method to get subscriptions needing billing
subscriptionSchema.statics.getSubscriptionsDueForBilling = function() {
  const now = new Date();
  return this.find({
    status: 'active',
    nextBillingDate: { $lte: now }
  })
    .populate('user')
    .populate('creator')
    .populate('paymentMethod');
};

module.exports = mongoose.model('Subscription', subscriptionSchema);
