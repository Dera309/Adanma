import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_001',
          message: 'Authentication token required'
        }
      });
      return;
    }

    const user = await authService.verifyToken(token);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_002',
          message: 'Invalid or expired token'
        }
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_003',
        message: 'Authentication failed'
      }
    });
  }
};

export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTH_004',
          message: 'Authentication required'
        }
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      res.status(403).json({
        success: false,
        error: {
          code: 'AUTH_005',
          message: 'Insufficient permissions'
        }
      });
      return;
    }

    next();
  };
};