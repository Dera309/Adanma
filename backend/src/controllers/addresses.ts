import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { getAddressConfig, validateAddressData, SUPPORTED_COUNTRIES } from '../config/address';

/**
 * Create Address Controller
 */
export const createAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Validation failed',
          details: errors.array()
        }
      });
      return;
    }

    const userId = (req as any).user?.userId;
    const { country, region, subRegion, city, district, streetAddress, postalCode, isPrimary } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_006',
          message: 'Authentication required'
        }
      });
      return;
    }

    // Validate country is supported
    const normalizedCountry = country.toUpperCase().replace(/\s+/g, '_');
    if (!SUPPORTED_COUNTRIES.includes(normalizedCountry)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: `Unsupported country: ${country}. Supported countries are: ${SUPPORTED_COUNTRIES.join(', ')}`
        }
      });
      return;
    }

    // Validate address data against country configuration
    const addressData = {
      country: normalizedCountry,
      region,
      subRegion,
      city,
      district,
      streetAddress,
      postalCode
    };

    const validation = validateAddressData(normalizedCountry, addressData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: 'Address validation failed',
          details: validation.errors
        }
      });
      return;
    }

    // If this address is being set as primary, update other addresses
    if (isPrimary) {
      await prisma.address.updateMany({
        where: { userId },
        data: { isPrimary: false }
      });
    }

    // Create the new address
    const newAddress = await prisma.address.create({
      data: {
        userId,
        country: normalizedCountry,
        region,
        subRegion,
        city,
        district,
        streetAddress,
        postalCode,
        isPrimary: isPrimary || false
      }
    });

    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      data: {
        address: newAddress
      }
    });

  } catch (error) {
    console.error('Create address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Create Address Validation Middleware
 */
export const validateCreateAddress = [
  body('country')
    .isLength({ min: 1 })
    .withMessage('Country is required'),
  body('region')
    .isLength({ min: 1 })
    .withMessage('Region is required'),
  body('city')
    .isLength({ min: 1 })
    .withMessage('City is required'),
  body('streetAddress')
    .isLength({ min: 1 })
    .withMessage('Street address is required'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean')
];

/**
 * Update Address Controller
 */
export const updateAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Validation failed',
          details: errors.array()
        }
      });
      return;
    }

    const userId = (req as any).user?.userId;
    const { id: addressId } = req.params;
    const { country, region, subRegion, city, district, streetAddress, postalCode, isPrimary } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_006',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!addressId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Address ID is required'
        }
      });
      return;
    }

    // Find the address and verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Address not found'
        }
      });
      return;
    }

    if (existingAddress.userId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this address'
        }
      });
      return;
    }

    // Validate country is supported
    const normalizedCountry = country.toUpperCase().replace(/\s+/g, '_');
    if (!SUPPORTED_COUNTRIES.includes(normalizedCountry)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: `Unsupported country: ${country}. Supported countries are: ${SUPPORTED_COUNTRIES.join(', ')}`
        }
      });
      return;
    }

    // Validate address data against country configuration
    const addressData = {
      country: normalizedCountry,
      region,
      subRegion,
      city,
      district,
      streetAddress,
      postalCode
    };

    const validation = validateAddressData(normalizedCountry, addressData);
    if (!validation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: 'Address validation failed',
          details: validation.errors
        }
      });
      return;
    }

    // If this address is being set as primary, update other addresses
    if (isPrimary && !existingAddress.isPrimary) {
      await prisma.address.updateMany({
        where: { 
          userId,
          id: { not: addressId }
        },
        data: { isPrimary: false }
      });
    }

    // Update the address
    const updatedAddress = await prisma.address.update({
      where: { id: addressId },
      data: {
        country: normalizedCountry,
        region,
        subRegion,
        city,
        district,
        streetAddress,
        postalCode,
        isPrimary: isPrimary !== undefined ? isPrimary : existingAddress.isPrimary
      }
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: {
        address: updatedAddress
      }
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Update Address Validation Middleware
 */
export const validateUpdateAddress = [
  body('country')
    .isLength({ min: 1 })
    .withMessage('Country is required'),
  body('region')
    .isLength({ min: 1 })
    .withMessage('Region is required'),
  body('city')
    .isLength({ min: 1 })
    .withMessage('City is required'),
  body('streetAddress')
    .isLength({ min: 1 })
    .withMessage('Street address is required'),
  body('isPrimary')
    .optional()
    .isBoolean()
    .withMessage('isPrimary must be a boolean')
];

/**
 * Delete Address Controller
 */
export const deleteAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id: addressId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_006',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!addressId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Address ID is required'
        }
      });
      return;
    }

    // Find the address and verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Address not found'
        }
      });
      return;
    }

    if (existingAddress.userId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this address'
        }
      });
      return;
    }

    // Check if this is a primary address and if other addresses exist
    if (existingAddress.isPrimary) {
      const otherAddresses = await prisma.address.findMany({
        where: {
          userId,
          id: { not: addressId }
        }
      });

      if (otherAddresses.length > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PRIMARY_ADDRESS_DELETION',
            message: 'Cannot delete primary address while other addresses exist. Please designate another address as primary first.',
            details: {
              otherAddressesCount: otherAddresses.length,
              suggestion: 'Update another address to be primary before deleting this one'
            }
          }
        });
        return;
      }
    }

    // Delete the address
    await prisma.address.delete({
      where: { id: addressId }
    });

    res.status(200).json({
      success: true,
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error'
      }
    });
  }
};

/**
 * Set Primary Address Controller
 */
export const setPrimaryAddress = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { id: addressId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_006',
          message: 'Authentication required'
        }
      });
      return;
    }

    if (!addressId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Address ID is required'
        }
      });
      return;
    }

    // Find the address and verify ownership
    const existingAddress = await prisma.address.findUnique({
      where: { id: addressId }
    });

    if (!existingAddress) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Address not found'
        }
      });
      return;
    }

    if (existingAddress.userId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to modify this address'
        }
      });
      return;
    }

    // If address is already primary, no need to update
    if (existingAddress.isPrimary) {
      res.status(200).json({
        success: true,
        message: 'Address is already set as primary',
        data: {
          address: existingAddress
        }
      });
      return;
    }

    // Use transaction to ensure atomicity
    const result = await prisma.$transaction([
      // Set all user addresses to non-primary
      prisma.address.updateMany({
        where: { userId },
        data: { isPrimary: false }
      }),
      // Set the specified address as primary
      prisma.address.update({
        where: { id: addressId },
        data: { isPrimary: true }
      })
    ]);

    const updatedAddress = result[1]; // The updated address from the second operation

    res.status(200).json({
      success: true,
      message: 'Address set as primary successfully',
      data: {
        address: updatedAddress
      }
    });

  } catch (error) {
    console.error('Set primary address error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error'
      }
    });
  }
};

// In-memory cache for region data (in production, use Redis or similar)
const regionCache = new Map<string, any>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Get Address Regions Controller
 */
export const getAddressRegions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { country } = req.params;

    if (!country) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Country parameter is required'
        }
      });
      return;
    }

    // Normalize country name
    const normalizedCountry = country.toUpperCase().replace(/\s+/g, '_');

    // Check cache first
    const cacheKey = `regions_${normalizedCountry}`;
    const cachedData = regionCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      res.status(200).json({
        success: true,
        data: cachedData.data,
        cached: true
      });
      return;
    }

    // Get address configuration for the country
    const config = getAddressConfig(normalizedCountry);
    
    if (!config) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Country '${country}' is not supported. Supported countries are: ${SUPPORTED_COUNTRIES.join(', ')}`
        }
      });
      return;
    }

    // Extract regions and sub-regions from the configuration
    const regionData: any = {
      country: config.country,
      countryCode: config.countryCode,
      regions: []
    };

    // Find the main region field (state, province, county, etc.)
    const regionField = config.fields.find(field => 
      ['state', 'region', 'province', 'county', 'governorate'].includes(field.name.toLowerCase())
    );

    if (regionField && regionField.type === 'select' && regionField.options) {
      regionData.regions = regionField.options.map((region: string) => ({
        name: region,
        code: region.toUpperCase().replace(/\s+/g, '_'),
        type: regionField.label
      }));
    }

    // Add field structure information for dynamic form generation
    regionData.fieldStructure = config.fields.map(field => ({
      name: field.name,
      label: field.label,
      type: field.type,
      required: field.required,
      hasOptions: field.type === 'select' && !!field.options,
      optionsCount: field.options?.length || 0
    }));

    // Add address format information
    regionData.addressFormat = config.addressFormat;
    regionData.postalCodeRequired = config.postalCodeRequired;
    regionData.postalCodePattern = config.postalCodePattern;

    // Cache the result
    regionCache.set(cacheKey, {
      data: regionData,
      timestamp: Date.now()
    });

    res.status(200).json({
      success: true,
      data: regionData,
      cached: false
    });

  } catch (error) {
    console.error('Get address regions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error'
      }
    });
  }
};