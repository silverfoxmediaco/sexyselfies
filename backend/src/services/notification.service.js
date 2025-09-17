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
          .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 15px 40px; background: #17D2C2; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to ${APP_NAME}!</h1>
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

// Keep all other existing functions unchanged...
// [Rest of your notification.service.js code remains the same]

module.exports = exports;
