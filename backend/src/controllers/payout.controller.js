const PayoutRequest = require('../models/PayoutRequest');
const Creator = require('../models/Creator');
const CreatorProfile = require('../models/CreatorProfile');
const Transaction = require('../models/Transaction');
const Admin = require('../models/Admin');

// @desc    Create payout request (Creator)
// @route   POST /api/creator/payout/request
// @access  Private - Creator only
exports.createPayoutRequest = async (req, res) => {
  try {
    const { requestedAmount, message } = req.body;

    if (!requestedAmount || requestedAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid payout amount is required',
      });
    }

    // Get creator details
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    // Get creator profile for PayPal email
    const profile = await CreatorProfile.findOne({ creator: creator._id });
    if (!profile?.financials?.payoutSettings?.paypalEmail) {
      return res.status(400).json({
        success: false,
        error:
          'Please set your PayPal email in settings before requesting a payout',
      });
    }

    // Check if there's already a pending request
    const existingRequest = await PayoutRequest.findOne({
      creator: creator._id,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending payout request',
      });
    }

    // Calculate available earnings
    const earningsData = await Transaction.aggregate([
      {
        $match: {
          creator: creator._id,
          status: 'completed',
          payoutProcessed: false,
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$creatorEarnings' },
          transactionIds: { $push: '$_id' },
        },
      },
    ]);

    const availableAmount = earningsData[0]?.totalEarnings || 0;
    const transactionIds = earningsData[0]?.transactionIds || [];

    if (availableAmount < requestedAmount) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds. Available: $${availableAmount.toFixed(2)}, Requested: $${requestedAmount.toFixed(2)}`,
      });
    }

    // Check minimum payout amount
    const minimumPayout = profile.financials.payoutSettings.minimumPayout || 50;
    if (requestedAmount < minimumPayout) {
      return res.status(400).json({
        success: false,
        error: `Minimum payout amount is $${minimumPayout.toFixed(2)}`,
      });
    }

    // Create payout request
    const payoutRequest = new PayoutRequest({
      creator: creator._id,
      requestedAmount,
      availableAmount,
      paypalEmail: profile.financials.payoutSettings.paypalEmail,
      message: message || '',
      transactions: transactionIds,
    });

    await payoutRequest.save();

    // Send email notification to admin
    await payoutRequest.sendAdminNotification();

    res.status(201).json({
      success: true,
      message: 'Payout request submitted successfully',
      data: {
        requestId: payoutRequest._id,
        requestedAmount: payoutRequest.requestedAmount,
        status: payoutRequest.status,
        paypalEmail: payoutRequest.paypalEmail,
      },
    });
  } catch (error) {
    console.error('Payout request creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payout request',
    });
  }
};

// @desc    Get creator's payout requests
// @route   GET /api/creator/payout/requests
// @access  Private - Creator only
exports.getCreatorPayoutRequests = async (req, res) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    const payoutRequests = await PayoutRequest.find({ creator: creator._id })
      .populate('reviewedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      data: payoutRequests,
    });
  } catch (error) {
    console.error('Get payout requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payout requests',
    });
  }
};

// @desc    Get creator's available earnings
// @route   GET /api/creator/payout/available
// @access  Private - Creator only
exports.getAvailableEarnings = async (req, res) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    const earningsData = await Transaction.aggregate([
      {
        $match: {
          creator: creator._id,
          status: 'completed',
          payoutProcessed: false,
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: '$creatorEarnings' },
          transactionCount: { $sum: 1 },
        },
      },
    ]);

    const availableEarnings = earningsData[0]?.totalEarnings || 0;
    const transactionCount = earningsData[0]?.transactionCount || 0;

    // Check for pending payout requests
    const pendingRequest = await PayoutRequest.findOne({
      creator: creator._id,
      status: 'pending',
    });

    res.status(200).json({
      success: true,
      data: {
        availableEarnings,
        transactionCount,
        hasPendingRequest: !!pendingRequest,
        pendingRequest: pendingRequest || null,
      },
    });
  } catch (error) {
    console.error('Get available earnings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available earnings',
    });
  }
};

// @desc    Cancel payout request (Creator)
// @route   PUT /api/creator/payout/cancel/:requestId
// @access  Private - Creator only
exports.cancelPayoutRequest = async (req, res) => {
  try {
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    const payoutRequest = await PayoutRequest.findOne({
      _id: req.params.requestId,
      creator: creator._id,
    });

    if (!payoutRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payout request not found',
      });
    }

    if (payoutRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be cancelled',
      });
    }

    payoutRequest.status = 'cancelled';
    await payoutRequest.save();

    res.status(200).json({
      success: true,
      message: 'Payout request cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel payout request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel payout request',
    });
  }
};

// ADMIN ENDPOINTS

// @desc    Get all payout requests (Admin)
// @route   GET /api/admin/payout-requests
// @access  Private - Admin only
exports.getAdminPayoutRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = status ? { status } : {};

    const payoutRequests = await PayoutRequest.find(query)
      .populate('creator', 'displayName profileImage')
      .populate('creator.user', 'email')
      .populate('reviewedBy', 'name email')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await PayoutRequest.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        payoutRequests,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      },
    });
  } catch (error) {
    console.error('Get admin payout requests error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payout requests',
    });
  }
};

// @desc    Approve payout request (Admin)
// @route   PUT /api/admin/payout-requests/:requestId/approve
// @access  Private - Admin only
exports.approvePayoutRequest = async (req, res) => {
  try {
    const { notes } = req.body;

    const payoutRequest = await PayoutRequest.findById(req.params.requestId);
    if (!payoutRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payout request not found',
      });
    }

    if (payoutRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be approved',
      });
    }

    await payoutRequest.approve(req.admin.id, notes);

    // Log the action
    await req.admin.logAction(
      'approve_payout_request',
      payoutRequest._id,
      'PayoutRequest',
      null,
      `Approved payout request for $${payoutRequest.requestedAmount.toFixed(2)}`
    );

    res.status(200).json({
      success: true,
      message: 'Payout request approved successfully',
      data: payoutRequest,
    });
  } catch (error) {
    console.error('Approve payout request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to approve payout request',
    });
  }
};

// @desc    Reject payout request (Admin)
// @route   PUT /api/admin/payout-requests/:requestId/reject
// @access  Private - Admin only
exports.rejectPayoutRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required',
      });
    }

    const payoutRequest = await PayoutRequest.findById(req.params.requestId);
    if (!payoutRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payout request not found',
      });
    }

    if (payoutRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be rejected',
      });
    }

    await payoutRequest.reject(req.admin.id, reason);

    // Log the action
    await req.admin.logAction(
      'reject_payout_request',
      payoutRequest._id,
      'PayoutRequest',
      null,
      `Rejected payout request: ${reason}`
    );

    res.status(200).json({
      success: true,
      message: 'Payout request rejected successfully',
    });
  } catch (error) {
    console.error('Reject payout request error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reject payout request',
    });
  }
};

// @desc    Mark payout as processed (Admin)
// @route   PUT /api/admin/payout-requests/:requestId/processed
// @access  Private - Admin only
exports.markPayoutProcessed = async (req, res) => {
  try {
    const { paymentReference } = req.body;

    const payoutRequest = await PayoutRequest.findById(req.params.requestId);
    if (!payoutRequest) {
      return res.status(404).json({
        success: false,
        error: 'Payout request not found',
      });
    }

    if (payoutRequest.status !== 'approved') {
      return res.status(400).json({
        success: false,
        error: 'Only approved requests can be marked as processed',
      });
    }

    await payoutRequest.markProcessed(paymentReference);

    // Log the action
    await req.admin.logAction(
      'process_payout',
      payoutRequest._id,
      'PayoutRequest',
      null,
      `Processed payout of $${payoutRequest.requestedAmount.toFixed(2)} - ${paymentReference}`
    );

    res.status(200).json({
      success: true,
      message: 'Payout marked as processed successfully',
      data: payoutRequest,
    });
  } catch (error) {
    console.error('Mark payout processed error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark payout as processed',
    });
  }
};
