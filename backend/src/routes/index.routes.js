const express = require('express');
const router = express.Router();

// Import all route modules
const authRoutes = require('./auth.routes');
const creatorRoutes = require('./creator.routes');
const memberRoutes = require('./member.routes');
const adminRoutes = require('./admin.routes');
const publicRoutes = require('./public.routes');
const uploadRoutes = require('./upload.routes');
const paymentRoutes = require('./payment.routes');
const connectionRoutes = require('./connections.routes');
const verificationRoutes = require('./verification.routes');
const notificationRoutes = require('./notification.routes');

// Import middleware
const { logRequest } = require('../middleware/logging.middleware');
const { corsMiddleware } = require('../middleware/cors.middleware');

// Apply global middleware
router.use(corsMiddleware);
router.use(logRequest);

// ==========================================
// API VERSION 1 ROUTES
// ==========================================

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Development-only seeding endpoint
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  router.post('/dev/seed-data', async (req, res) => {
    try {
      const { seedCreators } = require('../scripts/seedCreators');
      const result = await seedCreators();

      res.json({
        success: true,
        message: 'Database seeded successfully!',
        timestamp: new Date(),
        result,
      });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed database',
        error: error.message,
        timestamp: new Date(),
      });
    }
  });

  router.get('/dev/seed-data', (req, res) => {
    res.json({
      success: true,
      message: 'Seeding endpoint available in development mode',
      instructions: 'POST to this endpoint to seed the database with test data',
      data: {
        creators: 7,
        members: 10,
        includes: [
          'User records',
          'Creator profiles',
          'Member profiles',
          'Cloudinary images',
        ],
      },
    });
  });
}

// API version check
router.get('/version', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    api: 'SexySelfies API',
    documentation: '/api/v1/docs',
  });
});

// Mount all route modules
router.use('/auth', authRoutes);
router.use('/creator', creatorRoutes);
router.use('/member', memberRoutes);
router.use('/admin', adminRoutes);
router.use('/public', publicRoutes);
router.use('/upload', uploadRoutes);
router.use('/payment', paymentRoutes);
router.use('/connections', connectionRoutes);
router.use('/verification', verificationRoutes);
router.use('/notifications', notificationRoutes);

// API Documentation (would serve Swagger/OpenAPI docs)
router.get('/docs', (req, res) => {
  res.json({
    success: true,
    message: 'API documentation',
    endpoints: {
      auth: {
        base: '/api/v1/auth',
        endpoints: [
          'POST /register',
          'POST /login',
          'POST /logout',
          'GET /me',
          'PUT /updatepassword',
        ],
      },
      creator: {
        base: '/api/v1/creator',
        endpoints: [
          'GET /profile',
          'PUT /profile',
          'POST /content',
          'GET /content',
          'GET /earnings',
          'POST /earnings/payout',
          'GET /analytics',
          'GET /browse-members',
          'GET /connections',
          'POST /connections/:connectionId/accept',
        ],
      },
      member: {
        base: '/api/v1/member',
        endpoints: [
          'GET /profile',
          'GET /discover',
          'POST /swipe',
          'GET /connections',
          'GET /messages',
          'POST /messages',
          'POST /purchase/:contentId',
          'GET /library',
        ],
      },
      connections: {
        base: '/api/v1/connections',
        endpoints: [
          '--- Discovery ---',
          'GET /stack - Get creators to swipe on',
          'POST /swipe - Process swipe action',
          '',
          '--- Connections Management ---',
          'GET / - Get all connections with filters',
          'GET /stats - Get connection statistics',
          'POST /:connectionId/accept - Accept pending connection',
          'POST /:connectionId/decline - Decline pending connection',
          'PUT /:connectionId/pin - Pin/Unpin connection',
          'PUT /:connectionId/archive - Archive connection',
          'POST /:connectionId/block - Block connection',
          'POST /bulk - Bulk actions on connections',
          '',
          '--- Messaging ---',
          'POST /:connectionId/messages - Send message',
          'GET /:connectionId/messages - Get messages',
          'PUT /:connectionId/messages/read - Mark as read',
          'DELETE /messages/:messageId - Delete message',
          '',
          '--- Legacy Support ---',
          'GET /matches - Get all matches (legacy)',
          'GET /:connectionId - Get connection details',
          'DELETE /:connectionId - Disconnect/Unmatch',
        ],
      },
      admin: {
        base: '/api/v1/admin',
        endpoints: [
          'POST /login',
          'GET /dashboard',
          'GET /users',
          'GET /reports',
          'GET /content',
          'GET /analytics',
          'GET /verifications',
          'POST /verifications/:id/approve',
          'POST /verifications/:id/reject',
        ],
      },
      public: {
        base: '/api/v1/public',
        endpoints: [
          'GET /trending',
          'GET /creator',
          'GET /creator/:username',
          'GET /categories',
          'GET /search',
        ],
      },
      upload: {
        base: '/api/v1/upload',
        endpoints: [
          'POST /profile-image',
          'POST /content-images',
          'POST /content-video',
          'POST /message-media',
          'POST /verification-documents',
        ],
      },
      payment: {
        base: '/api/v1/payment',
        endpoints: [
          'POST /create-intent',
          'POST /confirm',
          'POST /tip',
          'POST /subscription',
          'GET /history',
          'POST /payout/request',
          'GET /payout/status',
        ],
      },
    },
  });
});

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler for unmatched API routes
router.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date(),
  });
});

// Global error handler
router.use((error, req, res, next) => {
  console.error('API Error:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    body: req.body,
    user: req.user?.id,
  });

  // Handle specific error types
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(e => e.message),
    });
  }

  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
    });
  }

  if (error.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      error: error.message,
    });
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

module.exports = router;
