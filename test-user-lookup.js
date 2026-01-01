const axios = require('axios');

async function testUserLookup() {
  console.log('🔍 Testing User Lookup');
  console.log('======================\n');

  try {
    // First, let's test with a user we know exists
    console.log('1. Testing login with a simple request...');
    
    // Try to login with obviously wrong credentials to see if we get a proper 401
    const wrongCredentials = {
      identifier: 'nonexistent@example.com',
      password: 'wrongpassword'
    };

    const response = await axios.post('http://localhost:5000/api/auth/login', wrongCredentials);
    console.log('Unexpected success:', response.data);

  } catch (error) {
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('✅ Good! Getting proper 401 for non-existent user');
      } else if (error.response.status === 500) {
        console.log('❌ 500 error - login function is crashing');
        console.log('This suggests an issue in the login code itself');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testUserLookup();