const { createTransport } = require('nodemailer');
const Creator = require('../models/Creator');
const User = require('../models/User');

// Create email transporter
const createTransporter = () => {
  return createTransport({
    host: process.env.EMAIL_HOST || 'mail.sexyselfies.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER || 'admin@sexyselfies.com',
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

// @desc    Send verification notification to admin
// @route   POST /api/notifications/admin-verification
// @access  Private
exports.sendAdminVerificationNotification = async (req, res) => {
  try {
    const { userId, userEmail, idType } = req.body;
    
    // Get user details
    const user = await User.findById(userId);
    const creator = await Creator.findOne({ user: userId });
    
    if (!user || !creator) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const transporter = createTransporter();
    
    // Simple text email to admin
    const adminMailOptions = {
      from: process.env.EMAIL_FROM || 'SexySelfies <admin@sexyselfies.com>',
      to: process.env.ADMIN_EMAIL || 'admin@sexyselfies.com',
      subject: 'New Creator Verification Request - Sexy Selfies',
      text: `
New Creator Verification Request

Creator Details:
- Display Name: ${creator.displayName}
- Email: ${userEmail}
- User ID: ${userId}
- Document Type: ${idType ? idType.replace(/_/g, ' ').toUpperCase() : 'Not specified'}
- Submitted At: ${new Date().toLocaleString()}

Please review the uploaded verification documents in Cloudinary.

To approve or reject:
1. Review the uploaded documents
2. Verify the person matches the ID
3. Check that the person appears to be 18+
4. Use the approval endpoint to update status

Admin Dashboard: ${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5173/admin'}
      `,
      html: `
<div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">New Verification Request</h1>
  </div>
  <div style="background: #121212; color: #ffffff; padding: 30px;">
    <h2 style="color: #17D2C2;">Creator Details:</h2>
    <div style="background: #1C1C1E; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p><strong>Display Name:</strong> ${creator.displayName}</p>
      <p><strong>Email:</strong> ${userEmail}</p>
      <p><strong>User ID:</strong> ${userId}</p>
      <p><strong>Document Type:</strong> ${idType ? idType.replace(/_/g, ' ').toUpperCase() : 'Not specified'}</p>
      <p><strong>Submitted At:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <p style="color: #C7C7CC;"><strong>Action Required:</strong> Please review the uploaded verification documents.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:5173/admin'}" 
         style="display: inline-block; background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); 
                color: #001310; padding: 12px 30px; border-radius: 16px; text-decoration: none; 
                font-weight: 600; font-size: 16px;">
        Go to Admin Dashboard
      </a>
    </div>
  </div>
  <div style="background: #0A0A0A; color: #8E8E93; padding: 20px; text-align: center; font-size: 12px;">
    <p>This is an automated notification from SexySelfies admin system.</p>
  </div>
</div>
      `
    };
    
    // Send email to admin
    await transporter.sendMail(adminMailOptions);
    
    // Simple confirmation email to user
    const userMailOptions = {
      from: process.env.EMAIL_FROM || 'SexySelfies <admin@sexyselfies.com>',
      to: userEmail,
      subject: 'Verification Documents Received - Sexy Selfies',
      text: `
Hi ${creator.displayName},

We've received your verification documents!

Our team will review them shortly, usually within 5-10 minutes during business hours.

What happens next:
1. Our team verifies your identity and age
2. You'll receive an email once approved
3. You can start uploading content and earning

Review Timeline:
- Business hours (9 AM - 6 PM EST): 5-10 minutes
- After hours: Within 24 hours

Best regards,
The Sexy Selfies Team
      `,
      html: `
<div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verification Submitted Successfully!</h1>
  </div>
  <div style="background: #121212; color: #ffffff; padding: 30px;">
    <p>Hi ${creator.displayName},</p>
    <p style="color: #17D2C2; font-size: 18px;"><strong>We've received your verification documents!</strong></p>
    <p>Our team will review them shortly, usually within 5-10 minutes during business hours.</p>
    
    <div style="background: #1C1C1E; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #47E0D2; margin-top: 0;">What happens next:</h3>
      <ol style="color: #C7C7CC;">
        <li>Our team verifies your identity and age</li>
        <li>You'll receive an email once approved</li>
        <li>You can start uploading content and earning</li>
      </ol>
    </div>
    
    <div style="background: #1C1C1E; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="color: #47E0D2; margin-top: 0;"><strong>Review Timeline:</strong></p>
      <ul style="color: #C7C7CC;">
        <li>Business hours (9 AM - 6 PM EST): 5-10 minutes</li>
        <li>After hours: Within 24 hours</li>
      </ul>
    </div>
    
    <p style="color: #C7C7CC;">Best regards,<br>The Sexy Selfies Team</p>
  </div>
  <div style="background: #0A0A0A; color: #8E8E93; padding: 20px; text-align: center; font-size: 12px;">
    <p>Thank you for joining SexySelfies!</p>
  </div>
</div>
      `
    };
    
    await transporter.sendMail(userMailOptions);
    
    // Update creator verification status
    if (!creator.verificationStatus) {
      creator.verificationStatus = 'pending';
    }
    creator.verificationSubmittedAt = new Date();
    await creator.save();
    
    res.status(200).json({
      success: true,
      message: 'Verification notification sent successfully'
    });
    
  } catch (error) {
    console.error('Email notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification: ' + error.message
    });
  }
};

// @desc    Approve creator verification
// @route   POST /api/notifications/approve-verification
// @access  Admin only
exports.approveVerification = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const creator = await Creator.findOne({ user: userId });
    const user = await User.findById(userId);
    
    if (!creator || !user) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }
    
    // Update verification status
    creator.isVerified = true;
    creator.verificationStatus = 'approved';
    creator.verificationApprovedAt = new Date();
    await creator.save();
    
    // Send approval email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SexySelfies <admin@sexyselfies.com>',
      to: user.email,
      subject: 'You are Approved! Start Earning on Sexy Selfies',
      text: `
Congratulations ${creator.displayName}!

Your account has been verified and approved! You can now start uploading content and earning money.

What you can do now:
- Upload photos and videos
- Set your own prices
- Connect with fans
- Track your earnings
- Get paid weekly

Remember: You keep 80% of all earnings!

Go to your dashboard: ${process.env.FRONTEND_URL || 'http://localhost:5174'}/creator/dashboard

Welcome aboard!
The Sexy Selfies Team
      `,
      html: `
<div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">🎉 Congratulations ${creator.displayName}!</h1>
  </div>
  <div style="background: #121212; color: #ffffff; padding: 30px;">
    <p style="color: #17D2C2; font-size: 20px;"><strong>Your account has been verified and approved!</strong></p>
    <p>You can now start uploading content and earning money.</p>
    
    <div style="background: #1C1C1E; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #47E0D2; margin-top: 0;">What you can do now:</h3>
      <ul style="color: #C7C7CC;">
        <li>Upload photos and videos</li>
        <li>Set your own prices</li>
        <li>Connect with fans</li>
        <li>Track your earnings</li>
        <li>Get paid weekly</li>
      </ul>
    </div>
    
    <div style="background: #22C55E; color: white; padding: 15px; border-radius: 12px; text-align: center; margin: 20px 0;">
      <p style="margin: 0; font-size: 18px;"><strong>Remember:</strong> You keep 80% of all earnings!</p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/creator/dashboard" 
         style="display: inline-block; background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); 
                color: #001310; padding: 12px 30px; border-radius: 16px; text-decoration: none; 
                font-weight: 600; font-size: 16px;">
        Go to Your Dashboard
      </a>
    </div>
    
    <p style="color: #C7C7CC;">Welcome aboard!<br>The Sexy Selfies Team</p>
  </div>
  <div style="background: #0A0A0A; color: #8E8E93; padding: 20px; text-align: center; font-size: 12px;">
    <p>Start your journey as a SexySelfies creator today!</p>
  </div>
</div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Creator approved successfully'
    });
    
  } catch (error) {
    console.error('Approval error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve creator: ' + error.message
    });
  }
};

// @desc    Reject creator verification
// @route   POST /api/notifications/reject-verification
// @access  Admin only
exports.rejectVerification = async (req, res) => {
  try {
    const { userId, reason } = req.body;
    
    const creator = await Creator.findOne({ user: userId });
    const user = await User.findById(userId);
    
    if (!creator || !user) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found'
      });
    }
    
    // Update verification status
    creator.isVerified = false;
    creator.verificationStatus = 'rejected';
    creator.verificationRejectedAt = new Date();
    creator.verificationRejectionReason = reason;
    await creator.save();
    
    // Send rejection email
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SexySelfies <admin@sexyselfies.com>',
      to: user.email,
      subject: 'Verification Update - Sexy Selfies',
      text: `
Hi ${creator.displayName},

Unfortunately, we were unable to verify your account at this time.

${reason ? 'Reason: ' + reason : ''}

Common reasons for verification issues:
- Photos were blurry or unreadable
- ID appeared to be expired
- Selfie didn't clearly show both face and ID
- Information didn't match our records

You can submit new verification documents at any time by visiting:
${process.env.FRONTEND_URL || 'http://localhost:5174'}/creator/verify-id

If you believe this was an error, please contact our support team.

Best regards,
The Sexy Selfies Team
      `,
      html: `
<div style="font-family: Poppins, Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Verification Update</h1>
  </div>
  <div style="background: #121212; color: #ffffff; padding: 30px;">
    <p>Hi ${creator.displayName},</p>
    <p>Unfortunately, we were unable to verify your account at this time.</p>
    
    ${reason ? `
    <div style="background: #1C1C1E; border: 1px solid #EF4444; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="color: #EF4444; margin-top: 0;"><strong>Reason:</strong></p>
      <p style="color: #C7C7CC;">${reason}</p>
    </div>
    ` : ''}
    
    <div style="background: #1C1C1E; border-radius: 12px; padding: 20px; margin: 20px 0;">
      <p style="color: #F59E0B; margin-top: 0;"><strong>Common reasons for verification issues:</strong></p>
      <ul style="color: #C7C7CC;">
        <li>Photos were blurry or unreadable</li>
        <li>ID appeared to be expired</li>
        <li>Selfie didn't clearly show both face and ID</li>
        <li>Information didn't match our records</li>
      </ul>
    </div>
    
    <p>You can submit new verification documents at any time.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/creator/verify-id" 
         style="display: inline-block; background: linear-gradient(135deg, #12B7AB 0%, #17D2C2 50%, #47E0D2 100%); 
                color: #001310; padding: 12px 30px; border-radius: 16px; text-decoration: none; 
                font-weight: 600; font-size: 16px;">
        Submit New Verification
      </a>
    </div>
    
    <p style="color: #C7C7CC;">If you believe this was an error, please contact our support team.</p>
    <p style="color: #C7C7CC;">Best regards,<br>The Sexy Selfies Team</p>
  </div>
  <div style="background: #0A0A0A; color: #8E8E93; padding: 20px; text-align: center; font-size: 12px;">
    <p>We're here to help - contact support if you have questions.</p>
  </div>
</div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.status(200).json({
      success: true,
      message: 'Creator rejection notification sent'
    });
    
  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process rejection: ' + error.message
    });
  }
};