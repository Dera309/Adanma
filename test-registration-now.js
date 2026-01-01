// Quick test of registration endpoints
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function testRegistration() {
  console.log('🧪 Testing Registration System...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check:', healthResponse.data);
    
    // Test 2: Phone Registration
    console.log('\n2️⃣ Testing phone registration...');
    const phoneData = {
      phoneNumber: '+2348123456789',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const phoneResponse = await axios.post(`${API_BASE}/auth/register/phone`, phoneData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-' + Date.now()
      }
    });
    console.log('✅ Phone registration response:', phoneResponse.data);
    
    // Test 3: Email Registration
    console.log('\n3️⃣ Testing email registration...');
    const emailData = {
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User'
    };
    
    const emailResponse = await axios.post(`${API_BASE}/auth/register/email`, emailData, {
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': 'test-' + Date.now()
      }
    });
    console.log('✅ Email registration response:', emailResponse.data);
    
    console.log('\n🎉 All tests passed! Registration system is working.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }
}

testRegistration();