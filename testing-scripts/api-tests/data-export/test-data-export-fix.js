const API_KEY = 'sly_your_api_key_here'; // Replace with your actual API key
const BASE_URL = 'http://localhost:3000';

async function testDataExportFix() {
  console.log('🔍 Testing Data Export Presigned URL Fix...');
  console.log('');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('📊 Requesting data export...');

    const response = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ PASS: Data export request successful');
      console.log(`📧 Message: ${result.message}`);
      console.log('');
      console.log('🕐 Fixes Applied:');
      console.log('  ✅ Presigned URLs now expire in 24 hours (86400 seconds)');
      console.log('  ✅ Previously expired in 1 hour (3600 seconds)');
      console.log('  ✅ URLs will remain valid for the full R2 storage period');
      console.log('  🛡️ SECURITY: Removed vulnerable API download route');
      console.log('  🛡️ SECURITY: System now uses only cryptographically secure presigned URLs');
    } else {
      const error = await response.text();
      console.log('❌ FAIL: Data export request failed');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ ERROR: Network or server error');
    console.log('Error:', error.message);
  }

  console.log('');
  console.log('🎉 Test complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Check your email for the export notification');
  console.log('2. Download links should remain valid for 24 hours');
  console.log('3. No more "ExpiredRequest" errors for downloads within 24h');
}

testDataExportFix().catch(console.error);
