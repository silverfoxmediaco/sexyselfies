const Admin = require('../models/Admin');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const signToken = (id, role) => {
  return jwt.sign(
    {
      id,
      role,
      type: 'admin',
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ADMIN_EXPIRE || '8h',
    }
  );
};

// Send token response
const sendTokenResponse = (admin, statusCode, res) => {
  const token = admin.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 8 * 60 * 60 * 1000 // 8 hours
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  // Remove password from output
  admin.password = undefined;

  res
    .status(statusCode)
    .cookie('adminToken', token, options)
    .json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
};

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
exports.adminLogin = async (req, res) => {
  try {
    const { email, password, twoFactorCode } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password',
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select(
      '+password +loginAttempts +lockUntil'
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        error:
          'Account is locked due to too many failed login attempts. Please try again later.',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact super admin.',
      });
    }

    // Check if password matches
    const isMatch = await admin.matchPassword(password);

    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
      });
    }

    // Check 2FA if enabled
    if (admin.twoFactorEnabled) {
      if (!twoFactorCode) {
        return res.status(200).json({
          success: true,
          requiresTwoFactor: true,
          message: 'Please provide 2FA code',
        });
      }

      // Verify 2FA code here (implement with speakeasy or similar)
      // const verified = speakeasy.totp.verify({
      //   secret: admin.twoFactorSecret,
      //   encoding: 'base32',
      //   token: twoFactorCode,
      //   window: 2
      // });

      // if (!verified) {
      //   return res.status(401).json({
      //     success: false,
      //     error: 'Invalid 2FA code'
      //   });
      // }
    }

    // Reset login attempts and update last login
    await admin.resetLoginAttempts();
    admin.lastLogin = Date.now();
    await admin.save();

    // Log the login action
    await admin.logAction(
      'admin_login',
      null,
      null,
      null,
      `Login from IP: ${req.ip}`
    );

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error during login',
    });
  }
};

// @desc    Create new admin (Super Admin only)
// @route   POST /api/admin/auth/create
// @access  Private - Super Admin
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if requester is super admin
    if (req.admin.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can create new admin accounts',
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        error: 'Admin with this email already exists',
      });
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password,
      name,
      role: role || 'moderator',
      createdBy: req.admin.id,
    });

    // Set role permissions
    admin.setRolePermissions();
    await admin.save();

    // Log the action
    await req.admin.logAction(
      'create_admin',
      admin._id,
      'Admin',
      null,
      `Created ${role} admin: ${email}`
    );

    res.status(201).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        permissions: admin.permissions,
      },
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get current admin
// @route   GET /api/admin/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select(
      '-password -loginAttempts -lockUntil'
    );

    res.status(200).json({
      success: true,
      data: admin,
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Update admin password
// @route   PUT /api/admin/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('+password');

    // Check current password
    if (!(await admin.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
      });
    }

    // Validate new password
    if (req.body.newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 8 characters',
      });
    }

    admin.password = req.body.newPassword;
    await admin.save();

    // Log the action
    await admin.logAction(
      'password_change',
      null,
      null,
      null,
      'Admin password updated'
    );

    sendTokenResponse(admin, 200, res);
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Admin logout
// @route   POST /api/admin/auth/logout
// @access  Private
exports.adminLogout = async (req, res) => {
  res.cookie('adminToken', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    data: {},
  });
};

// @desc    Update admin status (activate/deactivate)
// @route   PUT /api/admin/auth/:adminId/status
// @access  Private - Super Admin
exports.updateAdminStatus = async (req, res) => {
  try {
    const { isActive } = req.body;

    // Check if requester is super admin
    if (req.admin.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can update admin status',
      });
    }

    // Prevent self-deactivation
    if (req.params.adminId === req.admin.id && !isActive) {
      return res.status(400).json({
        success: false,
        error: 'Cannot deactivate your own account',
      });
    }

    const admin = await Admin.findById(req.params.adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
      });
    }

    admin.isActive = isActive;
    await admin.save();

    // Log the action
    await req.admin.logAction(
      isActive ? 'activate_admin' : 'deactivate_admin',
      admin._id,
      'Admin',
      null,
      `${isActive ? 'Activated' : 'Deactivated'} admin: ${admin.email}`
    );

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        email: admin.email,
        isActive: admin.isActive,
      },
    });
  } catch (error) {
    console.error('Update admin status error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Get all admins (Super Admin only)
// @route   GET /api/admin/auth/list
// @access  Private - Super Admin
exports.getAllAdmins = async (req, res) => {
  try {
    // Check if requester is super admin
    if (req.admin.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can view all admin accounts',
      });
    }

    const admins = await Admin.find()
      .select('-password -loginAttempts -lockUntil -twoFactorSecret')
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: admins.length,
      data: admins,
    });
  } catch (error) {
    console.error('Get all admins error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};

// @desc    Delete admin (Super Admin only)
// @route   DELETE /api/admin/auth/:adminId
// @access  Private - Super Admin
exports.deleteAdmin = async (req, res) => {
  try {
    // Check if requester is super admin
    if (req.admin.role !== 'superAdmin') {
      return res.status(403).json({
        success: false,
        error: 'Only super admins can delete admin accounts',
      });
    }

    // Prevent self-deletion
    if (req.params.adminId === req.admin.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      });
    }

    const admin = await Admin.findById(req.params.adminId);

    if (!admin) {
      return res.status(404).json({
        success: false,
        error: 'Admin not found',
      });
    }

    // Don't delete, just deactivate for audit trail
    admin.isActive = false;
    await admin.save();

    // Log the action
    await req.admin.logAction(
      'delete_admin',
      admin._id,
      'Admin',
      null,
      `Deleted admin: ${admin.email}`
    );

    res.status(200).json({
      success: true,
      message: 'Admin account deactivated successfully',
    });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
