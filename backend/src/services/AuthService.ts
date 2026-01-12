import { User, Session } from '../models/User';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export class AuthService {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, Session> = new Map();
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
  private readonly JWT_EXPIRES_IN = '30d';

  constructor() {
    // Initialize with test user
    this.createTestUser();
  }

  private createTestUser() {
    const testUser: User = {
      id: 'user_123',
      email: 'test@example.com',
      phoneNumber: '+234123456789',
      password: this.hashPassword('password123'),
      name: 'Test User',
      roles: ['buyer', 'admin'],
      isEmailVerified: true,
      isPhoneVerified: true,
      verificationStatus: 'verified',
      addresses: [],
      socialAccounts: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };
    this.users.set(testUser.id, testUser);
    this.users.set(testUser.email!, testUser);
    this.users.set(testUser.phoneNumber!, testUser);
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password + 'salt').digest('hex');
  }

  private verifyPassword(password: string, hashedPassword: string): boolean {
    return this.hashPassword(password) === hashedPassword;
  }

  async register(data: {
    email?: string;
    phoneNumber?: string;
    password: string;
    name: string;
    roles: string[];
  }): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const userId = uuidv4();
    const hashedPassword = this.hashPassword(data.password);

    const user: User = {
      id: userId,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: hashedPassword,
      name: data.name,
      roles: data.roles,
      isEmailVerified: false,
      isPhoneVerified: false,
      verificationStatus: 'unverified',
      addresses: [],
      socialAccounts: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true
    };

    this.users.set(userId, user);
    if (data.email) this.users.set(data.email, user);
    if (data.phoneNumber) this.users.set(data.phoneNumber, user);

    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.createSession(user.id, accessToken, refreshToken);

    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async login(identifier: string, password: string): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    console.log('Login attempt:', { identifier, password: password.substring(0, 3) + '***' });
    console.log('Available users:', Array.from(this.users.keys()));
    
    const user = this.users.get(identifier);
    console.log('Found user:', user ? 'Yes' : 'No');
    
    if (!user || !user.password) {
      console.log('User not found or no password');
      throw new Error('Invalid credentials');
    }

    const isValidPassword = this.verifyPassword(password, user.password);
    console.log('Password valid:', isValidPassword);
    console.log('Expected hash:', user.password);
    console.log('Provided hash:', this.hashPassword(password));
    
    if (!isValidPassword) {
      console.log('Password verification failed');
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    user.lastLoginAt = new Date();
    user.updatedAt = new Date();

    const { accessToken, refreshToken } = this.generateTokens(user);
    await this.createSession(user.id, accessToken, refreshToken);

    console.log('Login successful for:', identifier);
    return { user: this.sanitizeUser(user), accessToken, refreshToken };
  }

  async logout(token: string): Promise<void> {
    const session = Array.from(this.sessions.values()).find(s => s.token === token);
    if (session) {
      session.isActive = false;
      this.sessions.delete(session.id);
    }
  }

  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as any;
      const user = this.users.get(decoded.userId);
      return user ? this.sanitizeUser(user) : null;
    } catch {
      return null;
    }
  }

  async getUserProfile(userId: string): Promise<User | null> {
    const user = this.users.get(userId);
    return user ? this.sanitizeUser(user) : null;
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');

    Object.assign(user, updates, { updatedAt: new Date() });
    return this.sanitizeUser(user);
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, roles: user.roles },
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
      { userId: user.id, type: 'refresh' },
      this.JWT_SECRET,
      { expiresIn: '90d' }
    );

    return { accessToken, refreshToken };
  }

  private async createSession(userId: string, accessToken: string, refreshToken: string): Promise<Session> {
    const session: Session = {
      id: uuidv4(),
      userId,
      token: accessToken,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
      isActive: true
    };

    this.sessions.set(session.id, session);
    return session;
  }

  private sanitizeUser(user: User): User {
    const { password, ...sanitized } = user;
    return sanitized as User;
  }
}

export const authService = new AuthService();