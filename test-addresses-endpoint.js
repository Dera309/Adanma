// Test addresses endpoint with mock mode
const http = require('http');

console.log('🧪 Testing Addresses Endpoint...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/addresses',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    'X-Correlation-ID': 'test-' + Date.now(),
    'Origin': 'http://localhost:3001',
    'Referer': 'http://localhost:3001/'
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
      
      if (response.success && response.data?.addresses) {
        console.log(`\n🎉 Addresses endpoint working! Found ${response.data.addresses.length} mock addresses`);
      }
    } catch (error) {
      console.log('✅ Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();