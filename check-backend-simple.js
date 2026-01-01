// Simple backend check
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

console.log('🔍 Checking backend server...');

const req = http.request(options, (res) => {
  console.log(`✅ Backend is running! Status: ${res.statusCode}`);
  process.exit(0);
});

req.on('error', (err) => {
  console.log('❌ Backend is NOT running!');
  console.log('💡 Please start the backend server:');
  console.log('   cd backend && npm run dev');
  process.exit(1);
});

req.on('timeout', () => {
  console.log('⏰ Backend check timed out');
  console.log('💡 Backend might be starting up or not running');
  process.exit(1);
});

req.end();