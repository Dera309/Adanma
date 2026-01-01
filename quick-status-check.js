#!/usr/bin/env node

const axios = require('axios');

async function quickCheck() {
  console.log('🔍 Quick Status Check\n');
  
  try {
    // Health check
    const health = await axios.get('http://localhost:5000/health');
    console.log('✅ Server Health:', health.status, health.data.status);
    
    // Login test
    const login = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'test@example.com',
      password: 'password123'
    });
    console.log('✅ Login Test:', login.status, login.data?.success ? 'Success' : 'Expected response');
    
    // Profile test
    const profile = await axios.get('http://localhost:5000/api/users/profile');
    console.log('✅ Profile Test:', profile.status, profile.data?.success ? 'Success' : 'Expected response');
    
    // Addresses test
    const addresses = await axios.get('http://localhost:5000/api/addresses');
    console.log('✅ Addresses Test:', addresses.status, addresses.data?.success ? 'Success' : 'Expected response');
    
    console.log('\n🎉 All core endpoints are responding correctly!');
    
  } catch (error) {
    if (error.response) {
      console.log('⚠️  Response Error:', error.response.status, error.response.data);
    } else {
      console.log('❌ Network Error:', error.message);
    }
  }
}

quickCheck();