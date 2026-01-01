const axios = require('axios');

async function debugLoginIssue() {
  console.log('🔍 Debugging Login Issue');
  console.log('========================\n');

  try {
    // Test 1: Create a new user with email registration
    console.log('1. Creating a test user...');
    const testUser = {
      email: `testuser_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      acceptedTerms: true
    };

    const registerResponse = await axios.post('http://localhost:5000/api/auth/register/email', testUser);
    console.log('✅ User created successfully');
    console.log('User ID:', registerResponse.data.data.userId);
    console.log('Email:', registerResponse.data.data.email);

    // Test 2: Try to login with the same credentials
    console.log('\n2. Testing login with the same credentials...');
    const loginData = {
      identifier: testUser.email,
      password: testUser.password
    };

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', loginData);
    console.log('✅ Login successful!');
    console.log('Response:', loginResponse.data);

  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('\n🔍 LOGIN FAILURE ANALYSIS:');
        console.log('- The user might not exist in the database');
        console.log('- The password might be incorrect');
        console.log('- The email might not be verified (if required)');
        console.log('- There might be a password hashing issue');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

debugLoginIssue();