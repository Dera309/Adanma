import { Request, Response } from 'express';
import { updateUserRole } from '../users';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
  body: jest.fn(() => ({
    isArray: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
  })),
}));

describe('Update User Role Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  it('should successfully update user roles to buyer', async () => {
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
    };

    const updatedUser = {
      id: userId,
      email: 'test@example.com',
      phoneNumber: null,
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER'] };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: userId },
    });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { roles: ['BUYER'] },
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
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'User roles updated successfully',
      data: {
        user: updatedUser,
      },
    });
  });

  it('should successfully update user roles to both buyer and vendor', async () => {
    const userId = 'user-456';
    const mockUser = {
      id: userId,
      email: 'vendor@example.com',
      phoneNumber: null,
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
    };

    const updatedUser = {
      ...mockUser,
      roles: ['BUYER', 'VENDOR'],
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER', 'VENDOR'] };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(updatedUser);

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { roles: ['BUYER', 'VENDOR'] },
      select: expect.any(Object),
    });

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should remove duplicate roles', async () => {
    const userId = 'user-789';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: true,
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER', 'BUYER', 'VENDOR'] };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { roles: ['BUYER', 'VENDOR'] }, // Duplicates removed
      select: expect.any(Object),
    });

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;
    mockRequest.body = { roles: ['BUYER'] };

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required',
      },
    });
  });

  it('should reject empty roles array', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: [] };

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Roles must be a non-empty array',
      },
    });
  });

  it('should reject non-array roles', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: 'BUYER' }; // String instead of array

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Roles must be a non-empty array',
      },
    });
  });

  it('should reject invalid role values', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER', 'ADMIN', 'SUPERUSER'] };

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_002',
        message: 'Invalid role values: ADMIN, SUPERUSER. Valid roles are: BUYER, VENDOR',
      },
    });
  });

  it('should reject request for non-existent user', async () => {
    const userId = 'non-existent-user';

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER'] };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();

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
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      isActive: false, // Inactive user
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER'] };

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'User not found',
      },
    });
  });

  it('should handle database errors', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = { roles: ['BUYER'] };

    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await updateUserRole(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Update user role error:', expect.any(Error));
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
});
