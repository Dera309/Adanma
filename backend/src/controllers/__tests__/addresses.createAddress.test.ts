import { Request, Response } from 'express';
import { createAddress } from '../addresses';
import prisma from '../../config/database';

// Mock dependencies
jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    address: {
      updateMany: jest.fn(),
      create: jest.fn(),
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

describe('Create Address Controller', () => {
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

  it('should successfully create a Nigeria address', async () => {
    const userId = 'user-123';
    const addressData = {
      country: 'Nigeria',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      streetAddress: '123 Main Street',
      postalCode: '100001',
      isPrimary: false,
    };

    const createdAddress = {
      id: 'addr-123',
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
    mockRequest.body = addressData;

    (prisma.address.create as jest.Mock).mockResolvedValue(createdAddress);

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).toHaveBeenCalledWith({
      data: {
        userId,
        country: 'NIGERIA',
        region: 'Lagos',
        subRegion: 'Ikeja',
        city: 'Ikeja',
        district: undefined,
        streetAddress: '123 Main Street',
        postalCode: '100001',
        isPrimary: false,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      message: 'Address created successfully',
      data: {
        address: createdAddress,
      },
    });
  });

  it('should successfully create a Ghana address without postal code', async () => {
    const userId = 'user-456';
    const addressData = {
      country: 'Ghana',
      region: 'Greater Accra',
      subRegion: 'Accra Metropolitan',
      city: 'Accra',
      streetAddress: '456 Independence Avenue',
      isPrimary: false,
    };

    const createdAddress = {
      id: 'addr-456',
      userId,
      country: 'GHANA',
      region: 'Greater Accra',
      subRegion: 'Accra Metropolitan',
      city: 'Accra',
      district: null,
      streetAddress: '456 Independence Avenue',
      postalCode: null,
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = addressData;

    (prisma.address.create as jest.Mock).mockResolvedValue(createdAddress);

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).toHaveBeenCalledWith({
      data: {
        userId,
        country: 'GHANA',
        region: 'Greater Accra',
        subRegion: 'Accra Metropolitan',
        city: 'Accra',
        district: undefined,
        streetAddress: '456 Independence Avenue',
        postalCode: undefined,
        isPrimary: false,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(201);
  });

  it('should set address as primary and update other addresses', async () => {
    const userId = 'user-789';
    const addressData = {
      country: 'Kenya',
      region: 'Nairobi',
      subRegion: 'Westlands',
      city: 'Nairobi',
      streetAddress: '789 Uhuru Highway',
      postalCode: '00100',
      isPrimary: true,
    };

    const createdAddress = {
      id: 'addr-789',
      userId,
      country: 'KENYA',
      region: 'Nairobi',
      subRegion: 'Westlands',
      city: 'Nairobi',
      district: null,
      streetAddress: '789 Uhuru Highway',
      postalCode: '00100',
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = addressData;

    (prisma.address.updateMany as jest.Mock).mockResolvedValue({ count: 2 });
    (prisma.address.create as jest.Mock).mockResolvedValue(createdAddress);

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.updateMany).toHaveBeenCalledWith({
      where: { userId },
      data: { isPrimary: false },
    });

    expect(prisma.address.create).toHaveBeenCalledWith({
      data: {
        userId,
        country: 'KENYA',
        region: 'Nairobi',
        subRegion: 'Westlands',
        city: 'Nairobi',
        district: undefined,
        streetAddress: '789 Uhuru Highway',
        postalCode: '00100',
        isPrimary: true,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(201);
  });

  it('should reject request without authentication', async () => {
    (mockRequest as any).user = undefined;
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      city: 'Lagos',
      streetAddress: '123 Main Street',
    };

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required',
      },
    });
  });

  it('should reject unsupported country', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = {
      country: 'United States',
      region: 'California',
      city: 'Los Angeles',
      streetAddress: '123 Main Street',
    };

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_002',
        message: expect.stringContaining('Unsupported country: United States'),
      },
    });
  });

  it('should reject address with missing required fields for Nigeria', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      // Missing required fields: city, streetAddress, postalCode
    };

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_002',
        message: 'Address validation failed',
        details: expect.arrayContaining([
          expect.stringContaining('City/Town is required'),
          expect.stringContaining('Street Address is required'),
          expect.stringContaining('Postal Code is required'),
        ]),
      },
    });
  });

  it('should reject Nigeria address with invalid postal code format', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      streetAddress: '123 Main Street',
      postalCode: '12345', // Should be 6 digits for Nigeria
    };

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).not.toHaveBeenCalled();
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

  it('should successfully create Egypt address with district', async () => {
    const userId = 'user-egypt';
    const addressData = {
      country: 'Egypt',
      region: 'Cairo',
      city: 'Cairo',
      district: 'Zamalek',
      streetAddress: '123 Nile Street',
      postalCode: '12345',
      isPrimary: false,
    };

    const createdAddress = {
      id: 'addr-egypt',
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

    (mockRequest as any).user = { userId };
    mockRequest.body = addressData;

    (prisma.address.create as jest.Mock).mockResolvedValue(createdAddress);

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).toHaveBeenCalledWith({
      data: {
        userId,
        country: 'EGYPT',
        region: 'Cairo',
        subRegion: undefined,
        city: 'Cairo',
        district: 'Zamalek',
        streetAddress: '123 Nile Street',
        postalCode: '12345',
        isPrimary: false,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(201);
  });

  it('should handle database errors gracefully', async () => {
    const userId = 'user-123';

    (mockRequest as any).user = { userId };
    mockRequest.body = {
      country: 'Nigeria',
      region: 'Lagos',
      subRegion: 'Ikeja',
      city: 'Ikeja',
      streetAddress: '123 Main Street',
      postalCode: '100001',
    };

    (prisma.address.create as jest.Mock).mockRejectedValue(new Error('Database error'));

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Create address error:', expect.any(Error));
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

  it('should handle case-insensitive country names', async () => {
    const userId = 'user-123';
    const addressData = {
      country: 'south africa', // lowercase
      region: 'Gauteng',
      subRegion: 'City of Johannesburg',
      city: 'Johannesburg',
      streetAddress: '123 Nelson Mandela Square',
      postalCode: '2000',
      isPrimary: false,
    };

    const createdAddress = {
      id: 'addr-sa',
      userId,
      country: 'SOUTH_AFRICA',
      region: 'Gauteng',
      subRegion: 'City of Johannesburg',
      city: 'Johannesburg',
      district: null,
      streetAddress: '123 Nelson Mandela Square',
      postalCode: '2000',
      isPrimary: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (mockRequest as any).user = { userId };
    mockRequest.body = addressData;

    (prisma.address.create as jest.Mock).mockResolvedValue(createdAddress);

    await createAddress(mockRequest as Request, mockResponse as Response);

    expect(prisma.address.create).toHaveBeenCalledWith({
      data: {
        userId,
        country: 'SOUTH_AFRICA',
        region: 'Gauteng',
        subRegion: 'City of Johannesburg',
        city: 'Johannesburg',
        district: undefined,
        streetAddress: '123 Nelson Mandela Square',
        postalCode: '2000',
        isPrimary: false,
      },
    });

    expect(statusMock).toHaveBeenCalledWith(201);
  });
});