// Quick network diagnostics and fixes
console.log('🔧 Running Network Diagnostics...');

// Test 1: Check if backend is accessible
async function testBackendConnection() {
  console.log('\n1. Testing backend connection...');
  
  try {
    const response = await fetch('http://localhost:5000/health', {
      method: 'GET',
      cache: 'no-cache'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is accessible:', data);
      return true;
    } else {
      console.log('❌ Backend returned error:', response.status, response.statusText);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to backend:', error.message);
    return false;
  }
}

// Test 2: Check CORS configuration
async function testCORS() {
  console.log('\n2. Testing CORS configuration...');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('✅ CORS preflight successful:', response.status);
    
    // Log CORS headers
    const corsHeaders = {};
    for (let [key, value] of response.headers.entries()) {
      if (key.toLowerCase().includes('access-control')) {
        corsHeaders[key] = value;
      }
    }
    console.log('CORS headers:', corsHeaders);
    
  } catch (error) {
    console.log('❌ CORS test failed:', error.message);
  }
}

// Test 3: Test actual login request
async function testLogin() {
  console.log('\n3. Testing login request...');
  
  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': window.location.origin
      },
      credentials: 'include',
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'testpassword123'
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful:', data);
    } else {
      console.log('❌ Login failed:', response.status, data);
    }
    
  } catch (error) {
    console.log('❌ Login request failed:', error.message);
    console.log('Error type:', error.constructor.name);
    console.log('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
  }
}

// Test 4: Check browser environment
function checkBrowserEnvironment() {
  console.log('\n4. Checking browser environment...');
  
  const info = {
    userAgent: navigator.userAgent,
    cookiesEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    language: navigator.language,
    platform: navigator.platform,
    origin: window.location.origin,
    protocol: window.location.protocol,
    host: window.location.host
  };
  
  console.log('Browser info:', info);
  
  // Check for potential issues
  if (!navigator.cookieEnabled) {
    console.log('⚠️ WARNING: Cookies are disabled - this will cause authentication issues');
  }
  
  if (!navigator.onLine) {
    console.log('⚠️ WARNING: Browser reports offline status');
  }
  
  if (window.location.protocol === 'file:') {
    console.log('⚠️ WARNING: Running from file:// protocol - CORS will be restricted');
  }
}

// Run all tests
async function runDiagnostics() {
  console.log('🔧 Starting comprehensive network diagnostics...');
  
  checkBrowserEnvironment();
  
  const backendOnline = await testBackendConnection();
  
  if (backendOnline) {
    await testCORS();
    await testLogin();
  } else {
    console.log('\n❌ Backend is not accessible. Please check:');
    console.log('   1. Backend server is running on port 5000');
    console.log('   2. No firewall blocking localhost:5000');
    console.log('   3. No other service using port 5000');
  }
  
  console.log('\n🔧 Diagnostics complete. Check the results above.');
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  runDiagnostics();
} else {
  console.log('Run this script in a browser console for full diagnostics.');
}