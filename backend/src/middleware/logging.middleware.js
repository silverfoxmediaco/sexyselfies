const fs = require('fs');
const path = require('path');
const morgan = require('morgan');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Create write streams for different log files
const accessLogStream = fs.createWriteStream(
  path.join(logsDir, 'access.log'),
  { flags: 'a' }
);

const errorLogStream = fs.createWriteStream(
  path.join(logsDir, 'error.log'),
  { flags: 'a' }
);

// Custom token for user ID
morgan.token('user-id', (req) => {
  return req.user ? req.user.id : 'anonymous';
});

// Custom token for user type
morgan.token('user-type', (req) => {
  return req.user ? req.user.type : 'guest';
});

// Custom token for response time in milliseconds
morgan.token('response-time-ms', (req, res) => {
  return Math.round(morgan['response-time'](req, res));
});

// Development logging format
const devFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Production logging format
const prodFormat = ':remote-addr - :user-id [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time-ms ms';

// Custom logging format for detailed logs
const detailedFormat = JSON.stringify({
  timestamp: ':date[iso]',
  method: ':method',
  url: ':url',
  status: ':status',
  userId: ':user-id',
  userType: ':user-type',
  responseTime: ':response-time-ms',
  contentLength: ':res[content-length]',
  ip: ':remote-addr',
  userAgent: ':user-agent',
  referrer: ':referrer'
});

// Request logger middleware
exports.requestLogger = process.env.NODE_ENV === 'production'
  ? morgan(prodFormat, { stream: accessLogStream })
  : morgan(devFormat);

// Detailed logger for debugging
exports.detailedLogger = morgan(detailedFormat, {
  stream: accessLogStream,
  skip: (req, res) => res.statusCode < 400 // Only log errors in detailed format
});

// Error logger
exports.errorLogger = (err, req, res, next) => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    userId: req.user?.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  };

  // Write to error log file
  errorLogStream.write(JSON.stringify(errorLog) + '\n');

  // Console log in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error:', errorLog);
  }

  next(err);
};

// Log request body (be careful with sensitive data)
exports.logRequest = (req, res, next) => {
  // Skip logging for sensitive routes
  const sensitiveRoutes = ['/auth/login', '/auth/register', '/payment'];
  const isSensitive = sensitiveRoutes.some(route => req.path.includes(route));

  if (!isSensitive && process.env.NODE_ENV === 'development') {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }

  next();
};

// Performance monitoring
exports.performanceMonitor = (req, res, next) => {
  const start = Date.now();

  // Override res.end to calculate response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // Log slow requests (over 1 second)
    if (duration > 1000) {
      console.warn(`Slow request detected: ${req.method} ${req.url} took ${duration}ms`);
    }

    // Add response time header
    res.set('X-Response-Time', `${duration}ms`);
    
    originalEnd.apply(res, args);
  };

  next();
};

// Audit logger for important actions
exports.auditLog = (action) => {
  return (req, res, next) => {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userId: req.user?.id,
      userType: req.user?.type,
      method: req.method,
      path: req.path,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    // Write to audit log
    const auditLogStream = fs.createWriteStream(
      path.join(logsDir, 'audit.log'),
      { flags: 'a' }
    );
    
    auditLogStream.write(JSON.stringify(auditEntry) + '\n');
    auditLogStream.end();

    next();
  };
};

// Database query logger
exports.dbQueryLogger = (query, params, duration) => {
  if (process.env.LOG_DB_QUERIES === 'true') {
    const queryLog = {
      timestamp: new Date().toISOString(),
      query,
      params,
      duration: `${duration}ms`
    };

    const dbLogStream = fs.createWriteStream(
      path.join(logsDir, 'database.log'),
      { flags: 'a' }
    );
    
    dbLogStream.write(JSON.stringify(queryLog) + '\n');
    dbLogStream.end();
  }
};

// Security event logger
exports.securityLog = (event, details) => {
  const securityEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    severity: details.severity || 'info'
  };

  const securityLogStream = fs.createWriteStream(
    path.join(logsDir, 'security.log'),
    { flags: 'a' }
  );
  
  securityLogStream.write(JSON.stringify(securityEntry) + '\n');
  securityLogStream.end();

  // Alert on high severity events
  if (details.severity === 'high' || details.severity === 'critical') {
    console.error('🚨 Security Event:', securityEntry);
    // Could trigger alerts here (email, Slack, etc.)
  }
};

// Clean up old log files
exports.cleanupLogs = (daysToKeep = 30) => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  fs.readdir(logsDir, (err, files) => {
    if (err) {
      console.error('Error reading logs directory:', err);
      return;
    }

    files.forEach(file => {
      const filePath = path.join(logsDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        
        if (stats.mtime < cutoffDate) {
          fs.unlink(filePath, (err) => {
            if (err) {
              console.error(`Error deleting old log file ${file}:`, err);
            } else {
              console.log(`Deleted old log file: ${file}`);
            }
          });
        }
      });
    });
  });
};

// Schedule log cleanup (run daily)
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    exports.cleanupLogs();
  }, 24 * 60 * 60 * 1000); // Run once per day
}

module.exports = exports;