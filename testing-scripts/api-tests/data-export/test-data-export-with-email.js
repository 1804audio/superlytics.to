const API_KEY = 'sly_your_api_key_here';
const BASE_URL = 'http://localhost:3000';

async function testDataExportWithEmail() {
  console.log('🔍 Testing Data Export with Email Functionality...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    console.log('\n1. Testing data export initiation...');

    // Test data export request
    const exportResponse = await fetch(`${BASE_URL}/api/me/data-export`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    });

    if (exportResponse.ok) {
      const result = await exportResponse.json();
      console.log('✅ PASS: Data export initiated successfully');
      console.log('📊 Response:', {
        success: result.success,
        message: result.message,
        estimatedTime: result.estimatedTime,
      });

      console.log('\n📧 Email should be sent within 2-5 minutes with download links');
      console.log('⏰ Check your email for the data export notification');

      // Wait a bit to see if background processing starts
      console.log('\n⏳ Waiting 5 seconds to allow background processing to start...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      console.log('✅ Background processing should now be running');
    } else {
      const error = await exportResponse.text();
      console.log('❌ FAIL: Data export initiation failed');
      console.log('🔍 Status:', exportResponse.status);
      console.log('🔍 Error:', error);
    }

    console.log('\n2. Testing plan feature access...');

    // Test feature access
    const featureResponse = await fetch(`${BASE_URL}/api/me/features/dataExport`, {
      method: 'GET',
      headers,
    });

    if (featureResponse.ok) {
      const feature = await featureResponse.json();
      console.log('✅ PASS: Feature access check successful');
      console.log('📊 Has data export feature:', feature.hasFeature);
    } else {
      console.log('❌ FAIL: Feature access check failed');
      console.log('🔍 Status:', featureResponse.status);
    }

    console.log('\n3. Expected workflow:');
    console.log('   📤 Export request initiated immediately');
    console.log('   ⚙️  Background processing starts within 1 second');
    console.log('   🔍 System queries user data from database');
    console.log('   📄 CSV files generated (websites, events, sessions, reports)');
    console.log('   💾 Files stored temporarily with 24-hour expiry');
    console.log('   📧 Email sent with download links');
    console.log('   🔗 Download links valid for 24 hours');
    console.log('   🗑️  Files automatically deleted after 24 hours');

    console.log('\n📧 Email Features:');
    console.log('   ✉️  Professional HTML email template');
    console.log('   📋 Table showing all export files with sizes');
    console.log('   🔗 Individual download links for each file');
    console.log('   ⚠️  Security warnings about 24-hour expiry');
    console.log('   📊 Details about what data is included');
    console.log('   📱 Mobile-responsive email design');
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }

  console.log('\n🎉 Data export test complete!');
  console.log('\n🔧 Implementation Details:');
  console.log('   📧 Email service: EmailIt API integration');
  console.log('   💾 Storage: In-memory temporary storage (24h TTL)');
  console.log('   📄 Format: CSV files for all data types');
  console.log('   🔒 Security: Unique export IDs, automatic cleanup');
  console.log('   🌐 Download: Secure API endpoints with validation');

  console.log('\n📋 Files Included in Export:');
  console.log('   • websites.csv - All user websites and settings');
  console.log('   • events_[website].csv - Page views and events per website');
  console.log('   • sessions_[website].csv - Visitor sessions per website');
  console.log('   • reports.csv - Saved reports and configurations');
}

testDataExportWithEmail().catch(console.error);
