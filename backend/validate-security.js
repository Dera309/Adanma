#!/usr/bin/env node

/**
 * Security validation script for production deployment
 * Checks for insecure configurations and placeholder values
 */

const fs = require('fs');
const path = require('path');

const CRITICAL_ERRORS = [];
const WARNINGS = [];

function checkEnvironmentFile(filePath, isProduction = false) {
  if (!fs.existsSync(filePath)) {
    if (isProduction) {
      CRITICAL_ERRORS.push(`Production environment file missing: ${filePath}`);
    }
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    
    // Check for placeholder values
    if (line.includes('REPLACE-WITH-') || line.includes('your-') || line.includes('dummy')) {
      CRITICAL_ERRORS.push(`${filePath}:${lineNum} - Placeholder value detected: ${line.trim()}`);
    }
    
    // Check for weak secrets
    if (line.includes('JWT_ACCESS_SECRET=') || line.includes('JWT_REFRESH_SECRET=')) {
      const secret = line.split('=')[1];
      if (secret && secret.length < 32) {
        CRITICAL_ERRORS.push(`${filePath}:${lineNum} - JWT secret too short (minimum 32 characters)`);
      }
      if (secret && (secret.includes('secret') || secret.includes('key') || secret.includes('REPLACE'))) {
        WARNINGS.push(`${filePath}:${lineNum} - JWT secret appears to be a placeholder`);
      }
    }
    
    // Check for mock mode in production
    if (isProduction && line.includes('USE_MOCK_DATA=true')) {
      CRITICAL_ERRORS.push(`${filePath}:${lineNum} - Mock data enabled in production`);
    }
    
    if (isProduction && line.includes('SKIP_DB_CHECKS=true')) {
      CRITICAL_ERRORS.push(`${filePath}:${lineNum} - Database checks disabled in production`);
    }
  });
}

function main() {
  console.log('🔒 Running security validation...\n');
  
  // Check development environment
  checkEnvironmentFile('.env', false);
  
  // Check production environment
  checkEnvironmentFile('.env.production', true);
  
  // Report results
  if (CRITICAL_ERRORS.length > 0) {
    console.log('❌ CRITICAL SECURITY ERRORS:');
    CRITICAL_ERRORS.forEach(error => console.log(`   ${error}`));
    console.log('');
  }
  
  if (WARNINGS.length > 0) {
    console.log('⚠️  SECURITY WARNINGS:');
    WARNINGS.forEach(warning => console.log(`   ${warning}`));
    console.log('');
  }
  
  if (CRITICAL_ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('✅ Security validation passed');
    process.exit(0);
  } else if (CRITICAL_ERRORS.length > 0) {
    console.log('🚨 Security validation FAILED - Critical errors must be fixed before deployment');
    process.exit(1);
  } else {
    console.log('⚠️  Security validation completed with warnings');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkEnvironmentFile };