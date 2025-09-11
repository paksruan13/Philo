const helmet = require('helmet');

// Production-ready security headers configuration
const securityHeaders = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", // Allow inline styles for Tailwind
        "https://fonts.googleapis.com",
        "https://cdn.jsdelivr.net"
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for development
        "https://js.stripe.com",
        "https://cdn.jsdelivr.net"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "https://cdn.jsdelivr.net"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
        "*.amazonaws.com" // S3 bucket images
      ],
      connectSrc: [
        "'self'",
        "https://api.stripe.com",
        "wss://localhost:*", // WebSocket connections
        "ws://localhost:*"
      ],
      frameSrc: [
        "https://js.stripe.com",
        "https://hooks.stripe.com"
      ],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  
  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  
  // Hide X-Powered-By header
  hidePoweredBy: true,
  
  // Prevent MIME type sniffing
  noSniff: true,
  
  // XSS Protection
  xssFilter: true,
  
  // Referrer Policy
  referrerPolicy: { policy: 'same-origin' },
  
  // Permissions Policy (Feature Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: ['self'],
  }
});

module.exports = securityHeaders;
