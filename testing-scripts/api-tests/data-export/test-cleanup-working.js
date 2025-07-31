const API_KEY = 'sly_your_api_key_here';
const BASE_URL = 'http://localhost:3000';

async function testCleanupWorking() {
  console.log('🧹 Testing R2 Cleanup Functionality...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('\n1. Listing all current exports in R2...');

    const listResponse = await fetch(`${BASE_URL}/api/admin/cleanup-test`, {
      method: 'GET',
      headers,
    });

    if (listResponse.ok) {
      const listResult = await listResponse.json();
      console.log('✅ PASS: Export listing successful');
      console.log('📊 Current exports:', listResult.totalExports);
      console.log('📁 Total files:', listResult.totalFiles);

      if (listResult.exports.length > 0) {
        console.log('\n📋 Current Exports:');
        listResult.exports.forEach((exp, i) => {
          console.log(`   ${i + 1}. ${exp.exportId}`);
          console.log(`      Created: ${exp.createdAt || 'Unknown'}`);
          console.log(`      Files: ${exp.files.length}`);
        });
      }
    } else {
      console.log('❌ FAIL: Could not list exports');
      return;
    }

    console.log('\n2. Creating a test export for cleanup testing...');

    const exportResponse = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (!exportResponse.ok) {
      const error = await exportResponse.text();
      console.log('❌ FAIL: Export creation failed');
      console.log('🔍 Error:', error);
      return;
    }

    console.log('✅ PASS: Test export created');
    console.log('⏳ Waiting 20 seconds for export to complete...');

    // Wait for export to complete
    await new Promise(resolve => setTimeout(resolve, 20000));

    console.log('\n3. Listing exports to see the new one...');

    const listResponse2 = await fetch(`${BASE_URL}/api/admin/cleanup-test`, {
      method: 'GET',
      headers,
    });

    let latestExportId = null;
    if (listResponse2.ok) {
      const listResult2 = await listResponse2.json();
      console.log('📊 Updated exports count:', listResult2.totalExports);

      // Find the most recent export
      if (listResult2.exports.length > 0) {
        const sortedExports = listResult2.exports.sort(
          (a, b) => (b.timestamp || 0) - (a.timestamp || 0),
        );
        latestExportId = sortedExports[0].exportId;
        console.log('🆕 Latest export ID:', latestExportId);
        console.log('📁 Files in latest export:', sortedExports[0].files.length);
      }
    }

    if (!latestExportId) {
      console.log('❌ Could not find the test export to cleanup');
      return;
    }

    console.log('\n4. Testing manual cleanup of specific export...');

    const cleanupResponse = await fetch(`${BASE_URL}/api/admin/cleanup-test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'cleanup_export',
        exportId: latestExportId,
      }),
    });

    if (cleanupResponse.ok) {
      const cleanupResult = await cleanupResponse.json();
      console.log('✅ PASS: Manual cleanup successful');
      console.log('📊 Cleanup result:', cleanupResult.message);
    } else {
      const error = await cleanupResponse.text();
      console.log('❌ FAIL: Manual cleanup failed');
      console.log('🔍 Error:', error);
    }

    console.log('\n5. Verifying cleanup by listing exports again...');

    const listResponse3 = await fetch(`${BASE_URL}/api/admin/cleanup-test`, {
      method: 'GET',
      headers,
    });

    if (listResponse3.ok) {
      const listResult3 = await listResponse3.json();
      console.log('📊 Final exports count:', listResult3.totalExports);

      // Check if our test export was deleted
      const stillExists = listResult3.exports.some(exp => exp.exportId === latestExportId);
      if (stillExists) {
        console.log('❌ FAIL: Export still exists after cleanup');
      } else {
        console.log('✅ PASS: Export successfully deleted from R2');
      }
    }

    console.log('\n6. Testing bulk cleanup of old exports...');

    const bulkCleanupResponse = await fetch(`${BASE_URL}/api/admin/cleanup-test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'cleanup_old_exports',
        maxAge: 1, // 1 minute old (for testing)
      }),
    });

    if (bulkCleanupResponse.ok) {
      const bulkResult = await bulkCleanupResponse.json();
      console.log('✅ PASS: Bulk cleanup test completed');
      console.log('📊 Bulk cleanup result:', bulkResult.message);
    } else {
      const error = await bulkCleanupResponse.text();
      console.log('❌ FAIL: Bulk cleanup failed');
      console.log('🔍 Error:', error);
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n✅ Cleanup Testing Complete!');
  console.log('\n🔧 Cleanup Test Endpoints:');
  console.log('   GET  /api/admin/cleanup-test - List all exports');
  console.log('   POST /api/admin/cleanup-test - Cleanup operations');
  console.log('');
  console.log('📋 Available Cleanup Actions:');
  console.log('   • list_old_exports - Find exports older than X minutes');
  console.log('   • cleanup_export - Delete specific export by ID');
  console.log('   • cleanup_old_exports - Delete all old exports');
  console.log('');
  console.log('💡 Production Recommendations:');
  console.log('   1. Set up R2 Object Lifecycle Rules for automatic cleanup');
  console.log('   2. Create a scheduled job (cron) to run cleanup daily');
  console.log('   3. Monitor cleanup operations with proper logging');
  console.log('   4. Consider database tracking for export metadata');
}

testCleanupWorking().catch(console.error);
