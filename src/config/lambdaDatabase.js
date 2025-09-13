const { PrismaClient } = require('@prisma/client');

// Global variable to cache the Prisma client across Lambda invocations
let cachedPrisma = null;

// Enhanced Prisma configuration optimized for Lambda
const createLambdaPrismaClient = () => {
  const prismaOptions = {
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['warn', 'error'],
    
    // Optimize for Lambda cold starts
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

  // Add connection pooling configuration if using Prisma with connection pooling
  if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('pgbouncer')) {
    prismaOptions.datasources.db.url = process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1';
  }

  const prisma = new PrismaClient(prismaOptions);

  // Query monitoring for performance
  if (process.env.ENABLE_QUERY_MONITORING === 'true') {
    prisma.$on('query', (e) => {
      if (e.duration > 1000) { // Log slow queries (>1s for Lambda)
        console.warn(`⚠️ Slow query in Lambda: ${e.duration}ms`);
      }
    });
  }

  return prisma;
};

// Get or create Prisma client (Lambda-optimized with caching)
const getPrismaClient = () => {
  // Return cached client if available
  if (cachedPrisma) {
    return cachedPrisma;
  }

  console.log('🔗 Creating new Prisma client for Lambda...');
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
    console.error('❌ Database health check failed:', error);
    return { 
      status: 'unhealthy', 
      error: error.message,
      timestamp: new Date().toISOString() 
    };
  }
};

// Lambda-optimized cleanup (don't disconnect, just return)
const lambdaCleanup = async () => {
  // In Lambda, we don't want to disconnect since the container might be reused
  console.log('♻️ Lambda cleanup - keeping connection for reuse');
  return;
};

// Graceful shutdown (for non-Lambda environments)
const gracefulShutdown = async (prismaClient = null) => {
  const client = prismaClient || cachedPrisma;
  if (!client) return;

  console.log('🛑 Initiating graceful database shutdown...');
  try {
    await client.$disconnect();
    cachedPrisma = null; // Clear cache
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error during database disconnect:', error);
    process.exit(1);
  }
};

// Export the Lambda-optimized client
const prisma = getPrismaClient();

module.exports = { 
  prisma, 
  getPrismaClient,
  checkDatabaseHealth,
  gracefulShutdown,
  lambdaCleanup
};