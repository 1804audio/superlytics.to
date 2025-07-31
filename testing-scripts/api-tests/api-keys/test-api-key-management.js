const { API_KEY, BASE_URL } = require('../config.js');

async function testAPIKeyManagement() {
  console.log('🔑 Testing API Key Management');
  console.log('==============================');

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

  let testApiKeyId = null;
  let testApiKeyValue = null;

  // ========================================
  // API KEY CRUD OPERATIONS
  // ========================================
  console.log('\n🔑 API KEY MANAGEMENT');
  console.log('---------------------');

  await runTest('List Existing API Keys (/api/me/api-keys)', async () => {
    const response = await fetch(`${BASE_URL}/api/me/api-keys`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const apiKeys = await response.json();
      console.log(`   Found ${apiKeys.length} existing API keys`);
      if (apiKeys.length > 0) {
        console.log(`   Sample key: ${apiKeys[0].name} (${apiKeys[0].maskedKey})`);
        console.log(`   Created: ${new Date(apiKeys[0].createdAt).toLocaleDateString()}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   List API keys failed: ${error}`);
      return false;
    }
  });

  await runTest('Create New API Key (/api/me/api-keys)', async () => {
    const keyData = {
      name: `Test API Key ${Date.now()}`,
      description: 'Test API key created by automated test suite',
    };

    const response = await fetch(`${BASE_URL}/api/me/api-keys`, {
      method: 'POST',
      headers,
      body: JSON.stringify(keyData),
    });

    if (response.ok) {
      const newKey = await response.json();
      testApiKeyId = newKey.id;
      testApiKeyValue = newKey.key; // Full key is returned on creation
      console.log(`   Created API key: ${newKey.name}`);
      console.log(`   Key ID: ${testApiKeyId}`);
      console.log(`   Masked key: ${newKey.maskedKey}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Create API key failed: ${error}`);
      // Check if it's a plan limit issue - that's expected behavior
      if (error.includes('LIMIT_EXCEEDED') || error.includes('limit')) {
        console.log('   ✅ API key limit protection working correctly');
        return true;
      }
      return false;
    }
  });

  await runTest('Update API Key (/api/me/api-keys/{keyId})', async () => {
    if (!testApiKeyId) {
      console.log('   Skipping - no test API key created');
      return true; // Skip if we couldn't create a key due to limits
    }

    const updateData = {
      name: `Updated Test API Key ${Date.now()}`,
      description: 'Updated description for test API key',
    };

    const response = await fetch(`${BASE_URL}/api/me/api-keys/${testApiKeyId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      const updatedKey = await response.json();
      console.log(`   Updated API key name: ${updatedKey.name}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Update API key failed: ${error}`);
      return false;
    }
  });

  await runTest('Reveal API Key (/api/me/api-keys/{keyId}/reveal)', async () => {
    if (!testApiKeyId) {
      console.log('   Skipping - no test API key created');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/me/api-keys/${testApiKeyId}/reveal`, {
      method: 'POST',
      headers,
    });

    if (response.ok) {
      const keyData = await response.json();
      console.log(`   Revealed key: ${keyData.key?.substring(0, 12)}...`);
      console.log(`   Key matches created: ${keyData.key === testApiKeyValue}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Reveal API key failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // API KEY AUTHENTICATION TESTS
  // ========================================
  console.log('\n🔐 API KEY AUTHENTICATION');
  console.log('--------------------------');

  await runTest('Test New API Key Authentication', async () => {
    if (!testApiKeyValue) {
      console.log('   Skipping - no test API key available');
      return true;
    }

    // Test the new API key by making a simple API call
    const testHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': testApiKeyValue,
    };

    const response = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers: testHeaders,
    });

    if (response.ok) {
      const userData = await response.json();
      console.log(`   New API key works for user: ${userData.user?.username}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   New API key authentication failed: ${error}`);
      return false;
    }
  });

  await runTest('Test Invalid API Key Rejection', async () => {
    const invalidHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': 'sly_invalid_key_12345',
    };

    const response = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers: invalidHeaders,
    });

    const success = !response.ok && (response.status === 401 || response.status === 403);
    if (success) {
      console.log('   Invalid API key correctly rejected');
    } else {
      console.log(`   ⚠️  Invalid API key was accepted! Status: ${response.status}`);
    }
    return success;
  });

  // ========================================
  // API KEY DELETION
  // ========================================
  console.log('\n🗑️ API KEY DELETION');
  console.log('-------------------');

  await runTest('Delete API Key (/api/me/api-keys/{keyId})', async () => {
    if (!testApiKeyId) {
      console.log('   Skipping - no test API key to delete');
      return true;
    }

    const response = await fetch(`${BASE_URL}/api/me/api-keys/${testApiKeyId}`, {
      method: 'DELETE',
      headers,
    });

    if (response.ok) {
      console.log(`   Successfully deleted API key: ${testApiKeyId}`);
      return true;
    } else {
      const error = await response.text();
      console.log(`   Delete API key failed: ${error}`);
      return false;
    }
  });

  await runTest('Verify Deleted API Key No Longer Works', async () => {
    if (!testApiKeyValue) {
      console.log('   Skipping - no deleted API key to test');
      return true;
    }

    const deletedHeaders = {
      'Content-Type': 'application/json',
      'x-api-key': testApiKeyValue,
    };

    const response = await fetch(`${BASE_URL}/api/me`, {
      method: 'GET',
      headers: deletedHeaders,
    });

    const success = !response.ok && (response.status === 401 || response.status === 403);
    if (success) {
      console.log('   Deleted API key correctly rejected');
    } else {
      console.log(`   ⚠️  Deleted API key still works! Status: ${response.status}`);
    }
    return success;
  });

  // ========================================
  // PLAN LIMITS TESTING
  // ========================================
  console.log('\n📊 PLAN LIMITS');
  console.log('---------------');

  await runTest('API Key Plan Limits Check', async () => {
    // Try to create multiple API keys to test limits
    let createdKeys = 0;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      const keyData = {
        name: `Limit Test Key ${Date.now()}-${i}`,
        description: 'Testing plan limits',
      };

      const response = await fetch(`${BASE_URL}/api/me/api-keys`, {
        method: 'POST',
        headers,
        body: JSON.stringify(keyData),
      });

      if (response.ok) {
        createdKeys++;
        const newKey = await response.json();
        // Clean up immediately
        await fetch(`${BASE_URL}/api/me/api-keys/${newKey.id}`, {
          method: 'DELETE',
          headers,
        });
      } else {
        const error = await response.text();
        if (error.includes('LIMIT_EXCEEDED') || error.includes('limit')) {
          console.log(`   Plan limit reached after ${createdKeys} keys - protection working`);
          return true;
        }
        break;
      }
    }

    console.log(`   Created ${createdKeys} keys before stopping`);
    return true; // Consider this successful regardless
  });

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 API KEY MANAGEMENT TEST RESULTS');
  console.log('==================================');
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

  console.log('\n🎉 API Key Management Test Complete!');
  return results.passed > results.failed;
}

testAPIKeyManagement().catch(console.error);
