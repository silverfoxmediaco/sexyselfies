const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  // User information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  userRole: {
    type: String,
    enum: ['creator', 'member'],
    required: true
  },

  // Push subscription data from browser
  endpoint: {
    type: String,
    required: true,
    unique: true
  },
  keys: {
    p256dh: {
      type: String,
      required: true
    },
    auth: {
      type: String,
      required: true
    }
  },

  // Device information
  deviceInfo: {
    platform: String,
    userAgent: String,
    browser: String,
    os: String
  },

  // Status
  active: {
    type: Boolean,
    default: true,
    index: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },

  // Subscription preferences
  preferences: {
    connections: {
      type: Boolean,
      default: true
    },
    messages: {
      type: Boolean,
      default: true
    },
    purchases: {
      type: Boolean,
      default: true
    },
    tips: {
      type: Boolean,
      default: true
    },
    content: {
      type: Boolean,
      default: true
    },
    system: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
pushSubscriptionSchema.index({ userId: 1, active: 1 });
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });
pushSubscriptionSchema.index({ lastUsed: 1 });

// Instance methods
pushSubscriptionSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

pushSubscriptionSchema.methods.deactivate = function() {
  this.active = false;
  return this.save();
};

// Static methods
pushSubscriptionSchema.statics.findActiveByUser = function(userId) {
  return this.find({
    userId,
    active: true
  }).sort({ lastUsed: -1 });
};

pushSubscriptionSchema.statics.createOrUpdate = async function(userId, userRole, subscriptionData, deviceInfo = {}) {
  try {
    const { endpoint, keys } = subscriptionData;

    // Find existing subscription by endpoint
    let subscription = await this.findOne({ endpoint });

    if (subscription) {
      // Update existing subscription
      subscription.userId = userId;
      subscription.userRole = userRole;
      subscription.keys = keys;
      subscription.deviceInfo = deviceInfo;
      subscription.active = true;
      subscription.lastUsed = new Date();
    } else {
      // Create new subscription
      subscription = new this({
        userId,
        userRole,
        endpoint,
        keys,
        deviceInfo,
        active: true,
        lastUsed: new Date()
      });
    }

    return await subscription.save();
  } catch (error) {
    console.error('Error creating/updating push subscription:', error);
    throw error;
  }
};

pushSubscriptionSchema.statics.removeByEndpoint = async function(endpoint) {
  try {
    return await this.findOneAndDelete({ endpoint });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    throw error;
  }
};

pushSubscriptionSchema.statics.cleanupInactive = async function(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
      $or: [
        { active: false },
        { lastUsed: { $lt: cutoffDate } }
      ]
    });

    console.log(`Cleaned up ${result.deletedCount} inactive push subscriptions`);
    return result;
  } catch (error) {
    console.error('Error cleaning up push subscriptions:', error);
    throw error;
  }
};

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);