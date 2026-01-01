import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

// Shared Prisma instance (critical for production!)
let prisma: PrismaClient;
if ((global as any).prisma) {
  prisma = (global as any).prisma;
} else {
  prisma = new PrismaClient();
  (global as any).prisma = prisma;
}

// Define upload directory consistently
const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'kyc');

// Ensure directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 });
}

// Types
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles?: string[];
  };
}

// Input validation and sanitization
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/[<>"'&]/g, '');
}

function validateDateOfBirth(dateString: string): boolean {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return false;

  const now = new Date();
  const minDate = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
  const maxDate = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());

  return date >= minDate && date <= maxDate;
}

function validateIdNumber(idNumber: string, idType: string): boolean {
  const sanitized = idNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  switch (idType) {
    case 'national_id':
      return sanitized.length >= 6 && sanitized.length <= 20;
    case 'passport':
      return sanitized.length >= 6 && sanitized.length <= 15;
    case 'drivers_license':
      return sanitized.length >= 6 && sanitized.length <= 20;
    default:
      return false;
  }
}

// Secure multer configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return cb(new Error('User not authenticated'), '');
    }

    const randomName = crypto.randomBytes(20).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedExts = ['.jpg', '.jpeg', '.png', '.pdf'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file extension'), '');
    }

    const filename = `kyc_${userId}_${randomName}${ext}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes: Record<string, string[]> = {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/jpg': ['.jpg', '.jpeg'], // Add common alias
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
    };

    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;

    if (allowedMimes[mime]?.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  },
});

export const uploadKYCDocument = upload.single('idDocument');

// GET /kyc/status - Get current user's KYC status
export const getKYCStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const kycRecord = await prisma.kyc.findUnique({
      where: { userId },
      select: {
        status: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        nationality: true,
        idType: true,
        idNumber: true,
        submittedAt: true,
        verifiedAt: true,
        rejectionReason: true,
      },
    });

    if (!kycRecord) {
      return res.json({ success: true, data: { status: 'not_submitted' } });
    }

    res.json({ success: true, data: kycRecord });
  } catch (error) {
    console.error('Error fetching KYC status:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch KYC status' });
  }
};

export const submitKYC = async (req: AuthenticatedRequest, res: Response) => {
  uploadKYCDocument(req, res, async (err: any) => {
    if (err instanceof multer.MulterError) {
      // Handle common Multer errors with user-friendly messages
      let errorMsg = 'File upload error';
      if (err.code === 'LIMIT_FILE_SIZE') errorMsg = 'File too large (max 5MB)';
      if (err.code === 'LIMIT_FILE_COUNT') errorMsg = 'Too many files';
      if (err.code === 'LIMIT_UNEXPECTED_FILE') errorMsg = 'Unexpected file field';
      return res.status(400).json({ success: false, error: errorMsg });
    }
    if (err) {
      // Custom errors from storage/fileFilter
      return res.status(400).json({ success: false, error: err.message });
    }

    let uploadedFilePath: string | null = null;

    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'User not authenticated' });
      }

      const { firstName, lastName, dateOfBirth, nationality, idType, idNumber } = req.body;
      const idDocument = req.file;

      uploadedFilePath = req.file?.path || null;

      // Required fields
      if (!firstName || !lastName || !dateOfBirth || !nationality || !idType || !idNumber) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
      }

      const sanitized = {
        firstName: sanitizeInput(firstName),
        lastName: sanitizeInput(lastName),
        nationality: sanitizeInput(nationality.toUpperCase()),
        idType: sanitizeInput(idType),
        idNumber: sanitizeInput(idNumber),
      };

      // Validations
      if (!validateDateOfBirth(dateOfBirth)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid date of birth. Must be 18–100 years old.',
        });
      }

      if (!['national_id', 'passport', 'drivers_license'].includes(sanitized.idType)) {
        return res.status(400).json({ success: false, error: 'Invalid ID type' });
      }

      if (!validateIdNumber(sanitized.idNumber, sanitized.idType)) {
        return res.status(400).json({ success: false, error: 'Invalid ID number format' });
      }

      const allowedCountries = ['NG', 'GH', 'KE', 'ZA', 'CM', 'EG'];
      if (!allowedCountries.includes(sanitized.nationality)) {
        return res.status(400).json({ success: false, error: 'Unsupported nationality' });
      }

      // Check existing KYC
      const existingKYC = await prisma.kyc.findUnique({ where: { userId } });

      if (existingKYC && ['pending', 'verified'].includes(existingKYC.status)) {
        return res.status(400).json({
          success: false,
          error: 'KYC already submitted or verified. Contact support to update.',
        });
      }

      if (!existingKYC && !idDocument) {
        return res.status(400).json({ success: false, error: 'Identity document is required' });
      }

      // Delete old document if replacing
      if (existingKYC?.documentPath && idDocument) {
        const oldFilePath = path.join(UPLOAD_DIR, path.basename(existingKYC.documentPath));

        // Safety: ensure path is within upload dir
        if (path.resolve(oldFilePath).startsWith(path.resolve(UPLOAD_DIR))) {
          try {
            await unlinkAsync(oldFilePath);
          } catch (err) {
            console.warn('Failed to delete old KYC document:', err);
          }
        }
      }

      const kycData = {
        userId,
        firstName: sanitized.firstName,
        lastName: sanitized.lastName,
        dateOfBirth: new Date(dateOfBirth),
        nationality: sanitized.nationality,
        idType: sanitized.idType,
        idNumber: sanitized.idNumber,
        status: 'pending' as const,
        submittedAt: new Date(),
        documentPath: idDocument ? idDocument.filename : existingKYC?.documentPath,
      };

      if (existingKYC) {
        await prisma.kyc.update({
          where: { userId },
          data: {
            ...kycData,
            rejectionReason: null,
            verifiedAt: null,
          },
        });
      } else {
        await prisma.kyc.create({ data: kycData });
      }

      res.json({ success: true, message: 'KYC submitted successfully. Review in progress.' });
    } catch (error) {
      console.error('Error submitting KYC:', error);

      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        try {
          await unlinkAsync(uploadedFilePath);
        } catch (cleanupErr) {
          console.warn('Cleanup failed:', cleanupErr);
        }
      }

      res.status(500).json({ success: false, error: 'Failed to submit KYC' });
    }
  });
};

// GET /admin/kyc - List submissions (admin only)
export const adminGetKYCSubmissions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user?.roles || [];
    if (!req.user?.id || !Array.isArray(roles) || !roles.includes('ADMIN')) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { status, page = '1', limit = '10' } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const validStatuses = ['pending', 'verified', 'rejected'];
    const where = status && validStatuses.includes(status as string)
      ? { status: status as string }
      : {};

      const [submissions, total] = await Promise.all([
        prisma.kyc.findMany({
        where,
        select: {
          id: true,
          userId: true,
          firstName: true,
          lastName: true,
          nationality: true,
          idType: true,
          status: true,
          submittedAt: true,
          verifiedAt: true,
          rejectionReason: true,
          user: {
            select: { id: true, email: true, phoneNumber: true },
          },
        },
        orderBy: { submittedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.kyc.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        submissions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching KYC submissions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch submissions' });
  }
};

// PATCH /admin/kyc/:userId - Update status (admin only)
export const adminUpdateKYCStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = req.user?.roles || [];
    if (!req.user?.id || !Array.isArray(roles) || !roles.includes('ADMIN')) {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { status, rejectionReason } = req.body;

    if (!userId || userId.length < 10) {
      return res.status(400).json({ success: false, error: 'Invalid user ID' });
    }

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    if (status === 'rejected' && (!rejectionReason || rejectionReason.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason must be at least 10 characters',
      });
    }

    const existingKYC = await prisma.kyc.findUnique({ where: { userId } });
    if (!existingKYC) {
      return res.status(404).json({ success: false, error: 'KYC record not found' });
    }

    const updateData: any = {
      status,
      ...(status === 'verified' && { verifiedAt: new Date(), rejectionReason: null }),
      ...(status === 'rejected' && { rejectionReason: sanitizeInput(rejectionReason) }),
    };

    await prisma.kyc.update({
      where: { userId },
      data: updateData,
    });

    res.json({ success: true, message: `KYC ${status} successfully` });
  } catch (error) {
    console.error('Error updating KYC status:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};