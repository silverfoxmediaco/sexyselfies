// backend/src/services/notification.service.js
// Service for handling all notification types (push, email, in-app)

const nodemailer = require('nodemailer');
const webpush = require('web-push');
const Notification = require('../models/Notification');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const User = require('../models/User');

// Configure email transporter
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  emailTransporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Configure web push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.EMAIL_USER || 'admin@sexyselfies.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ============================================
// CORE NOTIFICATION FUNCTIONS
// ============================================

/**
 * Send notification to user (handles all channels)
 * @param {String} userId - User ID to notify
 * @param {Object} notification - Notification details
 */
exports.sendNotification = async (userId, notification) => {
  try {
    const user = await User.findById(userId)
      .populate('notificationPreferences');
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check user's notification preferences
    const prefs = user.notificationPreferences || {
      push: true,
      email: true,
      inApp: true
    };
    
    // Save in-app notification
    if (prefs.inApp) {
      await this.saveInAppNotification(userId, notification);
    }
    
    // Send push notification
    if (prefs.push && user.pushSubscription) {
      await this.sendPushNotification(user.pushSubscription, notification);
    }
    
    // Send email notification
    if (prefs.email && user.email && emailTransporter) {
      await this.sendEmailNotification(user.email, notification);
    }
    
    return { success: true };
    
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
};

/**
 * Save in-app notification
 */
exports.saveInAppNotification = async (userId, notification) => {
  const newNotification = new Notification({
    user: userId,
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    priority: notification.priority || 'normal',
    category: notification.category || 'general',
    isRead: false,
    createdAt: new Date()
  });
  
  await newNotification.save();
  
  // Emit socket event for real-time notification if available
  if (global.io) {
    global.io.to(userId).emit('notification', newNotification);
  }
  
  return newNotification;
};

/**
 * Send push notification
 */
exports.sendPushNotification = async (subscription, notification) => {
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    data: notification.data,
    actions: notification.actions || []
  });
  
  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error) {
    console.error('Push notification failed:', error);
    // Handle expired subscriptions
    if (error.statusCode === 410) {
      await User.findOneAndUpdate(
        { pushSubscription: subscription },
        { $unset: { pushSubscription: 1 } }
      );
    }
  }
};

/**
 * Send email notification
 */
exports.sendEmailNotification = async (email, notification) => {
  if (!emailTransporter) {
    console.log('Email transporter not configured');
    return;
  }

  const mailOptions = {
    from: `${process.env.APP_NAME || 'SexySelfies'} <${process.env.EMAIL_USER}>`,
    to: email,
    subject: notification.title,
    html: this.generateEmailTemplate(notification)
  };
  
  try {
    await emailTransporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Email notification failed:', error);
  }
};

// ============================================
// CREATOR-MEMBER INTERACTION NOTIFICATIONS
// ============================================

/**
 * Notify member when creator pokes them
 */
exports.notifyMemberOfPoke = async (memberId, creatorId) => {
  const creator = await Creator.findById(creatorId)
    .select('username profileImage');
  
  const notification = {
    type: 'poke',
    title: `${creator.username} poked you! 👋`,
    body: 'They want to get your attention. Check out their profile!',
    category: 'interaction',
    priority: 'normal',
    data: {
      creatorId,
      creatorUsername: creator.username,
      creatorImage: creator.profileImage,
      actionType: 'poke',
      actionUrl: `/creator/${creatorId}`
    }
  };
  
  const member = await Member.findById(memberId);
  await this.sendNotification(member.user, notification);
};

/**
 * Notify member when creator likes their profile
 */
exports.notifyMemberOfLike = async (memberId, creatorId) => {
  const creator = await Creator.findById(creatorId)
    .select('username profileImage');
  
  const notification = {
    type: 'like',
    title: `${creator.username} likes your profile! ❤️`,
    body: 'You caught their eye! Why not check them out?',
    category: 'interaction',
    priority: 'normal',
    data: {
      creatorId,
      creatorUsername: creator.username,
      creatorImage: creator.profileImage,
      actionType: 'like',
      actionUrl: `/creator/${creatorId}`
    }
  };
  
  const member = await Member.findById(memberId);
  await this.sendNotification(member.user, notification);
};

/**
 * Notify member of special offer
 */
exports.notifyMemberOfSpecialOffer = async (memberId, creatorId, offer) => {
  const creator = await Creator.findById(creatorId)
    .select('username profileImage');
  
  const notification = {
    type: 'special_offer',
    title: `🎁 Special Offer from ${creator.username}!`,
    body: offer.message || `Exclusive ${offer.discount}% off just for you! Expires soon.`,
    category: 'offer',
    priority: 'high',
    data: {
      creatorId,
      creatorUsername: creator.username,
      creatorImage: creator.profileImage,
      offerId: offer._id,
      offerType: offer.type,
      discount: offer.discount,
      expiresAt: offer.expiresAt,
      actionType: 'special_offer',
      actionUrl: `/offers/${offer._id}`
    },
    actions: [
      {
        action: 'view-offer',
        title: 'View Offer'
      },
      {
        action: 'dismiss',
        title: 'Maybe Later'
      }
    ]
  };
  
  const member = await Member.findById(memberId);
  await this.sendNotification(member.user, notification);
};

/**
 * Notify member of new message from creator
 */
exports.notifyMemberOfMessage = async (memberId, creatorId, message) => {
  const creator = await Creator.findById(creatorId)
    .select('username profileImage');
  
  const notification = {
    type: 'message',
    title: `New message from ${creator.username} 💬`,
    body: message.preview || 'You have a new message!',
    category: 'message',
    priority: 'normal',
    data: {
      creatorId,
      creatorUsername: creator.username,
      creatorImage: creator.profileImage,
      messageId: message._id,
      conversationId: message.conversationId,
      actionType: 'message',
      actionUrl: `/messages/${message.conversationId}`
    }
  };
  
  const member = await Member.findById(memberId);
  await this.sendNotification(member.user, notification);
};

/**
 * Notify member of content unlock
 */
exports.notifyMemberOfContentUnlock = async (memberId, creatorId, content) => {
  const creator = await Creator.findById(creatorId)
    .select('username profileImage');
  
  const notification = {
    type: 'content_unlocked',
    title: `Content Unlocked! 🔓`,
    body: `You can now view ${content.type} from ${creator.username}`,
    category: 'purchase',
    priority: 'normal',
    data: {
      creatorId,
      creatorUsername: creator.username,
      contentId: content._id,
      contentType: content.type,
      actionUrl: `/content/${content._id}`
    }
  };
  
  const member = await Member.findById(memberId);
  await this.sendNotification(member.user, notification);
};

// ============================================
// CREATOR NOTIFICATIONS
// ============================================

/**
 * Notify creator when member responds
 */
exports.notifyCreatorOfResponse = async (creatorId, memberId, responseType) => {
  const member = await Member.findById(memberId)
    .select('username avatar');
  
  const memberAnalytics = await require('../models/MemberAnalytics')
    .findOne({ member: memberId })
    .select('spending.tier activity.level');
  
  const emoji = memberAnalytics?.spending.tier === 'whale' ? '🐋' :
                 memberAnalytics?.spending.tier === 'vip' ? '⭐' : '👤';
  
  const notification = {
    type: 'member_response',
    title: `${emoji} ${member.username} responded!`,
    body: `${responseType === 'message' ? 'Sent you a message' : 'Engaged with your content'}`,
    category: 'response',
    priority: memberAnalytics?.spending.tier === 'whale' ? 'high' : 'normal',
    data: {
      memberId,
      memberUsername: member.username,
      memberAvatar: member.avatar,
      memberTier: memberAnalytics?.spending.tier,
      responseType,
      actionUrl: `/member/profile/${memberId}`
    }
  };
  
  const creator = await Creator.findById(creatorId);
  await this.sendNotification(creator.user, notification);
};

/**
 * Notify creator of content purchase
 */
exports.notifyCreatorOfPurchase = async (creatorId, memberId, purchase) => {
  const member = await Member.findById(memberId)
    .select('username avatar');
  
  const memberAnalytics = await require('../models/MemberAnalytics')
    .findOne({ member: memberId })
    .select('spending.tier');
  
  const emoji = memberAnalytics?.spending.tier === 'whale' ? '🐋' :
                 memberAnalytics?.spending.tier === 'vip' ? '⭐' : '💰';
  
  const notification = {
    type: 'purchase',
    title: `${emoji} New Purchase: $${purchase.amount}!`,
    body: `${member.username} just unlocked your ${purchase.contentType}`,
    category: 'sale',
    priority: 'high',
    data: {
      memberId,
      memberUsername: member.username,
      memberTier: memberAnalytics?.spending.tier,
      purchaseAmount: purchase.amount,
      contentType: purchase.contentType,
      contentId: purchase.contentId,
      actionUrl: `/sales/${purchase._id}`
    }
  };
  
  const creator = await Creator.findById(creatorId);
  await this.sendNotification(creator.user, notification);
};

/**
 * Notify creator of high-value member activity
 */
exports.notifyCreatorOfWhaleActivity = async (creatorId, memberData) => {
  const notification = {
    type: 'whale_alert',
    title: '🐋 Whale Alert!',
    body: `A high-value member just ${memberData.action}. Don't miss this opportunity!`,
    category: 'opportunity',
    priority: 'high',
    data: {
      memberId: memberData.memberId,
      action: memberData.action,
      spendingTier: 'whale',
      estimatedValue: memberData.estimatedValue,
      actionUrl: `/member/profile/${memberData.memberId}`
    }
  };
  
  const creator = await Creator.findById(creatorId);
  await this.sendNotification(creator.user, notification);
};

/**
 * Notify creator of sales milestone
 */
exports.notifyCreatorOfMilestone = async (creatorId, milestone) => {
  const notification = {
    type: 'milestone',
    title: `🎉 Milestone Achieved: ${milestone.name}!`,
    body: milestone.description,
    category: 'achievement',
    priority: 'normal',
    data: {
      milestoneType: milestone.type,
      milestoneName: milestone.name,
      reward: milestone.reward,
      nextMilestone: milestone.next
    }
  };
  
  const creator = await Creator.findById(creatorId);
  await this.sendNotification(creator.user, notification);
};

// ============================================
// BULK NOTIFICATIONS
// ============================================

/**
 * Send bulk notifications to multiple users
 */
exports.sendBulkNotifications = async (userIds, notification) => {
  const results = await Promise.allSettled(
    userIds.map(userId => this.sendNotification(userId, notification))
  );
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  return {
    total: userIds.length,
    successful,
    failed,
    results
  };
};

// ============================================
// NOTIFICATION MANAGEMENT
// ============================================

/**
 * Mark notification as read
 */
exports.markAsRead = async (notificationId, userId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
  
  return notification;
};

/**
 * Mark all notifications as read
 */
exports.markAllAsRead = async (userId) => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

/**
 * Get unread notification count
 */
exports.getUnreadCount = async (userId) => {
  const count = await Notification.countDocuments({
    user: userId,
    isRead: false
  });
  
  return count;
};

/**
 * Delete old notifications
 */
exports.cleanupOldNotifications = async (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
  
  const result = await Notification.deleteMany({
    createdAt: { $lt: cutoffDate },
    isRead: true
  });
  
  return result.deletedCount;
};

// ============================================
// EMAIL TEMPLATES
// ============================================

/**
 * Generate email template
 */
exports.generateEmailTemplate = (notification) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #17D2C2 0%, #12B7AB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #17D2C2; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${notification.title}</h1>
        </div>
        <div class="content">
          <p>${notification.body}</p>
          ${notification.data?.actionUrl ? 
            `<a href="${process.env.APP_URL || 'http://localhost:5173'}${notification.data.actionUrl}" class="button">View Now</a>` : 
            ''
          }
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} ${process.env.APP_NAME || 'SexySelfies'}. All rights reserved.</p>
          <p><a href="${process.env.APP_URL || 'http://localhost:5173'}/settings/notifications">Manage notification preferences</a></p>
        </div>
      </div>
    </body>
    </html>
  `;
};

module.exports = exports;