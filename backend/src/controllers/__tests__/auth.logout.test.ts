import { Request, Response } from 'express';
import { logout } from '../auth';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    session: {
      deleteMany: jest.fn(),
    },
  },
}));

describe('Logout Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let clearCookieMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));
    clearCookieMock = jest.fn();

    mockRequest = {
      cookies: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
      clearCookie: clearCookieMock,
    };

    jest.clearAllMocks();
  });

  it('should successfully logout and clear cookies', async () => {
    mockRequest.cookies = {
      refreshToken: 'valid-refresh-token',
    };

    (prisma.session.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await logout(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: {
        token: 'valid-refresh-token',
      },
    });

    expect(clearCookieMock).toHaveBeenCalledTimes(2);
    expect(clearCookieMock).toHaveBeenCalledWith('accessToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });
    expect(clearCookieMock).toHaveBeenCalledWith('refreshToken', {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Logout successful',
    });
  });

  it('should successfully logout even without refresh token', async () => {
    mockRequest.cookies = {};

    await logout(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.deleteMany).not.toHaveBeenCalled();
    expect(clearCookieMock).toHaveBeenCalledTimes(2);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Logout successful',
    });
  });

  it('should successfully logout even if session deletion fails', async () => {
    mockRequest.cookies = {
      refreshToken: 'valid-refresh-token',
    };

    (prisma.session.deleteMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await logout(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.deleteMany).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error invalidating session:', expect.any(Error));
    expect(clearCookieMock).toHaveBeenCalledTimes(2);
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Logout successful',
    });

    consoleErrorSpy.mockRestore();
  });

  it('should handle unexpected errors gracefully', async () => {
    mockRequest.cookies = {
      refreshToken: 'valid-refresh-token',
    };

    // Mock clearCookie to throw an error
    clearCookieMock.mockImplementation(() => {
      throw new Error('Cookie error');
    });

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await logout(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
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
