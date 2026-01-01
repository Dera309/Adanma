import { Request } from 'express';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug'
}

/**
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  correlationId?: string;
  userId?: string;
  requestId?: string;
}

/**
 * Logger class for structured logging
 */
class Logger {
  private context: string;

  constructor(context: string = 'Application') {
    this.context = context;
  }

  /**
   * Create log entry
   */
  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
      correlationId: this.getCorrelationId()
    };
  }

  /**
   * Get correlation ID from async context (if available)
   */
  private getCorrelationId(): string | undefined {
    // In production, this would use AsyncLocalStorage or similar
    return undefined;
  }

  /**
   * Format log entry for output
   */
  private formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === 'production') {
      // JSON format for production (easier to parse)
      return JSON.stringify(entry);
    } else {
      // Human-readable format for development
      const { timestamp, level, context, message, metadata } = entry;
      let log = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
      
      if (metadata && Object.keys(metadata).length > 0) {
        log += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
      }
      
      return log;
    }
  }

  /**
   * Write log to output
   */
  private write(entry: LogEntry): void {
    const formatted = this.formatLog(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formatted);
        break;
      case LogLevel.WARN:
        console.warn(formatted);
        break;
      case LogLevel.INFO:
        console.info(formatted);
        break;
      case LogLevel.DEBUG:
        console.debug(formatted);
        break;
    }
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | any, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, {
      ...metadata,
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : error
    });
    
    this.write(entry);
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, metadata);
    this.write(entry);
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: Record<string, any>): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, metadata);
    this.write(entry);
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: Record<string, any>): void {
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true') {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, metadata);
      this.write(entry);
    }
  }

  /**
   * Log HTTP request
   */
  logRequest(req: Request, metadata?: Record<string, any>): void {
    this.info('HTTP Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      ...metadata
    });
  }

  /**
   * Log HTTP response
   */
  logResponse(req: Request, statusCode: number, duration: number): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : 
                  statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;
    
    const entry = this.createLogEntry(level, 'HTTP Response', {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration}ms`
    });
    
    this.write(entry);
  }

  /**
   * Log security event
   */
  logSecurityEvent(event: string, metadata?: Record<string, any>): void {
    this.warn(`Security Event: ${event}`, {
      ...metadata,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, metadata?: Record<string, any>): void {
    this.debug('Database Query', {
      query,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Create child logger with additional context
   */
  child(context: string): Logger {
    return new Logger(`${this.context}:${context}`);
  }
}

/**
 * Create logger instance
 */
export function createLogger(context: string): Logger {
  return new Logger(context);
}

/**
 * Default logger instance
 */
export const logger = new Logger('Application');

export default logger;
