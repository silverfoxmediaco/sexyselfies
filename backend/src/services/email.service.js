const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send new message notification email
 */
exports.sendNewMessageEmail = async ({ recipientEmail, recipientName, senderName, messagePreview, messageLink }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: recipientEmail,
      subject: `💬 New message from ${senderName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #fff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #17d2c2;
            }
            .message-icon {
              font-size: 48px;
              margin: 20px 0;
            }
            h1 {
              color: #333;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .message-preview {
              background: #f5f5f5;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #17d2c2;
              margin: 20px 0;
              font-style: italic;
              color: #666;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #12b7ab 0%, #17d2c2 50%, #47e0d2 100%);
              color: white;
              padding: 15px 40px;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              margin: 20px 0;
              transition: transform 0.2s;
            }
            .cta-button:hover {
              transform: translateY(-2px);
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              color: #999;
              font-size: 14px;
            }
            .footer a {
              color: #17d2c2;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SexySelfies</div>
              <div class="message-icon">💬</div>
              <h1>New Message from ${senderName}</h1>
            </div>

            <p>Hi ${recipientName},</p>

            <p>You have a new message waiting for you!</p>

            ${messagePreview ? `
              <div class="message-preview">
                "${messagePreview}"
              </div>
            ` : ''}

            <div style="text-align: center;">
              <a href="${messageLink}" class="cta-button">
                View Message
              </a>
            </div>

            <p style="margin-top: 30px;">
              Reply directly from your messages inbox to keep the conversation going.
            </p>

            <div class="footer">
              <p>
                You're receiving this email because someone sent you a message on SexySelfies.
              </p>
              <p>
                <a href="${process.env.CLIENT_URL}/settings/notifications">Manage notification preferences</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${recipientName},

You have a new message from ${senderName} on SexySelfies!

${messagePreview ? `Message preview: "${messagePreview}"` : ''}

View and reply to this message: ${messageLink}

---
You're receiving this email because someone sent you a message on SexySelfies.
Manage your notification preferences: ${process.env.CLIENT_URL}/settings/notifications
      `.trim(),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ New message email sent to ${recipientEmail}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending new message email:', error);
    // Don't throw - email failure shouldn't break message sending
    return { success: false, error: error.message };
  }
};

/**
 * Verify email configuration
 */
exports.verifyEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};

module.exports = exports;
