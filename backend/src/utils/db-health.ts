import prisma from '../config/database';

/**
 * Check database connection health
 * @returns Promise<boolean> - true if connection is healthy
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  // Return true immediately in mock mode
  const skipDbChecks = process.env.SKIP_DB_CHECKS === 'true';
  const useMockData = process.env.USE_MOCK_DATA === 'true';

  if (skipDbChecks || useMockData) {
    console.log('🔧 Database checks skipped - Mock/Skip mode enabled');
    return true;
  }

  try {
    // Test database connection with a simple query
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error: any) {
    console.error('Database health check failed:', error);

    // Provide specific error messages for common database issues
    if (error.message?.includes('authentication failed') || error.message?.includes('password authentication failed')) {
      console.error('💡 SOLUTION: Check your database password in backend/.env');
      console.error('   Replace "password" with your actual password');
    } else if (error.message?.includes('connection refused') || error.message?.includes('ECONNREFUSED') || error.code === 'ENOTFOUND') {
      console.error('💡 POSSIBLE SOLUTIONS:');
      console.error('   1. Check your database host and port in backend/.env');
      console.error('   2. Make sure database server is running');
      console.error('   3. Check firewall settings');
      console.error('   4. Verify database name exists');
      console.error('   5. Check internet connectivity for MongoDB Atlas');
    } else if (error.message?.includes('does not exist')) {
      console.error('💡 SOLUTION: Database does not exist');
      console.error('   1. Create the database');
      console.error('   2. Or run: npm run db:push to create tables');
    }

    return false;
  }
}

/**
 * Initialize database connection
 * Attempts to connect to the database and verify the connection
 */
export async function initializeDatabase(): Promise<void> {
  // Check if we should skip database initialization in mock mode
  const skipDbChecks = process.env.SKIP_DB_CHECKS === 'true';
  const useMockData = process.env.USE_MOCK_DATA === 'true';
  
  console.log('🔧 Development Configuration:');
  console.log(`Development Mode: ${process.env.NODE_ENV === 'development'}`);
  console.log(`Skip DB Checks: ${skipDbChecks}`);
  console.log(`Use Mock Data: ${useMockData}`);
  
  if (skipDbChecks || useMockData) {
    console.log('🔧 Skipping database initialization - Mock mode enabled');
    console.log('✓ Server will run with mock data responses');
    return;
  }
  
  try {
    await prisma.$connect();
    console.log('✓ Database connection established successfully');
    
    // Verify connection with a simple query
    const isHealthy = await checkDatabaseHealth();
    if (!isHealthy) {
      console.log('⚠️ Database health check failed, but continuing in development mode');
      console.log('💡 Database operations will fall back to mock data when needed');
      return;
    }
    
    console.log('✓ Database health check passed');
    console.log('✓ Database connection is working properly');
  } catch (error) {
    console.error('❌ Failed to initialize database connection:', error);
    
    // In development mode, continue without database
    if (process.env.NODE_ENV === 'development') {
      console.log('⚠️ Continuing in development mode without database verification...');
      console.log('🚀 Server will start and use mock data when database is unavailable');
      return;
    } else {
      throw error;
    }
  }
}
