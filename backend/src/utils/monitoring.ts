import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

/**
 * Metric types
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram'
}

/**
 * Metric interface
 */
export interface Metric {
  name: string;
  type: MetricType;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

/**
 * Monitoring class for collecting application metrics
 */
class Monitoring {
  private metrics: Map<string, Metric>;
  private requestCounts: Map<string, number>;
  private errorCounts: Map<string, number>;
  private responseTimes: Map<string, number[]>;

  constructor() {
    this.metrics = new Map();
    this.requestCounts = new Map();
    this.errorCounts = new Map();
    this.responseTimes = new Map();
  }

  /**
   * Record a metric
   */
  recordMetric(name: string, type: MetricType, value: number, labels?: Record<string, string>): void {
    const metric: Metric = {
      name,
      type,
      value,
      timestamp: Date.now(),
      labels
    };

    this.metrics.set(name, metric);
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels?: Record<string, string>): void {
    const current = this.metrics.get(name);
    const value = current ? current.value + 1 : 1;
    this.recordMetric(name, MetricType.COUNTER, value, labels);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, MetricType.GAUGE, value, labels);
  }

  /**
   * Record histogram value
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, MetricType.HISTOGRAM, value, labels);
  }

  /**
   * Track HTTP request
   */
  trackRequest(method: string, path: string): void {
    const key = `${method}:${path}`;
    const count = this.requestCounts.get(key) || 0;
    this.requestCounts.set(key, count + 1);
    
    this.incrementCounter('http_requests_total', { method, path });
  }

  /**
   * Track HTTP error
   */
  trackError(method: string, path: string, statusCode: number): void {
    const key = `${method}:${path}:${statusCode}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
    
    this.incrementCounter('http_errors_total', { method, path, statusCode: statusCode.toString() });
  }

  /**
   * Track response time
   */
  trackResponseTime(method: string, path: string, duration: number): void {
    const key = `${method}:${path}`;
    const times = this.responseTimes.get(key) || [];
    times.push(duration);
    
    // Keep only last 100 response times
    if (times.length > 100) {
      times.shift();
    }
    
    this.responseTimes.set(key, times);
    this.recordHistogram('http_response_time_ms', duration, { method, path });
  }

  /**
   * Get average response time for an endpoint
   */
  getAverageResponseTime(method: string, path: string): number {
    const key = `${method}:${path}`;
    const times = this.responseTimes.get(key) || [];
    
    if (times.length === 0) return 0;
    
    const sum = times.reduce((a, b) => a + b, 0);
    return sum / times.length;
  }

  /**
   * Get request count for an endpoint
   */
  getRequestCount(method: string, path: string): number {
    const key = `${method}:${path}`;
    return this.requestCounts.get(key) || 0;
  }

  /**
   * Get error count for an endpoint
   */
  getErrorCount(method: string, path: string, statusCode?: number): number {
    if (statusCode) {
      const key = `${method}:${path}:${statusCode}`;
      return this.errorCounts.get(key) || 0;
    }
    
    // Sum all errors for this endpoint
    let total = 0;
    for (const [key, count] of this.errorCounts.entries()) {
      if (key.startsWith(`${method}:${path}:`)) {
        total += count;
      }
    }
    return total;
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get metrics summary
   */
  getMetricsSummary(): Record<string, any> {
    const summary: Record<string, any> = {
      totalRequests: 0,
      totalErrors: 0,
      endpoints: []
    };

    // Calculate totals
    for (const count of this.requestCounts.values()) {
      summary.totalRequests += count;
    }

    for (const count of this.errorCounts.values()) {
      summary.totalErrors += count;
    }

    // Get endpoint statistics
    const endpointStats = new Map<string, any>();
    
    for (const [key, count] of this.requestCounts.entries()) {
      const [method, path] = key.split(':');
      const avgResponseTime = this.getAverageResponseTime(method, path);
      const errorCount = this.getErrorCount(method, path);
      
      endpointStats.set(key, {
        method,
        path,
        requests: count,
        errors: errorCount,
        avgResponseTime: Math.round(avgResponseTime),
        errorRate: count > 0 ? ((errorCount / count) * 100).toFixed(2) + '%' : '0%'
      });
    }

    summary.endpoints = Array.from(endpointStats.values());
    
    return summary;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics.clear();
    this.requestCounts.clear();
    this.errorCounts.clear();
    this.responseTimes.clear();
  }

  /**
   * Log metrics summary
   */
  logMetricsSummary(): void {
    const summary = this.getMetricsSummary();
    logger.info('Metrics Summary', summary);
  }
}

/**
 * Singleton monitoring instance
 */
export const monitoring = new Monitoring();

/**
 * Middleware to track HTTP requests and responses
 */
export function monitoringMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();
  
  // Track request
  monitoring.trackRequest(req.method, req.path);
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data: any): Response {
    const duration = Date.now() - startTime;
    
    // Track response time
    monitoring.trackResponseTime(req.method, req.path, duration);
    
    // Track errors
    if (res.statusCode >= 400) {
      monitoring.trackError(req.method, req.path, res.statusCode);
    }
    
    // Log response
    logger.logResponse(req, res.statusCode, duration);
    
    return originalSend.call(this, data);
  };
  
  next();
}

/**
 * Health check metrics
 */
export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
  };
  database: {
    connected: boolean;
    responseTime?: number;
  };
  timestamp: string;
}

/**
 * Get health metrics
 */
export function getHealthMetrics(): HealthMetrics {
  const memUsage = process.memoryUsage();
  const totalMem = memUsage.heapTotal;
  const usedMem = memUsage.heapUsed;
  
  return {
    status: 'healthy',
    uptime: process.uptime(),
    memory: {
      used: Math.round(usedMem / 1024 / 1024), // MB
      total: Math.round(totalMem / 1024 / 1024), // MB
      percentage: Math.round((usedMem / totalMem) * 100)
    },
    cpu: {
      usage: Math.round(process.cpuUsage().user / 1000000) // Convert to seconds
    },
    database: {
      connected: true // This should be checked against actual DB connection
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * Start periodic metrics logging
 */
export function startMetricsLogging(intervalMs: number = 60000): NodeJS.Timeout {
  return setInterval(() => {
    monitoring.logMetricsSummary();
    
    const health = getHealthMetrics();
    logger.info('Health Metrics', health);
  }, intervalMs);
}

export default monitoring;
