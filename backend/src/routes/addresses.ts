import express from 'express';
import { body, param } from 'express-validator';
import { addressService } from '../services/AddressService';
import { handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user addresses
router.get('/', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const addresses = await addressService.getUserAddresses(req.user.id);
    
    res.json({
      success: true,
      data: { addresses },
      message: 'Addresses retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'ADDR_001',
        message: 'Failed to retrieve addresses'
      }
    });
  }
});

// Create new address
router.post('/',
  authenticateToken,
  [
    body('country').isIn(['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Cameroon', 'Egypt']).withMessage('Invalid country'),
    body('city').notEmpty().withMessage('City is required'),
    body('streetAddress').notEmpty().withMessage('Street address is required'),
    body('postalCode').optional().isString(),
    body('isPrimary').optional().isBoolean()
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const addressData = req.body;
      
      // Validate country-specific fields
      const validation = addressService.validateAddressForCountry(addressData.country, addressData);
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ADDR_002',
            message: 'Address validation failed',
            details: validation.errors
          }
        });
        return;
      }

      const address = await addressService.createAddress(req.user.id, addressData);
      
      // Set as primary if requested and no other primary exists
      if (addressData.isPrimary) {
        await addressService.setPrimaryAddress(req.user.id, address.id);
      }

      res.status(201).json({
        success: true,
        data: { address },
        message: 'Address created successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ADDR_003',
          message: error.message || 'Failed to create address'
        }
      });
    }
  }
);

// Update address
router.put('/:addressId',
  authenticateToken,
  [
    param('addressId').notEmpty().withMessage('Address ID is required'),
    body('country').optional().isIn(['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Cameroon', 'Egypt']),
    body('city').optional().notEmpty(),
    body('streetAddress').optional().notEmpty()
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { addressId } = req.params;
      const updates = req.body;

      const address = await addressService.updateAddress(addressId, updates);

      res.json({
        success: true,
        data: { address },
        message: 'Address updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ADDR_004',
          message: error.message || 'Failed to update address'
        }
      });
    }
  }
);

// Delete address
router.delete('/:addressId',
  authenticateToken,
  [
    param('addressId').notEmpty().withMessage('Address ID is required')
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { addressId } = req.params;
      
      await addressService.deleteAddress(addressId);

      res.json({
        success: true,
        message: 'Address deleted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ADDR_005',
          message: error.message || 'Failed to delete address'
        }
      });
    }
  }
);

// Set primary address
router.put('/:addressId/primary',
  authenticateToken,
  [
    param('addressId').notEmpty().withMessage('Address ID is required')
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { addressId } = req.params;
      
      await addressService.setPrimaryAddress(req.user.id, addressId);

      res.json({
        success: true,
        message: 'Primary address updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ADDR_006',
          message: error.message || 'Failed to set primary address'
        }
      });
    }
  }
);

export default router;