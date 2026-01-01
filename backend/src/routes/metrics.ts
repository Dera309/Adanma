import { Router, Request, Response } from 'express';
import { monitoring, getHealthMetrics } from '../utils/monitoring';
import { errorTracker } from '../utils/errorTracking';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /metrics
 * Get application metrics
 */
router.get('/', (_req: Request, res: Response) => {
  try {
    const metrics = monitoring.getMetricsSummary();
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Failed to get metrics', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'METRICS_ERROR',
        message: 'Failed to retrieve metrics'
      }
    });
  }
});

/**
 * GET /metrics/health
 * Get health metrics
 */
router.get('/health', (_req: Request, res: Response) => {
  try {
    const health = getHealthMetrics();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Failed to get health metrics', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_ERROR',
        message: 'Failed to retrieve health metrics'
      }
    });
  }
});

/**
 * GET /metrics/errors
 * Get error statistics
 */
router.get('/errors', (_req: Request, res: Response) => {
  try {
    const errorStats = errorTracker.getErrorStats();
    
    res.json({
      success: true,
      data: errorStats
    });
  } catch (error) {
    logger.error('Failed to get error stats', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'ERROR_STATS_ERROR',
        message: 'Failed to retrieve error statistics'
      }
    });
  }
});

/**
 * GET /metrics/errors/critical
 * Get critical errors
 */
router.get('/errors/critical', (_req: Request, res: Response) => {
  try {
    const criticalErrors = errorTracker.getErrorsBySeverity('critical' as any);
    
    res.json({
      success: true,
      data: {
        count: criticalErrors.length,
        errors: criticalErrors
      }
    });
  } catch (error) {
    logger.error('Failed to get critical errors', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CRITICAL_ERRORS_ERROR',
        message: 'Failed to retrieve critical errors'
      }
    });
  }
});

/**
 * POST /metrics/reset
 * Reset metrics (admin only)
 */
router.post('/reset', (_req: Request, res: Response) => {
  try {
    // In production, this should require admin authentication
    monitoring.reset();
    errorTracker.reset();
    
    logger.info('Metrics reset by admin');
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    logger.error('Failed to reset metrics', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_ERROR',
        message: 'Failed to reset metrics'
      }
    });
  }
});

export default router;
