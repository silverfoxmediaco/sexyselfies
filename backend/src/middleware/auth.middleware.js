const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const SessionService = require('../services/session.service');

// Session-aware authentication - validates JWT + session
exports.protectWithSession = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is active
      if (user.status === 'suspended' || user.status === 'banned') {
        return res.status(403).json({
          success: false,
          error: `Account ${user.status}`
        });
      }

      // Validate session if sessionId exists in JWT
      if (decoded.sessionId) {
        console.log(`🔍 Validating session: ${decoded.sessionId} for user: ${user._id}`);
        
        const sessionValidation = await SessionService.validateSession(
          decoded.sessionId, 
          user._id, 
          req
        );

        if (!sessionValidation.valid) {
          console.log(`❌ Session validation failed: ${sessionValidation.reason}`);
          
          if (sessionValidation.requiresReauth) {
            return res.status(401).json({
              success: false,
              error: 'Session expired. Please log in again.',
              code: 'SESSION_EXPIRED'
            });
          }
        }

        // Attach session info to request
        req.session = sessionValidation.session;
        console.log(`✅ Session validated for ${user.role}: ${decoded.sessionId}`);
      } else {
        console.log(`⚠️ Legacy token without session ID for user: ${user._id}`);
        // For backward compatibility, allow tokens without sessionId
        req.session = null;
      }

      req.user = user;
      next();
    } catch (err) {
      console.error('JWT verification error:', err.message);
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Session auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Activity tracking middleware (use after protectWithSession)
exports.trackActivity = (activityType) => {
  return async (req, res, next) => {
    try {
      if (req.session && req.session.sessionId) {
        // Extract metadata from request
        const metadata = {
          endpoint: req.originalUrl,
          method: req.method,
          userAgent: req.headers['user-agent'],
          timestamp: new Date()
        };

        // Add specific metadata based on activity type
        if (activityType === 'content_purchase' && req.body.amount) {
          metadata.amount = req.body.amount;
        }
        
        if (activityType === 'browse_members' && req.query) {
          metadata.filters = req.query;
        }

        await SessionService.trackActivity(req.session.sessionId, activityType, metadata);
      }
      next();
    } catch (error) {
      console.error('Activity tracking error:', error);
      // Don't fail the request if activity tracking fails
      next();
    }
  };
};

// Protect routes - verify JWT token (legacy - backward compatibility)
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is active
      if (req.user.status === 'suspended' || req.user.status === 'banned') {
        return res.status(403).json({
          success: false,
          error: `Account ${req.user.status}`
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Authenticate creator specifically
exports.authenticateCreator = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - no token'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is a creator
      if (user.role !== 'creator') {
        return res.status(403).json({
          success: false,
          error: 'Access denied - creators only'
        });
      }

      // Get creator profile
      const creator = await Creator.findOne({ user: user._id });
      
      if (!creator) {
        // Create creator profile if it doesn't exist
        const newCreator = await Creator.create({
          user: user._id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          isActive: true
        });
        req.creator = newCreator;
      } else {
        req.creator = creator;
      }

      req.user = user;
      req.user.type = 'creator';
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Token invalid or expired'
      });
    }
  } catch (error) {
    console.error('Creator auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Authenticate member specifically
exports.authenticateMember = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Make sure token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized - no token'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User not found'
        });
      }

      // Check if user is a member
      if (user.role !== 'member') {
        return res.status(403).json({
          success: false,
          error: 'Access denied - members only'
        });
      }

      // Get member profile
      const member = await Member.findOne({ user: user._id });
      
      if (!member) {
        // Create member profile if it doesn't exist
        const newMember = await Member.create({
          user: user._id,
          username: user.username || user.email.split('@')[0],
          email: user.email,
          isActive: true
        });
        req.member = newMember;
      } else {
        req.member = member;
      }

      req.user = user;
      req.user.type = 'member';
      
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Token invalid or expired'
      });
    }
  } catch (error) {
    console.error('Member auth middleware error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }

    next();
  };
};

// Optional authentication - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // If no token, continue without user
    if (!token) {
      return next();
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user
      req.user = await User.findById(decoded.id).select('-password');
      
      // Continue even if user not found
      next();
    } catch (err) {
      // Continue without user if token is invalid
      next();
    }
  } catch (error) {
    // Continue without user on error
    next();
  }
};

// Verify email token
exports.verifyEmailToken = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'No verification token provided'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_EMAIL_SECRET || process.env.JWT_SECRET);
      req.emailVerification = decoded;
      next();
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired verification token'
      });
    }
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

// Check if user owns the resource
exports.checkOwnership = (model) => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id || req.params.contentId || req.params.messageId;
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Resource ID required'
        });
      }

      const Model = require(`../models/${model}`);
      const resource = await Model.findById(resourceId);

      if (!resource) {
        return res.status(404).json({
          success: false,
          error: `${model} not found`
        });
      }

      // Check ownership based on model type
      let isOwner = false;
      
      if (resource.user && resource.user.toString() === req.user.id) {
        isOwner = true;
      } else if (resource.creator && resource.creator.toString() === req.user.id) {
        isOwner = true;
      } else if (resource.member && resource.member.toString() === req.user.id) {
        isOwner = true;
      }

      if (!isOwner && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Not authorized to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      res.status(500).json({
        success: false,
        error: 'Server error'
      });
    }
  };
};

// Rate limiting per user
exports.userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(userId)) {
      requests.set(userId, []);
    }

    const userRequests = requests.get(userId).filter(time => time > windowStart);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later'
      });
    }

    userRequests.push(now);
    requests.set(userId, userRequests);

    // Clean up old entries
    if (Math.random() < 0.01) {
      for (const [key, times] of requests.entries()) {
        const validTimes = times.filter(time => time > windowStart);
        if (validTimes.length === 0) {
          requests.delete(key);
        } else {
          requests.set(key, validTimes);
        }
      }
    }

    next();
  };
};

module.exports = exports;