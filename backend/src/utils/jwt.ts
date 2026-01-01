import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { shouldUseMockData } from '../config/development';

export interface JWTPayload {
  userId: string;
  email?: string;
  phoneNumber?: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * Generate JWT access token (15 minutes expiration)
 */
export function generateAccessToken(payload: Omit<JWTPayload, 'type'>): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  return jwt.sign(
    { ...payload, type: 'access' },
    secret,
    { 
      expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
      issuer: 'adanma',
      audience: 'adanma-users'
    }
  );
}

/**
 * Generate JWT refresh token (30 days expiration)
 */
export function generateRefreshToken(payload: Omit<JWTPayload, 'type'>): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not configured');
  }

  return jwt.sign(
    { ...payload, type: 'refresh' },
    secret,
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
      issuer: 'adanma',
      audience: 'adanma-users'
    }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string, type: 'access' | 'refresh'): JWTPayload {
  const secret = type === 'access' 
    ? process.env.JWT_ACCESS_SECRET 
    : process.env.JWT_REFRESH_SECRET;
    
  if (!secret) {
    throw new Error(`JWT_${type.toUpperCase()}_SECRET is not configured`);
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'adanma',
      audience: 'adanma-users'
    }) as JWTPayload;

    if (decoded.type !== type) {
      throw new Error(`Invalid token type. Expected ${type}, got ${decoded.type}`);
    }

    return decoded;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    throw error;
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Access token required'
      }
    });
    return;
  }

  try {
    const decoded = verifyToken(token, 'access');
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed';
    
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_006',
        message
      }
    });
  }
}

/**
 * Generate both access and refresh tokens
 */
export function generateTokenPair(payload: Omit<JWTPayload, 'type'>): {
  accessToken: string;
  refreshToken: string;
} {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
}

/**
 * Extract token from cookies (for cookie-based auth)
 */
export function extractTokenFromCookies(req: Request): string | null {
  return req.cookies?.accessToken || null;
}

/**
 * Middleware to authenticate using cookies
 */
export function authenticateFromCookie(req: Request, res: Response, next: NextFunction): void {
  // Check if we should use mock data (only in development with explicit flag)
  if (shouldUseMockData() && process.env.NODE_ENV === 'development') {
    console.log('⚠️  WARNING: Using mock authentication in development mode');
    
    // Set mock user data for development
    (req as AuthenticatedRequest).user = {
      userId: '507f1f77bcf86cd799439011',
      email: 'mock@example.com',
      phoneNumber: '+1234567890',
      roles: ['BUYER'],
      type: 'access'
    };
    
    next();
    return;
  }

  // Try Bearer token first
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.split(' ')[1];
  
  // Try cookie token second
  const cookieToken = extractTokenFromCookies(req);
  
  const token = bearerToken || cookieToken;

  if (!token) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_006',
        message: 'Authentication required'
      }
    });
    return;
  }

  try {
    const decoded = verifyToken(token, 'access');
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token verification failed';
    
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_006',
        message
      }
    });
  }
}