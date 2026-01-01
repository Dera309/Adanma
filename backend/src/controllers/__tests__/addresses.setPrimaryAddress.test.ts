import { Request, Response } from 'express';
import { setPrimaryAddress } from '../addresses';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    address: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

describe('Set Primary Address Controller', () => {
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

  it('should successfully set an address as primary', async () => {
    const userId = 'user-123';
    const addressId = 'addr-123';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'NIGERIA',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      district: null,
      streetAddress: '123 Main Street',
      postalCode: '100001',
      isPrimary: false, // Currently not primary
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAddress = {
      ...existingAddress,
      isPrimary: true, // Now primary
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { count: 2 }, // updateMany result
      updatedAddress // update result
    ]);

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        // updateMany operation to set all addresses to non-primary
      }),
      expect.objectContaining({
        // update operation to set this address as primary
      })
    ]);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address set as primary successfully',
      data: {
        address: updatedAddress,
      },
    });
  });

  it('should return success when address is already primary', async () => {
    const userId = 'user-456';
    const addressId = 'addr-456';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'KENYA',
      region: 'Nairobi',
      subRegion: 'Westlands',
      city: 'Nairobi',
      district: null,
      streetAddress: '123 Uhuru Highway',
      postalCode: '00100',
      isPrimary: true, // Already primary
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.$transaction).not.toHaveBeenCalled(); // No need to update

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address is already set as primary',
      data: {
        address: existingAddress,
      },
    });
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;
    mockRequest.params = { id: 'addr-123' };

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required',
      },
    });
  });

  it('should reject request without address ID', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.params = {}; // No ID

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Address ID is required',
      },
    });
  });

  it('should reject request for non-existent address', async () => {
    const userId = 'user-123';
    const addressId = 'non-existent-addr';

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(null);

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Address not found',
      },
    });
  });

  it('should reject request for address belonging to another user', async () => {
    const userId = 'user-123';
    const otherUserId = 'user-456';
    const addressId = 'addr-123';
    
    const existingAddress = {
      id: addressId,
      userId: otherUserId, // Different user
      country: 'NIGERIA',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      district: null,
      streetAddress: '123 Main Street',
      postalCode: '100001',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to modify this address',
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'user-123';
    const addressId = 'addr-123';

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Set primary address error:', expect.any(Error));
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

  it('should handle transaction errors gracefully', async () => {
    const userId = 'user-123';
    const addressId = 'addr-123';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'NIGERIA',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      district: null,
      streetAddress: '123 Main Street',
      postalCode: '100001',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.$transaction as jest.Mock).mockRejectedValue(new Error('Transaction failed'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Set primary address error:', expect.any(Error));
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

  it('should use transaction to ensure atomicity', async () => {
    const userId = 'user-multi';
    const addressId = 'addr-secondary';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'GHANA',
      region: 'Greater Accra',
      subRegion: 'Accra Metropolitan',
      city: 'Accra',
      district: null,
      streetAddress: '456 Secondary Street',
      postalCode: null,
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAddress = {
      ...existingAddress,
      isPrimary: true,
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { count: 3 }, // updateMany result (3 other addresses set to non-primary)
      updatedAddress // update result
    ]);

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    // Verify that transaction was called with both operations
    expect(prisma.$transaction).toHaveBeenCalledWith([
      expect.objectContaining({
        // This should be the updateMany operation
      }),
      expect.objectContaining({
        // This should be the update operation
      })
    ]);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address set as primary successfully',
      data: {
        address: updatedAddress,
      },
    });
  });

  it('should work with different country address formats', async () => {
    const userId = 'user-egypt';
    const addressId = 'addr-egypt';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'EGYPT',
      region: 'Cairo',
      subRegion: null,
      city: 'Cairo',
      district: 'Zamalek',
      streetAddress: '123 Nile Street',
      postalCode: '12345',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAddress = {
      ...existingAddress,
      isPrimary: true,
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.$transaction as jest.Mock).mockResolvedValue([
      { count: 1 },
      updatedAddress
    ]);

    await setPrimaryAddress(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address set as primary successfully',
      data: {
        address: updatedAddress,
      },
    });
  });
});