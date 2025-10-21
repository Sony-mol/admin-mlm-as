// Test script to verify token refresh functionality
// Run this with: node test-token-refresh.js

const BACKEND_URL = 'https://asmlmbackend-production.up.railway.app';

async function testTokenRefresh() {
  console.log('🧪 Starting Token Refresh Test...\n');
  
  try {
    // Step 1: Test login
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch(`${BACKEND_URL}/api/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@mlm.com',
        password: 'Admin@123'
      })
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      throw new Error(`Login failed: ${loginResponse.status} - ${errorData.error || 'Unknown error'}`);
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log(`   - Access Token: ${loginData.accessToken ? 'Present' : 'Missing'}`);
    console.log(`   - Refresh Token: ${loginData.refreshToken ? 'Present' : 'Missing'}`);
    console.log(`   - User ID: ${loginData.userId || 'N/A'}`);
    console.log(`   - Role: ${loginData.role || 'N/A'}\n`);

    if (!loginData.refreshToken) {
      throw new Error('❌ No refresh token received - token refresh will not work');
    }

    // Step 2: Test refresh token endpoint
    console.log('2️⃣ Testing refresh token endpoint...');
    const refreshResponse = await fetch(`${BACKEND_URL}/api/users/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        refreshToken: loginData.refreshToken
      })
    });

    if (!refreshResponse.ok) {
      const errorData = await refreshResponse.json();
      throw new Error(`Refresh failed: ${refreshResponse.status} - ${errorData.error || 'Unknown error'}`);
    }

    const refreshData = await refreshResponse.json();
    console.log('✅ Token refresh successful');
    console.log(`   - New Access Token: ${refreshData.accessToken ? 'Present' : 'Missing'}`);
    console.log(`   - New Refresh Token: ${refreshData.refreshToken ? 'Present' : 'Missing'}\n`);

    // Step 3: Test protected endpoint with new token
    console.log('3️⃣ Testing protected endpoint with new token...');
    const protectedResponse = await fetch(`${BACKEND_URL}/api/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${refreshData.accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!protectedResponse.ok) {
      throw new Error(`Protected endpoint failed: ${protectedResponse.status}`);
    }

    const profileData = await protectedResponse.json();
    console.log('✅ Protected endpoint accessible with new token');
    console.log(`   - Profile data received: ${profileData ? 'Yes' : 'No'}\n`);

    // Step 4: Summary
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Login endpoint working');
    console.log('✅ Refresh token endpoint working');
    console.log('✅ New token works for protected endpoints');
    console.log('✅ Token refresh functionality is working correctly\n');

    console.log('📋 Next Steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Login with the same credentials');
    console.log('3. Open browser console (F12)');
    console.log('4. Look for these messages:');
    console.log('   🔍 Token Manager: accessToken exists: true isExpired: false');
    console.log('   ⏰ Token Manager: Setting auto-refresh timer for 55 minutes');
    console.log('5. If you see those messages, auto-refresh is working! 🎉');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if backend is running');
    console.log('2. Verify admin credentials are correct');
    console.log('3. Check network connectivity');
    console.log('4. Verify backend endpoints are accessible');
  }
}

// Run the test
testTokenRefresh();
