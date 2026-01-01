const axios = require('axios');

async function testRegistration() {
  console.log('🧪 Testing Registration Endpoint');
  console.log('================================\n');

  try {
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!',
      acceptedTerms: true
    };

    console.log('Attempting to register user:', testUser.email);
    
    const response = await axios.post('http://localhost:5000/api/auth/register/email', testUser);
    
    console.log('✅ Registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Registration failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testRegistration();