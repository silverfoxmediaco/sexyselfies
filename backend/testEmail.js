// testEmail.js - Place this in your backend root directory
// Run with: node testEmail.js

require('dotenv').config();
const { createTransport } = require('nodemailer');

console.log('Testing email configuration...\n');
console.log('Configuration:');
console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***hidden***' : 'NOT SET');
console.log('EMAIL_FROM:', process.env.EMAIL_FROM);
console.log('ADMIN_EMAIL:', process.env.ADMIN_EMAIL);
console.log('----------------------------\n');

// Create transporter with your SiteGround settings
const transporter = createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // Sometimes needed for SiteGround
  },
  debug: true, // Enable debug output
  logger: true, // Log to console
});

// Verify connection configuration
console.log('Verifying SMTP connection...\n');
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ SMTP Connection Failed:');
    console.error(error);
    console.log('\nPossible issues:');
    console.log('1. Check EMAIL_PASS is correct');
    console.log(
      '2. Try using "mail.sexyselfies.com" instead of "smtp.siteground.com"'
    );
    console.log('3. Make sure no spaces in password');
    console.log('4. Check if 2FA is enabled on email account');
  } else {
    console.log('✅ SMTP Connection Successful!');
    console.log('Server is ready to send emails\n');

    // If verification succeeds, send a test email
    sendTestEmail();
  }
});

function sendTestEmail() {
  console.log('Sending test email...\n');

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.ADMIN_EMAIL,
    subject: 'Test Email from SexySelfies Platform',
    text: 'This is a test email to verify your email configuration is working correctly.',
    html: `
      <div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">SexySelfies Platform</h1>
        </div>
        <div style="background: #121212; color: #ffffff; padding: 30px;">
          <h2 style="color: #17D2C2;">Email Configuration Test</h2>
          <p>✅ Your email configuration is working correctly!</p>
          <p>This test email confirms that:</p>
          <ul>
            <li>SMTP connection is established</li>
            <li>Authentication is successful</li>
            <li>Emails can be sent from your platform</li>
          </ul>
          <p style="color: #C7C7CC;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
        <div style="background: #0A0A0A; color: #8E8E93; padding: 20px; text-align: center; font-size: 12px;">
          <p>This is an automated test email from your SexySelfies platform.</p>
        </div>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Failed to send test email:');
      console.error(error);
    } else {
      console.log('✅ Test email sent successfully!');
      console.log('Message ID:', info.messageId);
      console.log('Check your inbox at:', process.env.ADMIN_EMAIL);
    }

    // Close the connection
    transporter.close();
  });
}
