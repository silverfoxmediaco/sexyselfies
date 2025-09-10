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
const { createServer } = require('http');
const { Server } = require('socket.io');
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
const payoutRoutes = require('./routes/payout.routes');

// Import new Creator Active Sales routes
const creatorSalesRoutes = require('./routes/creatorSales.routes');
const memberProfileRoutes = require('./routes/memberProfile.routes');
const memberPrivacyRoutes = require('./routes/memberPrivacy.routes');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logging.middleware');

const app = express();

// Trust proxy - important for deployment behind reverse proxies
app.set('trust proxy', 1);

// Render.com specific optimizations for Starter instance
app.use((req, res, next) => {
  // Disable response timeout for auth endpoints, let server handle it  
  if (req.url.includes('/auth/')) {
    // No res.setTimeout for auth routes - let server keepAliveTimeout handle it
    console.log('🔧 Auth route detected, using server timeout settings');
  } else {
    // Set reasonable timeout for non-auth routes
    res.setTimeout(90000, () => {
      console.error('⏰ Response timeout after 90s for:', req.method, req.originalUrl);
      if (!res.headersSent) {
        return res.status(408).json({
          success: false,
          error: 'Request timeout - please try again',
          code: 'TIMEOUT'
        });
      }
    });
  }
  
  // Add headers safely
  try {
    if (!res.headersSent) {
      res.setHeader('Connection', 'close'); // Force connection close to prevent hanging
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
    }
  } catch (headerError) {
    console.error('Header setting error:', headerError);
  }
  
  // Disable Nagle's algorithm for faster response
  try {
    if (req.socket && req.socket.setNoDelay) {
      req.socket.setNoDelay(true);
    }
  } catch (socketError) {
    console.error('Socket optimization error:', socketError);
  }
  
  next();
});

// MongoDB Connection with enhanced error handling
const connectDB = async () => {
  let connectionRetries = 0;
  const maxRetries = 5;
  const retryDelay = 5000;

  const attemptConnection = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📦 Database Name: ${conn.connection.name}`);
      
      // Reset retry counter on successful connection
      connectionRetries = 0;
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️ MongoDB disconnected. Attempting to reconnect...');
        setTimeout(attemptConnection, retryDelay);
      });
      
      return true;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${connectionRetries + 1} failed:`, error.message);
      connectionRetries++;
      
      if (connectionRetries >= maxRetries) {
        console.error('❌ Max MongoDB connection retries reached. Server will continue but database operations will fail.');
        return false;
      }
      
      console.log(`🔄 Retrying MongoDB connection in ${retryDelay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return attemptConnection();
    }
  };
  
  return attemptConnection();
};

// Initialize database connection
connectDB();

// Database health check middleware
const checkDatabaseConnection = (req, res, next) => {
  console.log('🔍 DATABASE CHECK for:', req.originalUrl);
  
  if (mongoose.connection.readyState !== 1) {
    console.log('❌ DATABASE CHECK FAILED - Connection not ready');
    return res.status(503).json({
      success: false,
      error: 'Database service temporarily unavailable. Please try again later.',
      code: 'DB_UNAVAILABLE'
    });
  }
  
  console.log('✅ DATABASE CHECK PASSED');
  next();
};

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// Helmet for security headers with PWA-specific config
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.jsdelivr.net"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "blob:"],
      connectSrc: ["'self'", "wss:", "ws:", "https:", process.env.CLIENT_URL || "http://localhost:5173"],
      mediaSrc: ["'self'", "https://res.cloudinary.com", "blob:"],
      manifestSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration with multiple origins
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://sexyselfies-frontend.onrender.com',
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      process.env.MOBILE_URL
    ].filter(Boolean);
    
    // Allow requests with no origin (mobile apps, Postman, etc)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Rate limiting - different limits for different endpoints
const defaultLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Increased from 5 to 10 for testing
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// BODY PARSING & DATA SANITIZATION
// ==========================================

// Body parser middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
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
  whitelist: ['sort', 'fields', 'page', 'limit']
}));

// Compression middleware with immediate response
app.use(compression({
  threshold: 0,  // Compress all responses
  level: 1,      // Fast compression level
  flush: require('zlib').constants.Z_SYNC_FLUSH  // Immediate flush
}));

// ==========================================
// LOGGING
// ==========================================

// Morgan for HTTP request logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan(':method :url :status :res[content-length] - :response-time ms'));
}

// Custom request logger
app.use(requestLogger);

// Debug middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log('📨 Request:', {
      method: req.method,
      url: req.url,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    next();
  });
}

// ==========================================
// API ROUTES
// ==========================================

// API Version prefix
const API_V1 = '/api/v1';

// Root route for health checks and basic API info
app.get('/', (req, res) => {
  res.json({ 
    name: 'SexySelfies API',
    version: '1.0.0',
    status: 'OK', 
    message: 'API server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      health: '/health',
      api: '/api/v1'
    }
  });
});

// Health checks (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced health check with database status
app.get(`${API_V1}/health`, async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const dbStatus = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }[dbState] || 'unknown';
    
    res.status(dbState === 1 ? 200 : 503).json({ 
      status: dbState === 1 ? 'OK' : 'DEGRADED',
      api: 'v1',
      database: {
        status: dbStatus,
        isOperational: dbState === 1,
        host: mongoose.connection.host || 'not connected',
        name: mongoose.connection.name || 'not connected'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR',
      message: 'Service unavailable',
      error: error.message
    });
  }
});

// Apply rate limiting BEFORE routes
app.use('/api/', defaultLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/creator/register', authLimiter);
app.use('/api/v1/auth/creator/login', authLimiter);
app.use('/api/v1/upload/', uploadLimiter);

// Apply database check to critical auth routes
console.log('🔧 Configuring database checks for auth routes...');
// Temporarily disabled database checks to debug timeout issue
// app.use(`${API_V1}/auth/register`, checkDatabaseConnection);
// app.use(`${API_V1}/auth/login`, checkDatabaseConnection);  
// app.use(`${API_V1}/auth/creator/register`, checkDatabaseConnection);
// app.use(`${API_V1}/auth/creator/login`, checkDatabaseConnection);

// Mount routes with API versioning
console.log('🚀 Mounting API routes...');

// Add a test endpoint to verify routing works
app.post(`${API_V1}/auth/test`, (req, res) => {
  console.log('✅ Test endpoint hit successfully');
  res.json({ success: true, message: 'Test endpoint working', timestamp: new Date().toISOString() });
});

// Core routes
app.use(`${API_V1}/auth`, authRoutes);
console.log('✅ Auth routes mounted at:', `${API_V1}/auth`);

app.use(`${API_V1}/creator`, creatorRoutes);
console.log('✅ Creator routes mounted at:', `${API_V1}/creator`);

app.use(`${API_V1}/members`, memberRoutes);
console.log('✅ Member routes mounted at:', `${API_V1}/members`);

// Creator Active Sales System routes
app.use(`${API_V1}/creator/sales`, creatorSalesRoutes);
console.log('✅ Creator Sales routes mounted at:', `${API_V1}/creator/sales`);

app.use(`${API_V1}/creator/members`, memberProfileRoutes);
console.log('✅ Member Profile routes mounted at:', `${API_V1}/creator/members`);

app.use(`${API_V1}/member/privacy`, memberPrivacyRoutes);
console.log('✅ Member Privacy routes mounted at:', `${API_V1}/member/privacy`);

// Additional routes
app.use(`${API_V1}/content`, contentRoutes);
app.use(`${API_V1}/connections`, connectionRoutes);
app.use(`${API_V1}/transactions`, transactionRoutes);
app.use(`${API_V1}/upload`, uploadRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
console.log('✅ Admin routes mounted at:', `${API_V1}/admin`);
app.use(`${API_V1}/notifications`, notificationRoutes);
app.use(`${API_V1}/verification`, verificationRoutes);
app.use(`${API_V1}/payments`, paymentRoutes);
app.use(`${API_V1}/public`, publicRoutes);
app.use(`${API_V1}/payouts`, payoutRoutes);

console.log('✅ All API routes mounted successfully');

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
      console.error('❌ Seeding error:', error);
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

// Webhook routes (no versioning, raw body)
app.use('/webhooks', require('./routes/webhook.routes'));

// ==========================================
// ERROR HANDLING FOR API ROUTES
// ==========================================

// 404 handler for API routes ONLY
app.use('/api', (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ==========================================
// SERVE FRONTEND IN PRODUCTION
// ==========================================

// IMPORTANT: Frontend serving MUST come AFTER all API routes
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  
  console.log('📁 Serving frontend from:', frontendBuildPath);
  
  // Serve static files
  app.use(express.static(frontendBuildPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
      else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      }
    }
  }));
  
  // PWA specific files
  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'manifest.json'));
  });
  
  app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'service-worker.js'));
  });
  
  // Catch-all for frontend routes - MUST be last
  app.get('*', (req, res) => {
    // Double-check this isn't an API route
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
      return res.status(404).json({ 
        error: 'API endpoint not found',
        path: req.path 
      });
    }
    
    // Serve the React app for all other routes
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// ==========================================
// GLOBAL ERROR HANDLING
// ==========================================

// Global error handler (must be last)
app.use(errorMiddleware);

// ==========================================
// START SERVER WITH WEBSOCKETS
// ==========================================

const PORT = process.env.PORT || 5002;

// Create HTTP server with optimizations for Render
const server = createServer(app);

// HTTP server optimizations for Render.com (per Render docs)
server.timeout = 0; // Disable server timeout, let Render handle it (100min max)
server.keepAliveTimeout = 61000; // Shorter than Render's 60s timeout to force reconnect
server.headersTimeout = 62000; // Slightly longer than keepAlive

// Additional Render Starter instance optimizations
server.maxConnections = 100; // Limit concurrent connections for Starter plan
server.maxRequestsPerSocket = 100; // Limit requests per connection

// Force immediate response transmission
server.on('request', (req, res) => {
  // Only set headers if not already sent
  if (req.url && req.url.includes('/auth/') && !res.headersSent) {
    try {
      res.setHeader('X-Accel-Buffering', 'no');  // Nginx
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } catch (err) {
      // Silently ignore if headers already sent
    }
  }
});
const io = new Server(server, {
  cors: corsOptions, // Use same CORS config
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Make io globally available
global.io = io;

// Import and initialize socket handlers
try {
  const { initializeCreatorSalesSockets } = require('./sockets/creatorSales.socket');
  const { initializeMemberActivitySockets } = require('./sockets/memberActivity.socket');
  const { initializeMessagingSockets } = require('./sockets/messaging.socket');

  // Initialize socket namespaces
  initializeCreatorSalesSockets(io);
  initializeMemberActivitySockets(io);
  initializeMessagingSockets(io);
  
  console.log('✅ WebSocket handlers initialized');
} catch (error) {
  console.warn('⚠️ WebSocket initialization error:', error.message);
  console.log('📝 WebSockets will be unavailable');
}

// Import and initialize scheduled jobs
try {
  const { initializeScheduledJobs } = require('./jobs');
  initializeScheduledJobs();
  console.log('✅ Scheduled jobs initialized');
} catch (error) {
  console.warn('⚠️ Scheduled jobs initialization error:', error.message);
}

// Start the server
server.listen(PORT, () => {
  console.log('========================================');
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 URL: ${process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : `http://localhost:${PORT}`}`);
  console.log(`💚 Health Check: /health`);
  console.log(`📡 API Base: /api/v1`);
  console.log(`🔌 Socket.io: Enabled with real-time messaging`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📱 Frontend: Serving PWA from /frontend/dist`);
  }
  console.log('========================================');
  console.log('⏱️ RENDER TIMEOUT CONFIGURATION:');
  console.log(`   server.timeout: ${server.timeout}ms (0 = disabled)`);
  console.log(`   server.keepAliveTimeout: ${server.keepAliveTimeout}ms`);
  console.log(`   server.headersTimeout: ${server.headersTimeout}ms`);
  console.log(`   server.maxConnections: ${server.maxConnections}`);
  console.log('   🎯 Optimized for Render Starter instance');
  console.log('========================================');
  console.log('📋 Available endpoints:');
  console.log('  Auth: /api/v1/auth');
  console.log('  Creator: /api/v1/creator');
  console.log('  Members: /api/v1/members');
  console.log('  Creator Sales: /api/v1/creator/sales');
  console.log('  Member Profiles: /api/v1/creator/members');
  console.log('  Privacy: /api/v1/member/privacy');
  console.log('========================================');
});

// ==========================================
// GRACEFUL SHUTDOWN HANDLERS
// ==========================================

// Duplicate handlers removed - using more detailed versions below

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('🔥 UNHANDLED PROMISE REJECTION!');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    console.log('💥 Shutting down due to unhandled promise rejection...');
    server.close(() => {
      process.exit(1);
    });
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🔥 UNCAUGHT EXCEPTION!');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    console.log('💥 Shutting down due to uncaught exception...');
    process.exit(1);
  } else {
    console.log('🔄 Continuing in production mode - double header error handled...');
  }
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Process terminated');
    });
  });
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('📴 SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Process terminated');
    });
  });
});

module.exports = app;