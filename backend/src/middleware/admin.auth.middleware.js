const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Protect admin routes
exports.protectAdmin = async (req, res, next) => {
  let token;

  // Check for token in Authorization header only (admin uses headers, not cookies)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route - missing token',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if it's an admin token
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'This route is for administrators only',
      });
    }

    // Find admin
    const admin = await Admin.findById(decoded.id).select(
      '-password -loginAttempts -lockUntil'
    );

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin not found',
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Admin account is deactivated',
      });
    }

    // Check if account is locked
    if (admin.isLocked) {
      return res.status(423).json({
        success: false,
        error: 'Admin account is locked',
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth middleware error:', error);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Admin session has expired. Please login again.',
      });
    }

    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route',
    });
  }
};

// Grant access to specific admin roles
exports.authorizeAdmin = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        error: `Admin role ${req.admin.role} is not authorized to access this route`,
      });
    }

    next();
  };
};

// Check specific permissions
exports.requirePermission = permission => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
      });
    }

    if (!req.admin.permissions[permission]) {
      return res.status(403).json({
        success: false,
        error: `You don't have permission to ${permission.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      });
    }

    next();
  };
};

// Check multiple permissions (requires all)
exports.requireAllPermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
      });
    }

    const missingPermissions = permissions.filter(
      p => !req.admin.permissions[p]
    );

    if (missingPermissions.length > 0) {
      return res.status(403).json({
        success: false,
        error: `Missing required permissions: ${missingPermissions.join(', ')}`,
      });
    }

    next();
  };
};

// Check multiple permissions (requires at least one)
exports.requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
      });
    }

    const hasPermission = permissions.some(p => req.admin.permissions[p]);

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: `You need at least one of these permissions: ${permissions.join(', ')}`,
      });
    }

    next();
  };
};

// Rate limiting for admin actions
const adminActionLimits = new Map();

exports.rateLimitAdminAction = (action, maxAttempts = 10, windowMs = 60000) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        error: 'Admin authentication required',
      });
    }

    const key = `${req.admin.id}-${action}`;
    const now = Date.now();

    if (!adminActionLimits.has(key)) {
      adminActionLimits.set(key, []);
    }

    const attempts = adminActionLimits.get(key);
    const recentAttempts = attempts.filter(
      timestamp => now - timestamp < windowMs
    );

    if (recentAttempts.length >= maxAttempts) {
      const resetTime = Math.ceil((recentAttempts[0] + windowMs - now) / 1000);

      return res.status(429).json({
        success: false,
        error: `Too many ${action} attempts. Please try again in ${resetTime} seconds.`,
      });
    }

    recentAttempts.push(now);
    adminActionLimits.set(key, recentAttempts);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [k, v] of adminActionLimits.entries()) {
        const recent = v.filter(timestamp => now - timestamp < windowMs * 2);
        if (recent.length === 0) {
          adminActionLimits.delete(k);
        } else {
          adminActionLimits.set(k, recent);
        }
      }
    }

    next();
  };
};

// Log admin actions middleware
exports.logAdminAction = action => {
  return async (req, res, next) => {
    if (!req.admin) {
      return next();
    }

    // Store original send function
    const originalSend = res.send;

    // Override send function to log after response
    res.send = function (data) {
      res.send = originalSend;

      // Only log successful actions
      if (res.statusCode < 400) {
        const targetUser =
          req.params.userId || req.params.id || req.body.userId;
        const targetContent = req.params.contentId || req.body.contentId;
        const reason = req.body.reason || req.body.description || '';

        // Log action asynchronously
        req.admin
          .logAction(action, targetUser, 'User', targetContent, reason)
          .catch(err => console.error('Failed to log admin action:', err));
      }

      return res.send(data);
    };

    next();
  };
};

// Validate admin request body
exports.validateAdminRequest = requiredFields => {
  return (req, res, next) => {
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    next();
  };
};

// Check if admin can modify target user
exports.canModifyUser = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId || req.params.id;

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        error: 'Target user ID is required',
      });
    }

    // Super admins can modify anyone
    if (req.admin.role === 'superAdmin') {
      return next();
    }

    // Check if target is an admin
    const targetAdmin = await Admin.findById(targetUserId);

    if (targetAdmin) {
      // Non-super admins cannot modify other admins
      return res.status(403).json({
        success: false,
        error: 'You cannot modify other administrator accounts',
      });
    }

    // Moderators can modify regular users
    if (
      req.admin.role === 'moderator' &&
      req.admin.permissions.canSuspendUsers
    ) {
      return next();
    }

    // Verification staff cannot modify users
    if (req.admin.role === 'verificationStaff') {
      return res.status(403).json({
        success: false,
        error: 'Verification staff cannot modify user accounts',
      });
    }

    return res.status(403).json({
      success: false,
      error: 'You do not have permission to modify this user',
    });
  } catch (error) {
    console.error('Can modify user check error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error',
    });
  }
};
