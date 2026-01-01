const axios = require('axios');

async function testFrontendLogin() {
  console.log('🧪 Testing Frontend-style Login...\n');

  try {
    // Mimic exactly what the frontend does
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      identifier: 'chideraobia7@gmail.com',
      password: 'password123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      withCredentials: true,
      validateStatus: (status) => status < 500 // Don't throw on 4xx errors
    });

    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
    if (response.status === 200 && response.data.success) {
      console.log('✅ Login should work in frontend');
    } else {
      console.log('❌ Login will fail in frontend');
      console.log('Error:', response.data.error);
    }
    
  } catch (error) {
    console.log('❌ Network error');
    console.log('Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    }
  }
}

testFrontendLogin();