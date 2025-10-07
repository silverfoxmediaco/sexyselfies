const express = require('express');
const router = express.Router();

// Import controllers
const {
  adminLogin,
  createAdmin,
  getMe,
  updatePassword,
  adminLogout,
  updateAdminStatus,
  getAllAdmins,
  deleteAdmin,
} = require('../controllers/admin.auth.controller');

const {
  getPendingReports,
  resolveReport,
  getUserViolations,
  suspendUser,
  banUser,
  liftSuspension,
  removeContent,
  getModerationStats,
  searchUsers,
  freezePayouts,
} = require('../controllers/admin.moderation.controller');

// Import test credits controller
const testCreditsController = require('../controllers/admin.testCredits.controller');

// Import middleware
const {
  protectAdmin,
  authorizeAdmin,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  rateLimitAdminAction,
  logAdminAction,
  validateAdminRequest,
  canModifyUser,
} = require('../middleware/admin.auth.middleware');

// ============================
// PUBLIC ROUTES
// ============================

// Admin authentication
router.post('/auth/login', adminLogin);

// ============================
// PROTECTED ROUTES - ALL ADMINS
// ============================

// Apply admin protection to all routes below
router.use(protectAdmin);

// Current admin
router.get('/auth/me', getMe);
router.put('/auth/updatepassword', updatePassword);
router.post('/auth/logout', adminLogout);

// ============================
// MODERATION ROUTES
// ============================

// Reports management
router.get(
  '/moderation/reports',
  requireAnyPermission('canReviewContent', 'canSuspendUsers'),
  getPendingReports
);

router.put(
  '/moderation/reports/:reportId/resolve',
  requirePermission('canReviewContent'),
  validateAdminRequest(['action', 'reason']),
  logAdminAction('resolve_report'),
  resolveReport
);

// User violations and actions
router.get(
  '/moderation/users/:userId/violations',
  requireAnyPermission('canReviewContent', 'canSuspendUsers'),
  getUserViolations
);

router.post(
  '/moderation/users/:userId/suspend',
  requirePermission('canSuspendUsers'),
  canModifyUser,
  validateAdminRequest(['duration', 'reason']),
  rateLimitAdminAction('suspend_user', 10, 60000),
  logAdminAction('suspend_user'),
  suspendUser
);

router.post(
  '/moderation/users/:userId/ban',
  requirePermission('canDeleteUsers'),
  canModifyUser,
  validateAdminRequest(['reason']),
  rateLimitAdminAction('ban_user', 5, 60000),
  logAdminAction('ban_user'),
  banUser
);

router.post(
  '/moderation/users/:userId/lift-suspension',
  requirePermission('canSuspendUsers'),
  canModifyUser,
  validateAdminRequest(['reason']),
  logAdminAction('lift_suspension'),
  liftSuspension
);

// Content moderation
router.delete(
  '/moderation/content/:contentId',
  requirePermission('canRemoveContent'),
  validateAdminRequest(['reason']),
  logAdminAction('remove_content'),
  removeContent
);

// Search and statistics
router.get(
  '/moderation/users/search',
  requireAnyPermission('canReviewContent', 'canSuspendUsers'),
  searchUsers
);

router.get(
  '/moderation/stats',
  requireAnyPermission('canReviewContent', 'canSuspendUsers'),
  getModerationStats
);

// Financial actions
router.post(
  '/moderation/users/:userId/freeze-payouts',
  requirePermission('canAccessFinancials'),
  canModifyUser,
  validateAdminRequest(['days', 'reason']),
  rateLimitAdminAction('freeze_payouts', 5, 60000),
  logAdminAction('freeze_payouts'),
  freezePayouts
);

// ============================
// FINANCIAL/PAYOUT ROUTES
// ============================

// Get payout data for admin dashboard
router.get(
  '/financials/payouts',
  requirePermission('canAccessFinancials'),
  async (req, res) => {
    try {
      const Creator = require('../models/Creator');
      const CreatorProfile = require('../models/CreatorProfile');
      const Transaction = require('../models/Transaction');
      const PayoutRequest = require('../models/PayoutRequest');

      // Get all creators with pending earnings
      const creatorsWithProfiles = await Creator.aggregate([
        {
          $lookup: {
            from: 'creatorprofiles',
            localField: '_id',
            foreignField: 'creator',
            as: 'profile',
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'user',
            foreignField: '_id',
            as: 'user',
          },
        },
        {
          $unwind: { path: '$profile', preserveNullAndEmptyArrays: true },
        },
        {
          $unwind: '$user',
        },
        {
          $lookup: {
            from: 'transactions',
            let: { creatorId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$creator', '$$creatorId'] },
                      { $eq: ['$status', 'completed'] },
                      { $eq: ['$payoutProcessed', false] },
                    ],
                  },
                },
              },
              {
                $group: {
                  _id: null,
                  totalEarnings: { $sum: '$creatorEarnings' },
                },
              },
            ],
            as: 'pendingEarnings',
          },
        },
        {
          $addFields: {
            pendingAmount: {
              $ifNull: [
                { $arrayElemAt: ['$pendingEarnings.totalEarnings', 0] },
                0,
              ],
            },
            minimumPayout: {
              $ifNull: ['$profile.financials.payoutSettings.minimumPayout', 50],
            },
            paypalEmail: '$profile.financials.payoutSettings.paypalEmail',
          },
        },
        {
          $match: {
            pendingAmount: { $gt: 0 },
          },
        },
        {
          $project: {
            _id: 1,
            displayName: 1,
            profileImage: 1,
            email: '$user.email',
            pendingAmount: 1,
            minimumPayout: 1,
            paypalEmail: 1,
          },
        },
        { $sort: { pendingAmount: -1 } },
      ]);

      // Get payout statistics
      const totalPending = creatorsWithProfiles.reduce(
        (sum, creator) => sum + creator.pendingAmount,
        0
      );

      // Get today's payouts
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayPayouts = await Transaction.aggregate([
        {
          $match: {
            type: 'payout',
            createdAt: { $gte: todayStart },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: '$amount' } },
          },
        },
      ]);

      // Get this month's payouts
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthlyPayouts = await Transaction.aggregate([
        {
          $match: {
            type: 'payout',
            createdAt: { $gte: monthStart },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: { $abs: '$amount' } },
            count: { $sum: 1 },
          },
        },
      ]);

      // Get payout requests
      const pendingPayoutRequests = await PayoutRequest.find({
        status: 'pending',
      })
        .populate('creator', 'displayName profileImage')
        .populate('creator.user', 'email')
        .sort('-createdAt')
        .limit(50);

      // Get recent payout history from PayoutRequest model
      const payoutHistory = await PayoutRequest.find({
        status: { $in: ['processed', 'approved'] },
      })
        .populate('creator', 'displayName')
        .sort('-createdAt')
        .limit(20)
        .lean();

      const formattedHistory = payoutHistory.map(payout => ({
        _id: payout._id,
        creatorName: payout.creator?.displayName || 'Unknown',
        amount: payout.requestedAmount,
        status: payout.status,
        processedAt: payout.processedAt || payout.reviewedAt,
        paymentMethod: 'paypal',
      }));

      // Format payout requests for frontend
      const formattedRequests = pendingPayoutRequests.map(request => ({
        _id: request._id,
        displayName: request.creator?.displayName || 'Unknown',
        profileImage: request.creator?.profileImage || '',
        email: request.creator?.user?.email || '',
        pendingAmount: request.requestedAmount,
        availableAmount: request.availableAmount,
        paypalEmail: request.paypalEmail,
        minimumPayout: 50, // Default minimum
        createdAt: request.createdAt,
        message: request.message,
      }));

      // Calculate total pending from requests
      const requestsPendingTotal = pendingPayoutRequests.reduce(
        (sum, req) => sum + req.requestedAmount,
        0
      );

      res.status(200).json({
        success: true,
        data: {
          pendingPayouts: creatorsWithProfiles, // Keep for backwards compatibility
          payoutRequests: formattedRequests, // New payout requests
          payoutHistory: formattedHistory,
          totalPending,
          totalRequestsPending: requestsPendingTotal,
          totalPaidToday: todayPayouts[0]?.total || 0,
          stats: {
            creatorsAwaitingPayout: creatorsWithProfiles.length,
            pendingRequests: pendingPayoutRequests.length,
            averagePayoutAmount:
              monthlyPayouts[0]?.count > 0
                ? monthlyPayouts[0].total / monthlyPayouts[0].count
                : 0,
            thisMonthPayouts: monthlyPayouts[0]?.total || 0,
          },
        },
      });
    } catch (error) {
      console.error('Payout data fetch error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payout data',
      });
    }
  }
);

// Process PayPal payouts
router.post(
  '/financials/process-payouts',
  requirePermission('canAccessFinancials'),
  validateAdminRequest(['creatorIds', 'payoutMethod']),
  rateLimitAdminAction('process_payouts', 10, 60000),
  logAdminAction('process_payouts'),
  async (req, res) => {
    try {
      const { creatorIds, payoutMethod } = req.body;
      const Creator = require('../models/Creator');
      const CreatorProfile = require('../models/CreatorProfile');
      const Transaction = require('../models/Transaction');

      if (!Array.isArray(creatorIds) || creatorIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Creator IDs array is required',
        });
      }

      const results = [];
      let totalProcessed = 0;
      let successCount = 0;

      for (const creatorId of creatorIds) {
        try {
          // Get creator with profile
          const creator = await Creator.findById(creatorId)
            .populate('user')
            .lean();

          if (!creator) {
            results.push({
              creatorId,
              success: false,
              error: 'Creator not found',
            });
            continue;
          }

          const profile = await CreatorProfile.findOne({
            creator: creatorId,
          }).lean();

          if (!profile?.financials?.payoutSettings?.paypalEmail) {
            results.push({
              creatorId,
              success: false,
              error: 'No PayPal email configured',
            });
            continue;
          }

          // Calculate pending earnings
          const pendingTransactions = await Transaction.find({
            creator: creatorId,
            status: 'completed',
            payoutProcessed: false,
          });

          const totalEarnings = pendingTransactions.reduce(
            (sum, t) => sum + t.creatorEarnings,
            0
          );
          const minimumPayout =
            profile.financials.payoutSettings.minimumPayout || 50;

          if (totalEarnings < minimumPayout) {
            results.push({
              creatorId,
              success: false,
              error: `Amount $${totalEarnings} below minimum $${minimumPayout}`,
            });
            continue;
          }

          // TODO: Integrate with actual PayPal Payouts API here
          // const paypalResult = await processPayPalPayout(profile.financials.payoutSettings.paypalEmail, totalEarnings);

          // For now, simulate successful payout
          const payoutTransaction = new Transaction({
            creator: creatorId,
            type: 'payout',
            amount: -totalEarnings, // Negative for payout
            status: 'completed',
            paymentMethod: 'paypal',
            description: `PayPal payout to ${profile.financials.payoutSettings.paypalEmail}`,
            metadata: {
              paypalEmail: profile.financials.payoutSettings.paypalEmail,
              transactionIds: pendingTransactions.map(t => t._id),
              processedBy: req.admin.id,
            },
          });

          await payoutTransaction.save();

          // Mark original transactions as payout processed
          await Transaction.updateMany(
            { _id: { $in: pendingTransactions.map(t => t._id) } },
            { payoutProcessed: true }
          );

          results.push({
            creatorId,
            success: true,
            amount: totalEarnings,
            paypalEmail: profile.financials.payoutSettings.paypalEmail,
          });

          totalProcessed += totalEarnings;
          successCount++;
        } catch (error) {
          console.error(`Payout error for creator ${creatorId}:`, error);
          results.push({
            creatorId,
            success: false,
            error: error.message,
          });
        }
      }

      // Log the action
      await req.admin.logAction(
        'process_payouts',
        null,
        null,
        null,
        `Processed ${successCount} payouts totaling $${totalProcessed.toFixed(2)}`
      );

      res.status(200).json({
        success: true,
        data: {
          results,
          summary: {
            totalRequested: creatorIds.length,
            successCount,
            failedCount: creatorIds.length - successCount,
            totalProcessed,
          },
        },
      });
    } catch (error) {
      console.error('Batch payout processing error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process payouts',
      });
    }
  }
);

// ============================
// ID VERIFICATION ROUTES
// ============================

// Get pending verifications
router.get(
  '/verifications/pending',
  requirePermission('canApproveIDs'),
  async (req, res) => {
    try {
      const Creator = require('../models/Creator');

      const pendingCreators = await Creator.find({
        isVerified: false,
        verificationDocuments: { $exists: true, $ne: [] },
      })
        .populate('user', 'email createdAt')
        .sort('-verificationSubmittedAt')
        .limit(50);

      res.status(200).json({
        success: true,
        count: pendingCreators.length,
        data: pendingCreators,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pending verifications',
      });
    }
  }
);

// Approve creator verification
router.post(
  '/verifications/:creatorId/approve',
  requirePermission('canApproveIDs'),
  logAdminAction('approve_verification'),
  async (req, res) => {
    try {
      const Creator = require('../models/Creator');
      const {
        approveVerification,
      } = require('../controllers/notification.controller');

      const creator = await Creator.findById(req.params.creatorId).populate(
        'user'
      );

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
      creator.verificationApprovedBy = req.admin.id;
      await creator.save();

      // CRITICAL FIX: Also update User model verification status
      if (creator.user) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(creator.user._id, {
          isVerified: true,
          verificationStatus: 'approved',
          verificationApprovedAt: new Date(),
        });
      }

      // Send approval email
      await approveVerification({ body: { userId: creator.user._id } }, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to approve verification',
      });
    }
  }
);

// Reject creator verification
router.post(
  '/verifications/:creatorId/reject',
  requirePermission('canApproveIDs'),
  validateAdminRequest(['reason']),
  logAdminAction('reject_verification'),
  async (req, res) => {
    try {
      const Creator = require('../models/Creator');
      const {
        rejectVerification,
      } = require('../controllers/notification.controller');

      const creator = await Creator.findById(req.params.creatorId).populate(
        'user'
      );

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
      creator.verificationRejectionReason = req.body.reason;
      await creator.save();

      // CRITICAL FIX: Also update User model verification status
      if (creator.user) {
        const User = require('../models/User');
        await User.findByIdAndUpdate(creator.user._id, {
          isVerified: false,
          verificationStatus: 'rejected',
          verificationRejectedAt: new Date(),
        });
      }

      // Send rejection email
      await rejectVerification(
        {
          body: {
            userId: creator.user._id,
            reason: req.body.reason,
          },
        },
        res
      );
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to reject verification',
      });
    }
  }
);

// ============================
// TEST CREDITS MANAGEMENT (Development/QA)
// ============================

// Test credit operations
router.post(
  '/test-credits/grant',
  requireAnyPermission('canAccessFinancials', 'canReviewContent'),
  validateAdminRequest(['memberId', 'amount']),
  logAdminAction('grant_test_credits'),
  testCreditsController.grantTestCredits
);

router.post(
  '/test-credits/deduct',
  requireAnyPermission('canAccessFinancials', 'canReviewContent'),
  validateAdminRequest(['memberId', 'amount']),
  logAdminAction('deduct_test_credits'),
  testCreditsController.deductTestCredits
);

router.post(
  '/test-credits/set',
  requireAnyPermission('canAccessFinancials', 'canReviewContent'),
  validateAdminRequest(['memberId', 'amount']),
  logAdminAction('set_test_credits'),
  testCreditsController.setTestCredits
);

router.post(
  '/test-credits/bulk-grant',
  requirePermission('canAccessFinancials'),
  validateAdminRequest(['memberIds', 'amount']),
  logAdminAction('bulk_grant_test_credits'),
  testCreditsController.bulkGrantTestCredits
);

router.post(
  '/test-credits/reset-all',
  requirePermission('canAccessFinancials'),
  rateLimitAdminAction('reset_test_credits', 1, 60000),
  logAdminAction('reset_all_test_credits'),
  testCreditsController.resetAllTestCredits
);

// Get test credit info
router.get(
  '/test-credits/balance/:memberId',
  requireAnyPermission('canAccessFinancials', 'canReviewContent'),
  testCreditsController.getTestCreditBalance
);

router.get(
  '/test-credits/members',
  requireAnyPermission('canAccessFinancials', 'canReviewContent'),
  testCreditsController.getMembersWithTestCredits
);

router.get(
  '/test-credits/transactions',
  requirePermission('canAccessFinancials'),
  testCreditsController.getTestTransactions
);

// ============================
// SUPER ADMIN ONLY ROUTES
// ============================

// Admin management
router.post(
  '/auth/create',
  authorizeAdmin('superAdmin'),
  validateAdminRequest(['email', 'password', 'name']),
  logAdminAction('create_admin'),
  createAdmin
);

router.get('/auth/list', authorizeAdmin('superAdmin'), getAllAdmins);

router.put(
  '/auth/:adminId/status',
  authorizeAdmin('superAdmin'),
  validateAdminRequest(['isActive']),
  logAdminAction('update_admin_status'),
  updateAdminStatus
);

router.delete(
  '/auth/:adminId',
  authorizeAdmin('superAdmin'),
  logAdminAction('delete_admin'),
  deleteAdmin
);

// ============================
// DASHBOARD STATISTICS
// ============================

// Main dashboard stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    const User = require('../models/User');
    const Creator = require('../models/Creator');
    const Member = require('../models/Member');
    const Content = require('../models/Content');
    const Transaction = require('../models/Transaction');
    const AdminReport = require('../models/AdminReport');
    const UserViolation = require('../models/UserViolation');

    // Get counts
    const [
      totalUsers,
      totalCreators,
      totalMembers,
      totalContent,
      pendingReports,
      pendingVerifications,
      recentTransactions,
    ] = await Promise.all([
      User.countDocuments(),
      Creator.countDocuments(),
      Member.countDocuments(),
      Content.countDocuments({ isActive: true }),
      AdminReport.countDocuments({ status: 'pending' }),
      Creator.countDocuments({ verificationStatus: 'pending' }),
      Transaction.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Get high risk users
    const highRiskUsers = await UserViolation.getHighRiskUsers(5);

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          creators: totalCreators,
          members: totalMembers,
        },
        content: {
          total: totalContent,
        },
        moderation: {
          pendingReports,
          pendingVerifications,
          highRiskUsers,
        },
        financials: {
          last24Hours: recentTransactions[0] || { total: 0, count: 0 },
        },
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
    });
  }
});

// ============================
// AUDIT LOG
// ============================

// Get admin action logs
router.get('/audit/logs', authorizeAdmin('superAdmin'), async (req, res) => {
  try {
    const {
      adminId,
      action,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;
    const Admin = require('../models/Admin');

    const query = {};
    if (adminId) query._id = adminId;

    const admins = await Admin.find(query)
      .select('name email actionsLog')
      .lean();

    // Flatten and filter logs
    let allLogs = [];
    admins.forEach(admin => {
      admin.actionsLog.forEach(log => {
        allLogs.push({
          ...log,
          adminName: admin.name,
          adminEmail: admin.email,
          adminId: admin._id,
        });
      });
    });

    // Filter by action if specified
    if (action) {
      allLogs = allLogs.filter(log => log.action === action);
    }

    // Filter by date range
    if (startDate || endDate) {
      allLogs = allLogs.filter(log => {
        const logDate = new Date(log.timestamp);
        if (startDate && logDate < new Date(startDate)) return false;
        if (endDate && logDate > new Date(endDate)) return false;
        return true;
      });
    }

    // Sort by timestamp descending
    allLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedLogs = allLogs.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      count: paginatedLogs.length,
      total: allLogs.length,
      pages: Math.ceil(allLogs.length / limit),
      data: paginatedLogs,
    });
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
    });
  }
});

module.exports = router;
