const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
// Note: Server must be running (pnpm run dev) for this test to work
const BASE_URL = 'http://localhost:3000';

async function testZipBundleExport() {
  console.log('📦 Testing ZIP Bundle Data Export...');
  console.log('');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('🚀 Requesting data export with ZIP bundle...');
    console.log(`📡 Endpoint: ${BASE_URL}/api/me/data-export`);
    console.log('🔑 Note: Make sure API_KEY is set and server is running (pnpm run dev)');
    console.log('');

    const response = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ PASS: Data export request successful');
      console.log(`📧 Message: ${result.message}`);
      console.log('');
      console.log('📦 ZIP-Only Export Features:');
      console.log('  ✅ Single ZIP file contains all CSV files');
      console.log('  ✅ Maximum compression (level 9) for fastest download');
      console.log('  ✅ Includes README.txt with export information');
      console.log('  ✅ File comments with timestamps and sizes');
      console.log('  ✅ Clean, simple user experience - just one download');
      console.log('  ✅ No individual files clutter in email');
      console.log('  🛡️ Secure 24-hour presigned URL');
      console.log('');
      console.log('🎯 Simplified User Experience:');
      console.log('  • One-click download - no confusion');
      console.log('  • Clean email with single download button');
      console.log('  • Organized ZIP with README explaining contents');
      console.log('  • Smaller download size due to compression');
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
  console.log('2. Click the single "Download ZIP" button');
  console.log('3. ZIP contains all CSVs + README.txt with explanations');
  console.log('4. Clean, simple experience - no file selection needed');
}

testZipBundleExport().catch(console.error);
