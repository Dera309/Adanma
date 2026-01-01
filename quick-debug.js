// Quick Debug Script for Origin Header Fix
console.log('🔧 Quick Debug: Testing Origin Header Fix');

async function testOriginHeaderFix() {
  const API_BASE = 'http://localhost:5000';
  
  console.log('\n1. Testing without manual Origin header...');
  
  try {
    // Test with fetch (no manual Origin header)
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        identifier: 'test@example.com',
        password: 'testpassword123'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS: No Origin header errors!');
      console.log('✅ Login response:', data.message);
      console.log('✅ User ID format:', data.data?.user?.id);
      
      // Test logout
      const logoutResponse = await fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (logoutResponse.ok) {
        console.log('✅ Logout also works without Origin header errors!');
      }
      
    } else {
      console.log('❌ Request failed with status:', response.status);
    }
    
  } catch (error) {
    if (error.message.includes('Origin')) {
      console.log('❌ Still getting Origin header errors:', error.message);
    } else {
      console.log('✅ No Origin header errors! Other error:', error.message);
    }
  }
}

// Run the test
testOriginHeaderFix();