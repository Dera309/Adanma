import { Request, Response } from 'express';
import { login } from '../auth';
import prisma from '../../config/database';
import { comparePassword } from '../../utils/password';
import { generateTokenPair } from '../../utils/jwt';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    session: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../utils/password');
jest.mock('../../utils/jwt');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
}));

describe('Login Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    cookieMock = jest.fn();

    mockRequest = {
      body: {},
      headers: { 'user-agent': 'Test Agent' },
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' } as any,
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      cookie: cookieMock,
    };

    jest.clearAllMocks();
  });

  it('should successfully login with valid email and password', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      isActive: true,
    };

    const mockTokens = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    const mockSession = {
      id: 'session-123',
      userId: 'user-123',
      token: 'refresh-token',
      deviceInfo: 'Test Agent',
      ipAddress: '127.0.0.1',
      expiresAt: new Date(),
      lastActivityAt: new Date(),
    };

    mockRequest.body = {
      identifier: 'test@example.com',
      password: 'Password123!',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (comparePassword as jest.Mock).mockResolvedValue(true);
    (generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
    (prisma.session.create as jest.Mock).mockResolvedValue(mockSession);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    await login(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: 'test@example.com' },
          { phoneNumber: 'test@example.com' },
        ],
        isActive: true,
      },
    });
    expect(comparePassword).toHaveBeenCalledWith('Password123!', 'hashed-password');
    expect(generateTokenPair).toHaveBeenCalled();
    expect(prisma.session.create).toHaveBeenCalled();
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { lastLoginAt: expect.any(Date) },
    });
    expect(cookieMock).toHaveBeenCalledTimes(2);
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should reject login with invalid credentials', async () => {
    mockRequest.body = {
      identifier: 'test@example.com',
      password: 'WrongPassword',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await login(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'Invalid credentials',
      },
    });
  });

  it('should reject login for unverified email', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: false,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      isActive: true,
    };

    mockRequest.body = {
      identifier: 'test@example.com',
      password: 'Password123!',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (comparePassword as jest.Mock).mockResolvedValue(true);

    await login(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Please verify your email address before logging in',
      },
    });
  });

  it('should reject login for social auth users without password', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: null,
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'FACEBOOK',
      createdAt: new Date(),
      isActive: true,
    };

    mockRequest.body = {
      identifier: 'test@example.com',
      password: 'Password123!',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    await login(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'This account was created with social login. Please use the appropriate social login method.',
      },
    });
  });
});
