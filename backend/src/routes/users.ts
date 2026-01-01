import { Router } from 'express';
import {
  updateUserRole,
  validateUpdateUserRole,
  getUserProfile,
  updateUserProfile,
  validateUpdateUserProfile,
  getUserVerificationStatus,
  submitVerificationRequest,
  validateSubmitVerificationRequest,
  uploadDocuments,
  deleteUserAccount,
  validateDeleteUserAccount,
  getDashboard
} from '../controllers/users';
import {
  uploadProfilePicture,
  updateProfileWithPicture
} from '../controllers/profilePicture';
import {
  getKYCStatus,
  submitKYC,
  uploadKYCDocument,
  adminGetKYCSubmissions,
  adminUpdateKYCStatus
} from '../controllers/kyc';
import { authenticateToken } from '../utils/jwt';
import { kycLimiter, uploadLimiter, generalLimiter } from '../middleware/rateLimiter';
import { validateKYCSubmission, handleValidationErrors, sanitizeRequest } from '../middleware/security';

const router = Router();

// Apply general rate limiting and request sanitization to all routes
router.use(generalLimiter);
router.use(sanitizeRequest);

/**
 * @route GET /api/users/dashboard
 * @desc Get user dashboard data
 * @access Private
 */
router.get('/dashboard', authenticateToken, getDashboard);

/**
 * @route PATCH /api/users/role
 * @desc Update user roles
 * @access Private
 */
router.patch('/role', authenticateToken, validateUpdateUserRole, updateUserRole);

/**
 * @route GET /api/users/profile
 * @desc Get user profile with addresses
 * @access Private
 */
router.get('/profile', authenticateToken, getUserProfile);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile information with optional profile picture
 * @access Private
 */
router.put('/profile', 
  authenticateToken, 
  uploadProfilePicture,
  updateProfileWithPicture
);

/**
 * @route GET /api/users/verification-status
 * @desc Get user verification status and badge information
 * @access Private
 */
router.get('/verification-status', authenticateToken, getUserVerificationStatus);

/**
 * @route POST /api/users/verification-request
 * @desc Submit verification request with document uploads
 * @access Private (Vendor only)
 */
router.post('/verification-request', 
  authenticateToken, 
  uploadDocuments, 
  validateSubmitVerificationRequest, 
  submitVerificationRequest
);

/**
 * @route DELETE /api/users/account
 * @desc Delete user account (soft delete)
 * @access Private
 */
router.delete('/account', 
  authenticateToken, 
  validateDeleteUserAccount, 
  deleteUserAccount
);

/**
 * @route GET /api/users/kyc-status
 * @desc Get user KYC status
 * @access Private
 */
router.get('/kyc-status', authenticateToken, getKYCStatus);

/**
 * @route POST /api/users/kyc-submit
 * @desc Submit KYC documents
 * @access Private
 */
router.post('/kyc-submit', 
  authenticateToken, 
  kycLimiter,
  uploadLimiter,
  uploadKYCDocument, 
  validateKYCSubmission,
  handleValidationErrors,
  submitKYC
);

/**
 * @route GET /api/users/admin/kyc-submissions
 * @desc Get all KYC submissions (Admin only)
 * @access Private (Admin)
 */
router.get('/admin/kyc-submissions', authenticateToken, adminGetKYCSubmissions);

/**
 * @route PUT /api/users/admin/kyc/:userId/status
 * @desc Update KYC status (Admin only)
 * @access Private (Admin)
 */
router.put('/admin/kyc/:userId/status', authenticateToken, adminUpdateKYCStatus);

export default router;
