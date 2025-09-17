const cors = require('cors');

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:3000',
      'https://sexyselfies-frontend.onrender.com',
      'https://sexyselfies-api.onrender.com',
      process.env.CLIENT_URL,
      process.env.ADMIN_URL,
      process.env.MOBILE_URL,
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
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
};

// Export configured CORS middleware
exports.corsMiddleware = cors(corsOptions);

// Export options for custom use
exports.corsOptions = corsOptions;

// Simple CORS for public endpoints
exports.publicCors = cors({
  origin: '*',
  methods: ['GET'],
  allowedHeaders: ['Content-Type'],
  maxAge: 86400, // 24 hours
});

// Strict CORS for admin endpoints
exports.adminCors = cors({
  origin: [process.env.ADMIN_URL, 'http://localhost:5175'].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-Total-Count', 'X-Admin-Token'],
});

// Handle preflight requests
exports.handlePreflight = (req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '3600');
    res.status(204).send();
  } else {
    next();
  }
};
