// Notification utility functions
const Notification = require('../models/Notification');

/**
 * Send notification to a user
 * @param {String} userId - User ID to send notification to
 * @param {Object} notification - Notification details
 */
exports.sendNotification = async (userId, notification) => {
  try {
    // Create notification in database
    const newNotification = await Notification.create({
      recipient: userId,
      type: notification.type || 'general',
      title: notification.title,
      body: notification.body || notification.message,
      data: notification.data || {},
      priority: notification.priority || 'normal',
      category: notification.category || 'system',
      actionUrl: notification.actionUrl,
      icon: notification.icon || getIconForType(notification.type),
      read: false,
      createdAt: new Date(),
    });

    // Send push notification if user has push tokens
    if (notification.push !== false) {
      await sendPushNotification(userId, notification);
    }

    // Send email notification if enabled
    if (notification.email === true) {
      await sendEmailNotification(userId, notification);
    }

    // Send SMS if critical
    if (notification.priority === 'critical' && notification.sms === true) {
      await sendSMSNotification(userId, notification);
    }

    // Emit socket event for real-time notification
    emitSocketNotification(userId, newNotification);

    console.log(`Notification sent to user ${userId}:`, notification.title);

    return newNotification;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Send notification to multiple users
 */
exports.sendBulkNotifications = async (userIds, notification) => {
  const results = await Promise.allSettled(
    userIds.map(userId => exports.sendNotification(userId, notification))
  );

  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  console.log(`Bulk notifications: ${successful} sent, ${failed} failed`);

  return { successful, failed, total: userIds.length };
};

/**
 * Send push notification
 */
async function sendPushNotification(userId, notification) {
  try {
    // This would integrate with FCM, APNS, or other push services
    // For now, just log it
    console.log(`Push notification would be sent to user ${userId}`);

    // Example FCM implementation:
    /*
    const fcm = require('fcm-node');
    const serverKey = process.env.FCM_SERVER_KEY;
    const fcmClient = new fcm(serverKey);
    
    const user = await User.findById(userId);
    if (user.pushTokens && user.pushTokens.length > 0) {
      const message = {
        registration_ids: user.pushTokens,
        notification: {
          title: notification.title,
          body: notification.body,
          icon: notification.icon,
          sound: 'default'
        },
        data: notification.data
      };
      
      fcmClient.send(message, (err, response) => {
        if (err) console.error('FCM error:', err);
        else console.log('FCM success:', response);
      });
    }
    */
  } catch (error) {
    console.error('Push notification error:', error);
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(userId, notification) {
  try {
    // This would integrate with email service (SendGrid, Mailgun, etc.)
    console.log(`Email notification would be sent to user ${userId}`);

    // Example implementation:
    /*
    const nodemailer = require('nodemailer');
    const User = require('../models/User');
    
    const user = await User.findById(userId);
    if (!user.email) return;
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    const mailOptions = {
      from: 'noreply@sexyselfies.com',
      to: user.email,
      subject: notification.title,
      html: `
        <h2>${notification.title}</h2>
        <p>${notification.body}</p>
        ${notification.actionUrl ? `<a href="${notification.actionUrl}">View Details</a>` : ''}
      `
    };
    
    await transporter.sendMail(mailOptions);
    */
  } catch (error) {
    console.error('Email notification error:', error);
  }
}

/**
 * Send SMS notification
 */
async function sendSMSNotification(userId, notification) {
  try {
    // This would integrate with Twilio or similar
    console.log(`SMS notification would be sent to user ${userId}`);

    // Example Twilio implementation:
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
    const User = require('../models/User');
    
    const user = await User.findById(userId);
    if (!user.phoneNumber) return;
    
    await client.messages.create({
      body: `${notification.title}: ${notification.body}`,
      from: process.env.TWILIO_PHONE,
      to: user.phoneNumber
    });
    */
  } catch (error) {
    console.error('SMS notification error:', error);
  }
}

/**
 * Emit socket notification for real-time updates
 */
function emitSocketNotification(userId, notification) {
  try {
    // This would emit through Socket.io
    // For now, just log it
    console.log(`Socket notification would be emitted to user ${userId}`);

    // Example Socket.io implementation:
    /*
    const io = require('../sockets/socket').getIO();
    io.to(`user_${userId}`).emit('notification', notification);
    */
  } catch (error) {
    console.error('Socket notification error:', error);
  }
}

/**
 * Get icon for notification type
 */
function getIconForType(type) {
  const icons = {
    connection: '💕',
    message: '💬',
    payment: '💰',
    content: '📸',
    tip: '💵',
    like: '❤️',
    follow: '👥',
    achievement: '🏆',
    warning: '⚠️',
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    general: '🔔',
  };

  return icons[type] || icons.general;
}

/**
 * Create notification templates
 */
exports.notificationTemplates = {
  // Connection notifications
  newConnection: connectorName => ({
    type: 'connection',
    title: 'New Connection! 💕',
    body: `You connected with ${connectorName}!`,
    priority: 'high',
    push: true,
  }),

  connectionRequest: requesterName => ({
    type: 'connection',
    title: 'Someone likes you!',
    body: `${requesterName} wants to connect with you`,
    priority: 'normal',
    push: true,
  }),

  // Message notifications
  newMessage: (senderName, preview) => ({
    type: 'message',
    title: `New message from ${senderName}`,
    body: preview || 'You have a new message',
    priority: 'normal',
    push: true,
  }),

  unlockedMessage: (buyerName, amount) => ({
    type: 'payment',
    title: 'Message Unlocked! 💰',
    body: `${buyerName} unlocked your message for $${amount}`,
    priority: 'high',
    push: true,
  }),

  // Payment notifications
  contentPurchased: (buyerName, contentTitle, amount) => ({
    type: 'payment',
    title: 'Content Purchased! 💰',
    body: `${buyerName} purchased "${contentTitle}" for $${amount}`,
    priority: 'high',
    push: true,
    email: true,
  }),

  tipReceived: (tipperName, amount, message) => ({
    type: 'tip',
    title: `${tipperName} sent you a tip! 💵`,
    body: message
      ? `$${amount} - "${message}"`
      : `You received a $${amount} tip`,
    priority: 'high',
    push: true,
  }),

  payoutProcessed: (amount, method) => ({
    type: 'payment',
    title: 'Payout Processed',
    body: `Your $${amount} payout via ${method} has been processed`,
    priority: 'high',
    push: true,
    email: true,
  }),

  // Engagement notifications
  newFollower: followerName => ({
    type: 'follow',
    title: 'New Follower',
    body: `${followerName} started following you`,
    priority: 'low',
    push: false,
  }),

  contentLiked: (likerName, contentTitle) => ({
    type: 'like',
    title: 'Someone liked your content',
    body: `${likerName} liked "${contentTitle}"`,
    priority: 'low',
    push: false,
  }),

  // Achievement notifications
  achievementUnlocked: (achievementName, reward) => ({
    type: 'achievement',
    title: 'Achievement Unlocked! 🏆',
    body: `You earned "${achievementName}"${reward ? ` and received ${reward}` : ''}`,
    priority: 'normal',
    push: true,
  }),

  milestoneReached: milestone => ({
    type: 'achievement',
    title: 'Milestone Reached! 🎉',
    body: `Congratulations on reaching ${milestone}!`,
    priority: 'normal',
    push: true,
  }),

  // System notifications
  verificationApproved: () => ({
    type: 'success',
    title: 'Verification Approved! ✅',
    body: 'Your account has been verified',
    priority: 'high',
    push: true,
    email: true,
  }),

  verificationRejected: reason => ({
    type: 'warning',
    title: 'Verification Issue',
    body: reason || 'Please resubmit your verification documents',
    priority: 'high',
    push: true,
    email: true,
  }),

  contentRemoved: reason => ({
    type: 'warning',
    title: 'Content Removed',
    body: reason || 'Your content violated community guidelines',
    priority: 'high',
    push: true,
    email: true,
  }),

  accountWarning: reason => ({
    type: 'warning',
    title: 'Account Warning ⚠️',
    body: reason,
    priority: 'critical',
    push: true,
    email: true,
    sms: true,
  }),
};

/**
 * Mark notification as read
 */
exports.markAsRead = async notificationId => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark multiple notifications as read
 */
exports.markMultipleAsRead = async notificationIds => {
  try {
    const result = await Notification.updateMany(
      { _id: { $in: notificationIds } },
      { read: true, readAt: new Date() }
    );
    return result;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
};

/**
 * Delete old notifications
 */
exports.cleanupOldNotifications = async (daysToKeep = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await Notification.deleteMany({
      createdAt: { $lt: cutoffDate },
      read: true,
    });

    console.log(`Deleted ${result.deletedCount} old notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
    throw error;
  }
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async userId => {
  try {
    const count = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
    return count;
  } catch (error) {
    console.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Schedule notification for later
 */
exports.scheduleNotification = async (userId, notification, scheduledFor) => {
  try {
    // This would integrate with a job queue like Bull or Agenda
    console.log(`Notification scheduled for ${scheduledFor}`);

    // For now, create with scheduled status
    const scheduledNotification = await Notification.create({
      recipient: userId,
      ...notification,
      status: 'scheduled',
      scheduledFor: scheduledFor,
    });

    return scheduledNotification;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    throw error;
  }
};

module.exports = exports;
