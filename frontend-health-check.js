const fs = require('fs');
const path = require('path');

console.log('🔍 Frontend Health Check');
console.log('========================\n');

const frontendPath = './frontend';
const issues = [];
const warnings = [];

// Check if frontend directory exists
if (!fs.existsSync(frontendPath)) {
  issues.push('Frontend directory does not exist');
  console.log('❌ Frontend directory not found');
  process.exit(1);
}

console.log('✅ Frontend directory exists');

// Check package.json
const packageJsonPath = path.join(frontendPath, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  console.log('✅ package.json exists');
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check essential dependencies
    const requiredDeps = ['react', 'react-dom', 'react-router-dom', 'axios'];
    const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      issues.push(`Missing dependencies: ${missingDeps.join(', ')}`);
    } else {
      console.log('✅ Essential dependencies present');
    }
    
    // Check scripts
    const requiredScripts = ['dev', 'build'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts[script]);
    
    if (missingScripts.length > 0) {
      warnings.push(`Missing scripts: ${missingScripts.join(', ')}`);
    } else {
      console.log('✅ Essential scripts present');
    }
  } catch (error) {
    issues.push('Invalid package.json format');
  }
} else {
  issues.push('package.json not found');
}

// Check essential files
const essentialFiles = [
  'src/main.tsx',
  'src/App.tsx',
  'index.html',
  'vite.config.ts',
  'tsconfig.json'
];

essentialFiles.forEach(file => {
  const filePath = path.join(frontendPath, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    issues.push(`Missing essential file: ${file}`);
  }
});

// Check environment file
const envPath = path.join(frontendPath, '.env');
if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    if (envContent.includes('VITE_API_URL')) {
      console.log('✅ API URL configured');
    } else {
      warnings.push('VITE_API_URL not configured in .env');
    }
  } catch (error) {
    warnings.push('Could not read .env file');
  }
} else {
  warnings.push('.env file not found');
}

// Check node_modules
const nodeModulesPath = path.join(frontendPath, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('✅ node_modules exists');
} else {
  issues.push('node_modules not found - run npm install');
}

// Check src directory structure
const srcPath = path.join(frontendPath, 'src');
if (fs.existsSync(srcPath)) {
  console.log('✅ src directory exists');
  
  const expectedDirs = ['components', 'pages', 'contexts', 'lib'];
  expectedDirs.forEach(dir => {
    const dirPath = path.join(srcPath, dir);
    if (fs.existsSync(dirPath)) {
      console.log(`✅ src/${dir} exists`);
    } else {
      warnings.push(`src/${dir} directory not found`);
    }
  });
} else {
  issues.push('src directory not found');
}

// Summary
console.log('\n📊 SUMMARY');
console.log('===========');

if (issues.length === 0) {
  console.log('🎉 No critical issues found!');
} else {
  console.log('🚨 CRITICAL ISSUES:');
  issues.forEach((issue, index) => {
    console.log(`${index + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach((warning, index) => {
    console.log(`${index + 1}. ${warning}`);
  });
}

console.log('\n💡 RECOMMENDATIONS:');
if (issues.length > 0) {
  console.log('- Fix critical issues before starting the frontend');
  console.log('- Run: cd frontend && npm install');
} else {
  console.log('- Frontend appears to be properly configured');
  console.log('- Try starting with: cd frontend && npm run dev');
  console.log('- Check browser console for any runtime errors');
}

console.log('\n🔧 QUICK START COMMANDS:');
console.log('cd frontend');
console.log('npm install');
console.log('npm run dev');