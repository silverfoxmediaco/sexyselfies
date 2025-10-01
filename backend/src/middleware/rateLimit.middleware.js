// backend/src/middleware/rateLimit.middleware.js
// ENTERPRISE SCALE RATE LIMITING - Designed for millions of daily users
// Configured for content platform usage patterns similar to OnlyFans scale
// TODO: Migrate to Redis-based rate limiting for true horizontal scaling

const rateLimit = require('express-rate-limit');

// ==========================================
// RATE LIMITER FACTORY
// ==========================================

/**
 * Create a rate limiter with custom options
 * Uses in-memory store (default behavior)
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false,
  };

  const limiterOptions = { ...defaultOptions, ...options };

  return rateLimit(limiterOptions);
};

// ==========================================
// PRE-CONFIGURED RATE LIMITERS
// ==========================================

// General API rate limiter - ENTERPRISE SCALE for millions of users
exports.apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // 10k requests per 15min - supports heavy content browsing
  message: 'Too many API requests, please try again later.',
});

// Strict rate limiter for auth endpoints
exports.authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.',
});

// Rate limiter for registration
exports.registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: 'Too many registration attempts, please try again later.',
});

// Rate limiter for password reset
exports.passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.',
});

// Rate limiter for file uploads
exports.uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many uploads, please try again later.',
});

// Rate limiter for content creation
exports.contentCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 posts per hour
  message: 'Too many posts created, please slow down.',
});

// Rate limiter for messages - ENTERPRISE SCALE
exports.messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // 200 messages per minute - supports active conversations
  message: 'Too many messages sent, please slow down.',
});

// Rate limiter for payments - Keep conservative for security
exports.paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // Increased but still secure for rapid purchases
  message: 'Too many payment attempts, please try again later.',
});

// Rate limiter for searches - ENTERPRISE SCALE
exports.searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 searches per minute - supports active discovery
  message: 'Too many searches, please slow down.',
});

// Rate limiter for swipes (discovery) - ENTERPRISE SCALE
exports.swipeLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10000, // 10k swipes per hour - supports endless content discovery
  message: 'Too many swipes, please take a break.',
});

// Rate limiter for reports
exports.reportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many reports submitted, please try again later.',
});

// Rate limiter for webhook endpoints
exports.webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many webhook requests.',
});

// ==========================================
// DYNAMIC RATE LIMITER
// ==========================================

/**
 * Create a dynamic rate limiter with custom options
 * Usage: rateLimiter({ max: 5, windowMs: 60000 })
 */
exports.rateLimiter = (options = {}) => {
  return createRateLimiter(options);
};

// ==========================================
// USER-SPECIFIC RATE LIMITING
// ==========================================

/**
 * Rate limiter based on user verification level - ENTERPRISE SCALE
 * Designed for millions of daily users with heavy content consumption
 */
exports.tieredRateLimiter = (req, res, next) => {
  let maxRequests = 5000; // Default for unverified users - supports heavy browsing

  if (req.user) {
    // Check creator verification level - creators need higher limits for content management
    if (req.user.role === 'creator') {
      switch (req.user.verificationLevel) {
        case 'vip':
          maxRequests = 50000; // VIP creators - unlimited content management
          break;
        case 'premium':
          maxRequests = 25000; // Premium creators
          break;
        case 'verified':
          maxRequests = 15000; // Verified creators
          break;
        default:
          maxRequests = 8000; // New creators
      }
    }
    // Members get high limits for content consumption (browsing, purchasing)
    else if (req.user.role === 'member') {
      maxRequests = 12000; // Support endless scrolling and content discovery
    }
    // Admins get unlimited for platform management
    else if (req.user.role === 'admin') {
      maxRequests = 100000; // Platform administration
    }
  }

  const limiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: `Rate limit exceeded for your account level. Contact support for higher limits.`,
  });

  return limiter(req, res, next);
};

// ==========================================
// IP-BASED RATE LIMITING
// ==========================================

/**
 * IP-based rate limiting - ENTERPRISE SCALE
 * Uses express-rate-limit's default IP handling for IPv4/IPv6 support
 * Designed for shared networks (universities, offices, public wifi)
 */
exports.ipRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20000, // 20k requests per IP per 15min - supports multiple users per IP
  message: 'Too many requests from this IP address.',
  // No custom keyGenerator - use default IP handling
});

// ==========================================
// BYPASS RATE LIMITING
// ==========================================

/**
 * Skip rate limiting for certain conditions
 */
exports.skipRateLimit = req => {
  // Skip for admin users
  if (req.user?.role === 'admin') return true;

  // Skip for whitelisted IPs
  const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
  if (whitelist.includes(req.ip)) return true;

  // Skip for internal services
  if (req.headers['x-internal-service'] === process.env.INTERNAL_SERVICE_KEY)
    return true;

  return false;
};

// ==========================================
// RATE LIMIT RESPONSE HANDLER
// ==========================================

/**
 * Custom handler for rate limit exceeded
 */
exports.rateLimitHandler = (req, res) => {
  res.status(429).json({
    success: false,
    error: 'Too many requests',
    message: 'You have exceeded the rate limit. Please try again later.',
    retryAfter: res.getHeader('Retry-After'),
    limit: res.getHeader('RateLimit-Limit'),
    remaining: res.getHeader('RateLimit-Remaining'),
    reset: res.getHeader('RateLimit-Reset'),
  });
};

// ==========================================
// CLEANUP
// ==========================================

// No cleanup needed for in-memory rate limiting
