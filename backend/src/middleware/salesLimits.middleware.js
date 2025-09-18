// backend/src/middleware/salesLimits.middleware.js
// Middleware for enforcing daily limits and preventing spam

const MemberInteraction = require('../models/MemberInteraction');
const Creator = require('../models/Creator');

// In-memory store for rate limiting
const memoryStore = new Map();

// Memory-based functions for rate limiting
const memoryGet = async (key) => {
  const item = memoryStore.get(key);
  if (!item) return null;

  // Check if expired
  if (item.expiry && Date.now() > item.expiry) {
    memoryStore.delete(key);
    return null;
  }

  return item.value;
};

const memorySet = async (key, value, ttlSeconds) => {
  const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
  memoryStore.set(key, { value, expiry });
  return 'OK';
};

const memoryIncr = async (key) => {
  const current = await memoryGet(key);
  const newValue = current ? parseInt(current) + 1 : 1;

  // Preserve existing expiry if any
  const existing = memoryStore.get(key);
  const expiry = existing?.expiry || null;

  memoryStore.set(key, { value: newValue.toString(), expiry });
  return newValue;
};

const memoryExpire = async (key, ttlSeconds) => {
  const existing = memoryStore.get(key);
  if (existing) {
    existing.expiry = Date.now() + (ttlSeconds * 1000);
    memoryStore.set(key, existing);
  }
  return 1;
};

// ============================================
// DAILY INTERACTION LIMITS
// ============================================

/**
 * Check daily interaction limit
 */
exports.checkDailyInteractionLimit = interactionType => {
  return async (req, res, next) => {
    try {
      const creatorId = req.user.id;
      const creator = req.creator || (await Creator.findById(creatorId));

      // Get limits based on verification level
      const limits = getDailyLimits(creator.verificationLevel);
      const limit = limits[interactionType];

      // Unlimited check
      if (limit === -1) {
        return next();
      }

      // Check current usage
      const key = `limit:${creatorId}:${interactionType}:${getTodayDateString()}`;
      const current = (await memoryGet(key)) || 0;

      if (parseInt(current) >= limit) {
        return res.status(429).json({
          success: false,
          message: `Daily ${interactionType} limit reached`,
          limit,
          used: parseInt(current),
          resetsAt: getResetTime(),
          upgradeUrl: '/creator/subscription/upgrade',
        });
      }

      // Increment counter
      await memoryIncr(key);
      await memoryExpire(key, getSecondsUntilMidnight());

      // Add limit info to response headers
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', limit - parseInt(current) - 1);
      res.setHeader('X-RateLimit-Reset', getResetTime());

      next();
    } catch (error) {
      console.error('Daily limit check error:', error);
      // Don't block on error, log and continue
      next();
    }
  };
};

/**
 * Check message quota
 */
exports.checkMessageQuota = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const hourlyLimit = 20; // 20 messages per hour
    const dailyLimit = req.creator?.verificationLevel
      ? getDailyLimits(req.creator.verificationLevel).messages
      : 100;

    // Check hourly limit
    const hourlyKey = `limit:${creatorId}:messages:hourly:${getCurrentHour()}`;
    const hourlyCount = (await getAsync(hourlyKey)) || 0;

    if (parseInt(hourlyCount) >= hourlyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Hourly message limit reached',
        limit: hourlyLimit,
        used: parseInt(hourlyCount),
        resetsAt: getNextHour(),
        type: 'hourly',
      });
    }

    // Check daily limit
    const dailyKey = `limit:${creatorId}:messages:${getTodayDateString()}`;
    const dailyCount = (await getAsync(dailyKey)) || 0;

    if (parseInt(dailyCount) >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Daily message limit reached',
        limit: dailyLimit,
        used: parseInt(dailyCount),
        resetsAt: getResetTime(),
        type: 'daily',
      });
    }

    // Increment both counters
    await incrAsync(hourlyKey);
    await expireAsync(hourlyKey, 3600); // 1 hour
    await incrAsync(dailyKey);
    await expireAsync(dailyKey, getSecondsUntilMidnight());

    next();
  } catch (error) {
    console.error('Message quota check error:', error);
    next();
  }
};

/**
 * Prevent spam - cooldown periods
 */
exports.preventSpam = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    const interactionType = req.route.path.split('/').pop(); // Get action from route

    // Define cooldown periods (in seconds)
    const cooldowns = {
      poke: 86400, // 24 hours per member
      message: 300, // 5 minutes between messages to same member
      'special-offer': 3600, // 1 hour between offers to same member
      like: 60, // 1 minute between likes to same member
    };

    const cooldownPeriod = cooldowns[interactionType];
    if (!cooldownPeriod) {
      return next();
    }

    // Check cooldown
    const cooldownKey = `cooldown:${creatorId}:${memberId}:${interactionType}`;
    const isOnCooldown = await getAsync(cooldownKey);

    if (isOnCooldown) {
      const remainingTime = await redisClient.ttl(cooldownKey);

      return res.status(429).json({
        success: false,
        message: `Please wait before ${interactionType} this member again`,
        cooldownRemaining: remainingTime,
        cooldownEndsAt: new Date(Date.now() + remainingTime * 1000),
      });
    }

    // Set cooldown
    await setAsync(cooldownKey, '1', 'EX', cooldownPeriod);

    next();
  } catch (error) {
    console.error('Spam prevention error:', error);
    next();
  }
};

/**
 * Bulk action limits
 */
exports.bulkActionLimits = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const creator = req.creator || (await Creator.findById(creatorId));

    // Check if bulk actions are allowed
    const allowedLevels = ['premium', 'vip'];
    if (!allowedLevels.includes(creator.verificationLevel)) {
      return res.status(403).json({
        success: false,
        message: 'Bulk actions require premium verification',
        currentLevel: creator.verificationLevel,
        requiredLevels: allowedLevels,
      });
    }

    // Check bulk action limit
    const bulkLimit = creator.verificationLevel === 'vip' ? 10 : 3;
    const bulkKey = `limit:${creatorId}:bulk:${getTodayDateString()}`;
    const bulkCount = (await getAsync(bulkKey)) || 0;

    if (parseInt(bulkCount) >= bulkLimit) {
      return res.status(429).json({
        success: false,
        message: 'Daily bulk action limit reached',
        limit: bulkLimit,
        used: parseInt(bulkCount),
        resetsAt: getResetTime(),
      });
    }

    // Check recipients count
    const { recipients } = req.body;
    const maxRecipients = creator.verificationLevel === 'vip' ? 100 : 50;

    if (recipients && recipients.length > maxRecipients) {
      return res.status(400).json({
        success: false,
        message: `Maximum ${maxRecipients} recipients allowed per bulk action`,
        provided: recipients.length,
        maximum: maxRecipients,
      });
    }

    // Increment bulk counter
    await incrAsync(bulkKey);
    await expireAsync(bulkKey, getSecondsUntilMidnight());

    next();
  } catch (error) {
    console.error('Bulk action limit error:', error);
    next();
  }
};

// ============================================
// SPECIAL OFFER LIMITS
// ============================================

/**
 * Check special offer limits
 */
exports.checkSpecialOfferLimits = async (req, res, next) => {
  try {
    const creatorId = req.user.id;
    const hourlyLimit = 5;
    const dailyLimit = req.creator?.verificationLevel
      ? getDailyLimits(req.creator.verificationLevel).specialOffers
      : 10;

    // Check hourly limit
    const hourlyKey = `limit:${creatorId}:offers:hourly:${getCurrentHour()}`;
    const hourlyCount = (await getAsync(hourlyKey)) || 0;

    if (parseInt(hourlyCount) >= hourlyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Hourly special offer limit reached',
        limit: hourlyLimit,
        used: parseInt(hourlyCount),
        resetsAt: getNextHour(),
      });
    }

    // Check daily limit
    const dailyKey = `limit:${creatorId}:offers:${getTodayDateString()}`;
    const dailyCount = (await getAsync(dailyKey)) || 0;

    if (parseInt(dailyCount) >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: 'Daily special offer limit reached',
        limit: dailyLimit,
        used: parseInt(dailyCount),
        resetsAt: getResetTime(),
      });
    }

    // Increment counters
    await incrAsync(hourlyKey);
    await expireAsync(hourlyKey, 3600);
    await incrAsync(dailyKey);
    await expireAsync(dailyKey, getSecondsUntilMidnight());

    next();
  } catch (error) {
    console.error('Special offer limit error:', error);
    next();
  }
};

// ============================================
// RATE LIMIT HELPERS
// ============================================

/**
 * Get daily limits based on verification level
 */
function getDailyLimits(verificationLevel) {
  const limits = {
    basic: {
      profileViews: 50,
      pokes: 25,
      messages: 50,
      specialOffers: 5,
      bulkMessages: 0,
    },
    standard: {
      profileViews: 100,
      pokes: 50,
      messages: 100,
      specialOffers: 10,
      bulkMessages: 1,
    },
    premium: {
      profileViews: 500,
      pokes: 100,
      messages: 250,
      specialOffers: 25,
      bulkMessages: 3,
    },
    vip: {
      profileViews: -1, // Unlimited
      pokes: 200,
      messages: 500,
      specialOffers: 50,
      bulkMessages: 10,
    },
  };

  return limits[verificationLevel] || limits['basic'];
}

/**
 * Get today's date string for Redis keys
 */
function getTodayDateString() {
  const date = new Date();
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * Get current hour string
 */
function getCurrentHour() {
  const date = new Date();
  return `${getTodayDateString()}-${date.getHours()}`;
}

/**
 * Get seconds until midnight
 */
function getSecondsUntilMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.floor((midnight - now) / 1000);
}

/**
 * Get reset time (midnight)
 */
function getResetTime() {
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  return midnight.toISOString();
}

/**
 * Get next hour
 */
function getNextHour() {
  const nextHour = new Date();
  nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
  return nextHour.toISOString();
}

/**
 * Reset limits for testing (admin only)
 */
exports.resetLimits = async creatorId => {
  const patterns = [`limit:${creatorId}:*`, `cooldown:${creatorId}:*`];

  for (const pattern of patterns) {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }

  return { success: true, message: 'Limits reset successfully' };
};

module.exports = exports;
