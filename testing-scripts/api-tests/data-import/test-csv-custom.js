const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const BASE_URL = 'http://localhost:3000';

// Sample custom CSV data with different formats
const CUSTOM_CSV = `timestamp,url,title,event_name,user_id,custom_field
2024-01-01T10:30:00Z,/home,Home Page,pageview,user123,value1
2024-01-01T10:31:15Z,/about,About Us,pageview,user124,value2
2024-01-01T10:32:30Z,/contact,Contact,form_submit,user123,form_contact
2024-01-01T10:33:45Z,/products,Products,pageview,user125,value3
2024-01-01T10:35:00Z,/checkout,Checkout,purchase,user123,order_456`;

// Test custom column mapping
const MAPPED_CSV = `date_time,page_url,page_name,action_type,session_id
2024-01-01 10:30:00,/dashboard,Dashboard,view,sess_001
2024-01-01 10:31:00,/profile,User Profile,view,sess_001
2024-01-01 10:32:00,/settings,Settings,click,sess_001`;

const WEBSITE_ID = '550e8400-e29b-41d4-a716-446655440000'; // Replace with real website ID

async function testCustomCsvImport() {
  console.log('🔧 Testing Custom CSV Import...');
  console.log('');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    // Test standard custom format
    console.log('🔍 Testing standard custom CSV format...');

    const response1 = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: CUSTOM_CSV,
        websiteId: WEBSITE_ID,
        platform: 'custom',
        preview: true,
      }),
    });

    if (response1.ok) {
      const result1 = await response1.json();
      console.log('✅ PASS: Standard custom CSV preview successful');
      console.log(
        `📋 Summary: ${result1.summary.generatedEvents} events from ${result1.summary.totalRows} rows`,
      );

      if (result1.sampleEvents.length > 0) {
        console.log('🎯 Sample Custom Event:');
        const sample = result1.sampleEvents[0];
        console.log(`  • Event: ${sample.payload.name}`);
        console.log(`  • URL: ${sample.payload.url}`);
        console.log(`  • Title: ${sample.payload.title}`);
        console.log(`  • Timestamp: ${new Date(sample.payload.timestamp * 1000).toISOString()}`);
        console.log(`  • Custom Data:`, sample.payload.data);
      }
    } else {
      console.log('❌ FAIL: Standard custom CSV failed');
      console.log(await response1.text());
      return;
    }

    console.log('');
    console.log('🔀 Testing custom column mapping...');

    // Test with custom column mapping
    const columnMapping = {
      date_time: 'timestamp',
      page_url: 'url',
      page_name: 'title',
      action_type: 'event_name',
    };

    const response2 = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: MAPPED_CSV,
        websiteId: WEBSITE_ID,
        platform: 'custom',
        columnMapping: columnMapping,
        preview: true,
      }),
    });

    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ PASS: Custom column mapping successful');
      console.log(
        `📋 Mapped Summary: ${result2.summary.generatedEvents} events from ${result2.summary.totalRows} rows`,
      );

      if (result2.sampleEvents.length > 0) {
        console.log('🎯 Sample Mapped Event:');
        const sample = result2.sampleEvents[0];
        console.log(`  • Event: ${sample.payload.name}`);
        console.log(`  • URL: ${sample.payload.url}`);
        console.log(`  • Title: ${sample.payload.title}`);
        console.log(`  • Unmapped Data:`, sample.payload.data);
      }
    } else {
      console.log('❌ FAIL: Custom column mapping failed');
      console.log(await response2.text());
    }

    console.log('');
    console.log('⏳ Testing actual custom import...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test actual import
    const importResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: CUSTOM_CSV,
        websiteId: WEBSITE_ID,
        platform: 'custom',
        preview: false,
      }),
    });

    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log('✅ PASS: Custom CSV import successful');
      console.log(`📊 Import Summary:`);
      console.log(`  • Total CSV Rows: ${importResult.summary.totalRows}`);
      console.log(`  • Generated Events: ${importResult.summary.generatedEvents}`);
      console.log(`  • Processed Events: ${importResult.summary.actualProcessed}`);
      console.log(`  • Errors: ${importResult.summary.actualErrors}`);

      console.log('');
      console.log('🔧 Custom CSV Features:');
      console.log('  ✅ Flexible column mapping support');
      console.log('  ✅ Custom event types preservation');
      console.log('  ✅ Additional metadata fields included');
      console.log('  ✅ Timestamp parsing with multiple formats');
      console.log('  ✅ Source tracking for custom imports');
    } else {
      const error = await importResponse.text();
      console.log('❌ FAIL: Custom CSV import failed');
      console.log(`Error: ${error}`);
    }
  } catch (error) {
    console.log('❌ ERROR: Network or server error');
    console.log('Error:', error.message);
  }

  console.log('');
  console.log('🎉 Custom CSV import test complete!');
}

// Test various timestamp formats
async function testTimestampFormats() {
  console.log('');
  console.log('⏰ Testing various timestamp formats...');

  const timestampTestCSV = `timestamp,url,title,event_name
2024-01-01T10:30:00Z,/test1,Test 1,pageview
2024-01-01 10:30:00,/test2,Test 2,pageview
01/01/2024 10:30:00,/test3,Test 3,pageview
1704106200,/test4,Test 4,pageview`;

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  try {
    const response = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: timestampTestCSV,
        websiteId: WEBSITE_ID,
        platform: 'custom',
        preview: true,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ PASS: Timestamp format handling successful');
      console.log(`  • Events generated: ${result.summary.generatedEvents}`);
      console.log(`  • Parsing errors: ${result.errors.length}`);

      if (result.sampleEvents.length > 0) {
        console.log('⏰ Sample timestamps:');
        result.sampleEvents.forEach((event, index) => {
          const date = new Date(event.payload.timestamp * 1000);
          console.log(`  ${index + 1}. ${date.toISOString()} (${event.payload.url})`);
        });
      }
    } else {
      console.log('⚠️ Timestamp test had issues');
    }
  } catch (error) {
    console.log('⚠️ Timestamp test error:', error.message);
  }
}

async function runCustomTests() {
  await testCustomCsvImport();
  await testTimestampFormats();
}

runCustomTests().catch(console.error);
