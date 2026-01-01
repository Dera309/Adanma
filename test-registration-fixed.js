// Test registration with mock mode enabled
const http = require('http');

console.log('🧪 Testing Registration System (Mock Mode)...\n');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: responseData
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testRegistration() {
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/health',
      method: 'GET'
    };
    
    const healthResponse = await makeRequest(healthOptions);
    console.log(`✅ Health Status: ${healthResponse.status}`);
    console.log(`✅ Health Response: ${healthResponse.data}\n`);
    
    // Test 2: Phone Registration (should be instant now)
    console.log('2️⃣ Testing phone registration (mock mode)...');
    const phoneOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register/phone',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-phone-' + Date.now()
      }
    };
    
    const phoneData = {
      phoneNumber: '+2348123456789',
      password: 'TestPassword123!',
      acceptedTerms: true
    };
    
    const startTime = Date.now();
    const phoneResponse = await makeRequest(phoneOptions, phoneData);
    const duration = Date.now() - startTime;
    
    console.log(`✅ Phone Registration Status: ${phoneResponse.status}`);
    console.log(`✅ Response Time: ${duration}ms (should be < 1000ms)`);
    console.log(`✅ Phone Response: ${phoneResponse.data}\n`);
    
    // Test 3: Email Registration (should be instant now)
    console.log('3️⃣ Testing email registration (mock mode)...');
    const emailOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/register/email',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-email-' + Date.now()
      }
    };
    
    const emailData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      acceptedTerms: true
    };
    
    const startTime2 = Date.now();
    const emailResponse = await makeRequest(emailOptions, emailData);
    const duration2 = Date.now() - startTime2;
    
    console.log(`✅ Email Registration Status: ${emailResponse.status}`);
    console.log(`✅ Response Time: ${duration2}ms (should be < 1000ms)`);
    console.log(`✅ Email Response: ${emailResponse.data}\n`);
    
    // Summary
    console.log('🎉 REGISTRATION SYSTEM TEST COMPLETE!');
    console.log(`📊 Performance:`);
    console.log(`   - Phone Registration: ${duration}ms`);
    console.log(`   - Email Registration: ${duration2}ms`);
    
    if (duration < 1000 && duration2 < 1000) {
      console.log('✅ EXCELLENT: Both registrations are now fast (< 1 second)');
    } else {
      console.log('⚠️  Still slow - check if mock mode is working properly');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testRegistration();