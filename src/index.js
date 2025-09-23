require('dotenv').config();
const express = require('express');
const http = require('http');
const compression = require('compression');


const { configureSocket } = require('./config/socket');
const corsConfig = require('./middleware/cors');
const { prisma } = require('./config/database');


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


const routes = require('./routes');
const announcementRoutes = require('./routes/announcements');
const coachRoutes = require('./routes/coach');

const app = express();
const port = process.env.PORT || 4243;
const server = http.createServer(app);


const io = configureSocket(server);
app.set('io', io); 


app.set('trust proxy', 1);


app.use(addRequestId);
app.use(addSecurityLogging(securityLogger));


app.use(securityHeaders);
app.use(compression()); 
app.use(requestTimeout(30000)); 
app.use(corsConfig);


app.use('/api/', apiLimiter);


const bodyParsers = createSecureBodyParsers();
app.use(bodyParsers.json);
app.use(bodyParsers.urlencoded);


app.use(preventParameterPollution);
app.use(sanitizeInput);
app.use(createAttackDetector(securityLogger));


app.get('/health', async (req, res) => {
  try {
    
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


app.use('/api', routes);


app.use(createErrorHandler(securityLogger));

server.listen(port, '0.0.0.0', async () => {
  
  
  setTimeout(async () => {
    try {
      const createTestAdmin = require('../scripts/create-test-admin');
      await createTestAdmin();
    } catch (error) {
      console.error(' Failed to create test admin account:', error.message);
    }
  }, 5000); 
  
  
  if (process.env.NODE_ENV !== 'test') {
    const { EnvironmentSecurityAudit } = require('./utils/securityAudit');
    const audit = new EnvironmentSecurityAudit();
    audit.runAudit();
  }
});


const { gracefulShutdown } = require('./config/database');

process.on('SIGTERM', async () => {
  await gracefulShutdown(prisma);
  process.exit(0);
});

process.on('SIGINT', async () => {
  await gracefulShutdown(prisma);
  process.exit(0);
});


process.on('beforeExit', async () => {
  await gracefulShutdown(prisma);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error(' Unhandled Rejection at:', promise, 'reason:', reason);
  securityLogger.logSecurityEvent('UNHANDLED_REJECTION', {
    reason: reason.toString(),
    stack: reason.stack
  });
});

process.on('uncaughtException', (error) => {
  console.error(' Uncaught Exception:', error);
  securityLogger.logSecurityEvent('UNCAUGHT_EXCEPTION', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});