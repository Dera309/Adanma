// Test all auth endpoints with mock mode
const http = require('http');

const API_BASE = 'http://localhost:5000/api';

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-' + Date.now(),
        'Origin': 'http://localhost:3001',  // Add origin header for CSRF protection
        'Referer': 'http://localhost:3001/' // Add referer header as backup
      }
    };

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function testAllEndpoints() {
  console.log('🧪 Testing All Auth Endpoints with Mock Mode...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const health = await makeRequest('/health', 'GET');
    console.log(`✅ Health: ${health.status} - ${health.data.status || 'OK'}\n`);

    // Test 2: Phone Registration
    console.log('2️⃣ Testing phone registration...');
    const phoneReg = await makeRequest('/auth/register/phone', 'POST', {
      phoneNumber: '+2348123456789',
      password: 'TestPassword123!',
      acceptedTerms: true
    });
    console.log(`✅ Phone Registration: ${phoneReg.status}`);
    console.log(`   Mock Mode: ${phoneReg.data.data?.mockMode}`);
    console.log(`   User ID: ${phoneReg.data.data?.userId}\n`);

    // Test 3: Phone Verification
    console.log('3️⃣ Testing phone verification...');
    const phoneVerify = await makeRequest('/auth/verify/phone', 'POST', {
      userId: phoneReg.data.data?.userId || 'mock-123',
      code: '123456'
    });
    console.log(`✅ Phone Verification: ${phoneVerify.status}`);
    console.log(`   Mock Mode: ${phoneVerify.data.data?.mockMode}\n`);

    // Test 4: Phone Verification Resend
    console.log('4️⃣ Testing phone verification resend...');
    const phoneResend = await makeRequest('/auth/verify/phone/resend', 'POST', {
      userId: phoneReg.data.data?.userId || 'mock-123'
    });
    console.log(`✅ Phone Resend: ${phoneResend.status}`);
    console.log(`   Mock Mode: ${phoneResend.data.data?.mockMode}\n`);

    // Test 5: Login
    console.log('5️⃣ Testing login...');
    const login = await makeRequest('/auth/login', 'POST', {
      identifier: '+2348123456789',
      password: 'TestPassword123!'
    });
    console.log(`✅ Login: ${login.status}`);
    console.log(`   Mock Mode: ${login.data.data?.mockMode}\n`);

    // Test 6: Email Registration
    console.log('6️⃣ Testing email registration...');
    const emailReg = await makeRequest('/auth/register/email', 'POST', {
      email: 'test@example.com',
      password: 'TestPassword123!',
      acceptedTerms: true
    });
    console.log(`✅ Email Registration: ${emailReg.status}`);
    console.log(`   Mock Mode: ${emailReg.data.data?.mockMode}\n`);

    console.log('🎉 All tests completed! Check results above.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAllEndpoints();