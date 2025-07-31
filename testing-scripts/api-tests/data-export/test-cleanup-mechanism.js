const API_KEY = 'sly_your_api_key_here';
const BASE_URL = 'http://localhost:3000';

async function testCleanupMechanism() {
  console.log('🧹 Testing R2 Cleanup Mechanism...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('\n1. Creating test export to simulate cleanup...');

    // Create an export first
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

    const result = await exportResponse.json();
    console.log('✅ PASS: Export created successfully');
    console.log('📊 Export initiated:', result);

    console.log('\n2. Waiting for export to complete...');
    console.log('⏳ Waiting 15 seconds for files to be stored in R2...');

    // Wait for export to complete
    await new Promise(resolve => setTimeout(resolve, 15000));

    console.log('\n3. Testing manual cleanup trigger...');
    console.log('💡 We need to create a cleanup test endpoint for testing');

    console.log('\n🧹 Current Cleanup Limitations:');
    console.log('   ⚠️  setTimeout cleanup only works if server stays running for 24 hours');
    console.log('   ⚠️  Server restarts will lose cleanup timers');
    console.log('   ⚠️  Not suitable for production serverless environments');

    console.log('\n💡 Recommended Cleanup Solutions:');
    console.log('   ✅ Option 1: Cron job endpoint for manual cleanup testing');
    console.log('   ✅ Option 2: R2 Object Lifecycle Rules (automatic)');
    console.log('   ✅ Option 3: Database-tracked cleanup with scheduled jobs');

    console.log("\n🔧 Let's implement a manual cleanup test endpoint...");
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n📋 Cleanup Testing Strategy:');
  console.log('   1. Create cleanup test endpoint (/api/admin/cleanup-test)');
  console.log('   2. Track export timestamps in database or metadata');
  console.log('   3. Test cleanup logic with shorter timeouts (e.g., 30 seconds)');
  console.log('   4. Verify files are actually deleted from R2');
  console.log('   5. Set up R2 Lifecycle Rules as backup cleanup');
}

testCleanupMechanism().catch(console.error);
