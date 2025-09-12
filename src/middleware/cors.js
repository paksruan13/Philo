const cors = require('cors');

// Environment-based origin configuration
const getAllowedOrigins = () => {
  const baseOrigins = [];
  
  // Development origins (allow if NODE_ENV is not production)
  if (process.env.NODE_ENV !== 'production') {
    baseOrigins.push(
      'http://localhost:3000',
      'http://localhost:5173', 
      'http://localhost:5174',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174'
    );
  }
  
  // Production origins
  if (process.env.FRONTEND_URL) {
    baseOrigins.push(process.env.FRONTEND_URL);
  }
  
  // Add any additional allowed origins from environment
  if (process.env.ALLOWED_ORIGINS) {
    const additionalOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    baseOrigins.push(...additionalOrigins);
  }
  
  return baseOrigins;
};

const corsConfig = cors({
  origin: (origin, callback) => {
    const allowedOrigins = getAllowedOrigins();
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Content-Type", 
    "Authorization", 
    "stripe-signature",
    "X-Requested-With",
    "Accept",
    "Origin",
    "Cache-Control",
    "X-File-Name"
  ],
  exposedHeaders: [
    "Content-Range",
    "X-Content-Range",
    "X-Total-Count"
  ],
  maxAge: 86400, // 24 hours preflight cache
  optionsSuccessStatus: 200
});

module.exports = corsConfig;