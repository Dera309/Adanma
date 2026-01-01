import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import prisma from '../config/database';
import { validateEmailFormat, EmailService, generateVerificationToken } from '../services/email';
import { validatePhoneNumber, SMSService, generateVerificationCode } from '../services/sms';
import { EmailVerificationService, PhoneVerificationService } from '../services/verification';
import { shouldUseMockData } from '../config/development';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

/**
 * Get Dashboard Data Controller
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.id;

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

    try {
      // Get real data from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          orders: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              createdAt: true
            }
          },
          cart: {
            include: {
              items: {
                select: {
                  id: true,
                  quantity: true,
                  product: {
                    select: {
                      name: true,
                      price: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_001', message: 'User not found' }
        });
        return;
      }

      const totalOrders = user.orders?.length || 0;
      const totalSpent = user.orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
      const savedItems = user.cart?.items?.length || 0;

      const recentActivity = [
        ...user.orders.slice(0, 2).map(order => ({
          id: order.id,
          type: 'order',
          description: `Order #${order.id.slice(-6)} ${order.status}`,
          date: order.createdAt.toISOString()
        })),
        {
          id: 'profile',
          type: 'profile',
          description: 'Profile accessed',
          date: new Date().toISOString()
        }
      ];

      const dashboardData = {
        totalOrders,
        totalSpent,
        savedItems,
        recentActivity
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (dbError) {
      // Fallback to empty data if database fails
      const dashboardData = {
        totalOrders: 0,
        totalSpent: 0,
        savedItems: 0,
        recentActivity: []
      };

      res.status(200).json({
        success: true,
        data: dashboardData
      });
    }
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Internal server error'
      }
    });
  }
};
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
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
    const { roles } = req.body;

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

    // Validate roles array
    if (!Array.isArray(roles) || roles.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Roles must be a non-empty array'
        }
      });
      return;
    }

    // Validate role values
    const validRoles = ['BUYER', 'VENDOR'];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    
    if (invalidRoles.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: `Invalid role values: ${invalidRoles.join(', ')}. Valid roles are: BUYER, VENDOR`
        }
      });
      return;
    }

    // Remove duplicates
    const uniqueRoles = [...new Set(roles)];

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'User not found'
        }
      });
      return;
    }

    // Update user roles (convert array to string for database storage)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roles: uniqueRoles.join(',') },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        roles: true,
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true
      }
    });

    res.status(200).json({
      success: true,
      message: 'User roles updated successfully',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Update user role error:', error);
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
 * Update User Role Validation Middleware
 */
export const validateUpdateUserRole = [
  body('roles')
    .isArray({ min: 1 })
    .withMessage('Roles must be a non-empty array')
];

/**
 * Get User Addresses Controller
 */
export const getUserAddresses = async (req: Request, res: Response): Promise<void> => {
  try {
    // Check if we should use mock data (skip authentication and database operations)
    if (shouldUseMockData()) {
      console.log('🔧 Using mock mode for user addresses');
      
      // Return mock addresses for development
      const mockAddresses = [
        {
          id: '507f1f77bcf86cd799439012',
          userId: '507f1f77bcf86cd799439011',
          street: '123 Mock Street',
          city: 'Mock City',
          state: 'Mock State',
          country: 'Nigeria',
          postalCode: '12345',
          isPrimary: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: '507f1f77bcf86cd799439013',
          userId: '507f1f77bcf86cd799439011',
          street: '456 Test Avenue',
          city: 'Test City',
          state: 'Test State',
          country: 'Nigeria',
          postalCode: '67890',
          isPrimary: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Addresses retrieved successfully (MOCK MODE)',
        data: {
          addresses: mockAddresses,
          mockMode: true
        }
      });
      return;
    }

    const userId = (req as any).user?.userId;

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

    // Fetch all addresses for the current user
    const addresses = await prisma.address.findMany({
      where: {
        userId: userId
      },
      orderBy: [
        { isPrimary: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        addresses,
        total: addresses.length
      }
    });

  } catch (error) {
    console.error('Get user addresses error:', error);
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
 * Get User Profile Controller
 */
export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

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

    // Check if we should use mock data (skip database operations)
    if (shouldUseMockData()) {
      console.log('🔧 Using mock mode for user profile');
      
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: 'mock@example.com',
        phoneNumber: '+1234567890',
        roles: 'BUYER',
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: 'VERIFIED',
        authProvider: 'EMAIL',
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        isActive: true,
        addresses: [
          {
            id: '507f1f77bcf86cd799439012',
            userId: '507f1f77bcf86cd799439011',
            street: '123 Mock Street',
            city: 'Mock City',
            state: 'Mock State',
            country: 'Nigeria',
            postalCode: '12345',
            isPrimary: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      };

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully (MOCK MODE)',
        data: {
          user: mockUser,
          mockMode: true
        }
      });
      return;
    }

    // Fetch user data with addresses
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        roles: true,
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isActive: true,
        addresses: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'User not found'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user
      }
    });

  } catch (error) {
    console.error('Get user profile error:', error);
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
 * Update User Profile Controller
 */
export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
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
    const { email, phoneNumber } = req.body;

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

    // Find the current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'User not found'
        }
      });
      return;
    }

    const updateData: any = {};
    let emailChanged = false;
    let phoneChanged = false;

    // Handle email update
    if (email && email !== currentUser.email) {
      // Validate email format
      if (!validateEmailFormat(email)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_002',
            message: 'Invalid email format'
          }
        });
        return;
      }

      // Check if email is already taken by another user
      const existingEmailUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          id: { not: userId }
        }
      });

      if (existingEmailUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'AUTH_002',
            message: 'An account with this email already exists'
          }
        });
        return;
      }

      updateData.email = email.toLowerCase();
      updateData.emailVerified = false;
      emailChanged = true;
    }

    // Handle phone number update
    if (phoneNumber && phoneNumber !== currentUser.phoneNumber) {
      // Validate phone number format
      const phoneValidation = validatePhoneNumber(phoneNumber);
      if (!phoneValidation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VAL_002',
            message: phoneValidation.error || 'Invalid phone number format'
          }
        });
        return;
      }

      // Check if phone number is already taken by another user
      const existingPhoneUser = await prisma.user.findFirst({
        where: {
          phoneNumber: phoneValidation.formattedNumber,
          id: { not: userId }
        }
      });

      if (existingPhoneUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'An account with this phone number already exists'
          }
        });
        return;
      }

      updateData.phoneNumber = phoneValidation.formattedNumber;
      updateData.phoneVerified = false;
      phoneChanged = true;
    }

    // If no changes, return current user data
    if (Object.keys(updateData).length === 0) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phoneNumber: true,
          roles: true,
          emailVerified: true,
          phoneVerified: true,
          verificationStatus: true,
          authProvider: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          isActive: true,
          addresses: {
            orderBy: [
              { isPrimary: 'desc' },
              { createdAt: 'desc' }
            ]
          }
        }
      });

      res.status(200).json({
        success: true,
        message: 'No changes made to profile',
        data: { user }
      });
      return;
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        roles: true,
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        isActive: true,
        addresses: {
          orderBy: [
            { isPrimary: 'desc' },
            { createdAt: 'desc' }
          ]
        }
      }
    });

    // Send verification email if email was changed
    if (emailChanged && updatedUser.email) {
      try {
        const verificationToken = generateVerificationToken();
        EmailVerificationService.storeToken(verificationToken, userId, 24);

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
        
        const emailService = EmailService.getInstance();
        await emailService.sendVerificationEmail(
          updatedUser.email,
          verificationLink,
          updatedUser.email
        );
      } catch (error) {
        console.error('Failed to send verification email:', error);
        // Don't fail the update, just log the error
      }
    }

    // Send verification SMS if phone was changed
    if (phoneChanged && updatedUser.phoneNumber) {
      try {
        const verificationCode = generateVerificationCode();
        PhoneVerificationService.storeCode(userId, verificationCode, 10);

        const smsService = SMSService.getInstance();
        await smsService.sendVerificationCode(
          updatedUser.phoneNumber,
          verificationCode
        );
      } catch (error) {
        console.error('Failed to send verification SMS:', error);
        // Don't fail the update, just log the error
      }
    }

    // Prepare response message
    let message = 'Profile updated successfully';
    if (emailChanged && phoneChanged) {
      message += '. Verification emails and SMS have been sent to your new email and phone number.';
    } else if (emailChanged) {
      message += '. A verification email has been sent to your new email address.';
    } else if (phoneChanged) {
      message += '. A verification SMS has been sent to your new phone number.';
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        user: updatedUser,
        requiresEmailVerification: emailChanged,
        requiresPhoneVerification: phoneChanged
      }
    });

  } catch (error) {
    console.error('Update user profile error:', error);
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
 * Update User Profile Validation Middleware
 */
export const validateUpdateUserProfile = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phoneNumber')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number is required')
];

/**
 * Get User Verification Status Controller
 */
export const getUserVerificationStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;

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

    // Fetch user verification data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roles: true,
        verificationStatus: true,
        emailVerified: true,
        phoneVerified: true,
        verificationRequests: {
          orderBy: { submittedAt: 'desc' },
          take: 1,
          select: {
            id: true,
            documentType: true,
            status: true,
            rejectionReason: true,
            submittedAt: true,
            reviewedAt: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'User not found'
        }
      });
      return;
    }

    // Check if user has vendor role
    const isVendor = user.roles.includes('VENDOR');
    
    // Determine verification badge information
    let badgeInfo = {
      showBadge: false,
      badgeText: '',
      badgeColor: '',
      badgeIcon: ''
    };

    if (isVendor) {
      switch (user.verificationStatus) {
        case 'VERIFIED':
          badgeInfo = {
            showBadge: true,
            badgeText: 'Verified Vendor',
            badgeColor: 'green',
            badgeIcon: 'check-circle'
          };
          break;
        case 'PENDING':
          badgeInfo = {
            showBadge: true,
            badgeText: 'Verification Pending',
            badgeColor: 'yellow',
            badgeIcon: 'clock'
          };
          break;
        case 'UNVERIFIED':
        default:
          badgeInfo = {
            showBadge: true,
            badgeText: 'Unverified Vendor',
            badgeColor: 'gray',
            badgeIcon: 'exclamation-circle'
          };
          break;
      }
    }

    // Get latest verification request if exists
    const latestRequest = user.verificationRequests[0] || null;

    // Determine next steps for user
    let nextSteps: string[] = [];
    
    if (isVendor && user.verificationStatus === 'UNVERIFIED') {
      if (!latestRequest) {
        nextSteps.push('Submit verification documents to get verified vendor status');
      } else if (latestRequest.status === 'REJECTED') {
        nextSteps.push('Resubmit verification documents with corrections');
      }
    }

    if (!user.emailVerified) {
      nextSteps.push('Verify your email address');
    }

    if (!user.phoneVerified) {
      nextSteps.push('Verify your phone number');
    }

    res.status(200).json({
      success: true,
      data: {
        userId: user.id,
        roles: user.roles,
        isVendor,
        verificationStatus: user.verificationStatus,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        badge: badgeInfo,
        latestVerificationRequest: latestRequest,
        nextSteps,
        canSubmitVerification: isVendor && (
          !latestRequest || 
          latestRequest.status === 'REJECTED'
        )
      }
    });

  } catch (error) {
    console.error('Get user verification status error:', error);
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
 * Multer configuration for document uploads
 */
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'verification');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as any, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId;
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${userId}_${timestamp}_${file.fieldname}${ext}`;
    cb(null, filename);
  }
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow only specific file types
  const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

export const uploadDocuments = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5 // Maximum 5 files
  }
}).array('documents', 5);

/**
 * Submit Verification Request Controller
 */
export const submitVerificationRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { documentType } = req.body;
    const files = req.files as Express.Multer.File[];

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

    // Validate document type
    const validDocumentTypes = ['national_id', 'business_license', 'passport', 'drivers_license'];
    if (!documentType || !validDocumentTypes.includes(documentType)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_002',
          message: `Invalid document type. Valid types: ${validDocumentTypes.join(', ')}`
        }
      });
      return;
    }

    // Validate files
    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'At least one document file is required'
        }
      });
      return;
    }

    // Find the user and check vendor role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        roles: true,
        verificationStatus: true,
        verificationRequests: {
          where: { status: 'PENDING' },
          take: 1
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'User not found'
        }
      });
      return;
    }

    // Check if user has vendor role
    if (!user.roles.includes('VENDOR')) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Only vendors can submit verification requests'
        }
      });
      return;
    }

    // Check if user already has a pending verification request
    if (user.verificationRequests.length > 0) {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: 'You already have a pending verification request. Please wait for review.'
        }
      });
      return;
    }

    // In a production environment, you would upload files to cloud storage (S3, etc.)
    // For now, we'll store local file paths (this is just for demonstration)
    const documentUrls = files.map(file => {
      // In production, this would be the S3 URL or similar cloud storage URL
      return `/uploads/verification/${file.filename}`;
    });

    // Create verification request
    const verificationRequest = await prisma.verificationRequest.create({
      data: {
        userId,
        documentType,
        documentUrls,
        status: 'PENDING'
      }
    });

    // Update user verification status to pending
    await prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: 'PENDING' }
    });

    // In a production environment, you might want to:
    // 1. Send notification to administrators about new verification request
    // 2. Send confirmation email to user
    // 3. Upload files to secure cloud storage
    // 4. Scan files for malware
    // 5. Extract text from documents for automated verification

    res.status(201).json({
      success: true,
      message: 'Verification request submitted successfully. Our team will review your documents within 2-3 business days.',
      data: {
        verificationRequestId: verificationRequest.id,
        status: verificationRequest.status,
        documentType: verificationRequest.documentType,
        submittedAt: verificationRequest.submittedAt,
        documentsCount: documentUrls.length
      }
    });

  } catch (error) {
    console.error('Submit verification request error:', error);
    
    // Clean up uploaded files if there was an error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      for (const file of files) {
        try {
          await fs.unlink(file.path);
        } catch (unlinkError) {
          console.error('Failed to clean up file:', file.path, unlinkError);
        }
      }
    }

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
 * Submit Verification Request Validation Middleware
 */
export const validateSubmitVerificationRequest = [
  body('documentType')
    .isIn(['national_id', 'business_license', 'passport', 'drivers_license'])
    .withMessage('Valid document type is required')
];

/**
 * Delete User Account Controller
 */
export const deleteUserAccount = async (req: Request, res: Response): Promise<void> => {
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
    const { confirmationToken } = req.body;

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

    // Validate confirmation token
    if (!confirmationToken || confirmationToken !== 'DELETE_MY_ACCOUNT') {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Invalid confirmation token. Please type "DELETE_MY_ACCOUNT" to confirm account deletion.'
        }
      });
      return;
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        isActive: true,
        addresses: true,
        sessions: true,
        verificationRequests: true
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'User not found'
        }
      });
      return;
    }

    // Display data retention policy information in response
    const dataRetentionInfo = {
      policy: 'Account Deletion and Data Retention Policy',
      details: [
        'Your account will be deactivated immediately',
        'Personal data will be anonymized within 30 days',
        'Transaction records may be retained for legal compliance (up to 7 years)',
        'Verification documents will be securely deleted within 90 days',
        'Some data may be retained in encrypted backups for up to 1 year'
      ],
      contact: 'For questions about data retention, contact privacy@africancommerce.com'
    };

    // Perform soft delete (set isActive to false) instead of hard delete
    // This allows for data retention compliance and potential account recovery
    await prisma.$transaction([
      // Deactivate user account
      prisma.user.update({
        where: { id: userId },
        data: { 
          isActive: false,
          // Optionally anonymize some fields immediately
          email: user.email ? `deleted_${userId}@deleted.local` : null,
          phoneNumber: user.phoneNumber ? `deleted_${userId}` : null
        }
      }),
      // Invalidate all sessions
      prisma.session.deleteMany({
        where: { userId: userId }
      })
      // Note: We keep addresses and verification requests for compliance
      // These would be cleaned up by a background job according to retention policy
    ]);

    // Send notification email if user had an email (before anonymization)
    if (user.email && user.email !== `deleted_${userId}@deleted.local`) {
      try {
        const emailService = EmailService.getInstance();
        await emailService.sendNotificationEmail(
          user.email,
          'Account Deletion Confirmation',
          `Your African E-commerce account has been successfully deleted. If you did not request this deletion, please contact our support team immediately at support@africancommerce.com.`,
          user.email
        );
      } catch (error) {
        console.error('Failed to send account deletion notification email:', error);
        // Don't fail the deletion process
      }
    }

    // Send notification SMS if user had a phone number (before anonymization)
    if (user.phoneNumber && user.phoneNumber !== `deleted_${userId}`) {
      try {
        const smsService = SMSService.getInstance();
        await smsService.sendSMS(
          user.phoneNumber,
          'Your African E-commerce account has been deleted. If you did not request this, contact support immediately.'
        );
      } catch (error) {
        console.error('Failed to send account deletion notification SMS:', error);
        // Don't fail the deletion process
      }
    }

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully. We\'re sorry to see you go!',
      data: {
        deletedAt: new Date().toISOString(),
        dataRetention: dataRetentionInfo,
        nextSteps: [
          'You have been logged out of all devices',
          'Your account is now deactivated',
          'Personal data will be processed according to our retention policy',
          'Contact support if you need assistance'
        ]
      }
    });

  } catch (error) {
    console.error('Delete user account error:', error);
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
 * Delete User Account Validation Middleware
 */
export const validateDeleteUserAccount = [
  body('confirmationToken')
    .equals('DELETE_MY_ACCOUNT')
    .withMessage('Confirmation token must be "DELETE_MY_ACCOUNT"')
];
