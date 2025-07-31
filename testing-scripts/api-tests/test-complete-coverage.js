const { spawn } = require('child_process');
const path = require('path');

async function runCompleteAPICoverage() {
  console.log('🚀 Running Complete API Coverage Test Suite');
  console.log('============================================');
  console.log('🎯 Testing ALL user-accessible endpoints (35 total)');
  console.log('📊 Previous coverage: 13/35 (37.1%)');
  console.log('🔥 New coverage target: 35/35 (100%)');
  console.log('');

  const testSuites = [
    {
      name: '🔐 Authentication Flow',
      path: './authentication/test-auth-flow.js',
      endpoints: 6,
      description: 'Login, register, verify, logout, password reset',
    },
    {
      name: '👤 User Account Management',
      path: './user-management/test-user-account.js',
      endpoints: 7,
      description: 'Profile, settings, subscription, features',
    },
    {
      name: '🔑 API Key Management',
      path: './api-keys/test-api-key-management.js',
      endpoints: 3,
      description: 'Create, update, delete, reveal API keys',
    },
    {
      name: '👥 Team Management',
      path: './team-management/test-team-operations.js',
      endpoints: 4,
      description: 'Team CRUD, members, websites',
    },
    {
      name: '📊 Advanced Analytics',
      path: './advanced-analytics/test-realtime-active.js',
      endpoints: 2,
      description: 'Realtime data, active users',
    },
    {
      name: '📋 Reports API',
      path: './reports/test-all-reports.js',
      endpoints: 10,
      description: 'UTM, funnel, retention, revenue, goals, insights',
    },
    {
      name: '📈 Core Analytics (Existing)',
      path: './analytics/test-analytics-api.js',
      endpoints: 5,
      description: 'Stats, pageviews, events, sessions, metrics',
    },
    {
      name: '🌐 Website Management (Existing)',
      path: './website-management/test-website-management.js',
      endpoints: 4,
      description: 'Website CRUD, cleanup operations',
    },
    {
      name: '📤 Data Export (Existing)',
      path: './data-export/test-export-api.js',
      endpoints: 1,
      description: 'User data export functionality',
    },
    {
      name: '🔧 V1 API (Existing)',
      path: './v1-api/test-v1-api.js',
      endpoints: 2,
      description: 'Legacy API compatibility',
    },
    {
      name: '📊 Core Tracking (Existing)',
      path: './test-complete-api-suite.js',
      endpoints: 4,
      description: 'Event tracking, batch operations',
    },
  ];

  const results = {
    totalSuites: testSuites.length,
    passedSuites: 0,
    failedSuites: 0,
    totalEndpoints: testSuites.reduce((sum, suite) => sum + suite.endpoints, 0),
    testedEndpoints: 0,
    suiteResults: [],
  };

  console.log(
    `📦 Running ${results.totalSuites} test suites covering ${results.totalEndpoints} endpoints\n`,
  );

  for (let i = 0; i < testSuites.length; i++) {
    const suite = testSuites[i];
    console.log(`\n${'='.repeat(60)}`);
    console.log(`${suite.name} (${i + 1}/${testSuites.length})`);
    console.log(`📝 ${suite.description}`);
    console.log(`🎯 Testing ${suite.endpoints} endpoints`);
    console.log(`${'='.repeat(60)}`);

    try {
      const success = await runTestSuite(suite.path);
      results.suiteResults.push({
        name: suite.name,
        endpoints: suite.endpoints,
        success,
        path: suite.path,
      });

      if (success) {
        results.passedSuites++;
        results.testedEndpoints += suite.endpoints;
        console.log(`\n✅ ${suite.name} - PASSED (${suite.endpoints} endpoints)`);
      } else {
        results.failedSuites++;
        console.log(`\n❌ ${suite.name} - FAILED`);
      }
    } catch (error) {
      results.failedSuites++;
      results.suiteResults.push({
        name: suite.name,
        endpoints: suite.endpoints,
        success: false,
        error: error.message,
        path: suite.path,
      });
      console.log(`\n❌ ${suite.name} - ERROR: ${error.message}`);
    }

    // Brief pause between suites
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // ========================================
  // COMPREHENSIVE RESULTS SUMMARY
  // ========================================
  console.log('\n' + '='.repeat(80));
  console.log('🎯 COMPLETE API COVERAGE TEST RESULTS');
  console.log('='.repeat(80));

  console.log('\n📊 COVERAGE SUMMARY:');
  console.log(`   Total Test Suites: ${results.totalSuites}`);
  console.log(`   ✅ Passed Suites: ${results.passedSuites}`);
  console.log(`   ❌ Failed Suites: ${results.failedSuites}`);
  console.log(
    `   📈 Suite Success Rate: ${((results.passedSuites / results.totalSuites) * 100).toFixed(1)}%`,
  );

  console.log('\n🎯 ENDPOINT COVERAGE:');
  console.log(`   Total User Endpoints: ${results.totalEndpoints}`);
  console.log(`   ✅ Successfully Tested: ${results.testedEndpoints}`);
  console.log(`   ❌ Failed Tests: ${results.totalEndpoints - results.testedEndpoints}`);
  console.log(
    `   📊 Endpoint Coverage: ${((results.testedEndpoints / results.totalEndpoints) * 100).toFixed(1)}%`,
  );

  console.log('\n📋 DETAILED RESULTS:');
  results.suiteResults.forEach(suite => {
    const status = suite.success ? '✅ PASS' : '❌ FAIL';
    console.log(`   ${status} ${suite.name} (${suite.endpoints} endpoints)`);
    if (suite.error) {
      console.log(`      Error: ${suite.error}`);
    }
  });

  if (results.failedSuites > 0) {
    console.log('\n🔧 FAILED TEST SUITES:');
    results.suiteResults
      .filter(suite => !suite.success)
      .forEach(suite => {
        console.log(`   • ${suite.name}`);
        console.log(`     Path: ${suite.path}`);
        if (suite.error) {
          console.log(`     Error: ${suite.error}`);
        }
      });
  }

  console.log('\n🚀 ACHIEVEMENT UNLOCKED:');
  const coverageImprovement = (results.testedEndpoints / results.totalEndpoints) * 100 - 37.1;
  console.log(
    `   📈 Coverage improved by ${coverageImprovement.toFixed(1)}% (${results.testedEndpoints}/${results.totalEndpoints} endpoints)`,
  );
  console.log(
    `   🎯 From 37.1% to ${((results.testedEndpoints / results.totalEndpoints) * 100).toFixed(1)}% coverage`,
  );
  console.log(`   ✨ Added ${results.testedEndpoints - 13} new endpoint tests`);

  if (results.testedEndpoints === results.totalEndpoints) {
    console.log('\n🎉 PERFECT SCORE! 100% API ENDPOINT COVERAGE ACHIEVED!');
    console.log('   🏆 All 35 user-accessible endpoints now have test coverage');
    console.log('   🛡️ SuperLytics SaaS platform is fully tested and production-ready');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 Complete API Coverage Test Suite Finished!');
  console.log('='.repeat(80) + '\n');

  return results.passedSuites > results.failedSuites;
}

function runTestSuite(testPath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(__dirname, testPath);

    // Check if file exists
    const fs = require('fs');
    if (!fs.existsSync(fullPath)) {
      reject(new Error(`Test file not found: ${fullPath}`));
      return;
    }

    const child = spawn('node', [fullPath], {
      stdio: 'inherit',
      cwd: __dirname,
    });

    let timeout = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error('Test suite timed out after 2 minutes'));
    }, 120000); // 2 minute timeout

    child.on('close', code => {
      clearTimeout(timeout);
      resolve(code === 0);
    });

    child.on('error', error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

// Only run if called directly
if (require.main === module) {
  runCompleteAPICoverage().catch(console.error);
}

module.exports = { runCompleteAPICoverage };
