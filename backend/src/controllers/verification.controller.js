const Creator = require('../models/Creator');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const {
  sendAdminVerificationNotification,
} = require('./notification.controller');

// @desc    Upload verification documents
// @route   POST /api/verification/upload
// @access  Private (Creator only)
exports.uploadVerification = async (req, res) => {
  try {
    console.log('Starting verification upload for user:', req.user.id);

    // Find creator profile
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    // Check if already verified
    if (creator.isVerified) {
      return res.status(400).json({
        success: false,
        error: 'Already verified',
      });
    }

    const { idFront, idBack, selfie, idType } = req.body;

    if (!idFront || !idBack || !selfie || !idType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required verification documents',
      });
    }

    // Upload to Cloudinary with proper folder structure
    const uploadPromises = [
      cloudinary.uploader.upload(idFront, {
        folder: `verifications/${req.user.id}`,
        public_id: `id_front_${Date.now()}`,
        resource_type: 'image',
      }),
      cloudinary.uploader.upload(idBack, {
        folder: `verifications/${req.user.id}`,
        public_id: `id_back_${Date.now()}`,
        resource_type: 'image',
      }),
      cloudinary.uploader.upload(selfie, {
        folder: `verifications/${req.user.id}`,
        public_id: `selfie_${Date.now()}`,
        resource_type: 'image',
      }),
    ];

    const uploadResults = await Promise.all(uploadPromises);
    console.log('Cloudinary uploads successful');

    // Update creator with verification info
    creator.verification = {
      idType: idType,
      idFrontUrl: uploadResults[0].secure_url,
      idBackUrl: uploadResults[1].secure_url,
      selfieUrl: uploadResults[2].secure_url,
      submittedAt: new Date(),
      status: 'pending',
    };
    creator.verificationStatus = 'pending';
    creator.verificationSubmittedAt = new Date();

    // Also populate the verificationDocuments array for compatibility
    creator.verificationDocuments = [
      uploadResults[0].secure_url, // ID front
      uploadResults[1].secure_url, // ID back
      uploadResults[2].secure_url, // Selfie
    ];

    await creator.save();
    console.log('Creator verification data saved');

    // Get user email
    const user = await User.findById(req.user.id);

    // Send email notification to admin
    try {
      console.log('Sending email notification...');
      const notificationReq = {
        body: {
          userId: req.user.id,
          userEmail: user.email,
          idType: idType,
        },
      };

      const notificationRes = {
        status: code => ({
          json: data => console.log('Email notification response:', data),
        }),
      };

      await sendAdminVerificationNotification(notificationReq, notificationRes);
      console.log('Email notification sent successfully');
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the upload if email fails
    }

    res.status(200).json({
      success: true,
      message: 'Verification documents uploaded successfully',
      data: {
        status: 'pending',
        submittedAt: creator.verificationSubmittedAt,
      },
    });
  } catch (error) {
    console.error('Verification upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload verification documents',
    });
  }
};

// @desc    Get verification status
// @route   GET /api/verification/status
// @access  Private (Creator only)
exports.getVerificationStatus = async (req, res) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });

    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        isVerified: creator.isVerified,
        verificationStatus: creator.verificationStatus || 'not_submitted',
        submittedAt: creator.verificationSubmittedAt,
        approvedAt: creator.verificationApprovedAt,
        rejectionReason: creator.verificationRejectionReason,
      },
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get all pending verifications
// @route   GET /api/verification/pending
// @access  Admin only
exports.getPendingVerifications = async (req, res) => {
  try {
    const creators = await Creator.find({
      verificationStatus: 'pending',
    })
      .populate('user', 'email username createdAt')
      .sort({ verificationSubmittedAt: -1 });

    res.status(200).json({
      success: true,
      count: creators.length,
      data: creators,
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Approve verification
// @route   POST /api/verification/approve/:userId
// @access  Admin only
exports.approveVerification = async (req, res) => {
  try {
    const { userId } = req.params;

    const creator = await Creator.findOne({ user: userId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    // Update verification status in Creator
    creator.isVerified = true;
    creator.verificationStatus = 'approved';
    creator.verificationApprovedAt = new Date();
    await creator.save();

    // CRITICAL FIX: Also update User model verification status
    const user = await User.findByIdAndUpdate(userId, {
      isVerified: true,
      verificationStatus: 'approved',
      verificationApprovedAt: new Date(),
    });

    // Send approval notification
    const { approveVerification } = require('./notification.controller');
    const notificationReq = {
      body: { userId },
    };
    const notificationRes = {
      status: code => ({
        json: data => console.log('Approval notification response:', data),
      }),
    };

    try {
      await approveVerification(notificationReq, notificationRes);
    } catch (emailError) {
      console.error('Approval email failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Verification approved successfully',
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Reject verification
// @route   POST /api/verification/reject/:userId
// @access  Admin only
exports.rejectVerification = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const creator = await Creator.findOne({ user: userId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    // Update verification status in Creator
    creator.isVerified = false;
    creator.verificationStatus = 'rejected';
    creator.verificationRejectedAt = new Date();
    creator.verificationRejectionReason = reason;
    await creator.save();

    // CRITICAL FIX: Also update User model verification status
    await User.findByIdAndUpdate(userId, {
      isVerified: false,
      verificationStatus: 'rejected',
      verificationRejectedAt: new Date(),
    });

    // Send rejection notification
    const { rejectVerification } = require('./notification.controller');
    const notificationReq = {
      body: { userId, reason },
    };
    const notificationRes = {
      status: code => ({
        json: data => console.log('Rejection notification response:', data),
      }),
    };

    try {
      await rejectVerification(notificationReq, notificationRes);
    } catch (emailError) {
      console.error('Rejection email failed:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Verification rejected',
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
