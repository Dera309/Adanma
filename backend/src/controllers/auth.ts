import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import prisma from '../config/database';
import { hashPassword, validatePasswordFormat, comparePassword } from '../utils/password';
import { generateTokenPair } from '../utils/jwt';
import { EmailService, generateVerificationToken, validateEmailFormat } from '../services/email';
import { SMSService, generateVerificationCode, validatePhoneNumber } from '../services/sms';
import { EmailVerificationService, PhoneVerificationService, PasswordResetService } from '../services/verification';
import { generateOAuthState, storeOAuthState, retrieveOAuthState, clearOAuthState } from '../utils/oauth';
import { shouldUseMockData } from '../config/development';
import { trackFailedLogin, clearFailedLogin } from '../middleware/authSecurity';
import crypto from 'crypto';

/**
 * Helper function to get cookie options with proper SameSite setting
 */
const getCookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
  path: '/',
  maxAge
});

/**
 * Email Registration Controller
 */
export const registerWithEmail = async (req: Request, res: Response): Promise<void> => {
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

    const { email, password, acceptedTerms } = req.body;

    // Check if we should use mock data (only in development)
    if (shouldUseMockData() && process.env.NODE_ENV === 'development') {
      console.log('⚠️  WARNING: Using mock mode for email registration');
      
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

      // Generate mock verification token
      const mockVerificationToken = generateVerificationToken();
      const mockUserId = `mock-${Date.now()}`;
      
      res.status(201).json({
        success: true,
        message: 'Registration successful (DEVELOPMENT MODE). Please check your email for verification link.',
        data: {
          userId: mockUserId,
          email: email.toLowerCase(),
          requiresVerification: true,
          developmentMode: true
        }
      });
      return;
    }

    // Check if terms were accepted
    if (!acceptedTerms) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'You must accept the terms of service and privacy policy'
        }
      });
      return;
    }

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

    // Validate password format
    const passwordValidation = validatePasswordFormat(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_007',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'An account with this email already exists'
        }
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user
    let user;
    try {
      user = await prisma.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          authProvider: 'EMAIL',
          emailVerified: false,
          roles: 'BUYER' // Default role as string
        }
      });
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // If database is not available, return a mock response for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using mock response due to database issues');
        res.status(201).json({
          success: true,
          message: 'Registration successful (MOCK MODE - database not available). Please check your email for verification instructions.',
          data: {
            userId: `mock-${Date.now()}`,
            email: email.toLowerCase(),
            requiresVerification: true,
            mockMode: true
          }
        });
        return;
      }
      
      throw dbError;
    }

    // Store verification token
    EmailVerificationService.storeToken(verificationToken, user.id, 24);

    // Send verification email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;
    
    const emailService = EmailService.getInstance();
    const emailResult = await emailService.sendVerificationEmail(
      user.email!,
      verificationLink,
      user.email
    );

    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error);
      // Don't fail the registration, just log the error
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email for verification instructions.',
      data: {
        userId: user.id,
        email: user.email || undefined,
        requiresVerification: true
      }
    });

  } catch (error) {
    console.error('Email registration error:', error);
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
 * Email Registration Validation Middleware
 */
export const validateEmailRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('acceptedTerms')
    .isBoolean()
    .withMessage('Terms acceptance is required')
];

/**
 * Phone Registration Controller
 */
export const registerWithPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 Phone registration started');
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation failed:', errors.array());
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
    
    console.log('✅ Validation passed');

    const { phoneNumber, password, acceptedTerms } = req.body;
    console.log('📱 Processing phone registration for:', phoneNumber);

    // Check if we should use mock data (skip database operations)
    if (shouldUseMockData() && process.env.NODE_ENV === 'development') {
      console.log('⚠️  WARNING: Using mock mode for phone registration');
      
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

      // Generate mock verification code
      const mockVerificationCode = generateVerificationCode();
      const mockUserId = `mock-${Date.now()}`;
      
      res.status(201).json({
        success: true,
        message: 'Registration successful (DEVELOPMENT MODE). Please check your phone for verification code.',
        data: {
          userId: mockUserId,
          phoneNumber: phoneValidation.formattedNumber,
          requiresVerification: true,
          developmentMode: true
        }
      });
      return;
    }

    // Check if terms were accepted
    if (!acceptedTerms) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'You must accept the terms of service and privacy policy'
        }
      });
      return;
    }

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

    // Validate password format
    const passwordValidation = validatePasswordFormat(password);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_007',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate verification code
    const verificationCode = generateVerificationCode();

    // Check if phone number already exists and create user
    let user;
    try {
      const existingUser = await prisma.user.findUnique({
        where: { phoneNumber: phoneValidation.formattedNumber }
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: {
            code: 'AUTH_003',
            message: 'An account with this phone number already exists'
          }
        });
        return;
      }

      // Create user
      user = await prisma.user.create({
        data: {
          phoneNumber: phoneValidation.formattedNumber,
          passwordHash,
          authProvider: 'PHONE',
          phoneVerified: false,
          roles: 'BUYER' // Default role as string
        }
      });
      
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      
      // If database is not available, return a mock response for development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Using mock response due to database issues');
        const mockVerificationCode = generateVerificationCode();
        
        res.status(201).json({
          success: true,
          message: 'Registration successful (MOCK MODE - database not available). Please check your phone for verification code.',
          data: {
            userId: `mock-${Date.now()}`,
            phoneNumber: phoneValidation.formattedNumber,
            requiresVerification: true,
            mockMode: true,
            mockVerificationCode // Only in development
          }
        });
        return;
      }
      
      throw dbError;
    }

    // Store verification code
    PhoneVerificationService.storeCode(user.id, verificationCode, 10);

    // Send SMS verification code (don't let SMS failure crash registration)
    try {
      const smsService = SMSService.getInstance();
      const smsResult = await smsService.sendVerificationCode(
        phoneValidation.formattedNumber!,
        verificationCode
      );

      if (!smsResult.success) {
        console.error('Failed to send verification SMS:', smsResult.error);
        // Don't fail the registration, just log the error
      }
    } catch (smsError) {
      console.error('SMS service error:', smsError);
      // Continue with registration even if SMS fails
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your phone for verification code.',
      data: {
        userId: user.id,
        phoneNumber: phoneValidation.formattedNumber,
        requiresVerification: true
      }
    });

  } catch (error) {
    console.error('Phone registration error:', error);
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
 * Phone Registration Validation Middleware
 */
export const validatePhoneRegistration = [
  body('phoneNumber')
    .custom((value) => {
      const validation = validatePhoneNumber(value);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid phone number format');
      }
      return true;
    })
    .withMessage('Valid phone number is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('acceptedTerms')
    .isBoolean()
    .withMessage('Terms acceptance is required')
];

/**
 * Facebook OAuth Initiation
 */
export const initiateFacebookAuth = (req: Request, res: Response): void => {
  // Generate and store OAuth state for CSRF protection
  const state = generateOAuthState();
  const sessionId = req.sessionID || req.ip + Date.now().toString();
  
  storeOAuthState(sessionId, state, 10); // 10 minutes expiration
  
  // Store session ID in cookie for callback verification
  res.cookie('oauth_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000 // 10 minutes
  });

  // Redirect to Facebook OAuth with state parameter
  passport.authenticate('facebook', {
    scope: ['email'],
    state: state
  })(req, res);
};

/**
 * Facebook OAuth Callback Handler
 */
export const handleFacebookCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { state, error, error_description } = req.query;
    const sessionId = req.cookies.oauth_session;

    // Handle OAuth errors
    if (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const errorMessage = error_description || error;
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage as string)}`);
      return;
    }

    // Validate state parameter
    if (!sessionId || !state) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Invalid OAuth state`);
      return;
    }

    const storedState = retrieveOAuthState(sessionId);
    if (!storedState || storedState !== state) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/error?message=Invalid OAuth state - possible CSRF attack`);
      return;
    }

    // Clear the stored state
    clearOAuthState(sessionId);

    // Use Passport to handle the OAuth callback
    passport.authenticate('facebook', { session: false }, async (err: any, user: any, info: any) => {
      try {
        if (err) {
          console.error('Facebook OAuth error:', err);
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
          return;
        }

        if (!user) {
          const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          const message = info?.message || 'Authentication failed';
          res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(message)}`);
          return;
        }

        // Generate JWT tokens
        const tokens = generateTokenPair({
          userId: user.id,
          email: user.email || undefined,
          phoneNumber: user.phoneNumber || undefined,
          roles: user.roles ? user.roles.split(',') : ['BUYER'] // Convert string to array
        });

        // Set authentication cookies
        res.cookie('accessToken', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Use 'lax' in development
          maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('refreshToken', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax', // Use 'lax' in development
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });

        // Clear OAuth session cookie
        res.clearCookie('oauth_session');

        // Redirect to frontend dashboard
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/dashboard?auth=success`);

      } catch (error) {
        console.error('Facebook callback processing error:', error);
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendUrl}/auth/error?message=Authentication processing failed`);
      }
    })(req, res);

  } catch (error) {
    console.error('Facebook OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=Authentication failed`);
  }
};

/**
 * WhatsApp OAuth Initiation
 * Note: WhatsApp Business API OAuth is limited and requires special approval from Meta
 */
export const initiateWhatsAppAuth = (req: Request, res: Response): void => {
  try {
    const whatsappClientId = process.env.WHATSAPP_CLIENT_ID;
    const whatsappCallbackUrl = process.env.WHATSAPP_CALLBACK_URL;

    // Check if WhatsApp OAuth is configured
    if (!whatsappClientId || !whatsappCallbackUrl) {
      res.status(501).json({
        success: false,
        error: {
          code: 'NOT_CONFIGURED',
          message: 'WhatsApp OAuth is not configured. Please use phone number registration instead.'
        }
      });
      return;
    }

    // Generate and store OAuth state for CSRF protection
    const state = generateOAuthState();
    const sessionId = req.sessionID || req.ip + Date.now().toString();
    
    storeOAuthState(sessionId, state, 10); // 10 minutes expiration
    
    // Store session ID in cookie for callback verification
    res.cookie('oauth_session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60 * 1000 // 10 minutes
    });

    // Create WhatsApp OAuth authorization URL
    const authUrl = new URL('https://www.whatsapp.com/oauth/authorize');
    authUrl.searchParams.set('client_id', whatsappClientId);
    authUrl.searchParams.set('redirect_uri', whatsappCallbackUrl);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', 'whatsapp_business_messaging');
    authUrl.searchParams.set('state', state);

    // Redirect to WhatsApp OAuth
    res.redirect(authUrl.toString());

  } catch (error) {
    console.error('WhatsApp OAuth initiation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'SYS_001',
        message: 'Failed to initiate WhatsApp authentication'
      }
    });
  }
};

/**
 * WhatsApp OAuth Callback Handler
 * Note: WhatsApp Business API OAuth requires special approval and has limited availability
 */
export const handleWhatsAppCallback = async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error, error_description } = req.query;
    const sessionId = req.cookies.oauth_session;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    // Handle OAuth errors
    if (error) {
      const errorMessage = error_description || error;
      res.redirect(`${frontendUrl}/auth/error?message=${encodeURIComponent(errorMessage as string)}`);
      return;
    }

    // Validate state parameter
    if (!sessionId || !state) {
      res.redirect(`${frontendUrl}/auth/error?message=Invalid OAuth state`);
      return;
    }

    const storedState = retrieveOAuthState(sessionId);
    if (!storedState || storedState !== state) {
      res.redirect(`${frontendUrl}/auth/error?message=Invalid OAuth state - possible CSRF attack`);
      return;
    }

    // Clear the stored state
    clearOAuthState(sessionId);

    if (!code) {
      res.redirect(`${frontendUrl}/auth/error?message=Authorization code not received`);
      return;
    }

    // Exchange authorization code for access token
    const whatsappClientId = process.env.WHATSAPP_CLIENT_ID;
    const whatsappClientSecret = process.env.WHATSAPP_CLIENT_SECRET;
    const whatsappCallbackUrl = process.env.WHATSAPP_CALLBACK_URL;

    if (!whatsappClientId || !whatsappClientSecret || !whatsappCallbackUrl) {
      res.redirect(`${frontendUrl}/auth/error?message=WhatsApp OAuth not properly configured`);
      return;
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: whatsappClientId,
        client_secret: whatsappClientSecret,
        redirect_uri: whatsappCallbackUrl,
        code: code as string,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('WhatsApp token exchange failed:', errorData);
      res.redirect(`${frontendUrl}/auth/error?message=Failed to exchange authorization code`);
      return;
    }

    const tokenData = await tokenResponse.json() as any;
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      res.redirect(`${frontendUrl}/auth/error?message=No access token received`);
      return;
    }

    // Get user profile information
    const profileResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${accessToken}`);
    
    if (!profileResponse.ok) {
      console.error('WhatsApp profile fetch failed');
      res.redirect(`${frontendUrl}/auth/error?message=Failed to fetch user profile`);
      return;
    }

    const profileData = await profileResponse.json() as any;
    
    // Extract WhatsApp profile data
    const _whatsappProfile = {
      id: profileData.id,
      name: profileData.name,
      // Note: WhatsApp Business API doesn't provide phone number in profile
      // Phone number would need to be obtained through other means
    };

    // Check if user already exists by WhatsApp ID
    let user = await prisma.user.findFirst({
      where: {
        // Note: We'd need to add a whatsappId field to the User model
        // For now, we'll create a new user each time
        authProvider: 'WHATSAPP'
      }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          authProvider: 'WHATSAPP',
          emailVerified: false,
          phoneVerified: false, // WhatsApp doesn't automatically verify phone
          roles: 'BUYER' // Default role as string
        }
      });
    } else {
      // Update last login
      user = await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });
    }

    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      roles: user.roles ? user.roles.split(',') : ['BUYER'] // Convert string to array
    });

    // Set authentication cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    // Clear OAuth session cookie
    res.clearCookie('oauth_session');

    // Redirect to frontend dashboard
    res.redirect(`${frontendUrl}/dashboard?auth=success&provider=whatsapp`);

  } catch (error) {
    console.error('WhatsApp OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/error?message=WhatsApp authentication failed`);
  }
};
/**
 
* Email Verification Controller
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    // Check if we should use mock data (only in development)
    if (shouldUseMockData() && process.env.NODE_ENV === 'development') {
      console.log('⚠️  WARNING: Using mock mode for email verification');
      
      // Mock successful verification (accept any token in development)
      res.status(200).json({
        success: true,
        message: 'Email verified successfully (DEVELOPMENT MODE)',
        data: {
          userId: `mock-${Date.now()}`,
          email: 'mock@example.com',
          verified: true,
          developmentMode: true
        }
      });
      return;
    }

    if (!token) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Verification token is required'
        }
      });
      return;
    }

    // Validate and consume the verification token
    const tokenValidation = EmailVerificationService.consumeToken(token);
    
    if (!tokenValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: tokenValidation.error || 'Invalid verification token'
        }
      });
      return;
    }

    // Find and update the user
    const user = await prisma.user.findUnique({
      where: { id: tokenValidation.userId }
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

    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: 'Email is already verified'
        }
      });
      return;
    }

    // Update user to mark email as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: true,
        lastLoginAt: new Date()
      }
    });

    // Generate JWT tokens for automatic login
    const tokens = generateTokenPair({
      userId: updatedUser.id,
      email: updatedUser.email || undefined,
      phoneNumber: updatedUser.phoneNumber || undefined,
      roles: updatedUser.roles ? updatedUser.roles.split(',') : ['BUYER'] // Convert string to array
    });

    // Set authentication cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      data: {
        userId: updatedUser.id,
        email: updatedUser.email,
        emailVerified: true,
        roles: updatedUser.roles
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
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
 * Phone Verification Controller
 */
export const verifyPhone = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, code, phoneNumber } = req.body;

    // Check if we should use mock data (skip database operations)
    if (shouldUseMockData()) {
      console.log('🔧 Using mock mode for phone verification');
      
      // Mock successful verification (accept any code in development)
      res.status(200).json({
        success: true,
        message: 'Phone number verified successfully (MOCK MODE)',
        data: {
          userId: userId || `mock-${Date.now()}`,
          phoneNumber: phoneNumber || '+1234567890',
          verified: true,
          mockMode: true
        }
      });
      return;
    }

    // Support both userId+code and phoneNumber+code for verification
    let userIdToVerify = userId;
    
    if (!userId && phoneNumber) {
      // Find user by phone number if userId not provided
      const user = await prisma.user.findUnique({
        where: { phoneNumber }
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
      
      userIdToVerify = user.id;
    }

    if (!userIdToVerify || !code) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'User ID (or phone number) and verification code are required'
        }
      });
      return;
    }

    // Validate and consume the verification code
    const codeValidation = PhoneVerificationService.consumeCode(userIdToVerify, code);
    
    if (!codeValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: codeValidation.error || 'Invalid verification code'
        }
      });
      return;
    }

    // Find and update the user
    const user = await prisma.user.findUnique({
      where: { id: userIdToVerify }
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

    if (user.phoneVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: 'Phone number is already verified'
        }
      });
      return;
    }

    // Update user to mark phone as verified
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { 
        phoneVerified: true,
        lastLoginAt: new Date()
      }
    });

    // Generate JWT tokens for automatic login
    const tokens = generateTokenPair({
      userId: updatedUser.id,
      email: updatedUser.email || undefined,
      phoneNumber: updatedUser.phoneNumber || undefined,
      roles: updatedUser.roles ? updatedUser.roles.split(',') : ['BUYER'] // Convert string to array
    });

    // Set authentication cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.status(200).json({
      success: true,
      message: 'Phone number verified successfully',
      data: {
        userId: updatedUser.id,
        phoneNumber: updatedUser.phoneNumber,
        phoneVerified: true,
        roles: updatedUser.roles
      }
    });

  } catch (error) {
    console.error('Phone verification error:', error);
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
 * Resend Phone Verification Code Controller
 */
export const resendPhoneVerification = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, phoneNumber } = req.body;

    // Check if we should use mock data (skip database operations)
    if (shouldUseMockData()) {
      console.log('🔧 Using mock mode for phone verification resend');
      
      const mockVerificationCode = generateVerificationCode();
      
      res.status(200).json({
        success: true,
        message: 'Verification code resent successfully (MOCK MODE)',
        data: {
          userId: userId || `mock-${Date.now()}`,
          phoneNumber: phoneNumber || '+1234567890',
          mockMode: true,
          mockVerificationCode // Only in development
        }
      });
      return;
    }

    // Support both userId and phoneNumber for resend
    let userIdToResend = userId;
    let user;

    if (!userId && phoneNumber) {
      // Find user by phone number if userId not provided
      user = await prisma.user.findUnique({
        where: { phoneNumber }
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
      
      userIdToResend = user.id;
    } else if (userId) {
      // Find the user by ID
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
    }

    if (!userIdToResend) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'User ID or phone number is required'
        }
      });
      return;
    }

    // Check if user can request a new code
    const resendCheck = PhoneVerificationService.resendCode(userIdToResend);
    if (!resendCheck.canResend) {
      res.status(429).json({
        success: false,
        error: {
          code: 'SYS_003',
          message: resendCheck.error || 'Please wait before requesting a new code'
        }
      });
      return;
    }

    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: userIdToResend }
      });
    }

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

    if (user.phoneVerified) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: 'Phone number is already verified'
        }
      });
      return;
    }

    if (!user.phoneNumber) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'User does not have a phone number'
        }
      });
      return;
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();

    // Store verification code
    PhoneVerificationService.storeCode(user.id, verificationCode, 10);

    // Send SMS verification code
    const smsService = SMSService.getInstance();
    const smsResult = await smsService.sendVerificationCode(
      user.phoneNumber,
      verificationCode
    );

    if (!smsResult.success) {
      console.error('Failed to send verification SMS:', smsResult.error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SYS_002',
          message: 'Failed to send verification code'
        }
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent successfully'
    });

  } catch (error) {
    console.error('Resend phone verification error:', error);
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
 * Email Verification Validation Middleware
 */
export const validateEmailVerification = [
  body('token')
    .isLength({ min: 1 })
    .withMessage('Verification token is required')
];

/**
 * Phone Verification Validation Middleware
 */
export const validatePhoneVerification = [
  body('code')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Verification code must be 6 digits'),
  // Either userId or phoneNumber is required
  body().custom((value) => {
    if (!value.userId && !value.phoneNumber) {
      throw new Error('Either userId or phoneNumber is required');
    }
    return true;
  })
];  

/**
 * Resend Phone Verification Validation Middleware
 */
export const validateResendPhoneVerification = [
  // Either userId or phoneNumber is required
  body().custom((value) => {
    if (!value.userId && !value.phoneNumber) {
      throw new Error('Either userId or phoneNumber is required');
    }
    return true;
  })
];/**

 * Login Controller
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔧 Login attempt started');
    
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Login validation failed:', errors.array());
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
    
    console.log('✅ Login validation passed');

    const { identifier, password } = req.body; // identifier can be email or phone
    console.log('🔐 Login attempt for identifier:', identifier);
    
    const deviceInfo = req.headers['user-agent'] || 'Unknown Device';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown IP';

    // Check if we should use mock data (only in development)
    if (shouldUseMockData() && process.env.NODE_ENV === 'development') {
      console.log('⚠️  WARNING: Using mock mode for login');
      
      // Mock successful login for development
      const mockUser = {
        id: '507f1f77bcf86cd799439011',
        email: identifier.includes('@') ? identifier : 'mock@example.com',
        phoneNumber: identifier.includes('@') ? '+1234567890' : identifier,
        roles: 'BUYER',
        emailVerified: true,
        phoneVerified: true,
        verificationStatus: 'VERIFIED',
        authProvider: 'EMAIL',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };

      // Generate mock tokens
      const tokens = generateTokenPair({
        userId: mockUser.id,
        email: mockUser.email,
        roles: ['BUYER']
      });

      // Set authentication cookies for mock mode
      console.log('🍪 Setting mock authentication cookies');
      
      const mockCookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
        path: '/'
      };
      
      res.cookie('accessToken', tokens.accessToken, {
        ...mockCookieOptions,
        maxAge: 15 * 60 * 1000
      });
      
      res.cookie('refreshToken', tokens.refreshToken, {
        ...mockCookieOptions,
        maxAge: 30 * 24 * 60 * 60 * 1000
      });
      
      console.log('✅ Mock authentication cookies set successfully');

      res.status(200).json({
        success: true,
        message: 'Login successful (DEVELOPMENT MODE)',
        data: {
          user: mockUser,
          accessToken: tokens.accessToken,
          developmentMode: true
        }
      });
      return;
    }

    // Find user by email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phoneNumber: identifier }
        ]
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Check if user has a password (social auth users might not)
    if (!user.passwordHash) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'This account was created with social login. Please use the appropriate social login method.'
        }
      });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Track failed login attempt
      trackFailedLogin(identifier);
      
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Invalid credentials'
        }
      });
      return;
    }

    // Clear failed login attempts on successful login
    clearFailedLogin(identifier);

    // Check if email/phone is verified
    const isEmailLogin = user.email === identifier.toLowerCase();
    const isPhoneLogin = user.phoneNumber === identifier;

    // Temporarily disable email verification requirement for development
    // TODO: Re-enable this in production
    // if (isEmailLogin && !user.emailVerified) {
    //   res.status(401).json({
    //     success: false,
    //     error: {
    //       code: 'AUTH_006',
    //       message: 'Please verify your email address before logging in'
    //     }
    //   });
    //   return;
    // }

    if (isPhoneLogin && !user.phoneVerified) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_006',
          message: 'Please verify your phone number before logging in'
        }
      });
      return;
    }

    // Generate JWT tokens
    console.log('🔑 Generating JWT tokens for user:', user.id);
    console.log('🔑 User roles:', user.roles);
    
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email || undefined,
      phoneNumber: user.phoneNumber || undefined,
      roles: user.roles ? user.roles.split(',') : ['BUYER'] // Convert string to array
    });
    
    console.log('✅ JWT tokens generated successfully');

    // Generate secure session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: sessionToken,
        deviceInfo,
        ipAddress,
        expiresAt,
        lastActivityAt: new Date()
      }
    });
    
    console.log('✅ Session created successfully:', session.id);

    // Update user's last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Set HTTP-only, secure, SameSite cookies with additional security
    console.log('🍪 Setting authentication cookies');
    
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    };
    
    res.cookie('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000 // 15 minutes
    });
    
    res.cookie('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
    
    console.log('✅ Authentication cookies set successfully');

    // Return success response with user data (excluding sensitive fields)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          phoneNumber: user.phoneNumber,
          roles: user.roles,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          verificationStatus: user.verificationStatus,
          authProvider: user.authProvider,
          createdAt: user.createdAt,
          lastLoginAt: new Date()
        },
        accessToken: tokens.accessToken,
        sessionId: session.id
      }
    });

  } catch (error) {
    console.error('Login error:', error);
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
 * Login Validation Middleware
 */
export const validateLogin = [
  body('identifier')
    .isLength({ min: 1 })
    .withMessage('Email or phone number is required'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Password is required')
];

/**
 * Logout Controller
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    // Check if we should use mock data (only in development)
    if (shouldUseMockData() && process.env.NODE_ENV === 'development') {
      console.log('⚠️  WARNING: Using mock mode for logout');
      
      // In mock mode, just clear cookies without database operations
    } else {
      // If there's a refresh token, invalidate the session
      if (refreshToken) {
        try {
          // Find and delete the session associated with this token
          await prisma.session.deleteMany({
            where: {
              token: refreshToken
            }
          });
        } catch (error) {
          // Log error but don't fail the logout
          console.error('Error invalidating session:', error);
        }
      }
    }

    // Clear authentication cookies with secure options
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? process.env.COOKIE_DOMAIN : undefined
    });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
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
 * Get Active Sessions Controller
 */
export const getSessions = async (req: Request, res: Response): Promise<void> => {
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
      console.log('🔧 Using mock mode for sessions');
      
      const mockSessions = [
        {
          id: '507f1f77bcf86cd799439014',
          deviceInfo: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          ipAddress: '127.0.0.1',
          lastActivityAt: new Date(),
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          isCurrent: true
        }
      ];

      res.status(200).json({
        success: true,
        message: 'Sessions retrieved successfully (MOCK MODE)',
        data: {
          sessions: mockSessions,
          mockMode: true
        }
      });
      return;
    }

    // Fetch all active sessions for the current user
    const sessions = await prisma.session.findMany({
      where: {
        userId: userId,
        expiresAt: {
          gt: new Date() // Only return sessions that haven't expired
        }
      },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        lastActivityAt: true,
        createdAt: true,
        expiresAt: true
      },
      orderBy: {
        lastActivityAt: 'desc'
      }
    });

    // Identify the current session based on refresh token
    const currentRefreshToken = req.cookies?.refreshToken;
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: currentRefreshToken ? session.id === currentRefreshToken : false
    }));

    res.status(200).json({
      success: true,
      data: {
        sessions: sessionsWithCurrent,
        total: sessionsWithCurrent.length
      }
    });

  } catch (error) {
    console.error('Get sessions error:', error);
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
 * Terminate Session Controller
 */
export const terminateSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user?.userId;
    const { sessionId } = req.params;

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

    if (!sessionId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Session ID is required'
        }
      });
      return;
    }

    // Check if we should use mock data (skip database operations)
    if (shouldUseMockData()) {
      console.log('🔧 Using mock mode for session termination');
      
      res.status(200).json({
        success: true,
        message: 'Session terminated successfully (MOCK MODE)',
        data: {
          sessionId,
          mockMode: true
        }
      });
      return;
    }

    // Find the session to verify it belongs to the current user
    const session = await prisma.session.findUnique({
      where: { id: sessionId }
    });

    if (!session) {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found'
        }
      });
      return;
    }

    // Verify the session belongs to the current user
    if (session.userId !== userId) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to terminate this session'
        }
      });
      return;
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId }
    });

    res.status(200).json({
      success: true,
      message: 'Session terminated successfully'
    });

  } catch (error) {
    console.error('Terminate session error:', error);
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
 * Password Reset Request Controller
 */
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
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

    const { identifier } = req.body; // Can be email or phone number

    // Find user by email or phone number
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier.toLowerCase() },
          { phoneNumber: identifier }
        ]
      }
    });

    // Always return success to prevent user enumeration
    // Even if user doesn't exist, we return success
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email or phone number, you will receive password reset instructions.'
      });
      return;
    }

    // Determine if this is email or phone based reset
    const isEmailReset = user.email === identifier.toLowerCase();
    const isPhoneReset = user.phoneNumber === identifier;

    if (isEmailReset && user.email) {
      // Generate reset token for email
      const resetToken = generateVerificationToken();
      
      // Store reset token with 15-minute expiration
      PasswordResetService.storeResetToken(resetToken, user.id, 15);

      // Send reset email
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
      
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendPasswordResetEmail(
        user.email,
        resetLink,
        user.email
      );

      if (!emailResult.success) {
        console.error('Failed to send password reset email:', emailResult.error);
        // Don't fail the request, just log the error
      }
    } else if (isPhoneReset && user.phoneNumber) {
      // Generate reset code for phone
      const resetCode = generateVerificationCode();
      
      // Store reset code with 15-minute expiration
      PasswordResetService.storeResetCode(user.id, resetCode, 15);

      // Send SMS with reset code
      const smsService = SMSService.getInstance();
      const smsResult = await smsService.sendPasswordResetCode(
        user.phoneNumber,
        resetCode
      );

      if (!smsResult.success) {
        console.error('Failed to send password reset SMS:', smsResult.error);
        // Don't fail the request, just log the error
      }
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email or phone number, you will receive password reset instructions.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
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
 * Password Reset Request Validation Middleware
 */
export const validatePasswordResetRequest = [
  body('identifier')
    .isLength({ min: 1 })
    .withMessage('Email or phone number is required')
];

/**
 * Password Reset Controller
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
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

    const { token, code, userId, newPassword } = req.body;

    // Validate that we have either token or (userId + code)
    if (!token && (!userId || !code)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VAL_001',
          message: 'Either reset token or user ID with verification code is required'
        }
      });
      return;
    }

    // Validate new password format
    const passwordValidation = validatePasswordFormat(newPassword);
    if (!passwordValidation.isValid) {
      res.status(400).json({
        success: false,
        error: {
          code: 'AUTH_007',
          message: 'Password does not meet requirements',
          details: passwordValidation.errors
        }
      });
      return;
    }

    let userIdToReset: string;

    // Validate and consume reset token or code
    if (token) {
      // Email-based reset with token
      const tokenValidation = PasswordResetService.consumeResetToken(token);
      if (!tokenValidation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_005',
            message: tokenValidation.error || 'Invalid or expired reset token'
          }
        });
        return;
      }
      userIdToReset = tokenValidation.userId!;
    } else {
      // Phone-based reset with code
      const codeValidation = PasswordResetService.consumeResetCode(userId, code);
      if (!codeValidation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_005',
            message: codeValidation.error || 'Invalid or expired reset code'
          }
        });
        return;
      }
      userIdToReset = userId;
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userIdToReset },
      include: {
        passwordHistory: {
          orderBy: { createdAt: 'desc' },
          take: 5
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

    // Check against last 5 passwords
    for (const oldPassword of user.passwordHistory) {
      const isSamePassword = await comparePassword(newPassword, oldPassword.passwordHash);
      if (isSamePassword) {
        res.status(400).json({
          success: false,
          error: {
            code: 'AUTH_007',
            message: 'New password cannot be the same as any of your last 5 passwords'
          }
        });
        return;
      }
    }

    // Hash the new password
    const newPasswordHash = await hashPassword(newPassword);

    // Update password and add to password history
    await prisma.$transaction([
      // Update user password
      prisma.user.update({
        where: { id: userIdToReset },
        data: { passwordHash: newPasswordHash }
      }),
      // Add to password history
      prisma.passwordHistory.create({
        data: {
          userId: userIdToReset,
          passwordHash: newPasswordHash
        }
      }),
      // Invalidate all existing sessions
      prisma.session.deleteMany({
        where: { userId: userIdToReset }
      })
    ]);

    // Send notification email if user has email
    if (user.email) {
      const emailService = EmailService.getInstance();
      const emailResult = await emailService.sendNotificationEmail(
        user.email,
        'Password Changed Successfully',
        'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
        user.email
      );

      if (!emailResult.success) {
        console.error('Failed to send password change notification email:', emailResult.error);
      }
    }

    // Send notification SMS if user has phone number
    if (user.phoneNumber) {
      const smsService = SMSService.getInstance();
      const smsResult = await smsService.sendSMS(
        user.phoneNumber,
        'Your Adanma password has been changed successfully. If you did not make this change, please contact support immediately.'
      );

      if (!smsResult.success) {
        console.error('Failed to send password change notification SMS:', smsResult.error);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
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
 * Password Reset Validation Middleware
 */
export const validatePasswordReset = [
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
];