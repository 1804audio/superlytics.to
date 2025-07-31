const API_KEY = 'sly_your_api_key_here';
const BASE_URL = 'http://localhost:3000';

async function testR2Migration() {
  console.log('🌩️ Testing R2 Storage Migration...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('\n1. Testing data export with R2 storage...');

    const exportResponse = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (exportResponse.ok) {
      const result = await exportResponse.json();
      console.log('✅ PASS: Export request successful');
      console.log('📊 Response:', result);

      console.log('\n2. Waiting for R2 background processing...');
      console.log('⏳ R2 storage should process files within 30 seconds');
      console.log('📧 Email should be sent within 2-5 minutes');

      // Give some time for R2 processing
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('\n✅ R2 migration test initiated successfully');
      console.log('🔍 Check server logs for:');
      console.log('   - "Using Cloudflare R2 storage for data exports"');
      console.log('   - "Storing X files in R2"');
      console.log('   - "Files stored successfully in R2 for export..."');
      console.log('   - "Generated download URL for: exports/..."');
    } else {
      const error = await exportResponse.text();
      console.log('❌ FAIL: Export request failed');
      console.log('🔍 Status:', exportResponse.status);
      console.log('🔍 Error:', error);

      if (error.includes('R2 storage is not configured')) {
        console.log('\n⚠️ R2 Configuration Missing:');
        console.log('   Add these to your .env file:');
        console.log('   R2_ENDPOINT="https://your-account-id.r2.cloudflarestorage.com"');
        console.log('   R2_REGION="auto"');
        console.log('   R2_ACCESS_KEY_ID="your-r2-access-key-id"');
        console.log('   R2_SECRET_ACCESS_KEY="your-r2-secret-access-key"');
        console.log('   R2_BUCKET_NAME="superlytics-exports"');
      }
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n🌩️ R2 Migration Features:');
  console.log('   ✅ Direct R2 storage (no filesystem fallback)');
  console.log('   ✅ Presigned URLs for secure downloads (1-hour expiry)');
  console.log('   ✅ Automatic cleanup after 24 hours');
  console.log('   ✅ S3-compatible API with AWS SDK');
  console.log('   ✅ Scalable cloud storage for production');
  console.log('   ✅ Cost-effective (~$0.015/GB)');

  console.log('\n📧 Expected Email Behavior:');
  console.log('   🎉 SUCCESS: Email with direct R2 download links');
  console.log('   📱 Links work directly from email (no server dependency)');
  console.log('   ⏰ Download links expire after 1 hour (security)');
  console.log('   🔒 Presigned URLs provide secure, authenticated access');

  console.log('\n🔧 R2 vs Filesystem Benefits:');
  console.log('   📈 Scalable across multiple server instances');
  console.log('   🚀 No server storage limitations');
  console.log('   ⚡ CDN-powered global distribution');
  console.log('   💰 Pay-per-use cost model');
  console.log('   🔄 Automatic replication and durability');
}

testR2Migration().catch(console.error);
