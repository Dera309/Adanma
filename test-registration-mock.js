// Test registration with mock mode
const http = require('http');

console.log('🧪 Testing Registration with Mock Mode...\n');

// Test phone registration
const phoneData = JSON.stringify({
  phoneNumber: '+2348123456789',
  password: 'TestPassword123!',
  acceptedTerms: true
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/register/phone',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Correlation-ID': 'test-' + Date.now(),
    'Content-Length': Buffer.byteLength(phoneData)
  }
};

console.log('📱 Testing phone registration...');

const req = http.request(options, (res) => {
  console.log(`✅ Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Response:', JSON.stringify(response, null, 2));
      
      if (response.success && response.data?.mockMode) {
        console.log('\n🎉 Mock mode registration working perfectly!');
        console.log(`📱 Mock verification code: ${response.data.mockVerificationCode}`);
      } else {
        console.log('\n⚠️  Registration succeeded but not in mock mode');
      }
    } catch (error) {
      console.log('✅ Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure backend server is running on port 5000');
});

req.write(phoneData);
req.end();