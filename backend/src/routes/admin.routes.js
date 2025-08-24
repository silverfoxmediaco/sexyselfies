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
  deleteAdmin
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
  freezePayouts
} = require('../controllers/admin.moderation.controller');

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
  canModifyUser
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
        verificationDocuments: { $exists: true, $ne: [] }
      })
      .populate('user', 'email createdAt')
      .sort('-verificationSubmittedAt')
      .limit(50);
      
      res.status(200).json({
        success: true,
        count: pendingCreators.length,
        data: pendingCreators
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pending verifications'
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
      const { approveVerification } = require('../controllers/notification.controller');
      
      const creator = await Creator.findById(req.params.creatorId)
        .populate('user');
      
      if (!creator) {
        return res.status(404).json({
          success: false,
          error: 'Creator not found'
        });
      }
      
      // Update verification status
      creator.isVerified = true;
      creator.verificationStatus = 'approved';
      creator.verificationApprovedAt = new Date();
      creator.verificationApprovedBy = req.admin.id;
      await creator.save();
      
      // Send approval email
      await approveVerification({ body: { userId: creator.user._id } }, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to approve verification'
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
      const { rejectVerification } = require('../controllers/notification.controller');
      
      const creator = await Creator.findById(req.params.creatorId)
        .populate('user');
      
      if (!creator) {
        return res.status(404).json({
          success: false,
          error: 'Creator not found'
        });
      }
      
      // Update verification status
      creator.isVerified = false;
      creator.verificationStatus = 'rejected';
      creator.verificationRejectedAt = new Date();
      creator.verificationRejectedBy = req.admin.id;
      creator.verificationRejectionReason = req.body.reason;
      await creator.save();
      
      // Send rejection email
      await rejectVerification({ 
        body: { 
          userId: creator.user._id,
          reason: req.body.reason 
        } 
      }, res);
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to reject verification'
      });
    }
  }
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

router.get(
  '/auth/list',
  authorizeAdmin('superAdmin'),
  getAllAdmins
);

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
router.get(
  '/dashboard/stats',
  async (req, res) => {
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
        recentTransactions
      ] = await Promise.all([
        User.countDocuments(),
        Creator.countDocuments(),
        Member.countDocuments(),
        Content.countDocuments({ isActive: true }),
        AdminReport.countDocuments({ status: 'pending' }),
        Creator.countDocuments({ isVerified: false, verificationDocuments: { $ne: [] } }),
        Transaction.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 }
            }
          }
        ])
      ]);
      
      // Get high risk users
      const highRiskUsers = await UserViolation.getHighRiskUsers(5);
      
      res.status(200).json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            creators: totalCreators,
            members: totalMembers
          },
          content: {
            total: totalContent
          },
          moderation: {
            pendingReports,
            pendingVerifications,
            highRiskUsers
          },
          financials: {
            last24Hours: recentTransactions[0] || { total: 0, count: 0 }
          }
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard statistics'
      });
    }
  }
);

// ============================
// AUDIT LOG
// ============================

// Get admin action logs
router.get(
  '/audit/logs',
  authorizeAdmin('superAdmin'),
  async (req, res) => {
    try {
      const { adminId, action, startDate, endDate, page = 1, limit = 50 } = req.query;
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
            adminId: admin._id
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
        data: paginatedLogs
      });
    } catch (error) {
      console.error('Audit log error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs'
      });
    }
  }
);

module.exports = router;