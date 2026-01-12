import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import net from 'net';
import { databaseService } from './services/DatabaseService';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import cartRoutes from './routes/cart';
import addressRoutes from './routes/addresses';
import verificationRoutes from './routes/verification';
import orderRoutes from './routes/orders';
import contentRoutes from './routes/content';
import productRoutes from './routes/products';

// Load environment variables
dotenv.config();

// Function to find an available port
function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve) => {
    console.log(`🔍 Checking if port ${startPort} is available...`);
    const server = net.createServer();
    server.listen(startPort, () => {
      server.close(() => {
        console.log(`✅ Port ${startPort} is available.`);
        resolve(startPort);
      });
    });
    server.on('error', (err: any) => {
      console.log(`❌ Port ${startPort} is in use (error: ${err.code}). Trying next port...`);
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

const app = express();

// Security middleware
app.use(helmet());

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

// Health check endpoint
app.get('/health', async (_req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    database: databaseService.isConnected() ? 'connected' : 'in-memory',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || '5002',
    mode: 'full',
    features: {
      authentication: true,
      userManagement: true,
      addressManagement: true,
      vendorVerification: true,
      cart: true
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/products', productRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working', 
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      addresses: '/api/addresses',
      verification: '/api/verification',
      cart: '/api/cart',
      content: '/api/content'
    }
  });
});

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

// Start server
async function startServer() {
  try {
    const PORT = await findAvailablePort(parseInt(process.env.PORT || '5002', 10));

    console.log('\n🔧 Server Configuration:');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Port: ${PORT}`);

    // Connect to database
    await databaseService.connect();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server is running on http://localhost:${PORT}`);
      console.log(`✅ Health check: http://localhost:${PORT}/health`);
      console.log(`✅ Database: ${databaseService.isConnected() ? 'MongoDB Atlas' : 'In-Memory'}`);
      console.log(`✅ API endpoints:`);
      console.log(`   - Auth: http://localhost:${PORT}/api/auth`);
      console.log(`   - Users: http://localhost:${PORT}/api/users`);
      console.log(`   - Addresses: http://localhost:${PORT}/api/addresses`);
      console.log(`   - Verification: http://localhost:${PORT}/api/verification`);
      console.log(`   - Cart: http://localhost:${PORT}/api/cart`);
      console.log(`   - Content: http://localhost:${PORT}/api/content`);
      console.log(`   - Products: http://localhost:${PORT}/api/products`);
      console.log('\n🎯 Requirements Implementation:');
      console.log('   ✅ Multi-method authentication (email, phone)');
      console.log('   ✅ User role selection (buyer, vendor)');
      console.log('   ✅ Multi-country address management');
      console.log('   ✅ Profile management');
      console.log('   ✅ Session management with JWT');
      console.log('   ✅ Vendor verification system');
      console.log('   ✅ Password validation');
      console.log('   ✅ Error handling and validation');
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please stop the existing process or use a different port.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
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