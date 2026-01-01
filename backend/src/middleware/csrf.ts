import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

interface CSRFRequest extends Request {
  csrfToken?: string;
}

export const generateCSRFToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const csrfProtection = (req: CSRFRequest, res: Response, next: NextFunction) => {
  // Skip CSRF in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Skip CSRF for JWT-authenticated requests (API clients)
  if (req.headers.authorization?.startsWith('Bearer ')) {
    return next();
  }

  const token = req.headers['x-csrf-token'] as string;
  const sessionToken = req.session?.csrfToken;

  if (!token || !sessionToken || token !== sessionToken) {
    return res.status(403).json({
      success: false,
      error: { code: 'CSRF_TOKEN_INVALID', message: 'Invalid CSRF token' }
    });
  }

  next();
};

export const setCSRFToken = (req: CSRFRequest, res: Response, next: NextFunction) => {
  if (!req.session?.csrfToken) {
    req.session.csrfToken = generateCSRFToken();
  }
  res.locals.csrfToken = req.session.csrfToken;
  next();
};