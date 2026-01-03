// Test frontend API call
import axios from 'axios';

const testFrontendLogin = async () => {
  try {
    console.log('🔍 Testing frontend API call...');
    
    const apiUrl = 'http://localhost:5002/api/auth/login';
    
    const response = await axios.post(apiUrl, {
      identifier: 'admin@test.com',
      password: 'Admin123!'
    }, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
      timeout: 15000,
      validateStatus: (status) => status < 500,
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
    if (response.status === 200 && response.data && response.data.success) {
      console.log('✅ Login successful!');
      if (response.data.data?.accessToken) {
        console.log('🔑 Access token:', response.data.data.accessToken.substring(0, 50) + '...');
      }
    } else {
      console.log('❌ Login failed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (error.response) {
      console.log('Error response status:', error.response.status);
      console.log('Error response data:', error.response.data);
    }
  }
};

testFrontendLogin();