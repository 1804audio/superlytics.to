/**
 * Plausible Analytics CSV Import Compliance Test
 * Tests all 10 official Plausible table types for 100% compliance
 */

const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const BASE_URL = 'http://localhost:3000';

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY,
};

// Sample CSV data for each Plausible table type (based on official documentation)
const plausibleTestData = {
  imported_visitors: {
    filename: 'imported_visitors_20240101_20240131.csv',
    csvData: `date,visitors
2024-01-01,150
2024-01-02,175
2024-01-03,200`,
  },

  imported_pages: {
    filename: 'imported_pages_20240101_20240131.csv',
    csvData: `date,page,visitors,pageviews
2024-01-01,/home,100,150
2024-01-01,/about,50,75
2024-01-02,/home,110,165`,
  },

  imported_entry_pages: {
    filename: 'imported_entry_pages_20240101_20240131.csv',
    csvData: `date,entry_page,visitors,entrances
2024-01-01,/home,80,85
2024-01-01,/landing,40,42
2024-01-02,/home,90,95`,
  },

  imported_exit_pages: {
    filename: 'imported_exit_pages_20240101_20240131.csv',
    csvData: `date,exit_page,visitors,exits
2024-01-01,/contact,30,35
2024-01-01,/home,25,28
2024-01-02,/about,20,22`,
  },

  imported_sources: {
    filename: 'imported_sources_20240101_20240131.csv',
    csvData: `date,source,visitors
2024-01-01,Google,120
2024-01-01,Direct,80
2024-01-02,Facebook,45`,
  },

  imported_locations: {
    filename: 'imported_locations_20240101_20240131.csv',
    csvData: `date,country,visitors
2024-01-01,US,100
2024-01-01,UK,30
2024-01-02,CA,25`,
  },

  imported_devices: {
    filename: 'imported_devices_20240101_20240131.csv',
    csvData: `date,device,visitors
2024-01-01,Desktop,120
2024-01-01,Mobile,80
2024-01-02,Tablet,15`,
  },

  imported_browsers: {
    filename: 'imported_browsers_20240101_20240131.csv',
    csvData: `date,browser,visitors
2024-01-01,Chrome,100
2024-01-01,Safari,40
2024-01-02,Firefox,25`,
  },

  imported_operating_systems: {
    filename: 'imported_operating_systems_20240101_20240131.csv',
    csvData: `date,operating_system,visitors
2024-01-01,Windows,80
2024-01-01,macOS,45
2024-01-02,Linux,15`,
  },

  imported_custom_events: {
    filename: 'imported_custom_events_20240101_20240131.csv',
    csvData: `date,name,visitors
2024-01-01,signup,25
2024-01-01,purchase,12
2024-01-02,download,35`,
  },
};

async function testPlausibleTableType(tableType, testData) {
  console.log(`\n🔍 Testing Plausible table type: ${tableType}`);

  try {
    // Test preview mode first
    const previewResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: testData.csvData,
        websiteId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479', // Sample UUID
        platform: 'plausible',
        preview: true,
        filename: testData.filename,
      }),
    });

    if (!previewResponse.ok) {
      const error = await previewResponse.text();
      console.log(`❌ FAIL: ${tableType} preview - ${previewResponse.status}: ${error}`);
      return false;
    }

    const previewResult = await previewResponse.json();
    console.log(
      `✅ PASS: ${tableType} preview - Generated ${previewResult.summary.generatedEvents} events from ${previewResult.summary.totalRows} rows`,
    );

    // Validate that the correct number of events were generated
    if (previewResult.summary.generatedEvents === 0) {
      console.log(`⚠️  WARNING: ${tableType} - No events generated!`);
      return false;
    }

    // Test that table type was correctly detected
    if (previewResult.sampleEvents && previewResult.sampleEvents.length > 0) {
      const sampleEvent = previewResult.sampleEvents[0];
      const detectedTableType = sampleEvent.data?.table_type;
      if (detectedTableType === tableType) {
        console.log(`✅ PASS: ${tableType} - Table type correctly detected`);
      } else {
        console.log(
          `❌ FAIL: ${tableType} - Expected table type ${tableType}, got ${detectedTableType}`,
        );
        return false;
      }
    }

    // Test specific data mapping based on table type
    if (previewResult.sampleEvents && previewResult.sampleEvents.length > 0) {
      const sampleEvent = previewResult.sampleEvents[0];
      let isValidMapping = true;

      switch (tableType) {
        case 'imported_pages':
          if (!sampleEvent.url || sampleEvent.url === '/') {
            console.log(`❌ FAIL: ${tableType} - Page URL not correctly mapped`);
            isValidMapping = false;
          }
          break;
        case 'imported_sources':
          if (!sampleEvent.data?.referrer_source) {
            console.log(`❌ FAIL: ${tableType} - Source not correctly mapped`);
            isValidMapping = false;
          }
          break;
        case 'imported_locations':
          if (!sampleEvent.data?.country) {
            console.log(`❌ FAIL: ${tableType} - Country not correctly mapped`);
            isValidMapping = false;
          }
          break;
        case 'imported_custom_events':
          if (sampleEvent.name === 'pageview') {
            console.log(`❌ FAIL: ${tableType} - Custom event name not correctly mapped`);
            isValidMapping = false;
          }
          break;
      }

      if (isValidMapping) {
        console.log(`✅ PASS: ${tableType} - Data mapping validation successful`);
      }
    }

    return true;
  } catch (error) {
    console.log(`❌ ERROR: ${tableType} - ${error.message}`);
    return false;
  }
}

async function testColumnHeaderDetection() {
  console.log('\n🔍 Testing column header detection (without filename)');

  try {
    // Test with pages data but no filename - should detect from headers
    const response = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        csvData: plausibleTestData.imported_pages.csvData,
        websiteId: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
        platform: 'plausible',
        preview: true,
        // No filename provided
      }),
    });

    if (!response.ok) {
      console.log(`❌ FAIL: Column header detection - ${response.status}`);
      return false;
    }

    const result = await response.json();

    if (result.sampleEvents && result.sampleEvents.length > 0) {
      const detectedTableType = result.sampleEvents[0].data?.table_type;
      if (detectedTableType === 'imported_pages') {
        console.log(`✅ PASS: Column header detection - Correctly detected imported_pages`);
        return true;
      } else {
        console.log(
          `❌ FAIL: Column header detection - Expected imported_pages, got ${detectedTableType}`,
        );
        return false;
      }
    }

    return false;
  } catch (error) {
    console.log(`❌ ERROR: Column header detection - ${error.message}`);
    return false;
  }
}

async function testPlausibleCompliance() {
  console.log('🚀 Starting Plausible Analytics CSV Import Compliance Test');
  console.log('Testing all 10 official Plausible table types for 100% compliance\n');

  let passedTests = 0;
  let totalTests = 0;

  // Test each table type
  for (const [tableType, testData] of Object.entries(plausibleTestData)) {
    totalTests++;
    const passed = await testPlausibleTableType(tableType, testData);
    if (passed) passedTests++;
  }

  // Test column header detection
  totalTests++;
  const headerDetectionPassed = await testColumnHeaderDetection();
  if (headerDetectionPassed) passedTests++;

  // Test platform information endpoint
  console.log('\n🔍 Testing platform information endpoint');
  totalTests++;
  try {
    const platformResponse = await fetch(`${BASE_URL}/api/batch/csv`, {
      method: 'GET',
      headers,
    });

    if (platformResponse.ok) {
      const platformData = await platformResponse.json();
      const plausiblePlatform = platformData.platforms.find(p => p.id === 'plausible');

      if (plausiblePlatform && plausiblePlatform.description.includes('10 official table types')) {
        console.log('✅ PASS: Platform information includes Plausible compliance details');
        passedTests++;
      } else {
        console.log('❌ FAIL: Platform information missing Plausible compliance details');
      }
    } else {
      console.log('❌ FAIL: Platform information endpoint failed');
    }
  } catch (error) {
    console.log(`❌ ERROR: Platform information test - ${error.message}`);
  }

  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${totalTests - passedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Plausible CSV import is 100% compliant!');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED! Review the implementation for full compliance.');
  }

  console.log('\n✨ Plausible Compliance Test Complete!');
}

// Run the compliance test
testPlausibleCompliance().catch(console.error);
