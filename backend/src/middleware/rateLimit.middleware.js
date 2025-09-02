// backend/src/middleware/rateLimit.middleware.js

const rateLimit = require('express-rate-limit');

// Optional Redis support - only load if available
let RedisStore = null;
let Redis = null;
let redisClient = null;

try {
  // Try to load Redis dependencies
  RedisStore = require('rate-limit-redis');
  Redis = require('ioredis');
  
  // Create Redis client if Redis is available and configured
  if (process.env.REDIS_URL || process.env.REDIS_HOST) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => {
        if (times > 3) {
          console.log('Redis connection failed, falling back to memory store');
          return null;
        }
        return Math.min(times * 50, 2000);
      }
    });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
      redisClient = null; // Disable Redis on error
    });
    
    console.log('Redis rate limiting enabled');
  }
} catch (err) {
  // Redis dependencies not installed - use memory store
  console.log('Redis not available for rate limiting, using memory store');
}

// ==========================================
// RATE LIMITER FACTORY
// ==========================================

/**
 * Create a rate limiter with custom options
 * Falls back to memory store if Redis is not available
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false
  };

  const limiterOptions = { ...defaultOptions, ...options };

  // Only add custom keyGenerator if we need user-based limiting
  if (options.useUserId) {
    limiterOptions.keyGenerator = (req) => {
      // Use user ID if authenticated
      if (req.user?.id) {
        return `user_${req.user.id}`;
      }
      // Otherwise use default IP handling (which handles IPv6 properly)
      return req.ip;
    };
  }
  // If no custom key generator needed, express-rate-limit will use its default
  // which properly handles both IPv4 and IPv6

  // Use Redis store if available, otherwise use memory store
  if (RedisStore && redisClient && redisClient.status === 'ready') {
    limiterOptions.store = new RedisStore({
      client: redisClient,
      prefix: 'rl:',
    });
  }

  return rateLimit(limiterOptions);
};

// ==========================================
// PRE-CONFIGURED RATE LIMITERS
// ==========================================

// General API rate limiter
exports.apiLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many API requests, please try again later.'
});

// Strict rate limiter for auth endpoints
exports.authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many authentication attempts, please try again later.'
});

// Rate limiter for registration
exports.registrationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registration attempts per hour
  message: 'Too many registration attempts, please try again later.'
});

// Rate limiter for password reset
exports.passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: 'Too many password reset attempts, please try again later.'
});

// Rate limiter for file uploads
exports.uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: 'Too many uploads, please try again later.'
});

// Rate limiter for content creation
exports.contentCreationLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // 30 posts per hour
  message: 'Too many posts created, please slow down.'
});

// Rate limiter for messages
exports.messageLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 messages per minute
  message: 'Too many messages sent, please slow down.',
  useUserId: true // Rate limit by user ID if available
});

// Rate limiter for payments
exports.paymentLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many payment attempts, please try again later.'
});

// Rate limiter for searches
exports.searchLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: 'Too many searches, please slow down.'
});

// Rate limiter for swipes (discovery)
exports.swipeLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 swipes per hour
  message: 'Too many swipes, please take a break.',
  useUserId: true // Rate limit by user ID
});

// Rate limiter for reports
exports.reportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many reports submitted, please try again later.'
});

// Rate limiter for webhook endpoints
exports.webhookLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: 'Too many webhook requests.',
  // Webhooks should use IP-based limiting
  keyGenerator: (req) => {
    // Use webhook signature if available, otherwise IP
    const signature = req.headers['x-webhook-signature'];
    return signature ? `webhook_${signature}` : req.ip;
  }
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
 * Rate limiter based on user verification level (not subscription tier)
 * SexySelfies doesn't use subscriptions - only micro-transactions
 */
exports.tieredRateLimiter = (req, res, next) => {
  let maxRequests = 100; // Default for unverified users
  
  if (req.user) {
    // Check creator verification level
    if (req.user.role === 'creator') {
      switch (req.user.verificationLevel) {
        case 'vip':
          maxRequests = 1000;
          break;
        case 'premium':
          maxRequests = 500;
          break;
        case 'verified':
          maxRequests = 200;
          break;
        default:
          maxRequests = 100;
      }
    }
    // Members get standard limits
    else if (req.user.role === 'member') {
      maxRequests = 150;
    }
    // Admins get higher limits
    else if (req.user.role === 'admin') {
      maxRequests = 2000;
    }
  }
  
  const limiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: maxRequests,
    message: `Rate limit exceeded for your account level. Contact support for higher limits.`,
    useUserId: true
  });
  
  return limiter(req, res, next);
};

// ==========================================
// IP-BASED RATE LIMITING
// ==========================================

/**
 * Strict IP-based rate limiting (ignores user authentication)
 * Uses express-rate-limit's default IP handling for IPv4/IPv6 support
 */
exports.ipRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many requests from this IP address.'
  // No custom keyGenerator - use default IP handling
});

// ==========================================
// BYPASS RATE LIMITING
// ==========================================

/**
 * Skip rate limiting for certain conditions
 */
exports.skipRateLimit = (req) => {
  // Skip for admin users
  if (req.user?.role === 'admin') return true;
  
  // Skip for whitelisted IPs
  const whitelist = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
  if (whitelist.includes(req.ip)) return true;
  
  // Skip for internal services
  if (req.headers['x-internal-service'] === process.env.INTERNAL_SERVICE_KEY) return true;
  
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
    reset: res.getHeader('RateLimit-Reset')
  });
};

// ==========================================
// CLEANUP
// ==========================================

// Cleanup Redis connection on app termination
process.on('SIGINT', () => {
  if (redisClient) {
    redisClient.quit();
  }
});

process.on('SIGTERM', () => {
  if (redisClient) {
    redisClient.quit();
  }
});