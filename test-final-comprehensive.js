// Final comprehensive test of all endpoints
const http = require('http');

async function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-' + Date.now(),
        'Origin': 'http://localhost:3001',
        'Referer': 'http://localhost:3001/'
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

async function runFinalTest() {
  console.log('🎉 FINAL COMPREHENSIVE TEST - ALL ENDPOINTS\n');

  const tests = [
    {
      name: 'Health Check',
      path: '/health',
      method: 'GET',
      expected: 200
    },
    {
      name: 'Phone Registration',
      path: '/api/auth/register/phone',
      method: 'POST',
      data: { phoneNumber: '+2348123456789', password: 'Test123!', acceptedTerms: true },
      expected: 201
    },
    {
      name: 'Email Registration',
      path: '/api/auth/register/email',
      method: 'POST',
      data: { email: 'test@example.com', password: 'Test123!', acceptedTerms: true },
      expected: 201
    },
    {
      name: 'Login',
      path: '/api/auth/login',
      method: 'POST',
      data: { identifier: 'test@example.com', password: 'Test123!' },
      expected: 200
    },
    {
      name: 'Phone Verification',
      path: '/api/auth/verify/phone',
      method: 'POST',
      data: { userId: 'mock-123', code: '123456' },
      expected: 200
    },
    {
      name: 'Phone Resend',
      path: '/api/auth/verify/phone/resend',
      method: 'POST',
      data: { userId: 'mock-123' },
      expected: 200
    },
    {
      name: 'User Addresses',
      path: '/api/addresses',
      method: 'GET',
      expected: 200
    }
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      console.log(`🧪 Testing ${test.name}...`);
      const result = await makeRequest(test.path, test.method, test.data);
      
      if (result.status === test.expected) {
        console.log(`✅ ${test.name}: PASS (${result.status})`);
        if (result.data.data?.mockMode) {
          console.log(`   🔧 Mock Mode: Active`);
        }
        passed++;
      } else {
        console.log(`❌ ${test.name}: FAIL (${result.status}, expected ${test.expected})`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR (${error.message})`);
    }
    console.log('');
  }

  console.log('🎯 FINAL RESULTS:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📊 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL TESTS PASSED! SYSTEM FULLY OPERATIONAL! 🚀');
  } else {
    console.log(`\n⚠️  ${total - passed} tests failed. Check logs above.`);
  }
}

runFinalTest();