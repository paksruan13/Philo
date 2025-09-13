const serverless = require('serverless-http');
const express = require('express');
const compression = require('compression');

// Import configurations
const corsConfig = require('./src/middleware/cors');
const { prisma } = require('./src/config/lambdaDatabase');

// Import security middleware
const securityHeaders = require('./src/middleware/security');
const { apiLimiter } = require('./src/middleware/rateLimiting');
const { createSecureBodyParsers, requestTimeout, preventParameterPollution } = require('./src/middleware/requestSecurity');
const { sanitizeInput } = require('./src/middleware/validation');
const { 
  securityLogger, 
  createErrorHandler, 
  addRequestId, 
  addSecurityLogging, 
  createAttackDetector 
} = require('./src/middleware/securityLogging');

// Import routes
const routes = require('./src/routes');

const app = express();

// Enable trust proxy for Lambda/API Gateway
app.set('trust proxy', true);

// Apply CORS configuration
app.use(corsConfig);

// Compression
app.use(compression());

// Security headers
app.use(securityHeaders);

// Request parsing and security
const { json: jsonParser, urlencoded: urlencodedParser } = createSecureBodyParsers();
app.use(jsonParser);
app.use(urlencodedParser);

// Request timeout (shorter for Lambda)
app.use(requestTimeout(25000)); // 25 seconds for Lambda

// Rate limiting (Redis may not be available in all Lambda scenarios)
if (process.env.REDIS_URL) {
  app.use(apiLimiter);
}

// Security middleware
app.use(addRequestId);
app.use(addSecurityLogging(securityLogger));
app.use(preventParameterPollution);
app.use(sanitizeInput);
app.use(createAttackDetector(securityLogger));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Quick database connectivity test
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      database: 'connected',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    console.error('❌ Health check failed:', error);
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

// Export the handler for Lambda
module.exports.handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream']
});

// Scheduled leaderboard update function
module.exports.updateLeaderboard = async (event, context) => {
  console.log('🏆 Starting scheduled leaderboard update...');
  
  try {
    const { calculateLeaderboard } = require('./src/services/lambdaLeaderboardService');
    const { prisma } = require('./src/config/lambdaDatabase');
    
    // Calculate new leaderboard
    const leaderboard = await calculateLeaderboard();
    
    // Store snapshot with timestamp
    await prisma.leaderboardSnapshot.create({
      data: {
        rankings: leaderboard,
        calculatedAt: new Date(),
        period: 'daily'
      }
    });
    
    console.log(`✅ Leaderboard updated successfully with ${leaderboard.length} teams`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Leaderboard updated successfully',
        teamsUpdated: leaderboard.length,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    console.error('❌ Failed to update leaderboard:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
};

// For local testing, also export the app
module.exports.app = app;