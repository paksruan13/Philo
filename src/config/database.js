const { PrismaClient } = require('@prisma/client');

// Enhanced Prisma configuration with security settings
const createSecurePrismaClient = () => {
  const prismaOptions = {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'], // Reduced logging in production
  };

  const prisma = new PrismaClient(prismaOptions);

  // Query monitoring for performance and security
  if (process.env.ENABLE_QUERY_MONITORING === 'true') {
    prisma.$on('query', (e) => {
      if (e.duration > 2000) { // Log slow queries (>2s)
        console.warn(`Slow query detected: ${e.duration}ms`);
      }
    });
  }

  return prisma;
};

// Connection health check
const checkDatabaseHealth = async (prismaClient) => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error('Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString() 
    };
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (prismaClient) => {
  console.log('Initiating graceful database shutdown...');
  try {
    await prismaClient.$disconnect();
    console.log('Database disconnected successfully');
  } catch (error) {
    console.error('Error during database disconnect:', error);
    process.exit(1);
  }
};

const prisma = createSecurePrismaClient();

module.exports = { 
  prisma, 
  checkDatabaseHealth,
  gracefulShutdown 
};