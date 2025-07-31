const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testReportsAPI() {
  console.log('📋 Testing Reports API');
  console.log('======================');

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
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  const commonParams = {
    websiteId: WEBSITE_ID,
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    timezone: 'America/New_York',
  };

  // ========================================
  // USER REPORTS MANAGEMENT
  // ========================================
  console.log('\n📊 USER REPORTS MANAGEMENT');
  console.log('---------------------------');

  await runTest('List User Reports (/api/reports)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const reports = await response.json();
      console.log(`   Found ${reports.length} user reports`);
      if (reports.length > 0) {
        console.log(`   Sample report: ${reports[0].name} (${reports[0].type})`);
        console.log(`   Created: ${new Date(reports[0].createdAt).toLocaleDateString()}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   List reports failed: ${error}`);
      return false;
    }
  });

  await runTest('Get Website Reports (/api/websites/{id}/reports)', async () => {
    const response = await fetch(`${BASE_URL}/api/websites/${WEBSITE_ID}/reports`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const websiteReports = await response.json();
      console.log(`   Website has ${websiteReports.length} reports`);
      if (websiteReports.length > 0) {
        console.log(`   Sample: ${websiteReports[0].name} - ${websiteReports[0].type}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Get website reports failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // UTM REPORTS
  // ========================================
  console.log('\n📈 UTM REPORTS');
  console.log('---------------');

  await runTest('UTM Campaign Report (/api/reports/utm)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/utm`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'utm',
        parameters: {
          fields: ['utm_source', 'utm_medium', 'utm_campaign'],
        },
      }),
    });

    if (response.ok) {
      const utmReport = await response.json();
      console.log(`   UTM report generated: ${typeof utmReport}`);

      if (Array.isArray(utmReport)) {
        console.log(`   UTM data points: ${utmReport.length}`);
        if (utmReport.length > 0) {
          console.log(`   Sample UTM data:`, JSON.stringify(utmReport[0]).substring(0, 100));
        }
      } else if (utmReport.data) {
        console.log(`   UTM report data points: ${utmReport.data.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   UTM report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // FUNNEL REPORTS
  // ========================================
  console.log('\n🔄 FUNNEL REPORTS');
  console.log('------------------');

  await runTest('Funnel Analysis Report (/api/reports/funnel)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/funnel`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'funnel',
        parameters: {
          steps: [
            { event: 'pageview', url: '/' },
            { event: 'pageview', url: '/products' },
            { event: 'custom_event', name: 'purchase' },
          ],
        },
      }),
    });

    if (response.ok) {
      const funnelReport = await response.json();
      console.log(`   Funnel report generated: ${typeof funnelReport}`);

      if (Array.isArray(funnelReport)) {
        console.log(`   Funnel steps: ${funnelReport.length}`);
        if (funnelReport.length > 0) {
          console.log(`   Sample funnel step:`, JSON.stringify(funnelReport[0]).substring(0, 100));
        }
      } else if (funnelReport.steps) {
        console.log(`   Funnel analysis steps: ${funnelReport.steps.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Funnel report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // RETENTION REPORTS
  // ========================================
  console.log('\n📅 RETENTION REPORTS');
  console.log('--------------------');

  await runTest('User Retention Report (/api/reports/retention)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/retention`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'retention',
        parameters: {
          period: 'day',
          intervals: 7,
        },
      }),
    });

    if (response.ok) {
      const retentionReport = await response.json();
      console.log(`   Retention report generated: ${typeof retentionReport}`);

      if (Array.isArray(retentionReport)) {
        console.log(`   Retention data points: ${retentionReport.length}`);
        if (retentionReport.length > 0) {
          console.log(
            `   Sample retention data:`,
            JSON.stringify(retentionReport[0]).substring(0, 100),
          );
        }
      } else if (retentionReport.data) {
        console.log(`   Retention cohorts: ${retentionReport.data.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Retention report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // REVENUE REPORTS
  // ========================================
  console.log('\n💰 REVENUE REPORTS');
  console.log('-------------------');

  await runTest('Revenue Analysis Report (/api/reports/revenue)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/revenue`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'revenue',
        parameters: {
          currency: 'USD',
          granularity: 'day',
        },
      }),
    });

    if (response.ok) {
      const revenueReport = await response.json();
      console.log(`   Revenue report generated: ${typeof revenueReport}`);

      if (Array.isArray(revenueReport)) {
        console.log(`   Revenue data points: ${revenueReport.length}`);
        if (revenueReport.length > 0) {
          console.log(
            `   Sample revenue data:`,
            JSON.stringify(revenueReport[0]).substring(0, 100),
          );
        }
      } else if (revenueReport.total !== undefined) {
        console.log(`   Total revenue: ${revenueReport.total || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Revenue report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // GOALS REPORTS
  // ========================================
  console.log('\n🎯 GOALS REPORTS');
  console.log('-----------------');

  await runTest('Goals Achievement Report (/api/reports/goals)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/goals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'goals',
        parameters: {
          goals: [
            { name: 'Newsletter Signup', event: 'newsletter_signup' },
            { name: 'Purchase', event: 'purchase' },
          ],
        },
      }),
    });

    if (response.ok) {
      const goalsReport = await response.json();
      console.log(`   Goals report generated: ${typeof goalsReport}`);

      if (Array.isArray(goalsReport)) {
        console.log(`   Goals tracked: ${goalsReport.length}`);
        if (goalsReport.length > 0) {
          console.log(`   Sample goal data:`, JSON.stringify(goalsReport[0]).substring(0, 100));
        }
      } else if (goalsReport.goals) {
        console.log(`   Goals in report: ${goalsReport.goals.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Goals report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // INSIGHTS REPORTS
  // ========================================
  console.log('\n💡 INSIGHTS REPORTS');
  console.log('--------------------');

  await runTest('Insights Analysis Report (/api/reports/insights)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/insights`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'insights',
        parameters: {
          metrics: ['pageviews', 'sessions', 'bounce_rate'],
          comparison: 'previous_period',
        },
      }),
    });

    if (response.ok) {
      const insightsReport = await response.json();
      console.log(`   Insights report generated: ${typeof insightsReport}`);

      if (Array.isArray(insightsReport)) {
        console.log(`   Insights generated: ${insightsReport.length}`);
        if (insightsReport.length > 0) {
          console.log(`   Sample insight:`, JSON.stringify(insightsReport[0]).substring(0, 100));
        }
      } else if (insightsReport.insights) {
        console.log(`   Insights count: ${insightsReport.insights.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Insights report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // JOURNEY REPORTS
  // ========================================
  console.log('\n🗺️ JOURNEY REPORTS');
  console.log('-------------------');

  await runTest('User Journey Report (/api/reports/journey)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/journey`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'journey',
        parameters: {
          start_event: 'pageview',
          end_event: 'purchase',
          max_steps: 10,
        },
      }),
    });

    if (response.ok) {
      const journeyReport = await response.json();
      console.log(`   Journey report generated: ${typeof journeyReport}`);

      if (Array.isArray(journeyReport)) {
        console.log(`   Journey paths: ${journeyReport.length}`);
        if (journeyReport.length > 0) {
          console.log(`   Sample journey:`, JSON.stringify(journeyReport[0]).substring(0, 100));
        }
      } else if (journeyReport.paths) {
        console.log(`   User journey paths: ${journeyReport.paths.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Journey report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // ATTRIBUTION REPORTS
  // ========================================
  console.log('\n🔗 ATTRIBUTION REPORTS');
  console.log('-----------------------');

  await runTest('Attribution Analysis Report (/api/reports/attribution)', async () => {
    const response = await fetch(`${BASE_URL}/api/reports/attribution`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...commonParams,
        type: 'attribution',
        parameters: {
          model: 'last_click',
          conversion_event: 'purchase',
          lookback_days: 30,
        },
      }),
    });

    if (response.ok) {
      const attributionReport = await response.json();
      console.log(`   Attribution report generated: ${typeof attributionReport}`);

      if (Array.isArray(attributionReport)) {
        console.log(`   Attribution data: ${attributionReport.length}`);
        if (attributionReport.length > 0) {
          console.log(
            `   Sample attribution:`,
            JSON.stringify(attributionReport[0]).substring(0, 100),
          );
        }
      } else if (attributionReport.channels) {
        console.log(`   Attribution channels: ${attributionReport.channels.length || 0}`);
      }
      return true;
    } else {
      const error = await response.text();
      console.log(`   Attribution report failed: ${error}`);
      return false;
    }
  });

  // ========================================
  // RESULTS SUMMARY
  // ========================================
  console.log('\n🎯 REPORTS API TEST RESULTS');
  console.log('============================');
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

  console.log('\n🎉 Reports API Test Complete!');
  return results.passed > results.failed;
}

testReportsAPI().catch(console.error);
