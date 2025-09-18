// Simple in-memory cache middleware

const NodeCache = require('node-cache');

// Create cache instances with different TTLs
const shortCache = new NodeCache({ stdTTL: 60 }); // 1 minute
const mediumCache = new NodeCache({ stdTTL: 300 }); // 5 minutes
const longCache = new NodeCache({ stdTTL: 3600 }); // 1 hour

// Cache middleware factory
const cacheMiddleware = (duration = 'medium') => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Skip caching if user is authenticated (personalized content)
    if (req.user) {
      return next();
    }

    // Generate cache key from URL and query params
    const key = `${req.originalUrl || req.url}`;

    // Select appropriate cache based on duration
    let cache;
    switch (duration) {
      case 'short':
        cache = shortCache;
        break;
      case 'long':
        cache = longCache;
        break;
      default:
        cache = mediumCache;
    }

    // Try to get cached response
    const cachedResponse = cache.get(key);
    if (cachedResponse) {
      console.log(`Cache hit for: ${key}`);
      return res.json(cachedResponse);
    }

    // Store original res.json method
    const originalJson = res.json.bind(res);

    // Override res.json to cache successful responses
    res.json = body => {
      // Only cache successful responses
      if (res.statusCode === 200) {
        cache.set(key, body);
        console.log(`Cached response for: ${key}`);
      }
      return originalJson(body);
    };

    next();
  };
};

// Specific cache middleware exports
exports.cacheMiddleware = cacheMiddleware; // Add this line for compatibility
exports.cache = cacheMiddleware;
exports.shortCache = cacheMiddleware('short');
exports.mediumCache = cacheMiddleware('medium');
exports.longCache = cacheMiddleware('long');

// Clear cache function
exports.clearCache = pattern => {
  if (pattern) {
    // Clear specific keys matching pattern
    const shortKeys = shortCache.keys().filter(key => key.includes(pattern));
    const mediumKeys = mediumCache.keys().filter(key => key.includes(pattern));
    const longKeys = longCache.keys().filter(key => key.includes(pattern));

    shortKeys.forEach(key => shortCache.del(key));
    mediumKeys.forEach(key => mediumCache.del(key));
    longKeys.forEach(key => longCache.del(key));

    console.log(`Cleared cache for pattern: ${pattern}`);
  } else {
    // Clear all caches
    shortCache.flushAll();
    mediumCache.flushAll();
    longCache.flushAll();
    console.log('All caches cleared');
  }
};

// Cache invalidation middleware
exports.invalidateCache = pattern => {
  return (req, res, next) => {
    // Invalidate cache after successful write operations
    const originalJson = res.json.bind(res);
    res.json = body => {
      if (res.statusCode < 300) {
        exports.clearCache(pattern || req.baseUrl);
      }
      return originalJson(body);
    };
    next();
  };
};


// Cache headers middleware
exports.cacheHeaders = (maxAge = 300) => {
  return (req, res, next) => {
    // Set cache control headers
    if (req.method === 'GET') {
      res.set({
        'Cache-Control': `public, max-age=${maxAge}`,
        Vary: 'Accept-Encoding',
      });
    } else {
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      });
    }
    next();
  };
};

// Conditional request handling (ETags)
exports.etag = () => {
  const crypto = require('crypto');

  return (req, res, next) => {
    const originalJson = res.json.bind(res);

    res.json = body => {
      // Generate ETag
      const etag = crypto
        .createHash('md5')
        .update(JSON.stringify(body))
        .digest('hex');

      res.set('ETag', `"${etag}"`);

      // Check if client has matching ETag
      const clientEtag = req.headers['if-none-match'];
      if (clientEtag === `"${etag}"`) {
        return res.status(304).end();
      }

      return originalJson(body);
    };

    next();
  };
};

// Cache warming function
exports.warmCache = async routes => {
  console.log('Warming cache for specified routes...');
  // Implementation would make requests to specified routes
  // to populate the cache
};

// Cache statistics
exports.getCacheStats = () => {
  return {
    short: {
      hits: shortCache.getStats().hits,
      misses: shortCache.getStats().misses,
      keys: shortCache.keys().length,
    },
    medium: {
      hits: mediumCache.getStats().hits,
      misses: mediumCache.getStats().misses,
      keys: mediumCache.keys().length,
    },
    long: {
      hits: longCache.getStats().hits,
      misses: longCache.getStats().misses,
      keys: longCache.keys().length,
    },
  };
};

// Export all cache instances for direct access if needed
exports.caches = {
  short: shortCache,
  medium: mediumCache,
  long: longCache,
};
