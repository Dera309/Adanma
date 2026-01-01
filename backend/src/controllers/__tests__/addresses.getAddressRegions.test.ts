import { Request, Response } from 'express';
import { getAddressRegions } from '../addresses';

// Mock the address configuration
jest.mock('../../config/address', () => ({
  getAddressConfig: jest.fn(),
  SUPPORTED_COUNTRIES: ['NIGERIA', 'GHANA', 'KENYA', 'SOUTH_AFRICA', 'CAMEROON', 'EGYPT']
}));

import { getAddressConfig } from '../../config/address';

describe('Get Address Regions Controller', () => {
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

  it('should return regions for Nigeria', async () => {
    const mockNigeriaConfig = {
      country: 'Nigeria',
      countryCode: 'NG',
      postalCodeRequired: true,
      postalCodePattern: '^\\d{6}$',
      addressFormat: ['streetAddress', 'city', 'lga', 'state', 'postalCode'],
      fields: [
        {
          name: 'state',
          label: 'State',
          type: 'select',
          required: true,
          options: ['Lagos', 'Abuja', 'Kano', 'Rivers']
        },
        {
          name: 'lga',
          label: 'Local Government Area (LGA)',
          type: 'text',
          required: true
        },
        {
          name: 'city',
          label: 'City/Town',
          type: 'text',
          required: true
        },
        {
          name: 'streetAddress',
          label: 'Street Address',
          type: 'text',
          required: true
        },
        {
          name: 'postalCode',
          label: 'Postal Code',
          type: 'text',
          required: true
        }
      ]
    };

    mockRequest.params = { country: 'Nigeria' };
    (getAddressConfig as jest.Mock).mockReturnValue(mockNigeriaConfig);

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(getAddressConfig).toHaveBeenCalledWith('NIGERIA');
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        country: 'Nigeria',
        countryCode: 'NG',
        regions: [
          { name: 'Lagos', code: 'LAGOS', type: 'State' },
          { name: 'Abuja', code: 'ABUJA', type: 'State' },
          { name: 'Kano', code: 'KANO', type: 'State' },
          { name: 'Rivers', code: 'RIVERS', type: 'State' }
        ],
        fieldStructure: [
          { name: 'state', label: 'State', type: 'select', required: true, hasOptions: true, optionsCount: 4 },
          { name: 'lga', label: 'Local Government Area (LGA)', type: 'text', required: true, hasOptions: false, optionsCount: 0 },
          { name: 'city', label: 'City/Town', type: 'text', required: true, hasOptions: false, optionsCount: 0 },
          { name: 'streetAddress', label: 'Street Address', type: 'text', required: true, hasOptions: false, optionsCount: 0 },
          { name: 'postalCode', label: 'Postal Code', type: 'text', required: true, hasOptions: false, optionsCount: 0 }
        ],
        addressFormat: ['streetAddress', 'city', 'lga', 'state', 'postalCode'],
        postalCodeRequired: true,
        postalCodePattern: '^\\d{6}$'
      },
      cached: false
    });
  });

  it('should return regions for Kenya with county structure', async () => {
    const mockKenyaConfig = {
      country: 'Kenya',
      countryCode: 'KE',
      postalCodeRequired: true,
      postalCodePattern: '^\\d{5}$',
      addressFormat: ['streetAddress', 'city', 'subCounty', 'county', 'postalCode'],
      fields: [
        {
          name: 'county',
          label: 'County',
          type: 'select',
          required: true,
          options: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru']
        },
        {
          name: 'subCounty',
          label: 'Sub-County',
          type: 'text',
          required: true
        },
        {
          name: 'city',
          label: 'City/Town',
          type: 'text',
          required: true
        },
        {
          name: 'streetAddress',
          label: 'Street Address',
          type: 'text',
          required: true
        },
        {
          name: 'postalCode',
          label: 'Postal Code',
          type: 'text',
          required: true
        }
      ]
    };

    mockRequest.params = { country: 'Kenya' };
    (getAddressConfig as jest.Mock).mockReturnValue(mockKenyaConfig);

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        country: 'Kenya',
        countryCode: 'KE',
        regions: [
          { name: 'Nairobi', code: 'NAIROBI', type: 'County' },
          { name: 'Mombasa', code: 'MOMBASA', type: 'County' },
          { name: 'Kisumu', code: 'KISUMU', type: 'County' },
          { name: 'Nakuru', code: 'NAKURU', type: 'County' }
        ],
        fieldStructure: expect.any(Array),
        addressFormat: ['streetAddress', 'city', 'subCounty', 'county', 'postalCode'],
        postalCodeRequired: true,
        postalCodePattern: '^\\d{5}$'
      },
      cached: false
    });
  });

  it('should handle case-insensitive country names', async () => {
    const mockConfig = {
      country: 'Ghana',
      countryCode: 'GH',
      postalCodeRequired: false,
      addressFormat: ['streetAddress', 'city', 'district', 'region'],
      fields: [
        {
          name: 'region',
          label: 'Region',
          type: 'select',
          required: true,
          options: ['Greater Accra', 'Ashanti', 'Western']
        }
      ]
    };

    mockRequest.params = { country: 'ghana' }; // lowercase
    (getAddressConfig as jest.Mock).mockReturnValue(mockConfig);

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(getAddressConfig).toHaveBeenCalledWith('GHANA');
    expect(statusMock).toHaveBeenCalledWith(200);
  });

  it('should reject request without country parameter', async () => {
    mockRequest.params = {}; // No country

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(getAddressConfig).not.toHaveBeenCalled();
    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'VAL_001',
        message: 'Country parameter is required',
      },
    });
  });

  it('should reject unsupported country', async () => {
    mockRequest.params = { country: 'United States' };
    (getAddressConfig as jest.Mock).mockReturnValue(null);

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(getAddressConfig).toHaveBeenCalledWith('UNITED_STATES');
    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: expect.stringContaining('Country \'United States\' is not supported'),
      },
    });
  });

  it('should return cached data when available', async () => {
    const mockConfig = {
      country: 'Egypt',
      countryCode: 'EG',
      postalCodeRequired: true,
      postalCodePattern: '^\\d{5}$',
      addressFormat: ['streetAddress', 'district', 'city', 'governorate', 'postalCode'],
      fields: [
        {
          name: 'governorate',
          label: 'Governorate',
          type: 'select',
          required: true,
          options: ['Cairo', 'Alexandria', 'Giza']
        }
      ]
    };

    mockRequest.params = { country: 'Egypt' };
    (getAddressConfig as jest.Mock).mockReturnValue(mockConfig);

    // First call - should cache the data
    await getAddressRegions(mockRequest as Request, mockResponse as Response);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      cached: false
    }));

    // Reset mocks
    jest.clearAllMocks();

    // Second call - should return cached data
    await getAddressRegions(mockRequest as Request, mockResponse as Response);
    expect(getAddressConfig).not.toHaveBeenCalled(); // Should not call config again
    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
      cached: true
    }));
  });

  it('should handle countries without select-type region fields', async () => {
    const mockConfig = {
      country: 'Test Country',
      countryCode: 'TC',
      postalCodeRequired: false,
      addressFormat: ['streetAddress', 'city'],
      fields: [
        {
          name: 'city',
          label: 'City',
          type: 'text', // No select field
          required: true
        },
        {
          name: 'streetAddress',
          label: 'Street Address',
          type: 'text',
          required: true
        }
      ]
    };

    mockRequest.params = { country: 'TestCountry' };
    (getAddressConfig as jest.Mock).mockReturnValue(mockConfig);

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data: {
        country: 'Test Country',
        countryCode: 'TC',
        regions: [], // Empty regions since no select field
        fieldStructure: [
          { name: 'city', label: 'City', type: 'text', required: true, hasOptions: false, optionsCount: 0 },
          { name: 'streetAddress', label: 'Street Address', type: 'text', required: true, hasOptions: false, optionsCount: 0 }
        ],
        addressFormat: ['streetAddress', 'city'],
        postalCodeRequired: false,
        postalCodePattern: undefined
      },
      cached: false
    });
  });

  it('should handle database errors gracefully', async () => {
    mockRequest.params = { country: 'Nigeria' };
    (getAddressConfig as jest.Mock).mockImplementation(() => {
      throw new Error('Configuration error');
    });

    // Mock console.error to avoid cluttering test output
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(consoleErrorSpy).toHaveBeenCalledWith('Get address regions error:', expect.any(Error));
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

  it('should handle spaces in country names correctly', async () => {
    const mockConfig = {
      country: 'South Africa',
      countryCode: 'ZA',
      postalCodeRequired: true,
      postalCodePattern: '^\\d{4}$',
      addressFormat: ['streetAddress', 'city', 'municipality', 'province', 'postalCode'],
      fields: [
        {
          name: 'province',
          label: 'Province',
          type: 'select',
          required: true,
          options: ['Gauteng', 'Western Cape', 'KwaZulu-Natal']
        }
      ]
    };

    mockRequest.params = { country: 'South Africa' }; // With space
    (getAddressConfig as jest.Mock).mockReturnValue(mockConfig);

    await getAddressRegions(mockRequest as Request, mockResponse as Response);

    expect(getAddressConfig).toHaveBeenCalledWith('SOUTH_AFRICA'); // Normalized
    expect(statusMock).toHaveBeenCalledWith(200);
  });
});