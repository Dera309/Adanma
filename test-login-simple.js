const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing Login...\n');

  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      identifier: 'chideraobia7@gmail.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    console.log('✅ Login successful!');
    console.log('Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Network error:', error.message);
    }
  }
}

testLogin();