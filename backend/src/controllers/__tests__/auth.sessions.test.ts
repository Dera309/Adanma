import { Request, Response } from 'express';
import { getSessions } from '../auth';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    session: {
      findMany: jest.fn(),
    },
  },
}));

describe('Get Sessions Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      cookies: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  it('should return all active sessions for authenticated user', async () => {
    const userId = 'user-123';
    const mockSessions = [
      {
        id: 'session-1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastActivityAt: new Date('2024-01-01T10:00:00Z'),
        createdAt: new Date('2024-01-01T09:00:00Z'),
        expiresAt: new Date('2024-02-01T09:00:00Z'),
      },
      {
        id: 'session-2',
        deviceInfo: 'Safari on iPhone',
        ipAddress: '192.168.1.2',
        lastActivityAt: new Date('2024-01-01T08:00:00Z'),
        createdAt: new Date('2023-12-31T09:00:00Z'),
        expiresAt: new Date('2024-01-31T09:00:00Z'),
      },
    ];

    (mockRequest as any).user = { userId };
    mockRequest.cookies = { refreshToken: 'session-1' };

    (prisma.session.findMany as jest.Mock).mockResolvedValue(mockSessions);

    await getSessions(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-123',
        expiresAt: {
          gt: expect.any(Date),
        },
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActivityAt: true,
        createdAt: true,
        expiresAt: true,
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        sessions: [
          {
            ...mockSessions[0],
            isCurrent: true,
          },
          {
            ...mockSessions[1],
            isCurrent: false,
          },
        ],
        total: 2,
      },
    });
  });

  it('should return empty array when user has no active sessions', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    (prisma.session.findMany as jest.Mock).mockResolvedValue([]);

    await getSessions(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        sessions: [],
        total: 0,
      },
    });
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;

    await getSessions(mockRequest as Request, mockResponse as Response);

    expect(prisma.session.findMany).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required',
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    (prisma.session.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await getSessions(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Get sessions error:', expect.any(Error));
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

  it('should mark current session correctly when refresh token matches', async () => {
    const userId = 'user-123';
    const currentSessionId = 'session-current';
    const mockSessions = [
      {
        id: currentSessionId,
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastActivityAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    ];

    (mockRequest as any).user = { userId };
    mockRequest.cookies = { refreshToken: currentSessionId };

    (prisma.session.findMany as jest.Mock).mockResolvedValue(mockSessions);

    await getSessions(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        sessions: [
          {
            ...mockSessions[0],
            isCurrent: true,
          },
        ],
        total: 1,
      },
    });
  });

  it('should not mark any session as current when no refresh token in cookies', async () => {
    const userId = 'user-123';
    const mockSessions = [
      {
        id: 'session-1',
        deviceInfo: 'Chrome on Windows',
        ipAddress: '192.168.1.1',
        lastActivityAt: new Date(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
      },
    ];

    (mockRequest as any).user = { userId };
    mockRequest.cookies = {};

    (prisma.session.findMany as jest.Mock).mockResolvedValue(mockSessions);

    await getSessions(mockRequest as Request, mockResponse as Response);

    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        sessions: [
          {
            ...mockSessions[0],
            isCurrent: false,
          },
        ],
        total: 1,
      },
    });
  });
});
