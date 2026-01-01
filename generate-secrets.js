const crypto = require('crypto');

// Generate secure random secrets
const generateSecret = (length = 64) => crypto.randomBytes(length).toString('hex');

console.log('# Production Environment Variables');
console.log('# Replace these values in your production .env file');
console.log('');
console.log('# JWT Secrets (CRITICAL - Keep these secure!)');
console.log(`JWT_ACCESS_SECRET=${generateSecret()}`);
console.log(`JWT_REFRESH_SECRET=${generateSecret()}`);
console.log('');
console.log('# Session Secret');
console.log(`SESSION_SECRET=${generateSecret(32)}`);
console.log('');
console.log('# Production Mode Settings');
console.log('NODE_ENV=production');
console.log('SKIP_DB_CHECKS=false');
console.log('USE_MOCK_DATA=false');
console.log('');
console.log('# Database (Replace with your production MongoDB URL)');
console.log('DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/adanma_prod"');
console.log('');
console.log('# API Configuration');
console.log('PORT=5000');
console.log('API_BASE_URL=https://your-domain.com');
console.log('FRONTEND_URL=https://your-frontend-domain.com');
console.log('');
console.log('# Payment Configuration (Replace with real keys)');
console.log('STRIPE_SECRET_KEY=sk_live_your_real_stripe_secret_key');
console.log('STRIPE_PUBLISHABLE_KEY=pk_live_your_real_stripe_publishable_key');