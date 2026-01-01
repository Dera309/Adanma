const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('🔧 Testing Authentication Flow...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', healthResponse.data);
    console.log('');

    // Test 2: Login attempt
    console.log('2. Testing login endpoint...');
    const loginData = {
      identifier: 'test@example.com',
      password: 'testpassword123'
    };

    const loginResponse = await axios.post(`${API_BASE}/auth/login`, loginData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ Login response status:', loginResponse.status);
    console.log('✅ Login response data:', loginResponse.data);
    console.log('✅ Response headers:', loginResponse.headers);
    
    // Extract cookies
    const cookies = loginResponse.headers['set-cookie'];
    console.log('🍪 Cookies received:', cookies);
    console.log('');

    // Test 3: Profile access with cookies
    if (cookies) {
      console.log('3. Testing profile endpoint with cookies...');
      
      const cookieHeader = cookies.join('; ');
      const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
        withCredentials: true,
        headers: {
          'Cookie': cookieHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('✅ Profile response status:', profileResponse.status);
      console.log('✅ Profile response data:', profileResponse.data);
    }

  } catch (error) {
    console.error('❌ Error during auth flow test:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
  }
}

// Run the test
testAuthFlow();