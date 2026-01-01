# Monitoring and Logging Guide

This document explains the monitoring and logging infrastructure for the African E-commerce backend.

## 📊 Monitoring System

### Overview

The monitoring system tracks application performance, errors, and health metrics in real-time.

### Features

- **Request Tracking**: Monitor all HTTP requests and responses
- **Response Time Tracking**: Track endpoint performance
- **Error Tracking**: Identify and categorize errors
- **Health Metrics**: Monitor system health (CPU, memory, database)
- **Custom Metrics**: Track business-specific metrics

### Metrics Endpoints

#### GET /api/metrics
Get application metrics summary.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalRequests": 1250,
    "totalErrors": 15,
    "endpoints": [
      {
        "method": "POST",
        "path": "/api/auth/login",
        "requests": 150,
        "errors": 5,
        "avgResponseTime": 245,
        "errorRate": "3.33%"
      }
    ]
  }
}
```

#### GET /api/metrics/health
Get system health metrics.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 3600,
    "memory": {
      "used": 128,
      "total": 512,
      "percentage": 25
    },
    "cpu": {
      "usage": 15
    },
    "database": {
      "connected": true
    },
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

#### GET /api/metrics/errors
Get error statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 25,
    "bySeverity": {
      "critical": 2,
      "high": 5,
      "medium": 10,
      "low": 8
    },
    "byType": {
      "ValidationError": 10,
      "DatabaseError": 2,
      "AuthenticationError": 13
    },
    "mostFrequent": [...]
  }
}
```

#### GET /api/metrics/errors/critical
Get critical errors only.

#### POST /api/metrics/reset
Reset all metrics (admin only).

## 📝 Logging System

### Log Levels

- **ERROR**: Error events that might still allow the application to continue running
- **WARN**: Potentially harmful situations
- **INFO**: Informational messages highlighting progress
- **DEBUG**: Fine-grained informational events (development only)

### Log Format

**Development:**
```
[2024-01-01T12:00:00.000Z] [INFO] [Application] Server started
  Metadata: {
    "port": 5000,
    "environment": "development"
  }
```

**Production (JSON):**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "level": "info",
  "message": "Server started",
  "context": "Application",
  "metadata": {
    "port": 5000,
    "environment": "production"
  }
}
```

### Using the Logger

```typescript
import { logger, createLogger } from './utils/logger';

// Use default logger
logger.info('User logged in', { userId: '123' });
logger.error('Database connection failed', error);
logger.warn('High memory usage detected');
logger.debug('Processing request', { requestId: 'abc' });

// Create context-specific logger
const authLogger = createLogger('Authentication');
authLogger.info('Login attempt', { email: 'user@example.com' });

// Log HTTP requests
logger.logRequest(req, { userId: '123' });

// Log security events
logger.logSecurityEvent('Failed login attempt', { 
  ip: req.ip,
  attempts: 5 
});
```

## 🔍 Error Tracking

### Error Severity Levels

- **CRITICAL**: System-breaking errors (database failures, etc.)
- **HIGH**: Serious errors (500 status codes)
- **MEDIUM**: Client errors (400 status codes)
- **LOW**: Minor issues

### Tracking Errors

```typescript
import { trackError } from './utils/errorTracking';

try {
  // Your code
} catch (error) {
  trackError(error, req, 500, {
    operation: 'user-registration',
    userId: '123'
  });
}
```

### Error Context

Each tracked error includes:
- Error message and stack trace
- Severity level
- Request context (URL, method, IP, user agent)
- User ID (if authenticated)
- Timestamp
- Environment
- Custom metadata

## 📈 Metrics Collection

### Built-in Metrics

- **http_requests_total**: Total HTTP requests
- **http_errors_total**: Total HTTP errors
- **http_response_time_ms**: Response time histogram

### Custom Metrics

```typescript
import { monitoring } from './utils/monitoring';

// Increment counter
monitoring.incrementCounter('user_registrations', { 
  method: 'email' 
});

// Set gauge
monitoring.setGauge('active_users', 150);

// Record histogram
monitoring.recordHistogram('db_query_time', 45, { 
  query: 'SELECT' 
});
```

### Metrics Summary

```typescript
// Get metrics summary
const summary = monitoring.getMetricsSummary();

// Get specific endpoint stats
const avgTime = monitoring.getAverageResponseTime('POST', '/api/auth/login');
const requestCount = monitoring.getRequestCount('GET', '/api/users/profile');
const errorCount = monitoring.getErrorCount('POST', '/api/addresses', 400);
```

## 🏥 Health Checks

### Health Check Endpoint

**GET /health**

Returns server and database health status.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running",
  "database": "connected",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### Health Metrics

```typescript
import { getHealthMetrics } from './utils/monitoring';

const health = getHealthMetrics();
// Returns: status, uptime, memory, cpu, database
```

## 🔔 Alerting

### Setting Up Alerts

In production, integrate with external services:

**Sentry Integration:**
```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

**Alert Conditions:**
- Error rate > 5%
- Response time > 1000ms
- Memory usage > 80%
- Database connection failures
- Critical errors

## 📊 Dashboards

### Recommended Metrics to Monitor

**Performance:**
- Average response time per endpoint
- 95th percentile response time
- Requests per second
- Error rate

**Resources:**
- CPU usage
- Memory usage
- Database connections
- Disk I/O

**Business:**
- User registrations
- Login attempts
- Failed authentications
- API usage by endpoint

### Visualization Tools

**Recommended:**
- Grafana for metrics visualization
- Kibana for log analysis
- Sentry for error tracking
- Datadog for comprehensive monitoring

## 🔧 Configuration

### Environment Variables

```env
# Logging
LOG_LEVEL=info
DEBUG=false

# Monitoring
METRICS_ENABLED=true
METRICS_INTERVAL=300000  # 5 minutes

# Error Tracking
SENTRY_DSN=your-sentry-dsn
ERROR_TRACKING_ENABLED=true

# Health Checks
HEALTH_CHECK_INTERVAL=60000  # 1 minute
```

### Periodic Tasks

```typescript
// Start metrics logging every 5 minutes
startMetricsLogging(5 * 60 * 1000);

// Clear old errors every 24 hours
setInterval(() => {
  errorTracker.clearOldErrors(24);
}, 24 * 60 * 60 * 1000);
```

## 🧪 Testing Monitoring

### Test Metrics Collection

```bash
# Generate test requests
for i in {1..100}; do
  curl http://localhost:5000/api/health
done

# Check metrics
curl http://localhost:5000/api/metrics
```

### Test Error Tracking

```bash
# Trigger an error
curl -X POST http://localhost:5000/api/invalid-endpoint

# Check error stats
curl http://localhost:5000/api/metrics/errors
```

## 📚 Best Practices

### Logging

1. **Use appropriate log levels**
   - ERROR for errors
   - WARN for warnings
   - INFO for important events
   - DEBUG for development only

2. **Include context**
   - Always include relevant metadata
   - Add correlation IDs for request tracking
   - Include user IDs when available

3. **Avoid logging sensitive data**
   - Never log passwords
   - Mask credit card numbers
   - Redact personal information

4. **Structure your logs**
   - Use consistent format
   - Include timestamps
   - Add context information

### Monitoring

1. **Track key metrics**
   - Response times
   - Error rates
   - Resource usage
   - Business metrics

2. **Set up alerts**
   - Define thresholds
   - Configure notifications
   - Test alert conditions

3. **Regular review**
   - Analyze trends
   - Identify bottlenecks
   - Optimize performance

4. **Clean up old data**
   - Archive old logs
   - Clear old metrics
   - Maintain performance

## 🚨 Troubleshooting

### High Memory Usage

```typescript
// Check memory metrics
const health = getHealthMetrics();
console.log(health.memory);

// If memory > 80%, investigate:
// - Memory leaks
// - Large data structures
// - Unclosed connections
```

### Slow Response Times

```typescript
// Check endpoint performance
const avgTime = monitoring.getAverageResponseTime('POST', '/api/auth/login');

// If avgTime > 1000ms, investigate:
// - Database queries
// - External API calls
// - CPU-intensive operations
```

### High Error Rate

```typescript
// Check error statistics
const errorStats = errorTracker.getErrorStats();

// Investigate most frequent errors
console.log(errorStats.mostFrequent);
```

## 📞 Support

For monitoring and logging issues:
- Check logs: `tail -f logs/application.log`
- Review metrics: `GET /api/metrics`
- Contact DevOps team: devops@african-ecommerce.com