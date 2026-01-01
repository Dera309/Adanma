// Test backend connection
const http = require('http');

console.log('🧪 Testing backend connection...');

// Test health endpoint
const healthOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET'
};

const healthReq = http.request(healthOptions, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Health endpoint working:', res.statusCode);
    console.log('Response:', data);
    
    // Test registration endpoint
    testRegistration();
  });
});

healthReq.on('error', (err) => {
  console.log('❌ Health endpoint failed:', err.message);
});

healthReq.end();

function testRegistration() {
  console.log('\n🧪 Testing registration endpoint...');
  
  const postData = JSON.stringify({
    email: 'test@example.com',
    password: 'TestPass123!',
    acceptedTerms: true
  });

  const regOptions = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/register/email',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': 'test-123'
    }
  };

  const regReq = http.request(regOptions, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Registration endpoint responding:', res.statusCode);
      console.log('Response:', data);
      
      if (res.statusCode < 500) {
        console.log('\n🎉 Backend is working! Frontend should be able to connect.');
        console.log('💡 If frontend still shows network errors, try:');
        console.log('   1. Restart frontend: cd frontend && npm run dev');
        console.log('   2. Clear browser cache');
        console.log('   3. Check browser network tab for details');
      }
    });
  });

  regReq.on('error', (err) => {
    console.log('❌ Registration endpoint failed:', err.message);
  });

  regReq.write(postData);
  regReq.end();
}