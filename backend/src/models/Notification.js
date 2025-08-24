const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientModel: {
    type: String,
    enum: ['Member', 'Creator'],
    required: true
  },
  type: {
    type: String,
    enum: [
      'new_match',
      'new_message',
      'new_purchase',
      'new_tip',
      'new_like',
      'new_super_like',
      'content_unlocked',
      'payout_processed',
      'verification_approved',
      'verification_rejected',
      'warning',
      'announcement'
    ],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    type: mongoose.Schema.Types.Mixed // Additional data relevant to the notification
  },
  link: String, // Where to navigate when clicked
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isPush: {
    type: Boolean,
    default: true
  },
  pushSentAt: Date,
  isEmail: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });

// Auto-delete old read notifications after 30 days
notificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 2592000 });

module.exports = mongoose.model('Notification', notificationSchema);
