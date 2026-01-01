import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// In-memory content storage (in production, use database)
let contentData = {
  about: {
    title: 'About Adanma',
    content: 'Adanma is an African e-commerce platform connecting buyers and sellers across Nigeria, Ghana, Kenya, South Africa, Cameroon, and Egypt. Our mission is to facilitate secure and seamless online commerce tailored to African markets.'
  },
  terms: {
    title: 'Terms of Service',
    content: 'By using Adanma, you agree to these terms and conditions. Users must provide accurate information and comply with local laws. The platform is for legitimate commercial activities only.'
  },
  privacy: {
    title: 'Privacy Policy',
    content: 'Adanma respects your privacy and protects your personal information. We collect information necessary to provide our services including contact details and transaction data. Your data is used to facilitate transactions and improve our services.'
  },
  contact: {
    title: 'Contact Us',
    content: 'Get in touch with the Adanma team.\n\nEmail: support@adanma.com\nPhone: +234 123 456 7890\nAddress: Lagos, Nigeria'
  }
};

export const getContent = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    
    if (!contentData[type as keyof typeof contentData]) {
      return res.status(404).json({
        success: false,
        error: { code: 'CONTENT_001', message: 'Content not found' }
      });
    }

    res.json({
      success: true,
      data: contentData[type as keyof typeof contentData]
    });
  } catch (error) {
    logger.error('Get content error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: 'Internal server error' }
    });
  }
};

export const updateContent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { code: 'AUTH_001', message: 'Authentication required' }
      });
    }

    const { type } = req.params;
    const { title, content } = req.body;

    if (!contentData[type as keyof typeof contentData]) {
      return res.status(404).json({
        success: false,
        error: { code: 'CONTENT_001', message: 'Content type not found' }
      });
    }

    contentData[type as keyof typeof contentData] = { title, content };

    logger.info('Content updated', { userId, type, title });

    res.json({
      success: true,
      data: contentData[type as keyof typeof contentData]
    });
  } catch (error) {
    logger.error('Update content error', { error });
    res.status(500).json({
      success: false,
      error: { code: 'SYS_001', message: 'Internal server error' }
    });
  }
};