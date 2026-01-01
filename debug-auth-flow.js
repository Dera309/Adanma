const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testAuthFlow() {
  console.log('🔧 Testing Authentication Flow...\n');

  try {
    // Step 1: Test backend health
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Backend is running:', healthResponse.status);
  } catch (error) {
    console.log('❌ Backend is not running or not accessible');
    console.log('   Error:', error.message);
    return;
  }

  try {
    // Step 2: Test profile endpoint without authentication (should get 401)
    console.log('\n2. Testing profile endpoint without authentication...');
    const profileResponse = await axios.get(`${API_BASE}/users/profile`, {
      withCredentials: true
    });
    console.log('❌ Unexpected success - should have gotten 401');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Got expected 401 Unauthorized');
      console.log('   Message:', error.response.data.error?.message);
    } else {
      console.log('❌ Unexpected error:', error.message);
    }
  }

  try {
    // Step 3: Test login with mock credentials
    console.log('\n3. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      identifier: 'test@example.com',
      password: 'testpassword123'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login successful');
    console.log('   User:', loginResponse.data.data?.user?.email);
    
    // Step 4: Test profile endpoint with authentication
    console.log('\n4. Testing profile endpoint with authentication...');
    const authenticatedProfileResponse = await axios.get(`${API_BASE}/users/profile`, {
      withCredentials: true
    });
    
    console.log('✅ Profile access successful');
    console.log('   User ID:', authenticatedProfileResponse.data.data?.user?.id);
    
  } catch (error) {
    console.log('❌ Login/Profile test failed');
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data.error?.message);
    } else {
      console.log('   Error:', error.message);
    }
  }
}

testAuthFlow().catch(console.error);