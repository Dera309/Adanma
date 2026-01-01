import { Request, Response } from 'express';
import { getUserAddresses } from '../users';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    address: {
      findMany: jest.fn(),
    },
  },
}));

describe('Get User Addresses Controller', () => {
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

  it('should return all addresses for authenticated user ordered correctly', async () => {
    const userId = 'user-123';
    const mockAddresses = [
      {
        id: 'addr-1',
        userId: userId,
        country: 'NIGERIA',
        region: 'Lagos',
        subRegion: 'Ikeja',
        city: 'Ikeja',
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
        streetAddress: '456 Secondary Street',
        postalCode: '100002',
        isPrimary: false,
        createdAt: new Date('2024-01-02T10:00:00Z'),
        updatedAt: new Date('2024-01-02T10:00:00Z'),
      },
      {
        id: 'addr-3',
        userId: userId,
        country: 'GHANA',
        region: 'Greater Accra',
        subRegion: 'Accra Metropolitan',
        city: 'Accra',
        streetAddress: '789 Third Street',
        postalCode: null,
        isPrimary: false,
        createdAt: new Date('2024-01-01T08:00:00Z'),
        updatedAt: new Date('2024-01-01T08:00:00Z'),
      },
    ];

    (mockRequest as any).user = { userId };
    (prisma.address.findMany as jest.Mock).mockResolvedValue(mockAddresses);

    await getUserAddresses(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: {
        userId: userId,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        addresses: mockAddresses,
        total: 3,
      },
    });
  });

  it('should return empty array when user has no addresses', async () => {
    const userId = 'user-456';

    (mockRequest as any).user = { userId };
    (prisma.address.findMany as jest.Mock).mockResolvedValue([]);

    await getUserAddresses(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: {
        userId: userId,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        addresses: [],
        total: 0,
      },
    });
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;

    await getUserAddresses(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findMany).not.toHaveBeenCalled();
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
    (prisma.address.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await getUserAddresses(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Get user addresses error:', expect.any(Error));
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

  it('should return addresses in correct order (primary first, then by creation date)', async () => {
    const userId = 'user-789';
    const mockAddresses = [
      {
        id: 'addr-primary',
        userId: userId,
        country: 'KENYA',
        region: 'Nairobi',
        subRegion: 'Westlands',
        city: 'Nairobi',
        streetAddress: '123 Primary Street',
        postalCode: '00100',
        isPrimary: true,
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-01T10:00:00Z'),
      },
      {
        id: 'addr-newer',
        userId: userId,
        country: 'KENYA',
        region: 'Nairobi',
        subRegion: 'Kilimani',
        city: 'Nairobi',
        streetAddress: '456 Newer Street',
        postalCode: '00200',
        isPrimary: false,
        createdAt: new Date('2024-01-03T10:00:00Z'),
        updatedAt: new Date('2024-01-03T10:00:00Z'),
      },
      {
        id: 'addr-older',
        userId: userId,
        country: 'KENYA',
        region: 'Nairobi',
        subRegion: 'Karen',
        city: 'Nairobi',
        streetAddress: '789 Older Street',
        postalCode: '00300',
        isPrimary: false,
        createdAt: new Date('2024-01-02T10:00:00Z'),
        updatedAt: new Date('2024-01-02T10:00:00Z'),
      },
    ];

    (mockRequest as any).user = { userId };
    (prisma.address.findMany as jest.Mock).mockResolvedValue(mockAddresses);

    await getUserAddresses(mockRequest as Request, mockResponse as Response);

    // Verify the ordering parameters were passed correctly
    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: {
        userId: userId,
      },
      orderBy: [
        { isPrimary: 'desc' }, // Primary addresses first
        { createdAt: 'desc' },  // Then by creation date (newest first)
      ],
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        addresses: mockAddresses,
        total: 3,
      },
    });
  });

  it('should only return addresses for the authenticated user', async () => {
    const userId = 'user-specific';

    (mockRequest as any).user = { userId };
    (prisma.address.findMany as jest.Mock).mockResolvedValue([]);

    await getUserAddresses(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: {
        userId: userId, // Should only query for this specific user
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    expect(statusMock).toHaveBeenCalledWith(200);
  });
});