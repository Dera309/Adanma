import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  getKYCStatus, 
  submitKYC, 
  uploadKYCDocument,
  adminGetKYCSubmissions,
  adminUpdateKYCStatus 
} from '../controllers/kyc';

const router = Router();

// User KYC routes
router.get('/kyc-status', authenticateToken, getKYCStatus);
router.post('/kyc-submit', authenticateToken, uploadKYCDocument, submitKYC);

// Admin KYC routes
router.get('/admin/kyc-submissions', authenticateToken, adminGetKYCSubmissions);
router.put('/admin/kyc/:userId/status', authenticateToken, adminUpdateKYCStatus);

export default router;