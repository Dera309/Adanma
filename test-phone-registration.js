const axios = require('axios');

async function testPhoneRegistration() {
  console.log('🧪 Testing Phone Registration Endpoint');
  console.log('=====================================\n');

  try {
    const testUser = {
      phoneNumber: `+234801234${Date.now().toString().slice(-4)}`, // Nigerian phone number
      password: 'TestPassword123!',
      acceptedTerms: true
    };

    console.log('Attempting to register user with phone:', testUser.phoneNumber);
    
    const response = await axios.post('http://localhost:5000/api/auth/register/phone', testUser);
    
    console.log('✅ Phone registration successful!');
    console.log('Status:', response.status);
    console.log('Response:', response.data);
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Phone registration failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      if (error.response.status === 500) {
        console.log('\n🔍 This is a server error. Check backend logs for details.');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testPhoneRegistration();