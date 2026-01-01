import dotenv from 'dotenv';
import app from '../index';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env.NODE_ENV = 'test';
process.env.SKIP_DB_CHECKS = 'true';
process.env.USE_MOCK_DATA = 'true';

// Export the app for testing
export default app;