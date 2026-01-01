const axios = require('axios');

async function testBackend() {
  try {
    console.log('Testing backend health...');
    const response = await axios.get('http://localhost:5000/health', {
      timeout: 5000
    });
    console.log('✅ Backend health check successful:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Backend health check failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test login endpoint
  try {
    console.log('\nTesting login endpoint...');
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'test@example.com',
      password: 'testpassword123'
    }, {
      timeout: 5000,
      withCredentials: true,
      headers: {
        'Origin': 'http://localhost:3001',
        'Referer': 'http://localhost:3001/',
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Login test successful:');
    console.log(JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Login test failed:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testBackend();