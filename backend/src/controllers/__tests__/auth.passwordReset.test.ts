import { Request, Response } from 'express';
import { resetPassword } from '../auth';
import prisma from '../../config/database';
import { hashPassword, comparePassword } from '../../utils/password';
import { EmailService } from '../../services/email';
import { SMSService } from '../../services/sms';
import { PasswordResetService } from '../../services/verification';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    passwordHistory: {
      create: jest.fn(),
    },
    session: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((operations) => Promise.all(operations)),
  },
}));

jest.mock('../../utils/password');
jest.mock('../../services/email');
jest.mock('../../services/sms');
jest.mock('../../services/verification');
jest.mock('express-validator', () => ({
  validationResult: jest.fn(() => ({
    isEmpty: () => true,
    array: () => [],
  })),
  body: jest.fn(() => ({
    isLength: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
  })),
}));

describe('Password Reset Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let mockEmailService: any;
  let mockSMSService: any;

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

    mockEmailService = {
      sendNotificationEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    mockSMSService = {
      sendSMS: jest.fn().mockResolvedValue({ success: true }),
    };

    (EmailService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockEmailService);
    (SMSService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockSMSService);
    (hashPassword as jest.Mock) = jest.fn().mockResolvedValue('new-hashed-password');
    (comparePassword as jest.Mock) = jest.fn().mockResolvedValue(false);

    jest.clearAllMocks();
  });

  it('should successfully reset password with valid token', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: '+2348012345678',
      passwordHash: 'old-hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: true,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      isActive: true,
      passwordHistory: [
        { id: '1', userId: 'user-123', passwordHash: 'old-hash-1', createdAt: new Date() },
        { id: '2', userId: 'user-123', passwordHash: 'old-hash-2', createdAt: new Date() },
      ],
    };

    mockRequest.body = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetToken as jest.Mock).mockReturnValue({
      isValid: true,
      userId: 'user-123',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockUser, {}, {}]);

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(PasswordResetService.consumeResetToken).toHaveBeenCalledWith('valid-reset-token');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      include: {
        passwordHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    expect(hashPassword).toHaveBeenCalledWith('NewPassword123!');
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockEmailService.sendNotificationEmail).toHaveBeenCalled();
    expect(mockSMSService.sendSMS).toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.',
    });
  });

  it('should successfully reset password with valid code', async () => {
    const mockUser = {
      id: 'user-456',
      email: null,
      phoneNumber: '+2348012345678',
      passwordHash: 'old-hashed-password',
      roles: ['BUYER'],
      emailVerified: false,
      phoneVerified: true,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'PHONE',
      createdAt: new Date(),
      isActive: true,
      passwordHistory: [],
    };

    mockRequest.body = {
      userId: 'user-456',
      code: '123456',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetCode as jest.Mock).mockReturnValue({
      isValid: true,
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockUser, {}, {}]);

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(PasswordResetService.consumeResetCode).toHaveBeenCalledWith('user-456', '123456');
    expect(prisma.user.findUnique).toHaveBeenCalled();
    expect(hashPassword).toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(mockSMSService.sendSMS).toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should reject invalid reset token', async () => {
    mockRequest.body = {
      token: 'invalid-token',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetToken as jest.Mock).mockReturnValue({
      isValid: false,
      error: 'Invalid or expired reset token',
    });

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(PasswordResetService.consumeResetToken).toHaveBeenCalledWith('invalid-token');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_005',
        message: 'Invalid or expired reset token',
      },
    });
  });

  it('should reject invalid reset code', async () => {
    mockRequest.body = {
      userId: 'user-456',
      code: 'wrong-code',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetCode as jest.Mock).mockReturnValue({
      isValid: false,
      error: 'Invalid reset code',
    });

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(PasswordResetService.consumeResetCode).toHaveBeenCalledWith('user-456', 'wrong-code');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_005',
        message: 'Invalid reset code',
      },
    });
  });

  it('should reject password that matches recent password', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: null,
      passwordHash: 'old-hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: false,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      isActive: true,
      passwordHistory: [
        { id: '1', userId: 'user-123', passwordHash: 'recent-hash', createdAt: new Date() },
      ],
    };

    mockRequest.body = {
      token: 'valid-reset-token',
      newPassword: 'OldPassword123!',
    };

    (PasswordResetService.consumeResetToken as jest.Mock).mockReturnValue({
      isValid: true,
      userId: 'user-123',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (comparePassword as jest.Mock).mockResolvedValue(true); // Password matches old password

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(comparePassword).toHaveBeenCalledWith('OldPassword123!', 'recent-hash');
    expect(prisma.$transaction).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_007',
        message: 'New password cannot be the same as any of your last 5 passwords',
      },
    });
  });

  it('should reject request without token or code', async () => {
    mockRequest.body = {
      newPassword: 'NewPassword123!',
    };

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Either reset token or user ID with verification code is required',
      },
    });
  });

  it('should reject request for non-existent user', async () => {
    mockRequest.body = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetToken as jest.Mock).mockReturnValue({
      isValid: true,
      userId: 'non-existent-user',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_001',
        message: 'User not found',
      },
    });
  });

  it('should handle notification sending failures gracefully', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      phoneNumber: '+2348012345678',
      passwordHash: 'old-hashed-password',
      roles: ['BUYER'],
      emailVerified: true,
      phoneVerified: true,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'EMAIL',
      createdAt: new Date(),
      isActive: true,
      passwordHistory: [],
    };

    mockRequest.body = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetToken as jest.Mock).mockReturnValue({
      isValid: true,
      userId: 'user-123',
    });

    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (prisma.$transaction as jest.Mock).mockResolvedValue([mockUser, {}, {}]);

    mockEmailService.sendNotificationEmail.mockResolvedValue({
      success: false,
      error: 'Email service unavailable',
    });

    mockSMSService.sendSMS.mockResolvedValue({
      success: false,
      error: 'SMS service unavailable',
    });

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send password change notification email:',
      'Email service unavailable'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send password change notification SMS:',
      'SMS service unavailable'
    );

    // Should still return success
    expect(statusMock).toHaveBeenCalledWith(200);

    consoleErrorSpy.mockRestore();
  });

  it('should handle database errors', async () => {
    mockRequest.body = {
      token: 'valid-reset-token',
      newPassword: 'NewPassword123!',
    };

    (PasswordResetService.consumeResetToken as jest.Mock).mockReturnValue({
      isValid: true,
      userId: 'user-123',
    });

    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await resetPassword(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Password reset error:', expect.any(Error));
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
