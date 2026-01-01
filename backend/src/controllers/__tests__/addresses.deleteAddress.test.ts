import { Request, Response } from 'express';
import { deleteAddress } from '../addresses';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    address: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

describe('Delete Address Controller', () => {
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

  it('should successfully delete a non-primary address', async () => {
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
      isPrimary: false, // Non-primary address
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.delete as jest.Mock).mockResolvedValue(existingAddress);

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.address.delete).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address deleted successfully',
    });
  });

  it('should successfully delete the only primary address', async () => {
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
      isPrimary: true, // Primary address
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.findMany as jest.Mock).mockResolvedValue([]); // No other addresses
    (prisma.address.delete as jest.Mock).mockResolvedValue(existingAddress);

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        id: { not: addressId },
      },
    });

    expect(prisma.address.delete).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address deleted successfully',
    });
  });

  it('should reject deletion of primary address when other addresses exist', async () => {
    const userId = 'user-789';
    const addressId = 'addr-primary';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'GHANA',
      region: 'Greater Accra',
      subRegion: 'Accra Metropolitan',
      city: 'Accra',
      district: null,
      streetAddress: '123 Independence Avenue',
      postalCode: null,
      isPrimary: true, // Primary address
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const otherAddresses = [
      {
        id: 'addr-secondary-1',
        userId,
        country: 'GHANA',
        region: 'Ashanti',
        subRegion: 'Kumasi Metropolitan',
        city: 'Kumasi',
        district: null,
        streetAddress: '456 Secondary Street',
        postalCode: null,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'addr-secondary-2',
        userId,
        country: 'GHANA',
        region: 'Western',
        subRegion: 'Sekondi-Takoradi Metropolitan',
        city: 'Takoradi',
        district: null,
        streetAddress: '789 Third Street',
        postalCode: null,
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.findMany as jest.Mock).mockResolvedValue(otherAddresses);

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findMany).toHaveBeenCalledWith({
      where: {
        userId,
        id: { not: addressId },
      },
    });

    expect(prisma.address.delete).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'PRIMARY_ADDRESS_DELETION',
        message: 'Cannot delete primary address while other addresses exist. Please designate another address as primary first.',
        details: {
          otherAddressesCount: 2,
          suggestion: 'Update another address to be primary before deleting this one',
        },
      },
    });
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;
    mockRequest.params = { id: 'addr-123' };

    await deleteAddress(mockRequest as Request, mockResponse as Response);

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

    await deleteAddress(mockRequest as Request, mockResponse as Response);

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

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.address.delete).not.toHaveBeenCalled();
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

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalled();
    expect(prisma.address.delete).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to delete this address',
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

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Delete address error:', expect.any(Error));
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
    (prisma.address.delete as jest.Mock).mockRejectedValue(new Error('Deletion failed'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Delete address error:', expect.any(Error));
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

  it('should provide helpful error details when rejecting primary address deletion', async () => {
    const userId = 'user-multi';
    const addressId = 'addr-primary';
    
    const existingAddress = {
      id: addressId,
      userId,
      country: 'SOUTH_AFRICA',
      region: 'Gauteng',
      subRegion: 'City of Johannesburg',
      city: 'Johannesburg',
      district: null,
      streetAddress: '123 Nelson Mandela Square',
      postalCode: '2000',
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const otherAddresses = [
      {
        id: 'addr-secondary',
        userId,
        country: 'SOUTH_AFRICA',
        region: 'Western Cape',
        subRegion: 'City of Cape Town',
        city: 'Cape Town',
        district: null,
        streetAddress: '456 Table Mountain Road',
        postalCode: '8000',
        isPrimary: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.findMany as jest.Mock).mockResolvedValue(otherAddresses);

    await deleteAddress(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'PRIMARY_ADDRESS_DELETION',
        message: 'Cannot delete primary address while other addresses exist. Please designate another address as primary first.',
        details: {
          otherAddressesCount: 1,
          suggestion: 'Update another address to be primary before deleting this one',
        },
      },
    });
  });
});