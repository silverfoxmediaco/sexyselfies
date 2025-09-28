// backend/src/services/notification.service.js
// Service for handling all notification types (push, email, in-app)

const nodemailer = require('nodemailer');
const webpush = require('web-push');
const Notification = require('../models/Notification');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const User = require('../models/User');

// Configure email transporter with better error handling
let emailTransporter = null;

// Check for email configuration and create transporter
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_SERVICE = process.env.EMAIL_SERVICE || 'gmail';
const EMAIL_HOST = process.env.EMAIL_HOST;
const EMAIL_PORT = process.env.EMAIL_PORT;

if (EMAIL_USER && EMAIL_PASS) {
  try {
    if (EMAIL_HOST && EMAIL_PORT) {
      // Use custom SMTP settings if provided
      emailTransporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port: EMAIL_PORT,
        secure: EMAIL_PORT == 465, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });
    } else {
      // Use service preset (gmail, outlook, etc.)
      emailTransporter = nodemailer.createTransport({
        service: EMAIL_SERVICE,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });
    }

    // Verify transporter configuration
    emailTransporter.verify(function (error, success) {
      if (error) {
        console.error('Email transporter verification failed:', error);
        emailTransporter = null; // Disable if verification fails
      } else {
        console.log('✅ Email service is ready to send messages');
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error);
    emailTransporter = null;
  }
} else {
  console.log(
    '⚠️ Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env file'
  );
}

// Configure web push (keep existing code)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (EMAIL_USER || 'admin@sexyselfies.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ============================================
// EMAIL VERIFICATION - SIMPLIFIED
// ============================================

/**
 * Send welcome email with login link
 * This is the main function called during registration
 */
exports.sendVerificationEmail = async (
  email,
  verificationToken,
  username,
  userRole = 'member'
) => {
  // For development, just log if email is not configured
  if (!emailTransporter) {
    console.log(
      `📧 [DEV MODE] Would send welcome email to: ${email} for user: ${username} (${userRole})`
    );
    return { success: true, dev: true };
  }

  const APP_URL =
    process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174';
  const APP_NAME = process.env.APP_NAME || 'SexySelfies';

  // Use base64 embedded logo for reliable email rendering
  const logoBase64 = 'data:image/png;base64,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/';

  console.log('📧 Using base64 embedded logo for email');

  // Determine correct login page based on user role
  const loginPath = userRole === 'creator' ? '/creator/login' : '/member/login';
  const loginUrl = `${APP_URL}${loginPath}`;

  const mailOptions = {
    from: `${APP_NAME} <${EMAIL_USER}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}! Complete your setup`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17D2C2 0%, #12B7AB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { max-width: 200px; height: auto; margin-bottom: 20px; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 40px; background: #17D2C2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome!</h1>
            <img src="${logoBase64}" alt="${APP_NAME} Logo" class="logo" />
          </div>
          <div class="content">
            <p style="font-size: 18px;">Hi ${username || 'there'},</p>
            <p>Your account has been created successfully!</p>
            <p>Click the button below to login and complete your profile setup:</p>
            <div style="text-align: center;">
              <a href="${loginUrl}" class="button">Login to Your Account</a>
            </div>
            <p>Once you login, you'll be guided through:</p>
            <ul>
              <li>Profile setup</li>
              <li>Browse preferences</li>
              <li>Start discovering creators</li>
            </ul>
            <p>Welcome to the community!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
            <p>If you didn't create this account, please ignore this email.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent successfully to:', email);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Welcome email failed:', error.message);
    // Don't throw - let registration continue even if email fails
    return { success: false, error: error.message };
  }
};

/**
 * Send gift notification email to member
 * @param {string} memberEmail - Member's email address
 * @param {string} memberUsername - Member's username
 * @param {Object} giftData - Gift information
 */
exports.sendGiftNotificationEmail = async (memberEmail, memberUsername, giftData) => {
  if (!emailTransporter) {
    console.log(
      `📧 [DEV MODE] Would send gift notification email to: ${memberEmail}`
    );
    return { success: true, dev: true };
  }

  const APP_URL =
    process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174';
  const APP_NAME = process.env.APP_NAME || 'SexySelfies';

  const viewGiftUrl = `${APP_URL}/member/gifts`;

  const mailOptions = {
    from: `${APP_NAME} <${EMAIL_USER}>`,
    to: memberEmail,
    subject: `🎁 You received "${giftData.contentTitle}" from @${giftData.creatorUsername}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17D2C2 0%, #12B7AB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .gift-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .button { display: inline-block; padding: 15px 40px; background: #17D2C2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 You Got a Gift!</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px;">Hi ${memberUsername},</p>
            <p><strong>@${giftData.creatorUsername}</strong> sent you a special gift!</p>

            <div class="gift-box">
              <h3>"${giftData.contentTitle}"</h3>
              <p><strong>Original Value:</strong> $${giftData.originalPrice}</p>
              <p><strong>Message:</strong> "${giftData.message}"</p>
            </div>

            <div style="text-align: center;">
              <a href="${viewGiftUrl}" class="button">View Your Gift</a>
            </div>

            <p>Click the button above to see what @${giftData.creatorUsername} shared with you!</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Gift notification email sent to:', memberEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Gift notification email failed:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send gift viewed notification email to creator
 * @param {string} creatorEmail - Creator's email address
 * @param {string} creatorUsername - Creator's username
 * @param {Object} viewData - Gift view information
 */
exports.sendGiftViewedNotificationEmail = async (creatorEmail, creatorUsername, viewData) => {
  if (!emailTransporter) {
    console.log(
      `📧 [DEV MODE] Would send gift viewed notification to: ${creatorEmail}`
    );
    return { success: true, dev: true };
  }

  const APP_URL =
    process.env.FRONTEND_URL || process.env.APP_URL || 'http://localhost:5174';
  const APP_NAME = process.env.APP_NAME || 'SexySelfies';

  const analyticsUrl = `${APP_URL}/creator/gifts/analytics`;

  const mailOptions = {
    from: `${APP_NAME} <${EMAIL_USER}>`,
    to: creatorEmail,
    subject: `👀 ${viewData.memberUsername} viewed your gift "${viewData.contentTitle}"`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #17D2C2 0%, #12B7AB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .stats-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { display: inline-block; padding: 15px 40px; background: #17D2C2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👀 Gift Viewed!</h1>
          </div>
          <div class="content">
            <p style="font-size: 18px;">Hi ${creatorUsername},</p>
            <p>Great news! <strong>${viewData.memberUsername}</strong> just viewed your gift.</p>

            <div class="stats-box">
              <h3>"${viewData.contentTitle}"</h3>
              <p><strong>Viewed:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Member:</strong> @${viewData.memberUsername}</p>
            </div>

            <p>This shows your gift was well-received! Consider following up with a personalized message.</p>

            <div style="text-align: center;">
              <a href="${analyticsUrl}" class="button">View Gift Analytics</a>
            </div>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    const result = await emailTransporter.sendMail(mailOptions);
    console.log('✅ Gift viewed notification sent to:', creatorEmail);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Gift viewed notification failed:', error.message);
    return { success: false, error: error.message };
  }
};

// ============================================
// IN-APP NOTIFICATION SYSTEM
// ============================================

/**
 * Create a connection notification
 * Called when someone accepts a connection
 */
exports.createConnectionNotification = async (fromUser, toUserId) => {
  try {
    // Get recipient to determine their role
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      throw new Error('Recipient user not found');
    }

    const notification = await Notification.createNotification({
      recipientId: toUserId,
      recipientRole: recipient.role || 'member',
      type: 'connection',
      title: 'New Connection',
      message: `${fromUser.displayName || fromUser.name} connected with you`,
      from: {
        userId: fromUser._id,
        name: fromUser.displayName || fromUser.name,
        avatar: fromUser.profileImage || fromUser.avatar
      },
      actionUrl: recipient.role === 'creator' ? '/creator/connections' : '/member/connections'
    });

    console.log('Connection notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating connection notification:', error);
    throw error;
  }
};

/**
 * Create a message notification
 * Called when new message is received
 */
exports.createMessageNotification = async (fromUser, toUserId, messagePreview) => {
  try {
    // Get recipient to determine their role
    const recipient = await User.findById(toUserId);
    if (!recipient) {
      throw new Error('Recipient user not found');
    }

    const notification = await Notification.createNotification({
      recipientId: toUserId,
      recipientRole: recipient.role || 'member',
      type: 'message',
      title: 'New Message',
      message: `${fromUser.displayName || fromUser.name}: ${messagePreview}`,
      from: {
        userId: fromUser._id,
        name: fromUser.displayName || fromUser.name,
        avatar: fromUser.profileImage || fromUser.avatar
      },
      actionUrl: recipient.role === 'creator' ? '/creator/messages' : '/member/messages'
    });

    console.log('Message notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating message notification:', error);
    throw error;
  }
};

/**
 * Create a tip notification
 * Called when tip is sent
 */
exports.createTipNotification = async (fromUser, creatorId, amount) => {
  try {
    // Get creator user to verify role
    const creator = await User.findById(creatorId);
    if (!creator) {
      throw new Error('Creator user not found');
    }

    const notification = await Notification.createNotification({
      recipientId: creatorId,
      recipientRole: 'creator',
      type: 'tip',
      title: 'New Tip Received!',
      message: `${fromUser.displayName || fromUser.name} sent you a tip`,
      from: {
        userId: fromUser._id,
        name: fromUser.displayName || fromUser.name,
        avatar: fromUser.profileImage || fromUser.avatar
      },
      amount: amount,
      actionUrl: '/creator/earnings'
    });

    console.log('Tip notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating tip notification:', error);
    throw error;
  }
};

/**
 * Create a purchase notification
 * Called when content is purchased
 */
exports.createPurchaseNotification = async (buyerUser, creatorId, contentTitle, amount, contentId = null) => {
  try {
    // Get creator user to verify role
    const creator = await User.findById(creatorId);
    if (!creator) {
      throw new Error('Creator user not found');
    }

    const notification = await Notification.createNotification({
      recipientId: creatorId,
      recipientRole: 'creator',
      type: 'purchase',
      title: 'Content Purchased!',
      message: `${buyerUser.displayName || buyerUser.name} purchased "${contentTitle}"`,
      from: {
        userId: buyerUser._id,
        name: buyerUser.displayName || buyerUser.name,
        avatar: buyerUser.profileImage || buyerUser.avatar
      },
      amount: amount,
      relatedContentId: contentId,
      actionUrl: '/creator/earnings'
    });

    console.log('Purchase notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating purchase notification:', error);
    throw error;
  }
};

/**
 * Create a content notification
 * Called when followed creator posts new content
 */
exports.createContentNotification = async (creatorUser, followerId, contentTitle, contentId = null) => {
  try {
    // Get follower to determine their role
    const follower = await User.findById(followerId);
    if (!follower) {
      throw new Error('Follower user not found');
    }

    const notification = await Notification.createNotification({
      recipientId: followerId,
      recipientRole: follower.role || 'member',
      type: 'content',
      title: 'New Content Available',
      message: `${creatorUser.displayName || creatorUser.name} posted "${contentTitle}"`,
      from: {
        userId: creatorUser._id,
        name: creatorUser.displayName || creatorUser.name,
        avatar: creatorUser.profileImage || creatorUser.avatar
      },
      relatedContentId: contentId,
      actionUrl: follower.role === 'creator' ? '/creator/browse-creators' : '/member/browse-creators'
    });

    console.log('Content notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating content notification:', error);
    throw error;
  }
};

/**
 * Create a system notification
 * Called for system-wide announcements or updates
 */
exports.createSystemNotification = async (userId, title, message, actionUrl = null) => {
  try {
    // Get user to determine their role
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const notification = await Notification.createNotification({
      recipientId: userId,
      recipientRole: user.role || 'member',
      type: 'system',
      title: title,
      message: message,
      actionUrl: actionUrl
    });

    console.log('System notification created:', notification._id);
    return notification;
  } catch (error) {
    console.error('Error creating system notification:', error);
    throw error;
  }
};

/**
 * Create bulk notifications for multiple users
 * Useful for system announcements or promotional content
 */
exports.createBulkNotifications = async (userIds, notificationData) => {
  try {
    const notifications = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (user) {
          const notification = await Notification.createNotification({
            ...notificationData,
            recipientId: userId,
            recipientRole: user.role || 'member'
          });
          notifications.push(notification);
        }
      } catch (error) {
        console.error(`Failed to create notification for user ${userId}:`, error);
        // Continue with other users
      }
    }

    console.log(`Bulk notifications created: ${notifications.length}/${userIds.length}`);
    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics for a user
 * Helper method for analytics
 */
exports.getUserNotificationStats = async (userId) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { recipientId: userId } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    const totalUnread = await Notification.countDocuments({
      recipientId: userId,
      read: false
    });

    return {
      totalUnread,
      byType: stats
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    throw error;
  }
};

module.exports = exports;
