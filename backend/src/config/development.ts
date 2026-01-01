/**
 * Development mode configuration
 * Used when database is not available
 */

export const isDevelopmentMode = process.env.NODE_ENV === 'development';
export const skipDatabaseChecks = process.env.SKIP_DB_CHECKS === 'true';

/**
 * Mock database responses for development
 */
export const mockResponses = {
  users: [
    {
      id: 'dev-user-1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ],
  
  addresses: [
    {
      id: 'dev-addr-1',
      userId: 'dev-user-1',
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
      postalCode: '12345',
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]
};

/**
 * Check if we should use mock data
 */
export function shouldUseMockData(): boolean {
  // Only use mock data if explicitly enabled AND in development mode
  return process.env.USE_MOCK_DATA === 'true' && process.env.NODE_ENV === 'development';
}

console.log('🔧 Development Configuration:');
console.log(`   - Development Mode: ${isDevelopmentMode}`);
console.log(`   - Skip DB Checks: ${skipDatabaseChecks}`);
console.log(`   - Use Mock Data: ${shouldUseMockData()}`);