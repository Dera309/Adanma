import express from 'express';
import { body } from 'express-validator';
import { contentService } from '../services/ContentService';
import { handleValidationErrors } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

function getDefaultTitle(type: string): string {
  const titles: {[key: string]: string} = {
    about: 'About Adanma',
    terms: 'Terms of Service',
    privacy: 'Privacy Policy',
    contact: 'Contact Us'
  };
  return titles[type] || 'Untitled';
}

function getDefaultContent(type: string): string {
  const contents: {[key: string]: string} = {
    about: 'Adanma is your premier African e-commerce platform connecting buyers and vendors across the continent.',
    terms: 'These terms govern your use of Adanma platform...',
    privacy: 'We respect your privacy and are committed to protecting your personal data...',
    contact: 'Get in touch with our support team...'
  };
  return contents[type] || 'Content coming soon...';
}

const router = express.Router();

// Get content by type
router.get('/:type', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const { type } = req.params;
    let content = await contentService.getContent(type);

    // If content doesn't exist in DB, create it with defaults
    if (!content) {
      const defaultContent = await contentService.updateContent(
        type,
        getDefaultTitle(type),
        getDefaultContent(type)
      );
      content = defaultContent;
    }

    res.json({
      success: true,
      data: content,
      message: 'Content retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTENT_002',
        message: 'Failed to retrieve content'
      }
    });
  }
});

// Update content (admin only)
router.put('/:type',
  authenticateToken,
  [
    body('title').notEmpty().withMessage('Title is required'),
    body('content').notEmpty().withMessage('Content is required')
  ],
  handleValidationErrors,
  async (req: any, res: express.Response): Promise<void> => {
    try {
      const { type } = req.params;
      const { title, content } = req.body;

      // Check if user has admin role
      if (!req.user.roles.includes('admin')) {
        res.status(403).json({
          success: false,
          error: {
            code: 'CONTENT_003',
            message: 'Admin access required'
          }
        });
        return;
      }

      const updatedContent = await contentService.updateContent(type, title, content, req.user.id);

      res.json({
        success: true,
        data: updatedContent,
        message: 'Content updated successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'CONTENT_004',
          message: 'Failed to update content'
        }
      });
    }
  }
);

// Get all content
router.get('/', async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const contents = await contentService.getAllContent();

    res.json({
      success: true,
      data: contents,
      message: 'All content retrieved successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'CONTENT_005',
        message: 'Failed to retrieve content'
      }
    });
  }
});

export default router;