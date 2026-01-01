import express from 'express';
import { getAdminStats } from '../controllers/admin';
import { authenticateToken } from '../utils/jwt';

const router = express.Router();

// Get admin dashboard statistics
router.get('/stats', authenticateToken, getAdminStats);

export default router;