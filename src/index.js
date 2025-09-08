require('dotenv').config();
const express = require('express');
const http = require('http');

// Import configurations
const { configureSocket } = require('./config/socket');
const corsConfig = require('./middleware/cors');
const { prisma } = require('./config/database'); // Add this import

// Import routes
const routes = require('./routes');
const webhookRoutes = require('./routes/webhooks');
const announcementRoutes = require('./routes/announcements');
const coachRoutes = require('./routes/coach');

const app = express();
const port = process.env.PORT || 4243;
const server = http.createServer(app);

// Configure Socket.IO
const io = configureSocket(server);
app.set('io', io); // Make io available to routes

// Middleware
app.use(corsConfig);

// Special webhook route (needs raw body)
app.use('/webhook', webhookRoutes);

// JSON middleware for other routes
app.use(express.json());

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

server.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🌐 API endpoint: http://localhost:${port}/api`);
});

//Updated