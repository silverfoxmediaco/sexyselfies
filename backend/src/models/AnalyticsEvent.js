const mongoose = require('mongoose');

const analyticsEventSchema = new mongoose.Schema({
  category: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    required: true
  },
  label: {
    type: String
  },
  value: {
    type: Number,
    default: 0
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  userType: {
    type: String,
    enum: ['creator', 'member', 'admin'],
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  sessionId: {
    type: String,
    index: true
  },
  platform: {
    type: String,
    enum: ['web', 'mobile', 'api'],
    default: 'web'
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown'
  }
}, {
  timestamps: true
});

// Indexes for performance
analyticsEventSchema.index({ category: 1, timestamp: -1 });
analyticsEventSchema.index({ userId: 1, category: 1, timestamp: -1 });
analyticsEventSchema.index({ userType: 1, timestamp: -1 });

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

module.exports = AnalyticsEvent;