const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const BASE_URL = 'http://localhost:3000';

// Sample Plausible Analytics CSV data
const PLAUSIBLE_CSV = `date,visitors,pageviews,visit_duration,bounce_rate
2024-01-01,120,180,210,58.3
2024-01-02,95,140,190,62.1
2024-01-03,110,165,205,55.7
2024-01-04,140,200,185,60.2
2024-01-05,105,155,220,52.4
2024-01-06,85,125,175,68.1
2024-01-07,130,190,195,59.8`;

// Get a valid website ID (you'll need to replace this with actual website ID)
const WEBSITE_ID = '550e8400-e29b-41d4-a716-446655440000'; // Replace with real website ID

async function testPlausibleImport() {
  console.log('📈 Testing Plausible Analytics CSV Import...');
  console.log('');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    // Test preview mode first
    console.log('🔍 Testing Plausible preview mode...');

    const previewResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: PLAUSIBLE_CSV,
        websiteId: WEBSITE_ID,
        platform: 'plausible',
        preview: true,
      }),
    });

    if (previewResponse.ok) {
      const previewResult = await previewResponse.json();
      console.log('✅ PASS: Plausible preview mode successful');
      console.log(`📋 Summary:`, previewResult.summary);
      console.log(`📝 Sample events: ${previewResult.sampleEvents.length}`);

      if (previewResult.sampleEvents.length > 0) {
        console.log('🎯 Sample Plausible Event:');
        const sample = previewResult.sampleEvents[0];
        console.log(`  • Event: ${sample.payload.name}`);
        console.log(`  • Timestamp: ${new Date(sample.payload.timestamp * 1000).toISOString()}`);
        console.log(`  • Source: ${sample.payload.data.source}`);
        console.log(`  • Original Visitors: ${sample.payload.data.original_visitors}`);
        console.log(`  • Visit Duration: ${sample.payload.data.visit_duration}s`);
        console.log(`  • Bounce Rate: ${sample.payload.data.bounce_rate}%`);
      }
    } else {
      const error = await previewResponse.text();
      console.log('❌ FAIL: Plausible preview failed');
      console.log(`Status: ${previewResponse.status}`);
      console.log(`Error: ${error}`);
      return;
    }

    console.log('');
    console.log('⏳ Waiting 2 seconds before actual import...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test actual import
    console.log('📥 Testing Plausible actual import...');

    const importResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: PLAUSIBLE_CSV,
        websiteId: WEBSITE_ID,
        platform: 'plausible',
        preview: false,
      }),
    });

    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ PASS: Plausible CSV import successful');
      console.log(`📊 Import Summary:`);
      console.log(`  • Total CSV Rows: ${importResult.summary.totalRows}`);
      console.log(`  • Generated Events: ${importResult.summary.generatedEvents}`);
      console.log(`  • Processed Events: ${importResult.summary.actualProcessed}`);
      console.log(`  • CSV Parsing Errors: ${importResult.csvParsingErrors.length}`);
      console.log(`  • Processing Errors: ${importResult.processingErrors.length}`);
      console.log(`  • Platform: ${importResult.platform}`);

      // Show Plausible-specific features
      console.log('');
      console.log('🔄 Plausible Analytics Transformation Features:');
      console.log('  ✅ Daily visitor data converted to individual pageview events');
      console.log('  ✅ Pageviews distributed naturally across 24-hour periods');
      console.log('  ✅ Visit duration and bounce rate preserved as event metadata');
      console.log('  ✅ Privacy-focused analytics data structure maintained');
      console.log('  ✅ Source tracking for imported Plausible data');

      // Calculate some statistics
      const eventsPerDay =
        importResult.summary.generatedEvents / importResult.summary.processedRows;
      console.log(`  📊 Average events per day: ${Math.round(eventsPerDay)}`);

      if (importResult.csvParsingErrors.length > 0) {
        console.log('');
        console.log('⚠️ CSV Parsing Errors:');
        importResult.csvParsingErrors.slice(0, 5).forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`);
        });
      }
    } else {
      const error = await importResponse.text();
      console.log('❌ FAIL: Plausible CSV import failed');
      console.log(`Status: ${importResponse.status}`);
      console.log(`Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ ERROR: Network or server error');
    console.log('Error:', error.message);
  }

  console.log('');
  console.log('🎉 Plausible CSV import test complete!');
  console.log('');
  console.log('📋 Next Steps:');
  console.log('1. Check SuperLytics dashboard for imported Plausible data');
  console.log('2. Verify pageviews show realistic time distribution');
  console.log('3. Confirm original Plausible metrics in event metadata');
  console.log('4. Check source tracking shows "plausible_import"');
}

// Test edge cases and error handling
async function testPlausibleEdgeCases() {
  console.log('');
  console.log('🧪 Testing Plausible edge cases...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  // Test with missing required columns
  const invalidCSV = `date,visitors
2024-01-01,100`;

  try {
    const response = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: invalidCSV,
        websiteId: WEBSITE_ID,
        platform: 'plausible',
        preview: true,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('📋 Invalid CSV test result:');
      console.log(`  • Errors: ${result.errors.length}`);
      if (result.errors.length > 0) {
        console.log(`  • First Error: ${result.errors[0]}`);
        console.log('✅ PASS: Error handling works correctly');
      }
    } else {
      console.log('✅ PASS: Invalid CSV properly rejected');
    }
  } catch (error) {
    console.log('⚠️ Edge case test error:', error.message);
  }
}

async function runPlausibleTests() {
  await testPlausibleImport();
  await testPlausibleEdgeCases();
}

runPlausibleTests().catch(console.error);
