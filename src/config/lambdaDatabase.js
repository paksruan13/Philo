const { PrismaClient } = require('@prisma/client');
let cachedPrisma = null;

const createLambdaPrismaClient = () => {
  const prismaOptions = {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
    
    // cold starts
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    
    // Configure connection pool for serverless
    // Reduce connection pool size for Lambda
    __internal: {
      engine: {
        enableDebugLogs: process.env.NODE_ENV === 'development',
        logLevel: process.env.NODE_ENV === 'development' ? 'info' : 'warn',
      },
    },
  };

  // Connection pooling configuration for Prisma with connection pooling
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pgbouncer')) {
    prismaOptions.datasources.db.url = process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1';
  }

  const prisma = new PrismaClient(prismaOptions);

  // Query monitoring for performance
  if (process.env.ENABLE_QUERY_MONITORING === 'true') {
    prisma.$on('query', (e) => {
      if (e.duration > 1000) { 
        console.warn(`Slow query in Lambda: ${e.duration}ms`);
      }
    });
  }

  return prisma;
};

const getPrismaClient = () => {
  if (cachedPrisma) {
    return cachedPrisma;
  }

  cachedPrisma = createLambdaPrismaClient();
  
  return cachedPrisma;
};

// Connection health check
const checkDatabaseHealth = async (prismaClient = null) => {
  const client = prismaClient || getPrismaClient();
  try {
    await client.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    console.error(' Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString() 
    };
  }
};

const lambdaCleanup = async () => {
  return;
};

const gracefulShutdown = async (prismaClient = null) => {
  const client = prismaClient || cachedPrisma;
  if (!client) return;

  try {
    await client.$disconnect();
    cachedPrisma = null; 
  } catch (error) {
    console.error(' Error during database disconnect:', error);
    process.exit(1);
  }
};

const prisma = getPrismaClient();

module.exports = { 
  prisma, 
  getPrismaClient,
  checkDatabaseHealth,
  gracefulShutdown,
  lambdaCleanup
};