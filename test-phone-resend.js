// Test phone verification resend specifically
const http = require('http');

console.log('🧪 Testing Phone Verification Resend...\n');

const resendData = JSON.stringify({
  userId: 'mock-123456',
  phoneNumber: '+2348123456789'
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/auth/verify/phone/resend',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Correlation-ID': 'test-' + Date.now(),
    'Origin': 'http://localhost:3001',
    'Referer': 'http://localhost:3001/',
    'Content-Length': Buffer.byteLength(resendData)
  }
};

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
        console.log('\n🎉 Phone verification resend working perfectly!');
        console.log(`📱 Mock verification code: ${response.data.mockVerificationCode}`);
      }
    } catch (error) {
      console.log('✅ Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.write(resendData);
req.end();