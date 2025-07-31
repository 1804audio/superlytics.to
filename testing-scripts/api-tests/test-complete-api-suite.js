const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const WEBSITE_ID = '77b5aae8-8e1c-4604-a4cc-a4de2b9e3b7e';

async function runCompleteAPITest() {
  console.log('🚀 Running Complete API Test Suite');
  console.log('===================================');
  console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);
  console.log(`🌐 Website ID: ${WEBSITE_ID}`);

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000; // 30 days ago
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
  // CORE TRACKING APIs
  // ========================================
  console.log('\n📊 CORE TRACKING APIs');
  console.log('----------------------');

  await runTest('Send Single Event', async () => {
    const response = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          url: 'https://test.example.com/api-suite-test',
          title: 'API Suite Test Page',
          hostname: 'test.example.com',
          timestamp: Math.floor(Date.now() / 1000),
        },
      }),
    });
    return response.ok;
  });

  await runTest('Send Custom Event', async () => {
    const response = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          name: 'api_test_event',
          tag: 'testing',
          data: { test_id: 'complete_api_suite' },
          hostname: 'test.example.com',
          timestamp: Math.floor(Date.now() / 1000),
        },
      }),
    });
    return response.ok;
  });

  await runTest('Send User Identification', async () => {
    const response = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'identify',
        payload: {
          website: WEBSITE_ID,
          data: {
            userId: 'api_test_user',
            email: 'api-test@example.com',
            name: 'API Test User',
          },
          hostname: 'test.example.com',
          timestamp: Math.floor(Date.now() / 1000),
        },
      }),
    });
    return response.ok;
  });

  await runTest('Batch Send Events', async () => {
    const batchData = [
      {
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          url: 'https://test.example.com/batch-1',
          title: 'Batch Test 1',
          hostname: 'test.example.com',
          timestamp: Math.floor(Date.now() / 1000) - 100,
        },
      },
      {
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          name: 'batch_test_event',
          tag: 'batch',
          hostname: 'test.example.com',
          timestamp: Math.floor(Date.now() / 1000),
        },
      },
    ];

    const response = await fetch('http://localhost:3000/api/batch', {
      method: 'POST',
      headers,
      body: JSON.stringify(batchData),
    });

    if (response.ok) {
      const result = await response.json();
      return result.processed === 2 && result.errors === 0;
    }
    return false;
  });

  // ========================================
  // ANALYTICS APIs
  // ========================================
  console.log('\n📈 ANALYTICS APIs');
  console.log('-----------------');

  const commonParams = new URLSearchParams({
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    timezone: 'America/New_York',
  });

  await runTest('Website Statistics', async () => {
    const response = await fetch(
      `http://localhost:3000/api/websites/${WEBSITE_ID}/stats?${commonParams}`,
      {
        method: 'GET',
        headers,
      },
    );
    return response.ok;
  });

  await runTest('Page Views Data', async () => {
    const pageviewsParams = new URLSearchParams({
      ...Object.fromEntries(commonParams),
      unit: 'day',
    });
    const response = await fetch(
      `http://localhost:3000/api/websites/${WEBSITE_ID}/pageviews?${pageviewsParams}`,
      {
        method: 'GET',
        headers,
      },
    );
    return response.ok;
  });

  await runTest('Events List', async () => {
    const response = await fetch(
      `http://localhost:3000/api/websites/${WEBSITE_ID}/events?${commonParams}`,
      {
        method: 'GET',
        headers,
      },
    );
    return response.ok;
  });

  await runTest('Sessions List', async () => {
    const response = await fetch(
      `http://localhost:3000/api/websites/${WEBSITE_ID}/sessions?${commonParams}`,
      {
        method: 'GET',
        headers,
      },
    );
    return response.ok;
  });

  // ========================================
  // DATA EXPORT APIs
  // ========================================
  console.log('\n📤 DATA EXPORT APIs');
  console.log('-------------------');

  await runTest('Data Export JSON', async () => {
    const response = await fetch('http://localhost:3000/api/me/data-export', {
      method: 'POST',
      headers,
      body: JSON.stringify({ type: 'json' }),
    });
    return response.ok;
  });

  // ========================================
  // V1 API ENDPOINTS
  // ========================================
  console.log('\n🔧 V1 API ENDPOINTS');
  console.log('-------------------');

  await runTest('V1 Websites List', async () => {
    const response = await fetch('http://localhost:3000/api/v1/websites', {
      method: 'GET',
      headers,
    });
    return response.ok;
  });

  await runTest('V1 Website Stats', async () => {
    const statsParams = new URLSearchParams({
      startAt: startAt.toString(),
      endAt: endAt.toString(),
    });
    const response = await fetch(
      `http://localhost:3000/api/v1/websites/${WEBSITE_ID}/stats?${statsParams}`,
      {
        method: 'GET',
        headers,
      },
    );
    return response.ok;
  });

  // ========================================
  // AUTHENTICATION TESTS
  // ========================================
  console.log('\n🔐 AUTHENTICATION TESTS');
  console.log('-----------------------');

  await runTest('Invalid API Key Rejection', async () => {
    const response = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'sly_invalid_key_123',
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          url: 'https://test.example.com/invalid-test',
          hostname: 'test.example.com',
        },
      }),
    });
    // Should fail authentication
    return !response.ok && response.status === 401;
  });

  await runTest('No API Key Rejection', async () => {
    const response = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // No API key provided
      },
      body: JSON.stringify({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          url: 'https://test.example.com/no-key-test',
          hostname: 'test.example.com',
        },
      }),
    });
    // Should fail authentication
    return !response.ok && response.status === 401;
  });

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 TEST RESULTS SUMMARY');
  console.log('=======================');
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

  console.log('\n🎉 API Test Suite Complete!');

  return results.passed > results.failed;
}

runCompleteAPITest().catch(console.error);
