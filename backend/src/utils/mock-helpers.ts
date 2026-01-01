/**
 * Mock Data Helpers
 * Utilities for generating consistent mock data in development mode
 */

/**
 * Generate a valid MongoDB ObjectID for mock data
 * ObjectIDs are 24-character hex strings (12 bytes)
 */
export function generateMockObjectId(prefix = 'mock'): string {
  // Create a deterministic but unique ObjectID
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const random = Math.random().toString(16).substring(2, 18).padStart(16, '0');
  
  return (timestamp + random).substring(0, 24);
}

/**
 * Generate a consistent mock user ID
 */
export function generateMockUserId(): string {
  return generateMockObjectId('user');
}

/**
 * Generate a consistent mock session ID
 */
export function generateMockSessionId(): string {
  return generateMockObjectId('sess');
}

/**
 * Generate a consistent mock address ID
 */
export function generateMockAddressId(): string {
  return generateMockObjectId('addr');
}

/**
 * Get a fixed mock user ID for consistent testing
 */
export function getFixedMockUserId(): string {
  // Return a fixed ObjectID for consistent mock user across requests
  return '507f1f77bcf86cd799439011';
}

/**
 * Check if an ID looks like a mock ID (for debugging)
 */
export function isMockId(id: string): boolean {
  // Check if it's our fixed mock ID or follows our mock pattern
  return id === '507f1f77bcf86cd799439011' || /^[0-9a-f]{24}$/.test(id);
}