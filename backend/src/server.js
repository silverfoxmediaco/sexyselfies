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

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');
const { requestLogger } = require('./middleware/logging.middleware');

const app = express();

// Trust proxy - important for deployment behind reverse proxies
app.set('trust proxy', 1);

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
      
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      console.log(`Database Name: ${conn.connection.name}`);
      
      // Reset retry counter on successful connection
      connectionRetries = 0;
      
      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(attemptConnection, retryDelay);
      });
      
      return true;
    } catch (error) {
      console.error(`MongoDB connection attempt ${connectionRetries + 1} failed:`, error.message);
      connectionRetries++;
      
      if (connectionRetries >= maxRetries) {
        console.error('Max MongoDB connection retries reached. Server will continue but database operations will fail.');
        return false;
      }
      
      console.log(`Retrying MongoDB connection in ${retryDelay / 1000} seconds...`);
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
  console.log('🔍 MongoDB connection state:', mongoose.connection.readyState);
  console.log('🔍 Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting');
  
  if (mongoose.connection.readyState !== 1) {
    console.log('❌ DATABASE CHECK FAILED - Connection not ready');
    return res.status(503).json({
      success: false,
      error: 'Database service temporarily unavailable. Please try again later.',
      code: 'DB_UNAVAILABLE'
    });
  }
  
  console.log('✅ DATABASE CHECK PASSED - proceeding to next middleware');
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
    if (process.env.NODE_ENV === 'production' && !origin) {
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://sexyselfies-frontend.onrender.com',
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      process.env.MOBILE_URL
    ].filter(Boolean);
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
  max: 5,
  message: 'Too many authentication attempts, please try again later.',
  skipSuccessfulRequests: true,
});

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many uploads, please try again later.',
});

// Apply rate limiting
app.use('/api/', defaultLimiter);
app.use('/api/v1/auth/register', authLimiter);
app.use('/api/v1/auth/login', authLimiter);
app.use('/api/v1/auth/creator/register', authLimiter);
app.use('/api/v1/upload/', uploadLimiter);

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

// Compression middleware
app.use(compression());

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

// Emergency debug middleware - log ALL requests
app.use((req, res, next) => {
  console.log('🚨 EMERGENCY DEBUG - Incoming request:');
  console.log('Method:', req.method);
  console.log('URL:', req.url);
  console.log('Original URL:', req.originalUrl);
  console.log('Body:', req.body);
  console.log('Headers:', req.headers);
  console.log('Timestamp:', new Date().toISOString());
  next();
});

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

// Apply database check to critical auth routes
console.log('🔧 Adding database connection checks...');
app.use(`${API_V1}/auth/register`, checkDatabaseConnection);
app.use(`${API_V1}/auth/login`, checkDatabaseConnection);
app.use(`${API_V1}/auth/creator/register`, checkDatabaseConnection);
app.use(`${API_V1}/auth/creator/login`, checkDatabaseConnection);
console.log('✅ Database connection checks added');

// Mount routes with API versioning
console.log('🚀 MOUNTING AUTH ROUTES at:', `${API_V1}/auth`);
app.use(`${API_V1}/auth`, authRoutes);
console.log('✅ Auth routes mounted successfully');

console.log('🚀 MOUNTING CREATOR ROUTES at:', `${API_V1}/creators`);
app.use(`${API_V1}/creators`, creatorRoutes);

console.log('🚀 MOUNTING MEMBER ROUTES at:', `${API_V1}/members`);
app.use(`${API_V1}/members`, memberRoutes);
app.use(`${API_V1}/content`, contentRoutes);
app.use(`${API_V1}/connections`, connectionRoutes);
app.use(`${API_V1}/transactions`, transactionRoutes);
app.use(`${API_V1}/upload`, uploadRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
app.use(`${API_V1}/notifications`, notificationRoutes);
app.use(`${API_V1}/verification`, verificationRoutes);
app.use(`${API_V1}/payments`, paymentRoutes);
app.use(`${API_V1}/public`, publicRoutes);
app.use(`${API_V1}/payouts`, payoutRoutes);

// Development-only seeding endpoint
if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
  app.post(`${API_V1}/dev/seed-data`, async (req, res) => {
    try {
      console.log('Seeding endpoint called...');
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

// Webhook routes (no versioning, raw body)
app.use('/webhooks', require('./routes/webhook.routes'));

// ==========================================
// SERVE FRONTEND IN PRODUCTION
// ==========================================

// Serve frontend static files in production
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '..', '..', 'frontend', 'dist');
  
  console.log('Serving frontend from:', frontendBuildPath);
  
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
  
  app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'manifest.json'));
  });
  
  app.get('/service-worker.js', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'service-worker.js'));
  });
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/webhooks/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
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
// START SERVER
// ==========================================

const PORT = process.env.PORT || 5002;

// Create HTTP server and initialize Socket.io
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      if (process.env.NODE_ENV === 'production' && !origin) {
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:5174', 
        'http://localhost:3000',
        process.env.CLIENT_URL,
        process.env.ADMIN_URL,
        process.env.MOBILE_URL
      ].filter(Boolean);
      
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Import and initialize socket handlers
const { initializeCreatorSalesSockets } = require('./sockets/creatorSales.socket');
const { initializeMemberActivitySockets } = require('./sockets/memberActivity.socket');
const { initializeMessagingSockets } = require('./sockets/messaging.socket');

// Initialize socket namespaces
initializeCreatorSalesSockets(io);
initializeMemberActivitySockets(io);
initializeMessagingSockets(io);

server.listen(PORT, () => {
  console.log('========================================');
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode`);
  console.log(`Port: ${PORT}`);
  console.log(`URL: ${process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : `http://localhost:${PORT}`}`);
  console.log(`Health Check: /health`);
  console.log(`API Base: /api/v1`);
  console.log(`Socket.io: Enabled with real-time messaging`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Frontend: Serving from /frontend/dist`);
  }
  console.log('========================================');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Graceful shutdown on SIGTERM
process.on('SIGTERM', () => {
  console.log('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Process terminated');
    });
  });
});

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', () => {
  console.log('SIGINT RECEIVED. Shutting down gracefully');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('Process terminated');
    });
  });
});

module.exports = app;