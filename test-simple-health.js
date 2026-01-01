// Simple health check test
const http = require('http');

console.log('🧪 Testing Health Endpoint...\n');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',  // Note: no /api prefix for health
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();