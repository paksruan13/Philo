const { PrismaClient } = require('@prisma/client');


const createSecurePrismaClient = () => {
  const prismaOptions = {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'], 
  };

  const prisma = new PrismaClient(prismaOptions);

  
  if (process.env.ENABLE_QUERY_MONITORING === 'true') {
    prisma.$on('query', (e) => {
      if (e.duration > 2000) { 
        console.warn(`Slow query detected: ${e.duration}ms`);
      }
    });
  }

  return prisma;
};


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


const gracefulShutdown = async (prismaClient) => {
  try {
    await prismaClient.$disconnect();
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