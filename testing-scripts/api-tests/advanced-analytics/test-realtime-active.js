const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testAdvancedAnalytics() {
  console.log('📊 Testing Advanced Analytics & Realtime');
  console.log('=======================================');

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

  const endAt = Date.now();
  const startAt = endAt - 24 * 60 * 60 * 1000; // 24 hours ago

  // ========================================
  // ACTIVE USERS ANALYTICS
  // ========================================
  console.log('\n👥 ACTIVE USERS ANALYTICS');
  console.log('-------------------------');

  await runTest('Get Active Users Count (/api/websites/{id}/active)', async () => {
    const response = await fetch(`${BASE_URL}/api/websites/${WEBSITE_ID}/active`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const activeData = await response.json();
      console.log(`   Active users: ${activeData.x || activeData.count || 0}`);
      console.log(`   Data type: ${typeof activeData}`);
      console.log(`   Sample data:`, JSON.stringify(activeData).substring(0, 100));
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get active users failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // REALTIME DATA ANALYTICS
  // ========================================
  console.log('\n⚡ REALTIME DATA');
  console.log('----------------');

  await runTest('Get Realtime Data (/api/realtime/{websiteId})', async () => {
    const response = await fetch(`${BASE_URL}/api/realtime/${WEBSITE_ID}`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const realtimeData = await response.json();
      console.log(`   Realtime response type: ${typeof realtimeData}`);

      // Handle different possible realtime data structures
      if (Array.isArray(realtimeData)) {
        console.log(`   Realtime events: ${realtimeData.length}`);
        if (realtimeData.length > 0) {
          console.log(`   Sample event:`, JSON.stringify(realtimeData[0]).substring(0, 100));
        }
      } else if (typeof realtimeData === 'object') {
        console.log(`   Realtime data keys:`, Object.keys(realtimeData));
        console.log(`   Active sessions: ${realtimeData.sessions || realtimeData.active || 'N/A'}`);
        console.log(`   Page views: ${realtimeData.pageviews || realtimeData.views || 'N/A'}`);
      } else {
        console.log(`   Realtime data: ${realtimeData}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get realtime data failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // EXTENDED SESSION ANALYTICS
  // ========================================
  console.log('\n📈 EXTENDED SESSION ANALYTICS');
  console.log('------------------------------');

  await runTest('Get Session Statistics (/api/websites/{id}/sessions/stats)', async () => {
    const statsParams = new URLSearchParams({
      startAt: startAt.toString(),
      endAt: endAt.toString(),
      timezone: 'America/New_York',
    });

    const response = await fetch(
      `${BASE_URL}/api/websites/${WEBSITE_ID}/sessions/stats?${statsParams}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (response.ok) {
      const sessionStats = await response.json();
      console.log(`   Session stats response:`, JSON.stringify(sessionStats).substring(0, 150));

      // Handle different possible structures
      if (sessionStats.bounces !== undefined) {
        console.log(`   Bounce rate: ${sessionStats.bounces}%`);
      }
      if (sessionStats.totaltime !== undefined) {
        console.log(`   Total time: ${sessionStats.totaltime}ms`);
      }
      if (sessionStats.avgtime !== undefined) {
        console.log(`   Average time: ${sessionStats.avgtime}ms`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get session stats failed: ${error}`);
      return false;
    }
  });

  await runTest('Get Weekly Session Data (/api/websites/{id}/sessions/weekly)', async () => {
    const weeklyParams = new URLSearchParams({
      startAt: (endAt - 7 * 24 * 60 * 60 * 1000).toString(), // 7 days ago
      endAt: endAt.toString(),
      timezone: 'America/New_York',
    });

    const response = await fetch(
      `${BASE_URL}/api/websites/${WEBSITE_ID}/sessions/weekly?${weeklyParams}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (response.ok) {
      const weeklyData = await response.json();
      console.log(`   Weekly data type: ${typeof weeklyData}`);

      if (Array.isArray(weeklyData)) {
        console.log(`   Weekly sessions: ${weeklyData.length} data points`);
        if (weeklyData.length > 0) {
          console.log(`   Sample data point:`, JSON.stringify(weeklyData[0]).substring(0, 100));
        }
      } else {
        console.log(`   Weekly sessions data:`, JSON.stringify(weeklyData).substring(0, 150));
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get weekly session data failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // EVENT DATA ANALYTICS
  // ========================================
  console.log('\n🎯 EVENT DATA ANALYTICS');
  console.log('-----------------------');

  await runTest('Get Event Data Stats (/api/websites/{id}/event-data/stats)', async () => {
    const eventParams = new URLSearchParams({
      startAt: startAt.toString(),
      endAt: endAt.toString(),
      timezone: 'America/New_York',
    });

    const response = await fetch(
      `${BASE_URL}/api/websites/${WEBSITE_ID}/event-data/stats?${eventParams}`,
      {
        method: 'GET',
        headers,
      },
    );

    if (response.ok) {
      const eventStats = await response.json();
      console.log(`   Event stats response:`, JSON.stringify(eventStats).substring(0, 150));

      if (Array.isArray(eventStats)) {
        console.log(`   Event stats entries: ${eventStats.length}`);
        if (eventStats.length > 0) {
          console.log(`   Sample event stat:`, JSON.stringify(eventStats[0]).substring(0, 100));
        }
      } else if (typeof eventStats === 'object') {
        console.log(`   Event stats keys:`, Object.keys(eventStats));
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get event data stats failed: ${error}`);
      return false;
    }
  });

  await runTest('Get Event Data Fields (/api/websites/{id}/event-data/fields)', async () => {
    const response = await fetch(`${BASE_URL}/api/websites/${WEBSITE_ID}/event-data/fields`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const fields = await response.json();
      console.log(`   Event fields response:`, JSON.stringify(fields).substring(0, 150));

      if (Array.isArray(fields)) {
        console.log(`   Available event fields: ${fields.length}`);
        if (fields.length > 0) {
          console.log(`   Sample fields:`, fields.slice(0, 5).join(', '));
        }
      } else {
        console.log(`   Event fields:`, fields);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get event data fields failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // SESSION PROPERTIES ANALYTICS
  // ========================================
  console.log('\n🔍 SESSION PROPERTIES');
  console.log('---------------------');

  await runTest(
    'Get Session Data Properties (/api/websites/{id}/session-data/properties)',
    async () => {
      const response = await fetch(
        `${BASE_URL}/api/websites/${WEBSITE_ID}/session-data/properties`,
        {
          method: 'GET',
          headers,
        },
      );

      if (response.ok) {
        const properties = await response.json();
        console.log(
          `   Session properties response:`,
          JSON.stringify(properties).substring(0, 150),
        );

        if (Array.isArray(properties)) {
          console.log(`   Session properties: ${properties.length}`);
          if (properties.length > 0) {
            console.log(`   Sample properties:`, properties.slice(0, 3).join(', '));
          }
        } else {
          console.log(`   Session properties:`, properties);
        }
        return true;
      } else {
        const error = await response.text();
        console.log(`   Get session data properties failed: ${error}`);
        return false;
      }
    },
  );

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 ADVANCED ANALYTICS TEST RESULTS');
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

  console.log('\n🎉 Advanced Analytics Test Complete!');
  return results.passed > results.failed;
}

testAdvancedAnalytics().catch(console.error);
