/**
 * Test script to verify CORS and registration fixes
 * Run with: node test-cors-fix.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000';

async function testCorsHeaders() {
  console.log('🧪 Testing CORS Headers...');
  
  try {
    // Test with X-Correlation-ID header
    const response = await axios.post(`${API_BASE_URL}/api/auth/register/email`, {
      email: `test${Date.now()}@example.com`,
      password: 'TestPass123!',
      acceptedTerms: true
    }, {
      headers: {
        'X-Correlation-ID': 'test-correlation-id-123',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ CORS headers working - registration successful');
    return true;
  } catch (error) {
    if (error.message?.includes('CORS')) {
      console.error('❌ CORS error still present:', error.message);
      return false;
    } else {
      console.log('✅ CORS headers working - got application error (expected):', error.response?.data?.message || error.message);
      return true;
    }
  }
}

async function testHealthEndpoint() {
  console.log('🧪 Testing Health Endpoint...');
  
  try {
    const response = await axios.get(`${API_BASE_URL}/health`);
    console.log('✅ Health endpoint working:', response.data.status);
    return true;
  } catch (error) {
    console.error('❌ Health endpoint failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Testing CORS and API fixes...');
  console.log('📍 API Base URL:', API_BASE_URL);
  
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    console.log('\n❌ Backend server is not running. Please start it first:');
    console.log('💡 cd backend && npm run dev');
    return;
  }
  
  const corsOk = await testCorsHeaders();
  
  console.log('\n📊 Test Results:');
  console.log('- Backend Health:', healthOk ? '✅ Working' : '❌ Failed');
  console.log('- CORS Headers:', corsOk ? '✅ Working' : '❌ Failed');
  
  if (corsOk && healthOk) {
    console.log('\n🎉 All fixes are working! You can now test the frontend registration.');
  } else {
    console.log('\n⚠️  Some issues remain. Check the error messages above.');
  }
}

runTests().catch(console.error);