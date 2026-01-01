import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';

// Security headers middleware
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// CSRF protection (simplified)
export const csrfProtection = (req: Request, res: Response, next: NextFunction) => {
  // Skip CSRF for GET requests, health checks, and development
  if (req.method === 'GET' || req.path === '/health' || process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Skip CSRF for auth endpoints in development
  if (process.env.NODE_ENV === 'development' && req.path.startsWith('/auth')) {
    return next();
  }
  
  next();
};

// SQL injection prevention
export const sqlInjectionPrevention = (req: Request, res: Response, next: NextFunction) => {
  const checkForSQLInjection = (value: any): boolean => {
    if (typeof value === 'string') {
      const sqlPatterns = /('|(\-\-)|(;)|(\||\|)|(\*|\*))/i;
      return sqlPatterns.test(value);
    }
    return false;
  };

  const checkObject = (obj: any): boolean => {
    for (const key in obj) {
      if (checkForSQLInjection(obj[key]) || (typeof obj[key] === 'object' && checkObject(obj[key]))) {
        return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query) || checkObject(req.params)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }

  next();
};

// XSS prevention
export const xssPrevention = (req: Request, res: Response, next: NextFunction) => {
  const sanitizeValue = (value: any): any => {
    if (typeof value === 'string') {
      return value.replace(/<script[^>]*>.*?<\/script>/gi, '')
                  .replace(/<[^>]*>/g, '')
                  .replace(/javascript:/gi, '')
                  .replace(/on\w+=/gi, '');
    }
    return value;
  };

  const sanitizeObject = (obj: any): any => {
    for (const key in obj) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        obj[key] = sanitizeObject(obj[key]);
      } else {
        obj[key] = sanitizeValue(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);

  next();
};

// IP filtering (allow all in development)
export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  // In production, you might want to implement IP whitelisting/blacklisting
  next();
};

// Security response headers
export const securityResponseHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

// Input validation middleware
export const validateKYCSubmission = [
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name must be 2-50 characters and contain only letters'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name must be 2-50 characters and contain only letters'),
  
  body('dateOfBirth')
    .isISO8601()
    .withMessage('Invalid date format'),
  
  body('nationality')
    .isIn(['NG', 'GH', 'KE', 'ZA', 'CM', 'EG'])
    .withMessage('Invalid nationality'),
  
  body('idType')
    .isIn(['national_id', 'passport', 'drivers_license'])
    .withMessage('Invalid ID type'),
  
  body('idNumber')
    .trim()
    .isLength({ min: 6, max: 20 })
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('ID number must be 6-20 alphanumeric characters'),
];

// Validation result handler
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// CORS configuration
export const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Request sanitization
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove null bytes and control characters
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj.replace(/[\x00-\x1f\x7f-\x9f]/g, '');
    }
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        obj[key] = sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);
  
  next();
};