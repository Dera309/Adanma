/**
 * Script to check if backend is running and provide instructions
 */

const http = require('http');

function checkBackend() {
  console.log('🔍 Checking if backend server is running...');
  
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/health',
    method: 'GET',
    timeout: 3000
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        console.log('✅ Backend server is running!');
      