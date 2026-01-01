import { Request, Response } from 'express';
import { updateAddress } from '../addresses';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    address: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
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
    isLength: jest.fn().mockReturnThis(),
    withMessage: jest.fn().mockReturnThis(),
    optional: jest.fn().mockReturnThis(),
    isBoolean: jest.fn().mockReturnThis(),
  })),
}));

describe('Update Address Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(() => ({ json: jsonMock }));

    mockRequest = {
      body: {},
      params: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  it('should successfully update an address', async () => {
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
      streetAddress: '123 Old Street',
      postalCode: '100001',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAddressData = {
      country: 'Nigeria',
      region: 'Lagos',
      subRegion: 'Victoria Island',
      city: 'Lagos',
      streetAddress: '456 New Street',
      postalCode: '100002',
      isPrimary: false,
    };

    const updatedAddress = {
      ...existingAddress,
      region: 'Lagos',
      subRegion: 'Victoria Island',
      city: 'Lagos',
      streetAddress: '456 New Street',
      postalCode: '100002',
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = updatedAddressData;

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: addressId },
      data: {
        country: 'NIGERIA',
        region: 'Lagos',
        subRegion: 'Victoria Island',
        city: 'Lagos',
        district: undefined,
        streetAddress: '456 New Street',
        postalCode: '100002',
        isPrimary: false,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: updatedAddress,
      },
    });
  });

  it('should update address to primary and set others to non-primary', async () => {
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
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAddressData = {
      country: 'Kenya',
      region: 'Nairobi',
      subRegion: 'Westlands',
      city: 'Nairobi',
      streetAddress: '123 Uhuru Highway',
      postalCode: '00100',
      isPrimary: true, // Setting as primary
    };

    const updatedAddress = {
      ...existingAddress,
      isPrimary: true,
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = updatedAddressData;

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { 
        userId,
        id: { not: addressId }
      },
      data: { isPrimary: false },
    });

    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: addressId },
      data: {
        country: 'KENYA',
        region: 'Nairobi',
        subRegion: 'Westlands',
        city: 'Nairobi',
        district: undefined,
        streetAddress: '123 Uhuru Highway',
        postalCode: '00100',
        isPrimary: true,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;
    mockRequest.params = { id: 'addr-123' };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      city: 'Lagos',
      streetAddress: '123 Main Street',
    };

    await updateAddress(mockRequest as Request, mockResponse as Response);

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
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      city: 'Lagos',
      streetAddress: '123 Main Street',
    };

    await updateAddress(mockRequest as Request, mockResponse as Response);

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
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      city: 'Lagos',
      streetAddress: '123 Main Street',
    };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(null);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalledWith({
      where: { id: addressId },
    });

    expect(prisma.address.update).not.toHaveBeenCalled();
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
      streetAddress: '123 Old Street',
      postalCode: '100001',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      city: 'Lagos',
      streetAddress: '456 New Street',
    };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.findUnique).toHaveBeenCalled();
    expect(prisma.address.update).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'You do not have permission to update this address',
      },
    });
  });

  it('should reject unsupported country', async () => {
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
      streetAddress: '123 Old Street',
      postalCode: '100001',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = {
      country: 'United States', // Unsupported
      region: 'California',
      city: 'Los Angeles',
      streetAddress: '123 Main Street',
    };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.update).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_002',
        message: expect.stringContaining('Unsupported country: United States'),
      },
    });
  });

  it('should reject address with invalid validation', async () => {
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
      streetAddress: '123 Old Street',
      postalCode: '100001',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      streetAddress: '123 New Street',
      postalCode: '12345', // Invalid format for Nigeria (should be 6 digits)
    };

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.update).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_002',
        message: 'Address validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('Postal Code format is invalid'),
        ]),
      },
    });
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'user-123';
    const addressId = 'addr-123';

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      city: 'Lagos',
      streetAddress: '123 Main Street',
      postalCode: '100001',
    };

    (prisma.address.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Update address error:', expect.any(Error));
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

  it('should preserve isPrimary when not specified in update', async () => {
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
      streetAddress: '123 Old Street',
      postalCode: '100001',
      isPrimary: true, // Already primary
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedAddressData = {
      country: 'Nigeria',
      region: 'Lagos',
      subRegion: 'Victoria Island',
      city: 'Lagos',
      streetAddress: '456 New Street',
      postalCode: '100002',
      // isPrimary not specified
    };

    const updatedAddress = {
      ...existingAddress,
      subRegion: 'Victoria Island',
      streetAddress: '456 New Street',
      postalCode: '100002',
      isPrimary: true, // Should remain true
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.params = { id: addressId };
    mockRequest.body = updatedAddressData;

    (prisma.address.findUnique as jest.Mock).mockResolvedValue(existingAddress);
    (prisma.address.update as jest.Mock).mockResolvedValue(updatedAddress);

    await updateAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.updateMany).not.toHaveBeenCalled(); // Should not update other addresses
    expect(prisma.address.update).toHaveBeenCalledWith({
      where: { id: addressId },
      data: {
        country: 'NIGERIA',
        region: 'Lagos',
        subRegion: 'Victoria Island',
        city: 'Lagos',
        district: undefined,
        streetAddress: '456 New Street',
        postalCode: '100002',
        isPrimary: true, // Preserved from existing
      },
    });

    expect(statusMock).toHaveBeenCalledWith(200);
  });
});