const { API_KEY, BASE_URL } = require('../config.js');

async function testUserAccountManagement() {
  console.log('👤 Testing User Account Management');
  console.log('==================================');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

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

  // ========================================
  // USER PROFILE MANAGEMENT
  // ========================================
  console.log('\n👤 USER PROFILE ENDPOINTS');
  console.log('--------------------------');

  await runTest('Get User Profile (/api/me)', async () => {
    const response = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const profile = await response.json();
      console.log(`   Profile: ${profile.user?.username} (${profile.user?.email})`);
      console.log(`   Plan: ${profile.user?.planId || 'free'}`);
      console.log(`   Subscription: ${profile.user?.subscriptionStatus || 'none'}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get profile failed: ${error}`);
      return false;
    }
  });

  await runTest('Update User Profile (/api/me/profile)', async () => {
    const updateData = {
      timezone: 'America/New_York',
      dateFormat: 'yyyy-MM-dd',
      timeFormat: 'HH:mm:ss',
    };

    const response = await fetch(`${BASE_URL}/api/me/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const updatedProfile = await response.json();
      console.log(`   Profile updated: ${JSON.stringify(updateData)}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Profile update failed: ${error}`);
      return false;
    }
  });

  await runTest('Get User Websites (/api/me/websites)', async () => {
    const response = await fetch(`${BASE_URL}/api/me/websites`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const websites = await response.json();
      console.log(`   User has ${websites.length} websites`);
      if (websites.length > 0) {
        console.log(`   Sample: ${websites[0].name} (${websites[0].domain})`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get user websites failed: ${error}`);
      return false;
    }
  });

  await runTest('Get Subscription Info (/api/me/subscription)', async () => {
    const response = await fetch(`${BASE_URL}/api/me/subscription`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const subscription = await response.json();
      console.log(`   Subscription Status: ${subscription.status || 'none'}`);
      console.log(`   Plan: ${subscription.planId || 'free'}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get subscription failed: ${error}`);
      // Some users might not have subscriptions - this could be OK
      return response.status === 404 || response.status === 400;
    }
  });

  await runTest('Check Feature Access (/api/me/features/{feature})', async () => {
    const feature = 'apiKeys';
    const response = await fetch(`${BASE_URL}/api/me/features/${feature}`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const featureData = await response.json();
      console.log(`   Feature '${feature}' access: ${featureData.hasAccess}`);
      console.log(`   Limit: ${featureData.limit === -1 ? 'unlimited' : featureData.limit}`);
      console.log(`   Current usage: ${featureData.currentUsage || 0}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Feature check failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // PASSWORD MANAGEMENT
  // ========================================
  console.log('\n🔐 PASSWORD MANAGEMENT');
  console.log('----------------------');

  await runTest('Change Password Endpoint (/api/me/password)', async () => {
    // Test with invalid current password to avoid actually changing
    const passwordData = {
      currentPassword: 'wrongpassword',
      newPassword: 'NewTestPassword123!',
    };

    const response = await fetch(`${BASE_URL}/api/me/password`, {
      method: 'POST',
      headers,
      body: JSON.stringify(passwordData),
    });

    // Should fail with wrong current password - this is expected
    const success = !response.ok && (response.status === 400 || response.status === 401);
    if (success) {
      console.log('   Password change correctly rejected invalid current password');
    } else if (response.ok) {
      console.log('   ⚠️  WARNING: Password change succeeded with wrong current password!');
      return false;
    } else {
      const error = await response.text();
      console.log(`   Password change test: ${error}`);
    }
    return success;
  });

  // ========================================
  // ACCOUNT DELETION (TEST ONLY)
  // ========================================
  console.log('\n🗑️ ACCOUNT DELETION');
  console.log('-------------------');

  await runTest('Account Deletion Endpoint Test (/api/me/delete-account)', async () => {
    // Test the endpoint without actually deleting by sending invalid confirmation
    const response = await fetch(`${BASE_URL}/api/me/delete-account`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        confirmation: 'invalid_confirmation',
      }),
    });

    // Should fail with invalid confirmation - this is expected
    const success = !response.ok && (response.status === 400 || response.status === 401);
    if (success) {
      console.log('   Account deletion correctly requires valid confirmation');
    } else if (response.ok) {
      console.log('   ⚠️  WARNING: Account deletion succeeded without proper confirmation!');
      return false;
    } else {
      const error = await response.text();
      console.log(`   Account deletion test: ${error}`);
    }
    return success;
  });

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 USER ACCOUNT TEST RESULTS');
  console.log('=============================');
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

  console.log('\n🎉 User Account Management Test Complete!');
  return results.passed > results.failed;
}

testUserAccountManagement().catch(console.error);
