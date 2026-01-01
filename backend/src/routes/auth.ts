import { Router } from 'express';
import helmet from 'helmet';
import { csrfProtection } from '../middleware/csrf';
import {
  registerWithEmail,
  registerWithPhone,
  validateEmailRegistration,
  validatePhoneRegistration,
  initiateFacebookAuth,
  handleFacebookCallback,
  initiateWhatsAppAuth,
  handleWhatsAppCallback,
  verifyEmail,
  verifyPhone,
  resendPhoneVerification,
  validateEmailVerification,
  validatePhoneVerification,
  validateResendPhoneVerification,
  login,
  validateLogin,
  logout,
  getSessions,
  terminateSession,
  requestPasswordReset,
  validatePasswordResetRequest,
  resetPassword,
  validatePasswordReset
} from '../controllers/auth';
import { authenticateFromCookie } from '../utils/jwt';
import { 
  strictAuthLimiter, 
  authSlowDown, 
  accountLockoutMiddleware,
  validateStrongPassword,
  sanitizeAuthInput,
  secureSession
} from '../middleware/authSecurity';
import { generalLimiter } from '../middleware/rateLimiter';
import { sanitizeRequest } from '../middleware/security';

const router = Router();

// Apply security middleware to all routes
router.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
router.use(generalLimiter);
router.use(sanitizeRequest);
router.use(sanitizeAuthInput);
router.use(secureSession);

/**
 * @route POST /api/auth/register/email
 * @desc Register user with email
 * @access Public
 */
router.post('/register/email', 
  csrfProtection,
  strictAuthLimiter,
  authSlowDown,
  validateEmailRegistration, 
  validateStrongPassword,
  registerWithEmail
);

/**
 * @route POST /api/auth/register/phone
 * @desc Register user with phone number
 * @access Public
 */
router.post('/register/phone', 
  csrfProtection,
  strictAuthLimiter,
  authSlowDown,
  validatePhoneRegistration, 
  validateStrongPassword,
  registerWithPhone
);

/**
 * @route GET /api/auth/facebook
 * @desc Initiate Facebook OAuth flow
 * @access Public
 */
router.get('/facebook', initiateFacebookAuth);

/**
 * @route GET /api/auth/facebook/callback
 * @desc Handle Facebook OAuth callback
 * @access Public
 */
router.get('/facebook/callback', handleFacebookCallback);

/**
 * @route GET /api/auth/whatsapp
 * @desc Initiate WhatsApp OAuth flow (placeholder)
 * @access Public
 */
router.get('/whatsapp', initiateWhatsAppAuth);

/**
 * @route GET /api/auth/whatsapp/callback
 * @desc Handle WhatsApp OAuth callback (placeholder)
 * @access Public
 */
router.get('/whatsapp/callback', handleWhatsAppCallback);

/**
 * @route POST /api/auth/verify/email
 * @desc Verify email address with token
 * @access Public
 */
router.post('/verify/email', validateEmailVerification, verifyEmail);

/**
 * @route POST /api/auth/verify/phone
 * @desc Verify phone number with code
 * @access Public
 */
router.post('/verify/phone', validatePhoneVerification, verifyPhone);

/**
 * @route POST /api/auth/verify/phone/resend
 * @desc Resend phone verification code
 * @access Public
 */
router.post('/verify/phone/resend', validateResendPhoneVerification, resendPhoneVerification);

/**
 * @route POST /api/auth/login
 * @desc Login with email/phone and password
 * @access Public
 */
router.post('/login', 
  csrfProtection,
  strictAuthLimiter,
  authSlowDown,
  accountLockoutMiddleware,
  validateLogin, 
  login
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user and invalidate session
 * @access Public
 */
router.post('/logout', logout);

/**
 * @route GET /api/auth/sessions
 * @desc Get all active sessions for current user
 * @access Private
 */
router.get('/sessions', authenticateFromCookie, getSessions);

/**
 * @route DELETE /api/auth/sessions/:sessionId
 * @desc Terminate a specific session
 * @access Private
 */
router.delete('/sessions/:sessionId', authenticateFromCookie, terminateSession);

/**
 * @route POST /api/auth/password/reset-request
 * @desc Request password reset via email or phone
 * @access Public
 */
router.post('/password/reset-request', validatePasswordResetRequest, requestPasswordReset);

/**
 * @route POST /api/auth/password/reset
 * @desc Reset password with token or code
 * @access Public
 */
router.post('/password/reset', 
  strictAuthLimiter,
  validatePasswordReset, 
  validateStrongPassword,
  resetPassword
);

export default router;