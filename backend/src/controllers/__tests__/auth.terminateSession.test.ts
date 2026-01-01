import { Request, Response } from 'express';
import { terminateSession } from '../auth';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    session: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Terminate Session Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      params: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  it('should successfully terminate a session belonging to the user', async () => {
    const userId = 'user-123';
    const sessionId = 'session-456';
    const mockSession = {
      id: sessionId,
      userId: userId,
      token: 'refresh-token',
      deviceInfo: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      expiresAt: new Date(),
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { sessionId };

    (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
    (prisma.session.delete as jest.Mock).mockResolvedValue(mockSession);

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: sessionId },
    });

    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: sessionId },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Session terminated successfully',
    });
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;
    mockRequest.params = { sessionId: 'session-456' };

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findUnique).not.toHaveBeenCalled();
    expect(prisma.session.delete).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required',
      },
    });
  });

  it('should reject request without session ID', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.params = {};

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findUnique).not.toHaveBeenCalled();
    expect(prisma.session.delete).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Session ID is required',
      },
    });
  });

  it('should return 404 when session does not exist', async () => {
    const userId = 'user-123';
    const sessionId = 'non-existent-session';

    (mockRequest as any).user = { userId };
    mockRequest.params = { sessionId };

    (prisma.session.findUnique as jest.Mock).mockResolvedValue(null);

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: sessionId },
    });

    expect(prisma.session.delete).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Session not found',
      },
    });
  });

  it('should reject termination of session belonging to another user', async () => {
    const userId = 'user-123';
    const otherUserId = 'user-456';
    const sessionId = 'session-789';
    const mockSession = {
      id: sessionId,
      userId: otherUserId, // Different user
      token: 'refresh-token',
      deviceInfo: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      expiresAt: new Date(),
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { sessionId };

    (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findUnique).toHaveBeenCalledWith({
      where: { id: sessionId },
    });

    expect(prisma.session.delete).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to terminate this session',
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'user-123';
    const sessionId = 'session-456';

    (mockRequest as any).user = { userId };
    mockRequest.params = { sessionId };

    (prisma.session.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Terminate session error:', expect.any(Error));
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

  it('should handle deletion errors gracefully', async () => {
    const userId = 'user-123';
    const sessionId = 'session-456';
    const mockSession = {
      id: sessionId,
      userId: userId,
      token: 'refresh-token',
      deviceInfo: 'Chrome on Windows',
      ipAddress: '192.168.1.1',
      expiresAt: new Date(),
      createdAt: new Date(),
      lastActivityAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { sessionId };

    (prisma.session.findUnique as jest.Mock).mockResolvedValue(mockSession);
    (prisma.session.delete as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await terminateSession(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Terminate session error:', expect.any(Error));
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
