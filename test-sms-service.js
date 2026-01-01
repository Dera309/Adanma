// Simple test to check if SMS service is working
const axios = require('axios');

async function testSMSService() {
  console.log('🧪 Testing SMS Service');
  console.log('=====================\n');

  try {
    // Test a simple endpoint that doesn't involve SMS
    console.log('1. Testing basic API connectivity...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ API is accessible');

    // Test phone registration with minimal data
    console.log('\n2. Testing phone registration (minimal)...');
    const testUser = {
      phoneNumber: `+234801234${Date.now().toString().slice(-4)}`,
      password: 'Test123!',
      acceptedTerms: true
    };

    const response = await axios.post('http://localhost:5000/api/auth/register/phone', testUser);
    console.log('✅ Phone registration successful!');
    console.log('Response:', response.data);

  } catch (error) {
    if (error.response) {
      console.log('❌ Request failed');
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      // Check if it's a validation error vs server error
      if (error.response.status === 400) {
        console.log('\n💡 This is a validation error - check the request data');
      } else if (error.response.status === 500) {
        console.log('\n💡 This is a server error - check backend logs');
        console.log('   The SMS service might be failing to initialize');
      }
    } else {
      console.log('❌ Network error:', error.message);
    }
  }
}

testSMSService();