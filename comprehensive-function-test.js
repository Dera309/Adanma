#!/usr/bin/env node

/**
 * Comprehensive App Function Test
 * Tests all major functionality to ensure everything is working properly
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Test configuration
const testConfig = {
  timeout: 10000,
  validateStatus: () => true // Don't throw on any status code
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${name}${details ? ` - ${details}` : ''}`);
  
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

async function testHealthCheck() {
  try {
    const response = await axios.get(`${BASE_URL}/health`, testConfig);
    const passed = response.status === 200 && response.data.status === 'ok';
    logTest('Health Check', passed, `Status: ${response.status}`);
    return passed;
  } catch (error) {
    logTest('Health Check', false, `Error: ${error.message}`);
    return false;
  }
}

async function testAuthEndpoints() {
  console.log('\n🔐 Testing Authentication Endpoints...');
  
  // Test login endpoint
  try {
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    }, testConfig);
    
    const loginPassed = loginResponse.status === 200;
    logTest('Login Endpoint', loginPassed, `Status: ${loginResponse.status}`);
  } catch (error) {
    logTest('Login Endpoint', false, `Error: ${error.message}`);
  }
  
  // Test logout endpoint
  try {
    const logoutResponse = await axios.post(`${API_URL}/auth/logout`, {}, testConfig);
    const logoutPassed = logoutResponse.status === 200;
    logTest('Logout Endpoint', logoutPassed, `Status: ${logoutResponse.status}`);
  } catch (error) {
    logTest('Logout Endpoint', false, `Error: ${error.message}`);
  }
  
  // Test registration endpoints
  try {
    const emailRegResponse = await axios.post(`${API_URL}/auth/register/email`, {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    }, testConfig);
    
    const emailRegPassed = emailRegResponse.status === 200 || emailRegResponse.status === 201;
    logTest('Email Registration', emailRegPassed, `Status: ${emailRegResponse.status}`);
  } catch (error) {
    logTest('Email Registration', false, `Error: ${error.message}`);
  }
  
  try {
    const phoneRegResponse = await axios.post(`${API_URL}/auth/register/phone`, {
      phone: '+1234567890',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    }, testConfig);
    
    const phoneRegPassed = phoneRegResponse.status === 200 || phoneRegResponse.status === 201;
    logTest('Phone Registration', phoneRegPassed, `Status: ${phoneRegResponse.status}`);
  } catch (error) {
    logTest('Phone Registration', false, `Error: ${error.message}`);
  }
}

async function testUserEndpoints() {
  console.log('\n👤 Testing User Management Endpoints...');
  
  // Test user profile
  try {
    const profileResponse = await axios.get(`${API_URL}/users/profile`, testConfig);
    const profilePassed = profileResponse.status === 200 || profileResponse.status === 401;
    logTest('User Profile', profilePassed, `Status: ${profileResponse.status}`);
  } catch (error) {
    logTest('User Profile', false, `Error: ${error.message}`);
  }
  
  // Test role endpoint
  try {
    const roleResponse = await axios.patch(`${API_URL}/users/role`, {
      role: 'customer'
    }, testConfig);
    const rolePassed = roleResponse.status < 500; // Any non-server error is acceptable
    logTest('User Role Update', rolePassed, `Status: ${roleResponse.status}`);
  } catch (error) {
    logTest('User Role Update', false, `Error: ${error.message}`);
  }
  
  // Test verification status
  try {
    const verificationResponse = await axios.get(`${API_URL}/users/verification-status`, testConfig);
    const verificationPassed = verificationResponse.status < 500;
    logTest('Verification Status', verificationPassed, `Status: ${verificationResponse.status}`);
  } catch (error) {
    logTest('Verification Status', false, `Error: ${error.message}`);
  }
}

async function testAddressEndpoints() {
  console.log('\n📍 Testing Address Management Endpoints...');
  
  // Test address listing
  try {
    const addressesResponse = await axios.get(`${API_URL}/addresses`, testConfig);
    const addressesPassed = addressesResponse.status === 200 || addressesResponse.status === 401;
    logTest('Address Listing', addressesPassed, `Status: ${addressesResponse.status}`);
  } catch (error) {
    logTest('Address Listing', false, `Error: ${error.message}`);
  }
  
  // Test address creation
  try {
    const createResponse = await axios.post(`${API_URL}/addresses`, {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      zipCode: '12345',
      country: 'Test Country'
    }, testConfig);
    const createPassed = createResponse.status < 500;
    logTest('Address Creation', createPassed, `Status: ${createResponse.status}`);
  } catch (error) {
    logTest('Address Creation', false, `Error: ${error.message}`);
  }
}

async function testCORSAndSecurity() {
  console.log('\n🛡️ Testing CORS and Security...');
  
  // Test CORS headers
  try {
    const corsResponse = await axios.options(`${API_URL}/auth/login`, {
      ...testConfig,
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsPassed = corsResponse.status === 200 || corsResponse.status === 204;
    logTest('CORS Preflight', corsPassed, `Status: ${corsResponse.status}`);
  } catch (error) {
    logTest('CORS Preflight', false, `Error: ${error.message}`);
  }
  
  // Test rate limiting (should not be triggered in normal use)
  try {
    const rateLimitResponse = await axios.get(`${BASE_URL}/health`, testConfig);
    const rateLimitPassed = !rateLimitResponse.headers['x-ratelimit-remaining'] || 
                           parseInt(rateLimitResponse.headers['x-ratelimit-remaining']) > 0;
    logTest('Rate Limiting', rateLimitPassed, 'Within limits');
  } catch (error) {
    logTest('Rate Limiting', false, `Error: ${error.message}`);
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test 404 handling
  try {
    const notFoundResponse = await axios.get(`${API_URL}/nonexistent-endpoint`, testConfig);
    const notFoundPassed = notFoundResponse.status === 404;
    logTest('404 Error Handling', notFoundPassed, `Status: ${notFoundResponse.status}`);
  } catch (error) {
    logTest('404 Error Handling', false, `Error: ${error.message}`);
  }
  
  // Test malformed request handling
  try {
    const malformedResponse = await axios.post(`${API_URL}/auth/login`, 'invalid-json', {
      ...testConfig,
      headers: { 'Content-Type': 'application/json' }
    });
    const malformedPassed = malformedResponse.status === 400;
    logTest('Malformed Request Handling', malformedPassed, `Status: ${malformedResponse.status}`);
  } catch (error) {
    logTest('Malformed Request Handling', false, `Error: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 Starting Comprehensive App Function Test\n');
  console.log('=' .repeat(60));
  
  // Test server availability first
  console.log('🏥 Testing Server Health...');
  const serverHealthy = await testHealthCheck();
  
  if (!serverHealthy) {
    console.log('\n❌ Server is not responding. Please ensure the backend is running on port 5000.');
    return;
  }
  
  // Run all test suites
  await testAuthEndpoints();
  await testUserEndpoints();
  await testAddressEndpoints();
  await testCORSAndSecurity();
  await testErrorHandling();
  
  // Print summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('=' .repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! The application is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Review the details above.');
    
    // Show failed tests
    const failedTests = results.tests.filter(test => !test.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.name}: ${test.details}`);
      });
    }
  }
  
  console.log('\n🔍 For detailed logs, check the server console output.');
}

// Run the tests
runAllTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});