import { Request, Response } from 'express';
import { requestPasswordReset } from '../auth';
import prisma from '../../config/database';
import { EmailService } from '../../services/email';
import { SMSService } from '../../services/sms';
import { PasswordResetService } from '../../services/verification';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findFirst: jest.fn(),
    },
  },
}));

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

describe('Password Reset Request Controller', () => {
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
      sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
    };

    mockSMSService = {
      sendPasswordResetCode: jest.fn().mockResolvedValue({ success: true }),
    };

    (EmailService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockEmailService);
    (SMSService.getInstance as jest.Mock) = jest.fn().mockReturnValue(mockSMSService);
    (PasswordResetService.storeResetToken as jest.Mock) = jest.fn();
    (PasswordResetService.storeResetCode as jest.Mock) = jest.fn();

    jest.clearAllMocks();
  });

  it('should send password reset email for email-based request', async () => {
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

    mockRequest.body = {
      identifier: 'test@example.com',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    await requestPasswordReset(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: 'test@example.com' },
          { phoneNumber: 'test@example.com' },
        ],
        isActive: true,
      },
    });

    expect(PasswordResetService.storeResetToken).toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'test@example.com',
      expect.stringContaining('/reset-password?token='),
      'test@example.com'
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'If an account exists with this email or phone number, you will receive password reset instructions.',
    });
  });

  it('should send password reset SMS for phone-based request', async () => {
    const mockUser = {
      id: 'user-456',
      email: null,
      phoneNumber: '+2348012345678',
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: false,
      phoneVerified: true,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'PHONE',
      createdAt: new Date(),
      isActive: true,
    };

    mockRequest.body = {
      identifier: '+2348012345678',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);

    await requestPasswordReset(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: {
        OR: [
          { email: '+2348012345678' },
          { phoneNumber: '+2348012345678' },
        ],
        isActive: true,
      },
    });

    expect(PasswordResetService.storeResetCode).toHaveBeenCalled();
    expect(mockSMSService.sendPasswordResetCode).toHaveBeenCalledWith(
      '+2348012345678',
      expect.any(String)
    );

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'If an account exists with this email or phone number, you will receive password reset instructions.',
    });
  });

  it('should return success even when user does not exist (prevent user enumeration)', async () => {
    mockRequest.body = {
      identifier: 'nonexistent@example.com',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

    await requestPasswordReset(mockRequest as Request, mockResponse as Response);

    expect(prisma.user.findFirst).toHaveBeenCalled();
    expect(PasswordResetService.storeResetToken).not.toHaveBeenCalled();
    expect(PasswordResetService.storeResetCode).not.toHaveBeenCalled();
    expect(mockEmailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    expect(mockSMSService.sendPasswordResetCode).not.toHaveBeenCalled();

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'If an account exists with this email or phone number, you will receive password reset instructions.',
    });
  });

  it('should handle email sending failure gracefully', async () => {
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

    mockRequest.body = {
      identifier: 'test@example.com',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    mockEmailService.sendPasswordResetEmail.mockResolvedValue({
      success: false,
      error: 'Email service unavailable',
    });

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await requestPasswordReset(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send password reset email:',
      'Email service unavailable'
    );

    // Should still return success to user
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'If an account exists with this email or phone number, you will receive password reset instructions.',
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle SMS sending failure gracefully', async () => {
    const mockUser = {
      id: 'user-456',
      email: null,
      phoneNumber: '+2348012345678',
      passwordHash: 'hashed-password',
      roles: ['BUYER'],
      emailVerified: false,
      phoneVerified: true,
      verificationStatus: 'UNVERIFIED',
      authProvider: 'PHONE',
      createdAt: new Date(),
      isActive: true,
    };

    mockRequest.body = {
      identifier: '+2348012345678',
    };

    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    mockSMSService.sendPasswordResetCode.mockResolvedValue({
      success: false,
      error: 'SMS service unavailable',
    });

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await requestPasswordReset(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to send password reset SMS:',
      'SMS service unavailable'
    );

    // Should still return success to user
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'If an account exists with this email or phone number, you will receive password reset instructions.',
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle database errors', async () => {
    mockRequest.body = {
      identifier: 'test@example.com',
    };

    (prisma.user.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await requestPasswordReset(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Password reset request error:', expect.any(Error));
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
