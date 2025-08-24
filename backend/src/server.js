const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const creatorRoutes = require('./routes/creator.routes');
const memberRoutes = require('./routes/member.routes');
const contentRoutes = require('./routes/content.routes');
const connectionRoutes = require('./routes/connections.routes');
const transactionRoutes = require('./routes/transaction.routes');
const uploadRoutes = require('./routes/upload.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');
const verificationRoutes = require('./routes/verification.routes');
const paymentRoutes = require('./routes/payment.routes');
const publicRoutes = require('./routes/public.routes');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logging.middleware');

const app = express();

// Trust proxy - important for deployment behind reverse proxies
app.set('trust proxy', 1);

// Connect to MongoDB with retry logic
const connectDB = require('./config/database');
connectDB();

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet for security headers with PWA-specific config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
      connectSrc: ["'self'", "wss:", "https:"],
      mediaSrc: ["'self'", "https://res.cloudinary.com", "blob:"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false, // For PWA compatibility
}));

// CORS configuration with multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      process.env.MOBILE_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'] // For pagination
};

app.use(cors(corsOptions));

// Rate limiting - different limits for different endpoints
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Strict limit for auth endpoints
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Limit uploads
  message: 'Too many uploads, please try again later.',
});

// Apply rate limiting
app.use('/api/', defaultLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/upload/', uploadLimiter);

// ==========================================
// BODY PARSING & DATA SANITIZATION
// ==========================================

// Body parser middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook signature verification
    if (req.originalUrl.startsWith('/api/webhooks/')) {
      req.rawBody = buf.toString('utf8');
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit'] // Allow these duplicates
}));

// Compression middleware
app.use(compression());

// ==========================================
// LOGGING
// ==========================================

// Morgan for HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // Custom format for production
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Custom request logger
app.use(requestLogger);

// ==========================================
// STATIC FILES & PWA SUPPORT
// ==========================================

// Serve static files
app.use('/static', express.static(path.join(__dirname, 'public'), {
  maxAge: '1y',
  etag: true,
  lastModified: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Service Worker route (for PWA)
app.get('/service-worker.js', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/service-worker.js'));
});

// Manifest route (for PWA)
app.get('/manifest.json', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/manifest.json'));
});

// ==========================================
// API ROUTES
// ==========================================

// API Version prefix
const API_V1 = '/api/v1';

// Health checks (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get(`${API_V1}/health`, async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
    
    res.json({ 
      status: 'OK',
      api: 'v1',
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR',
      message: 'Service unavailable'
    });
  }
});

// Mount routes with API versioning
app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/creators`, creatorRoutes);
app.use(`${API_V1}/members`, memberRoutes);
app.use(`${API_V1}/content`, contentRoutes);
app.use(`${API_V1}/connections`, connectionRoutes); // Primary connection routes
app.use(`${API_V1}/transactions`, transactionRoutes);
app.use(`${API_V1}/upload`, uploadRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
app.use(`${API_V1}/notifications`, notificationRoutes);
app.use(`${API_V1}/verification`, verificationRoutes);
app.use(`${API_V1}/payments`, paymentRoutes);
app.use(`${API_V1}/public`, publicRoutes);

// Development-only seeding endpoint
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.post(`${API_V1}/dev/seed-data`, async (req, res) => {
    try {
      console.log('🌱 Seeding endpoint called...');
      const { seedCreators } = require('./scripts/seedCreators');
      const result = await seedCreators();
      
      res.json({
        success: true,
        message: 'Database seeded successfully!',
        timestamp: new Date(),
        ...result
      });
    } catch (error) {
      console.error('Seeding error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to seed database',
        error: error.message,
        timestamp: new Date()
      });
    }
  });
  
  app.get(`${API_V1}/dev/seed-data`, (req, res) => {
    res.json({
      success: true,
      message: 'Seeding endpoint available in development mode',
      instructions: 'POST to this endpoint to seed the database with test data',
      data: {
        creators: 7,
        members: 10,
        includes: ['User records', 'Creator profiles', 'Member profiles', 'Cloudinary images']
      }
    });
  });
}

// Legacy support - redirect old /matches routes to /connections
app.use(`${API_V1}/matches`, (req, res, next) => {
  console.log('Legacy /matches route accessed, redirecting to /connections');
  // The URL at this point doesn't include /matches, just the path after it
  // So we don't need to replace anything, just pass it through
  connectionRoutes(req, res, next);
});

// Webhook routes (no versioning, raw body)
app.use('/webhooks', require('./routes/webhook.routes'));

// ==========================================
// PWA FALLBACK FOR CLIENT ROUTING
// ==========================================

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  // Debug: Check what files exist
  const fs = require('fs');
  console.log('Server __dirname:', __dirname);
  console.log('Files in project root:', fs.existsSync(path.join(__dirname, '../../')) ? fs.readdirSync(path.join(__dirname, '../../')) : 'Root not found');
  console.log('Frontend dir exists:', fs.existsSync(path.join(__dirname, '../../frontend')));
  console.log('Dist dir exists:', fs.existsSync(path.join(__dirname, '../../frontend/dist')));
  
  // Serve static files from frontend build
  const frontendPath = path.join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath, {
    maxAge: '1y',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    }
  }));
  
  // Handle React router - serve index.html for all non-API routes
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
      return next();
    }
    
    const indexPath = path.join(frontendPath, 'index.html');
    console.log('Serving frontend from:', indexPath);
    res.sendFile(indexPath);
  });
}

// ==========================================
// ERROR HANDLING
// ==========================================

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.status = 404;
  next(error);
});

// Global error handler (must be last)
app.use(errorMiddleware);

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

const server = app.listen(process.env.PORT || 5002, () => {
  console.log('========================================');
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📡 Port: ${process.env.PORT || 5002}`);
  console.log(`🌐 Frontend URL: ${process.env.CLIENT_URL || 'http://localhost:5174'}`);
  console.log(`🛠️  Admin URL: ${process.env.ADMIN_URL || 'http://localhost:5175'}`);
  console.log(`❤️  Health Check: http://localhost:${process.env.PORT || 5002}/health`);
  console.log(`📚 API Base: http://localhost:${process.env.PORT || 5002}/api/v1`);
  console.log('========================================');
  console.log('📋 API Routes:');
  console.log(`   - Auth: ${API_V1}/auth`);
  console.log(`   - Connections: ${API_V1}/connections`);
  console.log(`   - Creators: ${API_V1}/creators`);
  console.log(`   - Members: ${API_V1}/members`);
  console.log(`   - Content: ${API_V1}/content`);
  console.log(`   - Payments: ${API_V1}/payments`);
  console.log(`   - Admin: ${API_V1}/admin`);
  console.log('========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('👋 SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💤 Process terminated');
  });
});

module.exports = app;