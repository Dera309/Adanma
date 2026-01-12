import express from 'express';
import { body } from 'express-validator';
import { authService } from '../services/AuthService';
import { handleValidationErrors, validatePassword } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Login endpoint
router.post('/login', 
  [
    body('identifier').notEmpty().withMessage('Email or phone number is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { identifier, password } = req.body;
      
      const result = await authService.login(identifier, password);
      
      res.json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user
        },
        message: 'Login successful'
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: error.message || 'Login failed'
        }
      });
    }
  }
);

// Register endpoint
router.post('/register',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('password').custom((value) => {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }
      return true;
    }),
    body('roles').isArray().withMessage('Roles must be an array'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phoneNumber').optional().isMobilePhone('any').withMessage('Valid phone number is required')
  ],
  handleValidationErrors,
  async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { email, phoneNumber, password, name, roles } = req.body;
      
      if (!email && !phoneNumber) {
        res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_002',
            message: 'Either email or phone number is required'
          }
        });
        return;
      }
      
      const result = await authService.register({
        email,
        phoneNumber,
        password,
        name,
        roles: roles || ['buyer']
      });
      
      res.status(201).json({
        success: true,
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          user: result.user
        },
        message: 'Registration successful'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_003',
          message: error.message || 'Registration failed'
        }
      });
    }
  }
);

// Logout endpoint
router.post('/logout', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      await authService.logout(token);
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_004',
        message: 'Logout failed'
      }
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
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
        code: 'AUTH_005',
        message: 'Failed to retrieve profile'
      }
    });
  }
});

export default router;