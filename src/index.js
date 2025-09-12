require('dotenv').config();
const express = require('express');
const http = require('http');
const compression = require('compression');

// Import configurations
const { configureSocket } = require('./config/socket');
const corsConfig = require('./middleware/cors');
const { prisma } = require('./config/database');

// Import security middleware
const securityHeaders = require('./middleware/security');
const { apiLimiter } = require('./middleware/rateLimiting');
const { createSecureBodyParsers, requestTimeout, preventParameterPollution } = require('./middleware/requestSecurity');
const { sanitizeInput } = require('./middleware/validation');
const { 
  securityLogger, 
  createErrorHandler, 
  addRequestId, 
  addSecurityLogging, 
  createAttackDetector 
} = require('./middleware/securityLogging');

// Import routes
const routes = require('./routes');
const announcementRoutes = require('./routes/announcements');
const coachRoutes = require('./routes/coach');

const app = express();
const port = process.env.PORT || 4243;
const server = http.createServer(app);

// Configure Socket.IO
const io = configureSocket(server);
app.set('io', io); // Make io available to routes

// Trust proxy (important for rate limiting behind load balancer)
app.set('trust proxy', 1);

// Request tracking and security logging
app.use(addRequestId);
app.use(addSecurityLogging(securityLogger));

// Core security middleware (applied first)
app.use(securityHeaders);
app.use(compression()); // Compress responses
app.use(requestTimeout(30000)); // 30 second timeout
app.use(corsConfig);

// Rate limiting (before body parsing to prevent large payload attacks)
app.use('/api/', apiLimiter);

// Secure body parsers with size limits
const bodyParsers = createSecureBodyParsers();
app.use(bodyParsers.json);
app.use(bodyParsers.urlencoded);

// Additional security middleware (after body parsing)
app.use(preventParameterPollution);
app.use(sanitizeInput);
app.use(createAttackDetector(securityLogger));

//Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      service: 'Project Phi API'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected'
    });
  }
});

// Routes
app.use('/api', routes);

// Security error handler (must be last middleware)
app.use(createErrorHandler(securityLogger));

server.listen(port, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🌐 API endpoint: http://localhost:${port}/api`);
  
  // Wait a moment for database to be fully ready, then create test admin
  setTimeout(async () => {
    try {
      const createTestAdmin = require('../scripts/create-test-admin');
      await createTestAdmin();
      console.log('✅ Test admin account verified/created for App Store review');
    } catch (error) {
      console.error('❌ Failed to create test admin account:', error.message);
    }
  }, 5000); // Wait 5 seconds for database to be ready
  
  // Run security audit on startup
  if (process.env.NODE_ENV !== 'test') {
    const { EnvironmentSecurityAudit } = require('./utils/securityAudit');
    const audit = new EnvironmentSecurityAudit();
    audit.runAudit();
  }
});

// Graceful shutdown handlers
const { gracefulShutdown } = require('./config/database');

process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  await gracefulShutdown(prisma);
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  await gracefulShutdown(prisma);
  process.exit(0);
});

// Handle process exit to ensure database cleanup
process.on('beforeExit', async () => {
  console.log('📋 Process ending, cleaning up database connections...');
  await gracefulShutdown(prisma);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  securityLogger.logSecurityEvent('UNHANDLED_REJECTION', {
    reason: reason.toString(),
    stack: reason.stack
  });
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  securityLogger.logSecurityEvent('UNCAUGHT_EXCEPTION', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});