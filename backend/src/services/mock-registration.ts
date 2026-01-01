/**
 * Mock Registration Service
 * Use this when database is not available for testing
 */

interface MockUser {
  id: string;
  email?: string;
  phoneNumber?: string;
  passwordHash: string;
  authProvider: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  roles: string[];
  createdAt: Date;
}

// In-memory storage for testing
const mockUsers: MockUser[] = [];

export class MockRegistrationService {
  static async registerWithEmail(email: string, password: string): Promise<MockUser> {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.email === email.toLowerCase());
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create mock user
    const user: MockUser = {
      id: `mock-${Date.now()}`,
      email: email.toLowerCase(),
      passwordHash: `hashed-${password}`, // Mock hash
      authProvider: 'EMAIL',
      emailVerified: false,
      phoneVerified: false,
      roles: ['BUYER'],
      createdAt: new Date()
    };
    
    mockUsers.push(user);
    console.log('✅ Mock user created:', user.id);
    return user;
  }
  
  static async registerWithPhone(phoneNumber: string, password: string): Promise<MockUser> {
    // Check if user already exists
    const existingUser = mockUsers.find(u => u.phoneNumber === phoneNumber);
    if (existingUser) {
      throw new Error('User already exists');
    }
    
    // Create mock user
    const user: MockUser = {
      id: `mock-${Date.now()}`,
      phoneNumber,
      passwordHash: `hashed-${password}`, // Mock hash
      authProvider: 'PHONE',
      emailVerified: false,
      phoneVerified: false,
      roles: ['BUYER'],
      createdAt: new Date()
    };
    
    mockUsers.push(user);
    console.log('✅ Mock user created:', user.id);
    return user;
  }
  
  static getAllUsers(): MockUser[] {
    return mockUsers;
  }
  
  static clearAllUsers(): void {
    mockUsers.length = 0;
    console.log('🗑️ All mock users cleared');
  }
}

export default MockRegistrationService;