// Debug script to test registration endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testEmailRegistration() {
  console.log('🧪 Testing Email Registration...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register/email`, {
      email: 'test@example.com',
      password: 'TestPassword123!',
      acceptedTerms: true
    });
    
    console.log('✅ Email Registration Success:', response.data);
  } catch (error) {
    console.log('❌ Email Registration Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

async function testPhoneRegistration() {
  console.log('\n🧪 Testing Phone Registration...');
  
  try {
    const response = await axios.post(`${API_BASE}/auth/register/phone`, {
      phoneNumber: '+2348012345678',
      password: 'TestPassword123!',
      acceptedTerms: true
    });
    
    console.log('✅ Phone Registration Success:', response.data);
  } catch (error) {
    console.log('❌ Phone Registration Error:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', error.response.data);
    } else {
      console.log('Network Error:', error.message);
    }
  }
}

async function testBackendHealth() {
  console.log('🏥 Testing Backend Health...');
  
  try {
    const response = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ Backend Health:', response.data);
  } catch (error) {
    console.log('❌ Backend Health Error:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Registration Debug Tests...\n');
  
  await testBackendHealth();
  await testEmailRegistration();
  await testPhoneRegistration();
  
  console.log('\n✅ Debug tests completed!');
}

runTests().catch(console.error);