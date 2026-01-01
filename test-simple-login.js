const axios = require('axios');

async function testSimpleLogin() {
  console.log('🔍 Testing Simple Login Flow');
  console.log('============================\n');

  try {
    // Step 1: Create a user with email registration
    console.log('1. Creating a test user...');
    const testUser = {
      email: `simple_${Date.now()}@example.com`,
      password: 'Simple123!',
      acceptedTerms: true
    };

    const registerResponse = await axios.post('http://localhost:5000/api/auth/register/email', testUser);
    console.log('✅ User created:', registerResponse.data.data.userId);

    // Step 2: Wait a moment for any async operations
    console.log('\n2. Waiting a moment...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Try login with very simple data
    console.log('\n3. Attempting login...');
    const loginData = {
      identifier: testUser.email,
      password: testUser.password
    };

    console.log('Login data:', loginData);

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      timeout: 10000 // 10 second timeout
    });

    console.log('✅ Login successful!');
    console.log('Response:', loginResponse.data);

  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      // More detailed error analysis
      if (error.response.status === 500) {
        console.log('\n🔍 500 Error Analysis:');
        console.log('- This is a server-side crash in the login function');
        console.log('- Likely issues: JWT generation, session creation, or database operation');
        console.log('- The user exists but something fails during login processing');
      }
    } else if (error.code === 'ECONNABORTED') {
      console.log('❌ Request timed out - server might be hanging');
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testSimpleLogin();