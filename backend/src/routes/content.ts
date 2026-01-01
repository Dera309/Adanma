import express from 'express';
import { getContent, updateContent } from '../controllers/content';
import { authenticateFromCookie } from '../utils/jwt';

const router = express.Router();

// Get content (public)
router.get('/:type', getContent);

// Update content (admin only)
router.put('/:type', authenticateFromCookie, updateContent);

export default router;