#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔒 Adanma Production Security Validation');
console.log('=========================================\n');

let errors = 0;
let warnings = 0;

// Check environment variables
const envPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ ERROR: backend/.env file not found');
  errors++;
} else {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check NODE_ENV
  if (!envContent.includes('NODE_ENV=production')) {
    console.log('⚠️  WARNING: NODE_ENV is not set to production');
    warnings++;
  } else {
    console.log('✅ NODE_ENV set to production');
  }
  
  // Check mock data settings
  if (envContent.includes('USE_MOCK_DATA=true')) {
    console.log('❌ CRITICAL: USE_MOCK_DATA is enabled - MUST be false in production');
    errors++;
  } else {
    console.log('✅ Mock data disabled');
  }
  
  // Check JWT secrets
  if (envContent.includes('REPLACE-WITH-SECURE') || 
      envContent.includes('adanma-access-secret-key-for-development') ||
      envContent.includes('your-session-secret-change-in-production')) {
    console.log('❌ CRITICAL: Default JWT secrets detected - MUST generate new secrets');
    errors++;
  } else {
    console.log('✅ JWT secrets appear to be customized');
  }
  
  // Check database URL
  if (envContent.includes('file:./dev.db') || 
      envContent.includes('localhost') ||
      envContent.includes('password')) {
    console.log('⚠️  WARNING: Database URL may not be configured for production');
    warnings++;
  } else {
    console.log('✅ Database URL appears to be configured');
  }
  
  // Check Stripe keys
  if (envContent.includes('sk_test_dummy_key') || 
      envContent.includes('pk_test_dummy_key')) {
    console.log('❌ CRITICAL: Dummy Stripe keys detected - MUST use real production keys');
    errors++;
  } else if (envContent.includes('sk_live_') && envContent.includes('pk_live_')) {
    console.log('✅ Production Stripe keys detected');
  } else {
    console.log('⚠️  WARNING: Stripe keys may not be configured');
    warnings++;
  }
}

// Check if production environment template exists
const prodEnvPath = path.join(__dirname, 'backend', '.env.production');
if (fs.existsSync(prodEnvPath)) {
  console.log('✅ Production environment template exists');
} else {
  console.log('⚠️  WARNING: Production environment template not found');
  warnings++;
}

// Check security checklist
const checklistPath = path.join(__dirname, 'SECURITY-CHECKLIST.md');
if (fs.existsSync(checklistPath)) {
  console.log('✅ Security checklist available');
} else {
  console.log('⚠️  WARNING: Security checklist not found');
  warnings++;
}

// Check deployment script
const deployPath = path.join(__dirname, 'deploy-production.sh');
if (fs.existsSync(deployPath)) {
  console.log('✅ Production deployment script available');
} else {
  console.log('⚠️  WARNING: Production deployment script not found');
  warnings++;
}

console.log('\n📊 Security Validation Summary');
console.log('==============================');
console.log(`❌ Critical Errors: ${errors}`);
console.log(`⚠️  Warnings: ${warnings}`);

if (errors > 0) {
  console.log('\n🚨 PRODUCTION DEPLOYMENT BLOCKED');
  console.log('Critical security issues must be resolved before deployment.');
  console.log('Run: node generate-secrets.js to generate secure secrets');
  process.exit(1);
} else if (warnings > 0) {
  console.log('\n⚠️  PRODUCTION DEPLOYMENT WITH WARNINGS');
  console.log('Review warnings before deploying to production.');
  process.exit(2);
} else {
  console.log('\n✅ PRODUCTION READY');
  console.log('All security checks passed. Safe to deploy.');
  process.exit(0);
}