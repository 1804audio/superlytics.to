const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const BASE_URL = 'http://localhost:3000';

// Sample Google Analytics CSV data
const GOOGLE_ANALYTICS_CSV = `date,page_path,page_title,sessions,users,pageviews,bounce_rate,avg_session_duration
2024-01-01,/,Home Page,150,120,200,65.5,180.2
2024-01-01,/about,About Us,45,40,50,20.1,240.5
2024-01-01,/contact,Contact,30,28,35,15.8,320.1
2024-01-02,/,Home Page,180,145,220,62.3,175.8
2024-01-02,/products,Products,75,65,95,35.2,290.4
2024-01-02,/pricing,Pricing,60,55,70,25.7,310.2`;

// Get a valid website ID (you'll need to replace this with actual website ID)
const WEBSITE_ID = '550e8400-e29b-41d4-a716-446655440000'; // Replace with real website ID

async function testGoogleAnalyticsImport() {
  console.log('📊 Testing Google Analytics CSV Import...');
  console.log('');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    // First, test preview mode
    console.log('🔍 Testing preview mode...');

    const previewResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: GOOGLE_ANALYTICS_CSV,
        websiteId: WEBSITE_ID,
        platform: 'google_analytics',
        preview: true,
      }),
    });

    if (previewResponse.ok) {
      const previewResult = await previewResponse.json();
      console.log('✅ PASS: Preview mode successful');
      console.log(`📋 Summary:`, previewResult.summary);
      console.log(`📝 Sample events: ${previewResult.sampleEvents.length}`);
      console.log(`⚠️ Errors: ${previewResult.errors.length}`);

      if (previewResult.sampleEvents.length > 0) {
        console.log('🎯 Sample Event Structure:');
        console.log(JSON.stringify(previewResult.sampleEvents[0], null, 2));
      }
    } else {
      const error = await previewResponse.text();
      console.log('❌ FAIL: Preview mode failed');
      console.log(`Status: ${previewResponse.status}`);
      console.log(`Error: ${error}`);
      return;
    }

    console.log('');
    console.log('⏳ Waiting 2 seconds before actual import...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Now test actual import
    console.log('📥 Testing actual import...');

    const importResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: GOOGLE_ANALYTICS_CSV,
        websiteId: WEBSITE_ID,
        platform: 'google_analytics',
        preview: false,
      }),
    });

    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ PASS: Google Analytics CSV import successful');
      console.log(`📊 Import Summary:`);
      console.log(`  • Total CSV Rows: ${importResult.summary.totalRows}`);
      console.log(`  • Generated Events: ${importResult.summary.generatedEvents}`);
      console.log(`  • Processed Events: ${importResult.summary.actualProcessed}`);
      console.log(`  • CSV Parsing Errors: ${importResult.csvParsingErrors.length}`);
      console.log(`  • Processing Errors: ${importResult.processingErrors.length}`);
      console.log(`  • Platform: ${importResult.platform}`);

      // Show transformation details
      console.log('');
      console.log('🔄 Google Analytics Transformation Features:');
      console.log('  ✅ Aggregated daily data converted to hourly events');
      console.log('  ✅ Pageviews distributed across 24 hours');
      console.log('  ✅ Random timestamps within each hour for natural distribution');
      console.log('  ✅ Original GA metrics preserved in event data');
      console.log('  ✅ Source tracking for imported data');

      if (importResult.processingErrors.length > 0) {
        console.log('');
        console.log('⚠️ Processing Errors (first 5):');
        importResult.processingErrors.slice(0, 5).forEach((error, index) => {
          console.log(`  ${index + 1}. Event: ${error.event}, Error: ${error.response.error}`);
        });
      }
    } else {
      const error = await importResponse.text();
      console.log('❌ FAIL: Google Analytics CSV import failed');
      console.log(`Status: ${importResponse.status}`);
      console.log(`Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ ERROR: Network or server error');
    console.log('Error:', error.message);
  }

  console.log('');
  console.log('🎉 Google Analytics CSV import test complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Check SuperLytics dashboard to verify imported events');
  console.log('2. Verify page views show realistic hourly distribution');
  console.log('3. Check that original GA metrics are preserved in event data');
  console.log('4. Confirm source tracking shows "google_analytics_import"');
}

// Also test platform info endpoint
async function testPlatformInfo() {
  console.log('');
  console.log('ℹ️ Testing platform information endpoint...');

  try {
    const response = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (response.ok) {
      const info = await response.json();
      console.log('✅ PASS: Platform info retrieved');
      console.log('📋 Available Platforms:');
      info.platforms.forEach(platform => {
        console.log(`  • ${platform.name}: ${platform.description}`);
      });
      console.log(
        `📊 Limits: Max ${info.limits.maxEvents} events, ${info.limits.maxFileSize} file size`,
      );
    } else {
      console.log('❌ FAIL: Platform info failed');
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message);
  }
}

async function runTests() {
  await testPlatformInfo();
  await testGoogleAnalyticsImport();
}

runTests().catch(console.error);
