import { Request, Response } from 'express';
import { getUserProfile } from '../users';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Get User Profile Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {};

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  it('should return user profile with addresses', async () => {
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      phoneNumber: '+2348012345678',
      roles: ['BUYER', 'VENDOR'],
      emailVerified: true,
      phoneVerified: true,
      verificationStatus: 'VERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-02T10:00:00Z'),
      lastLoginAt: new Date('2024-01-03T10:00:00Z'),
      isActive: true,
      addresses: [
        {
          id: 'addr-1',
          userId: userId,
          country: 'NIGERIA',
          region: 'Lagos',
          subRegion: 'Ikeja',
          city: 'Ikeja',
          district: null,
          streetAddress: '123 Primary Street',
          postalCode: '100001',
          isPrimary: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'addr-2',
          userId: userId,
          country: 'NIGERIA',
          region: 'Lagos',
          subRegion: 'Victoria Island',
          city: 'Lagos',
          district: null,
          streetAddress: '456 Secondary Street',
          postalCode: '100002',
          isPrimary: false,
          createdAt: new Date('2024-01-02T10:00:00Z'),
          updatedAt: new Date('2024-01-02T10:00:00Z'),
        },
      ],
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        roles: true,
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isActive: true,
        addresses: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' },
          ],
        },
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        user: mockUser,
      },
    });
  });

  it('should return user profile without addresses', async () => {
    const userId = 'user-456';
    const mockUser = {
      id: userId,
      email: 'noaddress@example.com',
      phoneNumber: null,
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: new Date('2024-01-01T10:00:00Z'),
      isActive: true,
      addresses: [], // No addresses
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        user: mockUser,
      },
    });
  });

  it('should return profile for social auth user', async () => {
    const userId = 'user-social';
    const mockUser = {
      id: userId,
      email: 'social@example.com',
      phoneNumber: null,
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'FACEBOOK',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: new Date('2024-01-01T10:00:00Z'),
      isActive: true,
      addresses: [],
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        user: mockUser,
      },
    });
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required',
      },
    });
  });

  it('should reject request for non-existent user', async () => {
    const userId = 'non-existent-user';

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'User not found',
      },
    });
  });

  it('should reject request for inactive user', async () => {
    const userId = 'user-inactive';
    const mockUser = {
      id: userId,
      email: 'inactive@example.com',
      phoneNumber: null,
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: new Date('2024-01-01T10:00:00Z'),
      isActive: false, // Inactive user
      addresses: [],
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'User not found',
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Get user profile error:', expect.any(Error));
    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error',
      },
    });

    consoleErrorSpy.mockRestore();
  });

  it('should exclude sensitive fields from response', async () => {
    const userId = 'user-security';
    const mockUser = {
      id: userId,
      email: 'secure@example.com',
      phoneNumber: '+2348012345678',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: true,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: new Date('2024-01-01T10:00:00Z'),
      isActive: true,
      addresses: [],
      // Note: passwordHash should NOT be included in the select
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    // Verify that the select statement excludes passwordHash
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: expect.not.objectContaining({
        passwordHash: expect.anything(),
      }),
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        user: mockUser,
      },
    });

    // Verify response doesn't contain passwordHash
    const responseData = jsonMock.mock.calls[0][0];
    expect(responseData.data.user).not.toHaveProperty('passwordHash');
  });

  it('should return addresses in correct order (primary first, then by creation date)', async () => {
    const userId = 'user-ordered';
    const mockUser = {
      id: userId,
      email: 'ordered@example.com',
      phoneNumber: null,
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: new Date('2024-01-01T10:00:00Z'),
      isActive: true,
      addresses: [
        {
          id: 'addr-primary',
          isPrimary: true,
          createdAt: new Date('2024-01-01T10:00:00Z'),
        },
        {
          id: 'addr-newer',
          isPrimary: false,
          createdAt: new Date('2024-01-03T10:00:00Z'),
        },
        {
          id: 'addr-older',
          isPrimary: false,
          createdAt: new Date('2024-01-02T10:00:00Z'),
        },
      ],
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    // Verify the ordering parameters were passed correctly
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
      select: expect.objectContaining({
        addresses: {
          orderBy: [
            { isPrimary: 'desc' }, // Primary addresses first
            { createdAt: 'desc' },  // Then by creation date (newest first)
          ],
        },
      }),
    });

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should handle user with different verification statuses', async () => {
    const userId = 'user-pending';
    const mockUser = {
      id: userId,
      email: 'pending@example.com',
      phoneNumber: '+2348012345678',
      roles: ['VENDOR'],
      emailVerified: true,
      phoneVerified: true,
      verificationStatus: 'PENDING', // Vendor verification pending
      authProvider: 'EMAIL',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      updatedAt: new Date('2024-01-01T10:00:00Z'),
      lastLoginAt: new Date('2024-01-01T10:00:00Z'),
      isActive: true,
      addresses: [],
    };

    (mockRequest as any).user = { userId };
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await getUserProfile(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        user: mockUser,
      },
    });
  });
});