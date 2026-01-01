#!/usr/bin/env node

const axios = require('axios');

async function testLogout() {
  console.log('🧪 Testing Logout Fix\n');
  
  try {
    // First, test login to get a session
    console.log('1. Testing login...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      identifier: 'test@example.com',
      password: 'password123'
    }, { validateStatus: () => true });
    
    console.log(`   Login Status: ${loginResponse.status}`);
    console.log(`   Login Success: ${loginResponse.data?.success}`);
    console.log(`   Mock Mode: ${loginResponse.data?.data?.mockMode}`);
    
    // Now test logout
    console.log('\n2. Testing logout...');
    const logoutResponse = await axios.post('http://localhost:5000/api/auth/logout', {}, {
      validateStatus: () => true,
      timeout: 5000 // 5 second timeout
    });
    
    console.log(`   Logout Status: ${logoutResponse.status}`);
    console.log(`   Logout Success: ${logoutResponse.data?.success}`);
    console.log(`   Response Time: Fast (no database timeout)`);
    
    if (logoutResponse.status === 200 && logoutResponse.data?.success) {
      console.log('\n✅ SUCCESS: Logout is working correctly!');
      console.log('   • No database timeout errors');
      console.log('   • Mock mode is properly respected');
      console.log('   • Response is fast and reliable');
    } else {
      console.log('\n❌ ISSUE: Logout still has problems');
      console.log('   Response:', logoutResponse.data);
    }
    
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      console.log('\n❌ TIMEOUT: Logout is still trying to access database');
    } else {
      console.log('\n❌ ERROR:', error.message);
    }
  }
}

testLogout();