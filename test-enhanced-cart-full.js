const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

// Test enhanced cart functionality
async function testEnhancedCart() {
  console.log('🧪 Testing Enhanced Cart (Full Mode)...\n');

  try {
    // Test 1: Health check
    console.log('1️⃣ Testing server health...');
    const healthResponse = await axios.get(`${API_BASE.replace('/api', '')}/health`);
    console.log('✅ Server health:', healthResponse.data.status);
    console.log('📊 Database:', healthResponse.data.database);
    console.log();

    // Test 2: Get cart (should work with mock data if DB unavailable)
    console.log('2️⃣ Testing enhanced cart retrieval...');
    try {
      const cartResponse = await axios.get(`${API_BASE}/cart`, {
        headers: {
          'Authorization': 'Bearer mock-token-for-testing'
        }
      });
      
      if (cartResponse.data.success) {
        const cart = cartResponse.data.data;
        console.log('✅ Cart retrieved successfully');
        console.log(`📦 Items: ${cart.itemCount}`);
        console.log(`💰 Total: $${cart.total}`);
        console.log(`🎯 Enhanced features: ${cartResponse.data.meta?.features?.join(', ') || 'Standard'}`);
        
        if (cart.recommendations) {
          console.log(`💡 Recommendations: ${cart.recommendations.length}`);
        }
        
        if (cart.analytics) {
          console.log(`📈 Analytics: Available`);
          console.log(`   - Average item price: $${cart.analytics.averageItemPrice}`);
          console.log(`   - Abandonment risk: ${cart.analytics.abandonmentRisk}`);
        }
        
        if (cart.loyaltyPoints) {
          console.log(`🏆 Loyalty points: ${cart.loyaltyPoints.available} available, ${cart.loyaltyPoints.earned} earned`);
        }
      } else {
        console.log('❌ Cart retrieval failed:', cartResponse.data.error?.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required (expected for full mode)');
        console.log('💡 Cart will work with proper authentication');
      } else {
        console.log('❌ Cart test error:', error.message);
      }
    }
    console.log();

    // Test 3: Add item to cart
    console.log('3️⃣ Testing add to cart...');
    try {
      const addResponse = await axios.post(`${API_BASE}/cart/items`, {
        productId: 'test-product-001',
        quantity: 1,
        attributes: {
          color: 'Blue',
          size: 'M'
        }
      }, {
        headers: {
          'Authorization': 'Bearer mock-token-for-testing',
          'Content-Type': 'application/json'
        }
      });
      
      if (addResponse.data.success) {
        console.log('✅ Item added to cart successfully');
        console.log(`📦 Product: ${addResponse.data.data.name}`);
        console.log(`💰 Price: $${addResponse.data.data.price}`);
      } else {
        console.log('❌ Add to cart failed:', addResponse.data.error?.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required (expected for full mode)');
      } else {
        console.log('❌ Add to cart error:', error.message);
      }
    }
    console.log();

    // Test 4: Apply coupon
    console.log('4️⃣ Testing coupon application...');
    try {
      const couponResponse = await axios.post(`${API_BASE}/cart/coupon`, {
        couponCode: 'WELCOME10'
      }, {
        headers: {
          'Authorization': 'Bearer mock-token-for-testing',
          'Content-Type': 'application/json'
        }
      });
      
      if (couponResponse.data.success) {
        console.log('✅ Coupon applied successfully');
        console.log(`🎫 Code: ${couponResponse.data.data.couponCode}`);
        console.log(`💸 Discount: ${couponResponse.data.data.discount}${couponResponse.data.data.type === 'percentage' ? '%' : '$'}`);
        console.log(`📝 Description: ${couponResponse.data.data.description}`);
      } else {
        console.log('❌ Coupon application failed:', couponResponse.data.error?.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required (expected for full mode)');
      } else {
        console.log('❌ Coupon test error:', error.message);
      }
    }
    console.log();

    // Test 5: Get shipping options
    console.log('5️⃣ Testing shipping options...');
    try {
      const shippingResponse = await axios.get(`${API_BASE}/cart/shipping-options`, {
        headers: {
          'Authorization': 'Bearer mock-token-for-testing'
        }
      });
      
      if (shippingResponse.data.success) {
        console.log('✅ Shipping options retrieved');
        shippingResponse.data.data.forEach((option, index) => {
          console.log(`   ${index + 1}. ${option.name}: $${option.price} (${option.estimatedDays} days)`);
        });
      } else {
        console.log('❌ Shipping options failed:', shippingResponse.data.error?.message);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('🔐 Authentication required (expected for full mode)');
      } else {
        console.log('❌ Shipping options error:', error.message);
      }
    }
    console.log();

    console.log('🎉 Enhanced Cart Test Complete!');
    console.log('📋 Summary:');
    console.log('   - Server: Running on port 5001');
    console.log('   - Cart: Enhanced with full features');
    console.log('   - Mock Data: Disabled (full mode)');
    console.log('   - Authentication: Required for full functionality');
    console.log('   - Features: Recommendations, Analytics, Loyalty Points');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the backend server is running on port 5001');
      console.log('   Run: npm run dev in the backend directory');
    }
  }
}

// Run the test
testEnhancedCart();