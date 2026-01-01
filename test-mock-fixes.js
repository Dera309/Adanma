const axios = require('axios');

async function testMockFixes() {
  const API_BASE = 'http://localhost:5000';
  
  console.log('🔧 Testing Mock ObjectID Fixes\n');

  try {
    // Step 1: Login to get authentication
    console.log('1. Testing login...');
    const loginResponse = await axios.post(`${API_BASE}/api/auth/login`, {
      identifier: 'test@example.com',
      password: 'testpassword123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3001'
      },
      withCredentials: true
    });

    if (loginResponse.status === 200) {
      console.log('✅ Login successful');
      console.log(`   User ID: ${loginResponse.data.data.user.id}`);
      console.log(`   Mock Mode: ${loginResponse.data.data.mockMode}`);
      
      // Extract cookies for subsequent requests
      const cookies = loginResponse.headers['set-cookie'];
      const cookieHeader = cookies ? cookies.join('; ') : '';
      
      // Step 2: Test user profile (was causing ObjectID error)
      console.log('\n2. Testing user profile...');
      const profileResponse = await axios.get(`${API_BASE}/api/users/profile`, {
        headers: {
          'Cookie': cookieHeader,
          'Origin': 'http://localhost:3001'
        },
        withCredentials: true
      });
      
      if (profileResponse.status === 200) {
        console.log('✅ User profile successful');
        console.log(`   User ID: ${profileResponse.data.data.user.id}`);
        console.log(`   Mock Mode: ${profileResponse.data.data.mockMode}`);
      }
      
      // Step 3: Test sessions (was causing ObjectID error)
      console.log('\n3. Testing sessions...');
      const sessionsResponse = await axios.get(`${API_BASE}/api/auth/sessions`, {
        headers: {
          'Cookie': cookieHeader,
          'Origin': 'http://localhost:3001'
        },
        withCredentials: true
      });
      
      if (sessionsResponse.status === 200) {
        console.log('✅ Sessions successful');
        console.log(`   Sessions count: ${sessionsResponse.data.data.sessions.length}`);
        console.log(`   Mock Mode: ${sessionsResponse.data.data.mockMode}`);
      }
      
      // Step 4: Test addresses
      console.log('\n4. Testing addresses...');
      const addressesResponse = await axios.get(`${API_BASE}/api/addresses`, {
        headers: {
          'Cookie': cookieHeader,
          'Origin': 'http://localhost:3001'
        },
        withCredentials: true
      });
      
      if (addressesResponse.status === 200) {
        console.log('✅ Addresses successful');
        console.log(`   Addresses count: ${addressesResponse.data.data.addresses.length}`);
        console.log(`   Mock Mode: ${addressesResponse.data.data.mockMode}`);
      }
      
      console.log('\n🎉 All tests passed! Mock ObjectID errors should be fixed.');
      
    }
  } catch (error) {
    console.log('❌ Test failed:');
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Error: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.log(`   Error: ${error.message}`);
    }
  }
}

testMockFixes();