import express from 'express';
import { body, param } from 'express-validator';
import { verificationService } from '../services/VerificationService';
import { handleValidationErrors } from '../middleware/validation';
import { authenticateToken, requireRoles } from '../middleware/auth';

const router = express.Router();

// Submit verification request
router.post('/',
  authenticateToken,
  requireRoles(['vendor']),
  [
    body('documents').isArray().withMessage('Documents array is required'),
    body('documents.*.type').notEmpty().withMessage('Document type is required'),
    body('documents.*.url').isURL().withMessage('Valid document URL is required')
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { documents } = req.body;
      
      const request = await verificationService.submitVerificationRequest(req.user.id, documents);

      res.status(201).json({
        success: true,
        data: { request },
        message: 'Verification request submitted successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VER_001',
          message: error.message || 'Failed to submit verification request'
        }
      });
    }
  }
);

// Get user's verification status
router.get('/status', authenticateToken, async (req: any, res: express.Response): Promise<void> => {
  try {
    const request = await verificationService.getVerificationRequest(req.user.id);

    res.json({
      success: true,
      data: { 
        verificationRequest: request,
        status: request?.status || 'unverified'
      },
      message: 'Verification status retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'VER_002',
        message: 'Failed to retrieve verification status'
      }
    });
  }
});

// Admin: Get all pending verification requests
router.get('/pending',
  authenticateToken,
  requireRoles(['admin']),
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const requests = await verificationService.getAllPendingRequests();

      res.json({
        success: true,
        data: { requests },
        message: 'Pending verification requests retrieved successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'VER_003',
          message: 'Failed to retrieve pending requests'
        }
      });
    }
  }
);

// Admin: Approve verification request
router.put('/:requestId/approve',
  authenticateToken,
  requireRoles(['admin']),
  [
    param('requestId').notEmpty().withMessage('Request ID is required'),
    body('notes').optional().isString()
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { notes } = req.body;

      const request = await verificationService.approveVerification(requestId, req.user.id, notes);

      res.json({
        success: true,
        data: { request },
        message: 'Verification request approved successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VER_004',
          message: error.message || 'Failed to approve verification request'
        }
      });
    }
  }
);

// Admin: Reject verification request
router.put('/:requestId/reject',
  authenticateToken,
  requireRoles(['admin']),
  [
    param('requestId').notEmpty().withMessage('Request ID is required'),
    body('reason').notEmpty().withMessage('Rejection reason is required'),
    body('notes').optional().isString()
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { requestId } = req.params;
      const { reason, notes } = req.body;

      const request = await verificationService.rejectVerification(requestId, req.user.id, reason, notes);

      res.json({
        success: true,
        data: { request },
        message: 'Verification request rejected successfully'
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VER_005',
          message: error.message || 'Failed to reject verification request'
        }
      });
    }
  }
);

export default router;