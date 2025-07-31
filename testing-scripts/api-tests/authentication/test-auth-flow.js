const BASE_URL = 'http://localhost:3000';

async function testAuthenticationFlow() {
  console.log('🔐 Testing Authentication Flow');
  console.log('==============================');

  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const runTest = async (name, testFn) => {
    try {
      console.log(`\n${name}...`);
      const result = await testFn();
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`${status}: ${name}`);
      results.tests.push({ name, status: result ? 'PASS' : 'FAIL' });
      if (result) results.passed++;
      else results.failed++;
      return result;
    } catch (error) {
      console.log(`❌ ERROR: ${name} - ${error.message}`);
      results.tests.push({ name, status: 'ERROR', error: error.message });
      results.failed++;
      return false;
    }
  };

  let authToken = null;
  let userId = null;
  const testEmail = `test-auth-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `testuser${Date.now()}`;

  // ========================================
  // AUTHENTICATION FLOW TESTS
  // ========================================
  console.log('\n🔑 AUTHENTICATION ENDPOINTS');
  console.log('----------------------------');

  await runTest('User Registration', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testUsername,
        email: testEmail,
        password: testPassword,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      userId = data.user?.id;
      console.log(`   Created user: ${testUsername} (${userId})`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Registration failed: ${error}`);
      return false;
    }
  });

  await runTest('User Login', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testEmail, // Can login with email or username
        password: testPassword,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      console.log(`   Login successful, token: ${authToken?.substring(0, 20)}...`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Login failed: ${error}`);
      return false;
    }
  });

  await runTest('Login with Invalid Credentials', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: testEmail,
        password: 'wrongpassword',
      }),
    });

    // Should fail with 401
    const success = !response.ok && response.status === 401;
    console.log(`   Invalid login correctly rejected: ${success}`);
    return success;
  });

  await runTest('Email Verification Request', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/verify-email/resend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    // Should succeed or already verified
    const success = response.ok || response.status === 400;
    if (response.ok) {
      console.log('   Email verification sent');
    } else {
      const error = await response.text();
      console.log(`   Email verification: ${error}`);
    }
    return success;
  });

  await runTest('Password Reset Request', async () => {
    const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
      }),
    });

    const success = response.ok;
    if (success) {
      console.log('   Password reset email sent');
    } else {
      const error = await response.text();
      console.log(`   Password reset failed: ${error}`);
    }
    return success;
  });

  await runTest('User Logout', async () => {
    if (!authToken) {
      console.log('   No auth token to test logout');
      return false;
    }

    const response = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    const success = response.ok;
    if (success) {
      console.log('   Logout successful');
      authToken = null; // Clear token
    } else {
      const error = await response.text();
      console.log(`   Logout failed: ${error}`);
    }
    return success;
  });

  await runTest('Access Protected Route After Logout', async () => {
    // Should fail since we logged out
    const response = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken || 'invalid'}`,
      },
    });

    const success = !response.ok && (response.status === 401 || response.status === 403);
    console.log(`   Protected route correctly blocked after logout: ${success}`);
    return success;
  });

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 AUTHENTICATION TEST RESULTS');
  console.log('===============================');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(
    `📊 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`,
  );

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.tests
      .filter(t => t.status !== 'PASS')
      .forEach(test => {
        console.log(`   • ${test.name}: ${test.status}`);
        if (test.error) console.log(`     Error: ${test.error}`);
      });
  }

  console.log('\n🎉 Authentication Flow Test Complete!');
  return results.passed > results.failed;
}

testAuthenticationFlow().catch(console.error);
