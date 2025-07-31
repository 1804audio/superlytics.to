const API_KEY = 'sly_your_api_key_here';
const BASE_URL = 'http://localhost:3000';

async function testDataExportFix() {
  console.log('🔧 Testing Data Export Fix...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('\n1. Testing data export request...');

    const exportResponse = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (exportResponse.ok) {
      const result = await exportResponse.json();
      console.log('✅ PASS: Export request successful');
      console.log('📊 Response:', result);

      console.log('\n2. Waiting for background processing...');
      console.log('⏳ Background export should start within 1 second');
      console.log('📧 Email should be sent within 2-5 minutes');

      // Give some time for background processing to start
      await new Promise(resolve => setTimeout(resolve, 3000));

      console.log('\n✅ Export initiated successfully');
      console.log('🔍 Check server logs for:');
      console.log('   - "Starting background data export for user..."');
      console.log('   - "Data export completed successfully for user..."');
      console.log('   - Or "Data export failed for user..." with error details');
    } else {
      const error = await exportResponse.text();
      console.log('❌ FAIL: Export request failed');
      console.log('🔍 Status:', exportResponse.status);
      console.log('🔍 Error:', error);

      if (exportResponse.status === 403) {
        console.log('\n🔐 Note: This might be a plan limitation issue');
        console.log('   Check if your user has the dataExport feature enabled');
      }
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n🎯 Key Fixes Applied:');
  console.log('   ✅ Fixed Prisma import (was causing "Cannot read properties of undefined")');
  console.log('   ✅ Using correct prismaHelpers for rawQuery and parseFilters');
  console.log('   ✅ Proper error handling in background process');
  console.log('   ✅ Email service integration with failure notifications');

  console.log('\n📧 Expected Email Behavior:');
  console.log('   🎉 SUCCESS: Email with download links and file table');
  console.log('   ❌ FAILURE: Email with error details and retry button');
  console.log('   📱 Both emails are mobile-responsive with SuperLytics branding');
}

testDataExportFix().catch(console.error);
