const User = require('../models/User');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const Content = require('../models/Content');
const Report = require('../models/Report');
const AdminReport = require('../models/AdminReport');
const UserViolation = require('../models/UserViolation');
const Transaction = require('../models/Transaction');

// @desc    Get all reports pending review
// @route   GET /api/admin/moderation/reports
// @access  Private - Admin
exports.getPendingReports = async (req, res) => {
  try {
    const {
      status = 'pending',
      severity,
      reportType,
      page = 1,
      limit = 20,
      sortBy = '-createdAt',
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (reportType) query.reportType = reportType;

    const reports = await AdminReport.find(query)
      .populate('reportedUser', 'email role')
      .populate('reportedBy', 'email')
      .populate('reportedContent')
      .populate('assignedTo', 'name')
      .sort(sortBy)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AdminReport.countDocuments(query);

    // Get statistics
    const stats = await AdminReport.getDashboardStats();

    res.status(200).json({
      success: true,
      count: reports.length,
      total,
      pages: Math.ceil(total / limit),
      stats,
      data: reports,
    });
  } catch (error) {
    console.error('Get pending reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch reports',
    });
  }
};

// @desc    Review and resolve report
// @route   PUT /api/admin/moderation/reports/:reportId/resolve
// @access  Private - Admin
exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { action, reason, details, strikeIssued } = req.body;

    const report =
      await AdminReport.findById(reportId).populate('reportedUser');

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found',
      });
    }

    // Resolve the report
    await report.resolve(req.admin.id, {
      action,
      reason,
      details,
    });

    // Get or create user violation record
    let userViolation = await UserViolation.findOne({
      user: report.reportedUser._id,
    });

    if (!userViolation) {
      userViolation = await UserViolation.create({
        user: report.reportedUser._id,
        userType: report.reportedUser.role,
      });
    }

    // Handle different actions
    switch (action) {
      case 'user_warned':
        await userViolation.addWarning(reason, 'caution', req.admin.id);
        break;

      case 'user_suspended_24h':
        await userViolation.suspend(24, reason, req.admin.id);
        break;

      case 'user_suspended_7d':
        await userViolation.suspend(7 * 24, reason, req.admin.id);
        if (strikeIssued) {
          await userViolation.addStrike(reason, req.admin.id);
        }
        break;

      case 'user_suspended_30d':
        await userViolation.suspend(30 * 24, reason, req.admin.id);
        if (strikeIssued) {
          await userViolation.addStrike(reason, req.admin.id);
        }
        break;

      case 'user_banned':
        await userViolation.ban(reason, req.admin.id);
        break;

      case 'content_removed':
        if (report.reportedContent) {
          await Content.findByIdAndUpdate(report.reportedContent, {
            isActive: false,
            removedBy: req.admin.id,
            removedReason: reason,
            removedAt: new Date(),
          });
        }
        break;

      case 'payout_frozen':
        await userViolation.freezePayouts(30, req.admin.id);
        break;
    }

    // Add violation record
    if (action !== 'no_action' && action !== 'false_report') {
      userViolation.violations.push({
        reportId: report._id,
        type: report.reportType,
        severity: report.severity,
        description: reason,
        issuedBy: req.admin.id,
      });
      await userViolation.save();
    }

    // Send notification to user (implement email/notification service)
    // await notificationService.sendViolationNotice(report.reportedUser, action, reason);

    res.status(200).json({
      success: true,
      message: 'Report resolved successfully',
      data: report,
    });
  } catch (error) {
    console.error('Resolve report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resolve report',
    });
  }
};

// @desc    Get user violation history
// @route   GET /api/admin/moderation/users/:userId/violations
// @access  Private - Admin
exports.getUserViolations = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    const violations = await UserViolation.findOne({ user: userId })
      .populate('violations.issuedBy', 'name')
      .populate('suspensions.issuedBy', 'name')
      .populate('warnings.issuedBy', 'name');

    const reports = await AdminReport.find({ reportedUser: userId })
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
        },
        violations: violations || {
          strikes: { current: 0 },
          violations: [],
          warnings: [],
        },
        recentReports: reports,
      },
    });
  } catch (error) {
    console.error('Get user violations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user violations',
    });
  }
};

// @desc    Suspend user
// @route   POST /api/admin/moderation/users/:userId/suspend
// @access  Private - Admin
exports.suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, reason, freezePayouts } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    let userViolation = await UserViolation.findOne({ user: userId });

    if (!userViolation) {
      userViolation = await UserViolation.create({
        user: userId,
        userType: user.role,
      });
    }

    // Suspend the user
    await userViolation.suspend(duration, reason, req.admin.id);

    // Freeze payouts if requested
    if (freezePayouts && user.role === 'creator') {
      await userViolation.freezePayouts(duration / 24, req.admin.id);
    }

    // Update user status
    user.status = 'suspended';
    await user.save();

    res.status(200).json({
      success: true,
      message: `User suspended for ${duration} hours`,
      data: userViolation,
    });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to suspend user',
    });
  }
};

// @desc    Ban user
// @route   POST /api/admin/moderation/users/:userId/ban
// @access  Private - Admin (with canDeleteUsers permission)
exports.banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, deleteContent } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    let userViolation = await UserViolation.findOne({ user: userId });

    if (!userViolation) {
      userViolation = await UserViolation.create({
        user: userId,
        userType: user.role,
      });
    }

    // Ban the user
    await userViolation.ban(reason, req.admin.id);

    // Update user status
    user.status = 'banned';
    user.bannedAt = new Date();
    user.bannedReason = reason;
    await user.save();

    // Delete or hide all content if requested
    if (deleteContent) {
      await Content.updateMany(
        { creator: userId },
        {
          isActive: false,
          removedBy: req.admin.id,
          removedReason: 'User banned',
          removedAt: new Date(),
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'User banned successfully',
      data: userViolation,
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to ban user',
    });
  }
};

// @desc    Lift suspension
// @route   POST /api/admin/moderation/users/:userId/lift-suspension
// @access  Private - Admin
exports.liftSuspension = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const userViolation = await UserViolation.findOne({ user: userId });

    if (!userViolation) {
      return res.status(404).json({
        success: false,
        error: 'No violation record found',
      });
    }

    await userViolation.liftSuspension(req.admin.id, reason);

    // Update user status
    const user = await User.findById(userId);
    if (user) {
      user.status = 'active';
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Suspension lifted successfully',
      data: userViolation,
    });
  } catch (error) {
    console.error('Lift suspension error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lift suspension',
    });
  }
};

// @desc    Remove content
// @route   DELETE /api/admin/moderation/content/:contentId
// @access  Private - Admin
exports.removeContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const { reason, notifyCreator } = req.body;

    const content = await Content.findById(contentId).populate('creator');

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found',
      });
    }

    // Soft delete the content
    content.isActive = false;
    content.removedBy = req.admin.id;
    content.removedReason = reason;
    content.removedAt = new Date();
    await content.save();

    // Create report if doesn't exist
    await AdminReport.create({
      reportedContent: contentId,
      reportedUser: content.creator._id,
      reportType: 'manual_review',
      severity: 'medium',
      status: 'resolved',
      reviewedBy: req.admin.id,
      decision: {
        action: 'content_removed',
        reason: reason,
      },
      metadata: {
        source: 'manual_review',
      },
    });

    // Notify creator if requested
    if (notifyCreator) {
      // Implement notification
    }

    res.status(200).json({
      success: true,
      message: 'Content removed successfully',
    });
  } catch (error) {
    console.error('Remove content error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove content',
    });
  }
};

// @desc    Get moderation statistics
// @route   GET /api/admin/moderation/stats
// @access  Private - Admin
exports.getModerationStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    let dateFilter = new Date();
    switch (period) {
      case '24h':
        dateFilter.setHours(dateFilter.getHours() - 24);
        break;
      case '7d':
        dateFilter.setDate(dateFilter.getDate() - 7);
        break;
      case '30d':
        dateFilter.setDate(dateFilter.getDate() - 30);
        break;
    }

    const stats = await AdminReport.aggregate([
      {
        $facet: {
          totalReports: [
            { $match: { createdAt: { $gte: dateFilter } } },
            { $count: 'total' },
          ],
          pendingReports: [
            { $match: { status: 'pending' } },
            { $count: 'total' },
          ],
          resolvedReports: [
            {
              $match: {
                status: 'resolved',
                reviewCompletedAt: { $gte: dateFilter },
              },
            },
            { $count: 'total' },
          ],
          byType: [
            { $match: { createdAt: { $gte: dateFilter } } },
            { $group: { _id: '$reportType', count: { $sum: 1 } } },
          ],
          bySeverity: [
            { $match: { status: 'pending' } },
            { $group: { _id: '$severity', count: { $sum: 1 } } },
          ],
          avgResolutionTime: [
            {
              $match: {
                status: 'resolved',
                reviewCompletedAt: { $gte: dateFilter },
              },
            },
            {
              $project: {
                resolutionTime: {
                  $subtract: ['$reviewCompletedAt', '$createdAt'],
                },
              },
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$resolutionTime' },
              },
            },
          ],
        },
      },
    ]);

    // Get high risk users
    const highRiskUsers = await UserViolation.getHighRiskUsers(10);

    // Get recent bans
    const recentBans = await UserViolation.find({
      currentStatus: 'banned',
      bannedAt: { $gte: dateFilter },
    })
      .populate('user', 'email')
      .sort('-bannedAt')
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        period,
        stats: stats[0],
        highRiskUsers,
        recentBans,
      },
    });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
    });
  }
};

// @desc    Search users
// @route   GET /api/admin/moderation/users/search
// @access  Private - Admin
exports.searchUsers = async (req, res) => {
  try {
    const {
      query,
      role,
      status,
      hasViolations,
      page = 1,
      limit = 20,
    } = req.query;

    const searchQuery = {};

    if (query) {
      searchQuery.$or = [
        { email: { $regex: query, $options: 'i' } },
        { username: { $regex: query, $options: 'i' } },
      ];
    }

    if (role) searchQuery.role = role;
    if (status) searchQuery.status = status;

    const users = await User.find(searchQuery)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get violation info for each user
    const userIds = users.map(u => u._id);
    const violations = await UserViolation.find({
      user: { $in: userIds },
    }).select('user strikes currentStatus riskScore');

    const violationMap = {};
    violations.forEach(v => {
      violationMap[v.user.toString()] = v;
    });

    const usersWithViolations = users.map(user => ({
      ...user.toObject(),
      violations: violationMap[user._id.toString()] || null,
    }));

    const total = await User.countDocuments(searchQuery);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      data: usersWithViolations,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
    });
  }
};

// @desc    Freeze creator payouts
// @route   POST /api/admin/moderation/users/:userId/freeze-payouts
// @access  Private - Admin
exports.freezePayouts = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days, reason } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'creator') {
      return res.status(404).json({
        success: false,
        error: 'Creator not found',
      });
    }

    let userViolation = await UserViolation.findOne({ user: userId });

    if (!userViolation) {
      userViolation = await UserViolation.create({
        user: userId,
        userType: 'creator',
      });
    }

    await userViolation.freezePayouts(days, req.admin.id);

    // Calculate frozen amount
    const pendingPayouts = await Transaction.aggregate([
      {
        $match: {
          creator: userId,
          status: 'pending',
          type: 'payout',
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);

    userViolation.restrictions.frozenAmount = pendingPayouts[0]?.total || 0;
    await userViolation.save();

    res.status(200).json({
      success: true,
      message: `Payouts frozen for ${days} days`,
      data: {
        frozenUntil: userViolation.restrictions.frozenUntil,
        frozenAmount: userViolation.restrictions.frozenAmount,
      },
    });
  } catch (error) {
    console.error('Freeze payouts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to freeze payouts',
    });
  }
};
