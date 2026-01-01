const axios = require('axios');

async function testAuthAndCart() {
  console.log('🧪 Testing Authentication and Cart Access...\n');

  try {
    // Test 1: Login
    console.log('1️⃣ Testing login...');
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      identifier: 'obia.colin.100@gmail.com',
      password: 'password123'
    }, {
      withCredentials: true,
      validateStatus: () => true
    });

    console.log('Login Status:', loginResponse.status);
    console.log('Login Success:', loginResponse.data.success);

    if (loginResponse.status === 200 && loginResponse.data.success) {
      console.log('✅ Login successful');
      
      // Extract cookies for cart request
      const cookies = loginResponse.headers['set-cookie'];
      console.log('Cookies received:', cookies ? 'Yes' : 'No');

      // Test 2: Access cart with authentication
      console.log('\n2️⃣ Testing cart access...');
      const cartResponse = await axios.get('http://localhost:5001/api/cart', {
        headers: {
          'Cookie': cookies ? cookies.join('; ') : ''
        },
        withCredentials: true,
        validateStatus: () => true
      });

      console.log('Cart Status:', cartResponse.status);
      console.log('Cart Success:', cartResponse.data.success);

      if (cartResponse.status === 200) {
        console.log('✅ Cart accessible - Frontend should work');
        console.log('Cart items:', cartResponse.data.data?.itemCount || 0);
      } else {
        console.log('❌ Cart not accessible');
        console.log('Error:', cartResponse.data.error?.message);
      }
    } else {
      console.log('❌ Login failed');
      console.log('Error:', loginResponse.data.error?.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAuthAndCart();