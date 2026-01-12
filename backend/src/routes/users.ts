import express from 'express';
import { body, param } from 'express-validator';
import { authService } from '../services/AuthService';
import { kycService } from '../services/KYCService';
import { handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get user profile
router.get('/profile', authenticateToken, async (req: any, res: express.Response) => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    
    res.json({
      success: true,
      data: { user },
      message: 'Profile retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_001',
        message: 'Failed to retrieve profile'
      }
    });
  }
});

// Update user profile
router.put('/profile',
  authenticateToken,
  [
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number is required')
  ],
  handleValidationErrors,
  async (req: any, res: express.Response) => {
    try {
      const updates = req.body;
      const user = await authService.updateProfile(req.user.id, updates);
      
      res.json({
        success: true,
        data: { user },
        message: 'Profile updated successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'USER_002',
          message: error.message || 'Failed to update profile'
        }
      });
    }
  }
);

// Get user dashboard data
router.get('/dashboard', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const user = await authService.getUserProfile(req.user.id);
    
    res.json({
      success: true,
      data: { 
        user,
        stats: {
          orders: 5,
          cartItems: 3,
          addresses: 1
        }
      },
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'USER_003',
        message: 'Failed to retrieve dashboard data'
      }
    });
  }
});

// Get KYC status
router.get('/kyc-status', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const kycStatus = await kycService.getKYCStatus(req.user.id);
    
    res.json({
      success: true,
      data: { kyc: kycStatus },
      message: 'KYC status retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'KYC_001',
        message: 'Failed to retrieve KYC status'
      }
    });
  }
});

// Submit KYC
router.post('/kyc-submit',
  authenticateToken,
  [
    body('personalInfo.fullName').notEmpty().withMessage('Full name is required'),
    body('personalInfo.dateOfBirth').notEmpty().withMessage('Date of birth is required'),
    body('personalInfo.nationality').notEmpty().withMessage('Nationality is required'),
    body('personalInfo.address').notEmpty().withMessage('Address is required'),
    body('documents').isArray().withMessage('Documents array is required')
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { personalInfo, documents } = req.body;
      
      const submission = await kycService.submitKYC(req.user.id, {
        personalInfo,
        documents
      });
      
      res.status(201).json({
        success: true,
        data: { kyc: submission },
        message: 'KYC submitted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'KYC_002',
          message: error.message || 'Failed to submit KYC'
        }
      });
    }
  }
);

export default router;