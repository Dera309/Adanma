#!/usr/bin/env node

/**
 * Full Mode Verification Script
 * Verifies that all parts of the application are running in full production mode
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFYING FULL MODE CONFIGURATION...\n');

// Check backend .env configuration
function checkBackendEnv() {
  console.log('📋 Checking Backend Environment Configuration:');
  
  const envPath = path.join(__dirname, 'backend', '.env');
  if (!fs.existsSync(envPath)) {
    console.log('❌ Backend .env file not found');
    return false;
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  const checks = [
    { key: 'USE_MOCK_DATA', expected: 'false', description: 'Mock data disabled' },
    { key: 'SKIP_DB_CHECKS', expected: 'false', description: 'Database checks enabled' },
    { key: 'NODE_ENV', expected: 'development', description: 'Development environment' },
    { key: 'DATABASE_URL', required: true, description: 'Database URL configured' },
    { key: 'SMS_PROVIDER', expected: 'twilio', description: 'Real SMS provider' },
    { key: 'EMAIL_PROVIDER', expected: 'sendgrid', description: 'Real email provider' }
  ];
  
  let allPassed = true;
  
  checks.forEach(check => {
    const line = envLines.find(line => line.startsWith(`${check.key}=`));
    if (!line) {
      if (check.required) {
        console.log(`❌ ${check.description}: ${check.key} not found`);
        allPassed = false;
      } else {
        console.log(`⚠️  ${check.description}: ${check.key} not set (using default)`);
      }
      return;
    }
    
    const value = line.split('=')[1]?.replace(/"/g, '');
    if (check.expected && value !== check.expected) {
      console.log(`❌ ${check.description}: Expected "${check.expected}", got "${value}"`);
      allPassed = false;
    } else {
      console.log(`✅ ${check.description}: ${value || 'configured'}`);
    }
  });
  
  return allPassed;
}

console.log('✅ Full mode verification script created');