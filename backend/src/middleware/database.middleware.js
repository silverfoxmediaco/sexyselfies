const mongoose = require('mongoose');
const database = require('../config/database');

// Health check middleware
exports.checkDatabaseHealth = (req, res, next) => {
  const status = database.getConnectionStatus();

  if (!status.isConnected || status.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database service is currently unavailable',
      code: 'SERVICE_UNAVAILABLE',
      details: {
        message:
          'The service is temporarily unable to process your request. Please try again later.',
        readyState: status.readyStateText,
        retryAfter: 30, // seconds
      },
    });
  }

  next();
};

// Critical route protection
exports.requireDatabase = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    const error = new Error('Database connection required');
    error.statusCode = 503;
    error.code = 'DB_CONNECTION_REQUIRED';
    return next(error);
  }
  next();
};

// Graceful degradation for non-critical routes
exports.optionalDatabase = (req, res, next) => {
  req.dbAvailable = mongoose.connection.readyState === 1;
  next();
};

// Transaction wrapper for critical operations
exports.withTransaction = async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      error: 'Database transaction cannot be started',
      code: 'TRANSACTION_UNAVAILABLE',
    });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  req.dbSession = session;

  // Store original json method
  const originalJson = res.json;

  // Override json method to commit transaction on success
  res.json = function (data) {
    if (data.success) {
      session
        .commitTransaction()
        .then(() => session.endSession())
        .catch(err => console.error('Transaction commit error:', err));
    } else {
      session
        .abortTransaction()
        .then(() => session.endSession())
        .catch(err => console.error('Transaction abort error:', err));
    }

    // Call original json method
    return originalJson.call(this, data);
  };

  next();
};
