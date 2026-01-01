import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';

// Enhanced rate limiting for authentication endpoints
export const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // limit each IP to 3 requests per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Simple delay implementation instead of express-slow-down
const delayTracker = new Map<string, { attempts: number; lastAttempt: Date }>();

export const authSlowDown = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = new Date();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  let tracker = delayTracker.get(ip);
  
  // Clean up old entries
  if (tracker && (now.getTime() - tracker.lastAttempt.getTime()) > windowMs) {
    delayTracker.delete(ip);
    tracker = undefined;
  }
  
  if (!tracker) {
    tracker = { attempts: 0, lastAttempt: now };
  }
  
  tracker.attempts += 1;
  tracker.lastAttempt = now;
  delayTracker.set(ip, tracker);
  
  // Add delay after 2 attempts
  if (tracker.attempts > 2) {
    const delay = Math.min((tracker.attempts - 2) * 500, 20000); // Max 20 seconds
    setTimeout(() => next(), delay);
  } else {
    next();
  }
};

// Account lockout tracking (in-memory for demo, use Redis in production)
const accountLockouts = new Map<string, { attempts: number; lockedUntil?: Date }>();

export const accountLockoutMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const identifier = req.body.identifier?.toLowerCase();
  
  if (!identifier) {
    return next();
  }

  const lockoutInfo = accountLockouts.get(identifier);
  
  if (lockoutInfo?.lockedUntil && lockoutInfo.lockedUntil > new Date()) {
    const remainingTime = Math.ceil((lockoutInfo.lockedUntil.getTime() - Date.now()) / 1000 / 60);
    return res.status(429).json({
      success: false,
      error: {
        code: 'ACCOUNT_LOCKED',
        message: `Account temporarily locked. Try again in ${remainingTime} minutes.`
      }
    });
  }

  // Clear expired lockout
  if (lockoutInfo?.lockedUntil && lockoutInfo.lockedUntil <= new Date()) {
    accountLockouts.delete(identifier);
  }

  next();
};

export const trackFailedLogin = (identifier: string) => {
  const key = identifier.toLowerCase();
  const lockoutInfo = accountLockouts.get(key) || { attempts: 0 };
  
  lockoutInfo.attempts += 1;
  
  // Lock account after 5 failed attempts for 30 minutes
  if (lockoutInfo.attempts >= 5) {
    lockoutInfo.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
  }
  
  accountLockouts.set(key, lockoutInfo);
};

export const clearFailedLogin = (identifier: string) => {
  accountLockouts.delete(identifier.toLowerCase());
};

// Enhanced password validation
export const validateStrongPassword = [
  body('password')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be between 8 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
];

// Input sanitization for authentication
export const sanitizeAuthInput = (req: Request, res: Response, next: NextFunction) => {
  if (req.body.identifier) {
    req.body.identifier = req.body.identifier.trim().toLowerCase();
  }
  if (req.body.email) {
    req.body.email = req.body.email.trim().toLowerCase();
  }
  if (req.body.phoneNumber) {
    req.body.phoneNumber = req.body.phoneNumber.replace(/[^\d+\-\s()]/g, '');
  }
  next();
};

// CSRF protection for state-changing operations
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;
  
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: 'Invalid CSRF token'
    });
  }
  
  next();
};

// Session security middleware
export const secureSession = (req: Request, res: Response, next: NextFunction) => {
  // Regenerate session ID on login to prevent session fixation
  if (req.path.includes('/login') && req.method === 'POST') {
    req.session?.regenerate((err) => {
      if (err) {
        console.error('Session regeneration failed:', err);
      }
      next();
    });
  } else {
    next();
  }
};