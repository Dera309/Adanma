import { Request } from 'express';
import { logger } from './logger';

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Error context interface
 */
export interface ErrorContext {
  userId?: string;
  requestId?: string;
  url?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
  environment: string;
  [key: string]: any;
}

/**
 * Tracked error interface
 */
export interface TrackedError {
  id: string;
  message: string;
  stack?: string;
  severity: ErrorSeverity;
  context: ErrorContext;
  count: number;
  firstSeen: string;
  lastSeen: string;
}

/**
 * Error tracking class
 */
class ErrorTracker {
  private errors: Map<string, TrackedError>;
  private errorCounts: Map<string, number>;

  constructor() {
    this.errors = new Map();
    this.errorCounts = new Map();
  }

  /**
   * Generate error ID from error message and stack
   */
  private generateErrorId(error: Error): string {
    const stackLine = error.stack?.split('\n')[1] || '';
    return `${error.name}:${error.message}:${stackLine}`.replace(/\s+/g, '_');
  }

  /**
   * Determine error severity
   */
  private determineSeverity(error: Error, statusCode?: number): ErrorSeverity {
    // Critical errors
    if (error.name === 'DatabaseError' || error.message.includes('database')) {
      return ErrorSeverity.CRITICAL;
    }
    
    if (statusCode && statusCode >= 500) {
      return ErrorSeverity.HIGH;
    }
    
    if (statusCode && statusCode >= 400) {
      return ErrorSeverity.MEDIUM;
    }
    
    return ErrorSeverity.LOW;
  }

  /**
   * Extract context from request
   */
  private extractContext(req?: Request, additionalContext?: Record<string, any>): ErrorContext {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      ...additionalContext
    };

    if (req) {
      context.url = req.url;
      context.method = req.method;
      context.ip = req.ip;
      context.userAgent = req.get('user-agent');
      
      // Extract user ID if available
      if ((req as any).user) {
        context.userId = (req as any).user.userId;
      }
    }

    return context;
  }

  /**
   * Track an error
   */
  trackError(
    error: Error,
    req?: Request,
    statusCode?: number,
    additionalContext?: Record<string, any>
  ): void {
    const errorId = this.generateErrorId(error);
    const severity = this.determineSeverity(error, statusCode);
    const context = this.extractContext(req, additionalContext);

    const existing = this.errors.get(errorId);

    if (existing) {
      // Update existing error
      existing.count++;
      existing.lastSeen = context.timestamp;
      this.errors.set(errorId, existing);
    } else {
      // Create new tracked error
      const trackedError: TrackedError = {
        id: errorId,
        message: error.message,
        stack: error.stack,
        severity,
        context,
        count: 1,
        firstSeen: context.timestamp,
        lastSeen: context.timestamp
      };
      
      this.errors.set(errorId, trackedError);
    }

    // Increment error count
    const count = this.errorCounts.get(error.name) || 0;
    this.errorCounts.set(error.name, count + 1);

    // Log error
    logger.error(`Error tracked: ${error.message}`, error, {
      errorId,
      severity,
      context
    });

    // Send to external error tracking service (Sentry, etc.) in production
    if (process.env.NODE_ENV === 'production' && severity !== ErrorSeverity.LOW) {
      this.sendToExternalService(error, context, severity);
    }
  }

  /**
   * Send error to external tracking service
   */
  private sendToExternalService(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity
  ): void {
    // In production, integrate with Sentry or similar service
    // Example:
    // Sentry.captureException(error, {
    //   level: severity,
    //   contexts: { custom: context }
    // });
    
    logger.debug('Would send to external error tracking service', {
      error: error.message,
      severity,
      context
    });
  }

  /**
   * Get all tracked errors
   */
  getAllErrors(): TrackedError[] {
    return Array.from(this.errors.values());
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: ErrorSeverity): TrackedError[] {
    return this.getAllErrors().filter(e => e.severity === severity);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, any> {
    const errors = this.getAllErrors();
    
    return {
      total: errors.length,
      bySeverity: {
        critical: errors.filter(e => e.severity === ErrorSeverity.CRITICAL).length,
        high: errors.filter(e => e.severity === ErrorSeverity.HIGH).length,
        medium: errors.filter(e => e.severity === ErrorSeverity.MEDIUM).length,
        low: errors.filter(e => e.severity === ErrorSeverity.LOW).length
      },
      byType: Object.fromEntries(this.errorCounts),
      mostFrequent: errors.sort((a, b) => b.count - a.count).slice(0, 5)
    };
  }

  /**
   * Clear old errors
   */
  clearOldErrors(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    
    for (const [id, error] of this.errors.entries()) {
      const lastSeenTime = new Date(error.lastSeen).getTime();
      
      if (lastSeenTime < cutoffTime) {
        this.errors.delete(id);
      }
    }
  }

  /**
   * Reset all tracked errors
   */
  reset(): void {
    this.errors.clear();
    this.errorCounts.clear();
  }
}

/**
 * Singleton error tracker instance
 */
export const errorTracker = new ErrorTracker();

/**
 * Helper function to track errors
 */
export function trackError(
  error: Error,
  req?: Request,
  statusCode?: number,
  additionalContext?: Record<string, any>
): void {
  errorTracker.trackError(error, req, statusCode, additionalContext);
}

export default errorTracker;
