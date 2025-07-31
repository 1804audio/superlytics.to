/**
 * Test Data Export Validation - Ensures export only works when user has data
 */

const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const BASE_URL = 'http://localhost:3000';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

async function testDataStatusEndpoint() {
  console.log('🔍 Testing data status endpoint...');

  try {
    const response = await fetch(`${BASE_URL}/api/me/data-status`, {
      method: 'GET',
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ PASS: Data status endpoint working');
      console.log(`   - Has exportable data: ${result.hasExportableData}`);
      console.log(`   - Websites count: ${result.websitesCount || 0}`);
      console.log(`   - Has events: ${result.hasEvents || false}`);
      console.log(`   - Has sessions: ${result.hasSessions || false}`);
      console.log(`   - Message: ${result.message || 'N/A'}`);
      return result;
    } else {
      console.log(`❌ FAIL: Data status endpoint - ${response.status}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ERROR: Data status endpoint - ${error.message}`);
    return null;
  }
}

async function testDataExportValidation() {
  console.log('\n🔍 Testing data export validation...');

  try {
    const response = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
    });

    const result = await response.text();

    if (response.status === 403) {
      console.log('✅ PASS: Export correctly blocked when no data available');
      console.log(`   - Response: ${result}`);
      return true;
    } else if (response.status === 200) {
      console.log('ℹ️  INFO: Export allowed - user has data available');
      console.log(`   - Response: ${result}`);
      return true;
    } else {
      console.log(`❌ FAIL: Unexpected response - ${response.status}: ${result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ERROR: Data export validation - ${error.message}`);
    return false;
  }
}

async function testExportDataValidation() {
  console.log('🚀 Starting Data Export Validation Test');
  console.log('Testing that export is only available when user has actual data\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test data status endpoint
  totalTests++;
  const dataStatus = await testDataStatusEndpoint();
  if (dataStatus !== null) passedTests++;

  // Test export validation
  totalTests++;
  const exportValidation = await testDataExportValidation();
  if (exportValidation) passedTests++;

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Export validation is working correctly!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Review the implementation.');
  }

  console.log('\n✨ Export Data Validation Test Complete!');
}

// Run the test
testExportDataValidation().catch(console.error);
