import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import compression from 'compression';
import morgan from 'morgan';
import session from 'express-session';
import passport from 'passport';
import { initializeDatabase, checkDatabaseHealth } from './utils/db-health';
import { initializePassport } from './config/passport';
import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import addressesRoutes from './routes/addresses';
import cartRoutes from './routes/cart';
import adminRoutes from './routes/admin';
import contentRoutes from './routes/content';
import orderRoutes from './routes/orders';
import productRoutes from './routes/products';
import paymentRoutes from './routes/payments';
import metricsRoutes from './routes/metrics';
import { monitoringMiddleware, startMetricsLogging } from './utils/monitoring';
import { logger } from './utils/logger';
import {
  securityHeaders,
  apiLimiter,
  csrfProtection,
  sqlInjectionPrevention,
  xssPrevention,
  ipFilter,
  securityResponseHeaders
} from './middleware/security';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5002', 10);

// Security middleware
app.use(securityHeaders);
app.use(compression());
app.use(ipFilter);
app.use(securityResponseHeaders);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3001',
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3000'
    ];
    
    if (allowedOrigins.includes(origin) || process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Correlation-ID', 'x-request-id', 'Origin', 'Accept']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Input validation and sanitization
app.use(sqlInjectionPrevention);
app.use(xssPrevention);
// Skip CSRF protection in development for auth endpoints
if (process.env.NODE_ENV !== 'development') {
  app.use(csrfProtection);
}

// Session middleware for OAuth state management
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000 // 10 minutes for OAuth flows
  }
}));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Monitoring middleware
app.use(monitoringMiddleware);

// Initialize Passport
initializePassport();
app.use(passport.initialize());

// Health check endpoint
app.get('/health', async (_req, res) => {
  const dbHealthy = await checkDatabaseHealth();
  
  if (dbHealthy) {
    res.status(200).json({ 
      status: 'ok', 
      message: 'Server is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({ 
      status: 'error', 
      message: 'Server is running but database is unavailable',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});

// API Routes with rate limiting
app.use('/api/auth', apiLimiter, authRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/addresses', apiLimiter, addressesRoutes);
app.use('/api/cart', apiLimiter, cartRoutes);
app.use('/api/admin', apiLimiter, adminRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/orders', apiLimiter, orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', apiLimiter, paymentRoutes);
app.use('/api/metrics', metricsRoutes);

// 404 handler
app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint not found'
    }
  });
});

// Global error handler
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'SYS_001',
      message: 'Internal server error'
    }
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database connection
    await initializeDatabase();

    // Start server - explicitly bind to all interfaces
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('Server started', {
        port: PORT,
        host: '0.0.0.0',
        environment: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001'
      });

      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ API base: http://localhost:${PORT}/api`);

      // Start periodic metrics logging (every 5 minutes)
      startMetricsLogging(5 * 60 * 1000);
    });

    // Handle server errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop other processes or use a different port.`);
        process.exit(1);
      } else if (error.code === 'EACCES') {
        console.error(`❌ Permission denied to bind to port ${PORT}. Try using a port > 1024 or run as administrator.`);
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
