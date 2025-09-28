const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // Recipient information
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientRole: {
    type: String,
    enum: ['creator', 'member'],
    required: true
  },

  // Notification details
  type: {
    type: String,
    enum: ['connection', 'message', 'tip', 'purchase', 'content', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 100,
    trim: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500,
    trim: true
  },

  // Sender information
  from: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      trim: true
    },
    avatar: {
      type: String,
      trim: true
    }
  },

  // Optional fields
  amount: {
    type: Number,
    min: 0,
    default: null
  },
  relatedContentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Content',
    default: null
  },
  actionUrl: {
    type: String,
    trim: true,
    default: null
  },

  // Status fields
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },

  // Additional data
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
notificationSchema.index({ recipientId: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ recipientId: 1, type: 1 });
notificationSchema.index({ recipientId: 1, createdAt: -1 });

// Virtual field for time ago calculation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return this.createdAt.toLocaleDateString();
});

// Instance method to mark notification as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create a notification
notificationSchema.statics.createNotification = async function(data) {
  try {
    // Validate required fields
    if (!data.recipientId || !data.recipientRole || !data.type || !data.title || !data.message) {
      throw new Error('Missing required notification fields');
    }

    // Create notification
    const notification = new this({
      recipientId: data.recipientId,
      recipientRole: data.recipientRole,
      type: data.type,
      title: data.title,
      message: data.message,
      from: data.from || {},
      amount: data.amount || null,
      relatedContentId: data.relatedContentId || null,
      actionUrl: data.actionUrl || null,
      metadata: data.metadata || {}
    });

    const savedNotification = await notification.save();

    // Populate sender information if provided
    if (data.from?.userId) {
      await savedNotification.populate('from.userId', 'name avatar');
    }

    return savedNotification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Static method to get unread count for a user
notificationSchema.statics.getUnreadCount = async function(userId) {
  try {
    const count = await this.countDocuments({
      recipientId: userId,
      read: false
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

// Static method to mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = async function(userId) {
  try {
    const result = await this.updateMany(
      {
        recipientId: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );
    return result;
  } catch (error) {
    console.error('Error marking all as read:', error);
    throw error;
  }
};

// Static method to get notifications for a user with pagination
notificationSchema.statics.getUserNotifications = async function(userId, options = {}) {
  try {
    const {
      page = 1,
      limit = 20,
      type = null,
      unreadOnly = false
    } = options;

    const query = { recipientId: userId };

    if (type) {
      query.type = type;
    }

    if (unreadOnly) {
      query.read = false;
    }

    const skip = (page - 1) * limit;

    const notifications = await this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('from.userId', 'name avatar')
      .populate('relatedContentId', 'title thumbnail')
      .lean();

    const total = await this.countDocuments(query);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Static method to delete old notifications (cleanup)
notificationSchema.statics.deleteOldNotifications = async function(daysOld = 30) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true
    });

    console.log(`Deleted ${result.deletedCount} old notifications`);
    return result;
  } catch (error) {
    console.error('Error deleting old notifications:', error);
    throw error;
  }
};

// Pre-save middleware to validate notification data
notificationSchema.pre('save', function(next) {
  // Ensure amount is only set for relevant notification types
  if (this.type !== 'tip' && this.type !== 'purchase' && this.amount) {
    this.amount = null;
  }

  // Ensure relatedContentId is only set for content-related notifications
  if (this.type !== 'content' && this.type !== 'purchase' && this.relatedContentId) {
    this.relatedContentId = null;
  }

  next();
});

// Post-save middleware for real-time notifications
notificationSchema.post('save', function(doc) {
  // Emit socket event for real-time notifications
  if (global.io) {
    global.io.to(`user_${doc.recipientId}`).emit('notification', {
      id: doc._id,
      type: doc.type,
      title: doc.title,
      message: doc.message,
      timeAgo: doc.timeAgo,
      read: doc.read,
      actionUrl: doc.actionUrl
    });
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
