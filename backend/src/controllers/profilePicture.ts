import { Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// Shared Prisma
let prisma: PrismaClient;
if ((global as any).prisma) {
  prisma = (global as any).prisma;
} else {
  prisma = new PrismaClient();
  (global as any).prisma = prisma;
}

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
  };
}

interface UserUpdateData {
  email?: string;
  phoneNumber?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  profilePicture?: string;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'profiles');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true, mode: 0o755 });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const userId = (req as AuthenticatedRequest).user?.userId;
    if (!userId) return cb(new Error('User not authenticated'), '');

    const randomName = crypto.randomBytes(20).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();

    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    if (!allowedExts.includes(ext)) {
      return cb(new Error('Invalid file extension'), '');
    }

    const safeFilename = `profile_${userId}_${randomName}${ext}`;
    cb(null, safeFilename);
  },
});

const profilePictureUpload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1,
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedMimes.includes(file.mimetype) && allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  },
});

export const uploadProfilePicture = profilePictureUpload.single('profilePicture');

export const handleMulterError = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, error: 'File too large. Maximum size is 2MB.' });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ success: false, error: 'Unexpected field. Expected "profilePicture".' });
    }
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err?.message) {
    return res.status(400).json({ success: false, error: err.message });
  }

  next();
};

export const updateProfileWithPicture = async (req: AuthenticatedRequest, res: Response) => {
  let uploadedFilePath: string | null = null;
  let newProfilePictureUrl: string | null = null;

  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { email, phoneNumber, firstName, lastName } = req.body;
    const file = req.file;

    // Fetch current user (including current profile picture)
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, profilePicture: true },
    });

    if (!currentUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updateData: UserUpdateData = {};

    // Email validation
    if (typeof email === 'string') {
      const trimmed = email.trim();
      if (trimmed) {
        if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
          return res.status(400).json({ success: false, error: 'Invalid email format' });
        }
        updateData.email = trimmed;
      }
      // Else: ignore empty email → keep current
    }

    // Optional fields: empty string → null
    if (typeof phoneNumber === 'string') updateData.phoneNumber = phoneNumber.trim() || null;
    if (typeof firstName === 'string') updateData.firstName = firstName.trim() || null;
    if (typeof lastName === 'string') updateData.lastName = lastName.trim() || null;

    // Handle new profile picture
    if (file) {
      uploadedFilePath = file.path;
      newProfilePictureUrl = `/uploads/profiles/${file.filename}`;
      updateData.profilePicture = newProfilePictureUrl;
    }

    // Perform update — this may throw (e.g., unique constraint)
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        profilePicture: true,
        emailVerified: true,
        phoneVerified: true,
        roles: true,
        authProvider: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // SUCCESS: Now safe to delete old picture
    if (file && currentUser.profilePicture && currentUser.profilePicture !== updatedUser.profilePicture) {
      const oldFilename = path.basename(currentUser.profilePicture);
      const oldFilePath = path.join(UPLOAD_DIR, oldFilename);

      // Path traversal protection
      if (path.resolve(oldFilePath).startsWith(path.resolve(UPLOAD_DIR))) {
        try {
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        } catch (err) {
          console.warn('Failed to delete old profile picture:', oldFilePath, err);
          // Non-fatal
        }
      }
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (error) {
    console.error('Error updating profile:', error);

    // Handle known Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        // Unique constraint failed (likely email)
        return res.status(409).json({
          success: false,
          error: 'This email is already in use by another account.',
        });
      }
    }

    // Cleanup uploaded file on failure
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      try {
        fs.unlinkSync(uploadedFilePath);
      } catch (cleanupErr) {
        console.warn('Failed to cleanup uploaded file:', cleanupErr);
      }
    }

    return res.status(500).json({
      success: false,
      error: 'Failed to update profile. Please try again.',
    });
  }
};