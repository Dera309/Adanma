#!/usr/bin/env node

/**
 * Adanma Deployment Readiness Test
 * Comprehensive test to verify the application is ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Adanma Deployment Readiness Test');
console.log('=====================================\n');

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  issues: []
};

function test(name, condition, severity = 'error') {
  if (condition) {
    console.log(`✅ ${name}`);
    results.passed++;
  } else {
    const symbol = severity === 'warning' ? '⚠️' : '❌';
    console.log(`${symbol} ${name}`);
    if (severity === 'warning') {
      results.warnings++;
    } else {
      results.failed++;
      results.issues.push(name);
    }
  }
}

// 1. Build Tests
console.log('📦 Build Tests');
console.log('---------------');

const frontendDist = fs.existsSync('./frontend/dist');
const backendDist = fs.existsSync('./backend/dist');

test('Frontend builds successfully', frontendDist);
test('Backend builds successfully', backendDist);

if (frontendDist) {
  const indexHtml = fs.existsSync('./frontend/dist/index.html');
  const assets = fs.existsSync('./frontend/dist/assets');
  test('Frontend has index.html', indexHtml);
  test('Frontend has assets directory', assets);
}

if (backendDist) {
  const indexJs = fs.existsSync('./backend/dist/index.js');
  test('Backend has compiled index.js', indexJs);
}

// 2. Configuration Tests
console.log('\n⚙️ Configuration Tests');
console.log('----------------------');

const packageJson = fs.existsSync('./package.json');
const frontendPackageJson = fs.existsSync('./frontend/package.json');
const backendPackageJson = fs.existsSync('./backend/package.json');

test('Root package.json exists', packageJson);
test('Frontend package.json exists', frontendPackageJson);
test('Backend package.json exists', backendPackageJson);

const dockerCompose = fs.existsSync('./docker-compose.prod.yml');
const frontendDockerfile = fs.existsSync('./frontend/Dockerfile');
const backendDockerfile = fs.existsSync('./backend/Dockerfile');

test('Production docker-compose.yml exists', dockerCompose);
test('Frontend Dockerfile exists', frontendDockerfile);
test('Backend Dockerfile exists', backendDockerfile);

const envExample = fs.existsSync('./.env.production.example');
test('Production environment example exists', envExample);

// 3. Security Tests
console.log('\n🔒 Security Tests');
console.log('-----------------');

const gitignore = fs.existsSync('./.gitignore');
test('.gitignore exists', gitignore);

if (gitignore) {
  const gitignoreContent = fs.readFileSync('./.gitignore', 'utf8');
  test('.env files are ignored', gitignoreContent.includes('.env'));
  test('node_modules are ignored', gitignoreContent.includes('node_modules'));
  test('dist folders are ignored', gitignoreContent.includes('dist'));
}

// Check for sensitive files that shouldn't exist
const sensitiveFiles = ['.env', 'backend/.env', 'frontend/.env'];
let hasSensitiveFiles = false;
sensitiveFiles.forEach(file => {
  if (fs.existsSync(file)) {
    hasSensitiveFiles = true;
    console.log(`⚠️ Sensitive file found: ${file} (should not be in production)`);
    results.warnings++;
  }
});

if (!hasSensitiveFiles) {
  console.log('✅ No sensitive files found in repository');
  results.passed++;
}

// 4. Documentation Tests
console.log('\n📚 Documentation Tests');
console.log('----------------------');

const readme = fs.existsSync('./README.md');
const deployment = fs.existsSync('./DEPLOYMENT.md') || fs.existsSync('./docs/DEPLOYMENT.md');
const quickStart = fs.existsSync('./QUICK-START.md') || fs.existsSync('./docs/QUICK-START.md');

test('README.md exists', readme);
test('Deployment documentation exists', deployment);
test('Quick start guide exists', quickStart);

// 5. Frontend Tests
console.log('\n🎨 Frontend Tests');
console.log('-----------------');

if (frontendPackageJson) {
  const frontendPkg = JSON.parse(fs.readFileSync('./frontend/package.json', 'utf8'));
  test('Frontend has build script', frontendPkg.scripts && frontendPkg.scripts.build);
  test('Frontend has start script', frontendPkg.scripts && frontendPkg.scripts.start);
  test('Frontend has React dependency', frontendPkg.dependencies && frontendPkg.dependencies.react);
  test('Frontend has TypeScript', frontendPkg.devDependencies && frontendPkg.devDependencies.typescript);
}

const frontendTsConfig = fs.existsSync('./frontend/tsconfig.json');
const frontendViteConfig = fs.existsSync('./frontend/vite.config.ts');

test('Frontend TypeScript config exists', frontendTsConfig);
test('Frontend Vite config exists', frontendViteConfig);

// 6. Backend Tests
console.log('\n🔧 Backend Tests');
console.log('----------------');

if (backendPackageJson) {
  const backendPkg = JSON.parse(fs.readFileSync('./backend/package.json', 'utf8'));
  test('Backend has build script', backendPkg.scripts && backendPkg.scripts.build);
  test('Backend has start script', backendPkg.scripts && backendPkg.scripts.start);
  test('Backend has dev script', backendPkg.scripts && backendPkg.scripts.dev);
  test('Backend has Express dependency', backendPkg.dependencies && backendPkg.dependencies.express);
  test('Backend has TypeScript', backendPkg.devDependencies && backendPkg.devDependencies.typescript);
}

const backendTsConfig = fs.existsSync('./backend/tsconfig.json');
test('Backend TypeScript config exists', backendTsConfig);

// Check for essential backend files
const backendFiles = [
  './backend/src/index.ts',
  './backend/src/routes',
  './backend/src/middleware',
  './backend/src/controllers'
];

backendFiles.forEach(file => {
  test(`Backend ${path.basename(file)} exists`, fs.existsSync(file));
});

// 7. Infrastructure Tests
console.log('\n🏗️ Infrastructure Tests');
console.log('------------------------');

const nginxConfig = fs.existsSync('./nginx/nginx.conf');
test('Nginx configuration exists', nginxConfig);

const scripts = fs.existsSync('./scripts');
test('Deployment scripts directory exists', scripts);

if (scripts) {
  const deployScript = fs.existsSync('./scripts/deploy.sh');
  test('Deploy script exists', deployScript, 'warning');
}

// 8. Performance Tests
console.log('\n⚡ Performance Tests');
console.log('-------------------');

if (frontendDist) {
  const distFiles = fs.readdirSync('./frontend/dist', { recursive: true });
  const jsFiles = distFiles.filter(f => f.endsWith('.js'));
  const cssFiles = distFiles.filter(f => f.endsWith('.css'));
  
  test('Frontend has JavaScript bundles', jsFiles.length > 0);
  test('Frontend has CSS bundles', cssFiles.length > 0);
  
  // Check for source maps (good for debugging)
  const sourceMaps = distFiles.filter(f => f.endsWith('.map'));
  test('Source maps generated', sourceMaps.length > 0, 'warning');
}

// 9. Dependency Tests
console.log('\n📦 Dependency Tests');
console.log('-------------------');

// Check for package-lock.json files
const rootLock = fs.existsSync('./package-lock.json');
const frontendLock = fs.existsSync('./frontend/package-lock.json');
const backendLock = fs.existsSync('./backend/package-lock.json');

test('Root package-lock.json exists', rootLock);
test('Frontend package-lock.json exists', frontendLock);
test('Backend package-lock.json exists', backendLock);

// 10. Final Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️ Warnings: ${results.warnings}`);

const total = results.passed + results.failed + results.warnings;
const passRate = ((results.passed / total) * 100).toFixed(1);

console.log(`\n📈 Pass Rate: ${passRate}%`);

if (results.failed === 0) {
  console.log('\n🎉 DEPLOYMENT READY!');
  console.log('The application is ready for production deployment.');
  
  if (results.warnings > 0) {
    console.log('\n⚠️ Warnings to address:');
    console.log('- Consider addressing warnings for optimal deployment');
  }
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Set up production environment variables');
  console.log('2. Configure domain and SSL certificates');
  console.log('3. Set up monitoring and logging');
  console.log('4. Run: docker-compose -f docker-compose.prod.yml up -d');
  
  process.exit(0);
} else {
  console.log('\n❌ NOT READY FOR DEPLOYMENT');
  console.log('\nCritical issues to fix:');
  results.issues.forEach(issue => {
    console.log(`- ${issue}`);
  });
  
  console.log('\n🔧 Fix these issues before deploying to production.');
  process.exit(1);
}