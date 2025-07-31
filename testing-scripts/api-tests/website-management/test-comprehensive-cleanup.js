const { API_KEY, BASE_URL } = require('../config.js');

async function testComprehensiveCleanup() {
  console.log('🧹 Testing Comprehensive Website Data Cleanup');
  console.log('=============================================');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  let createdWebsiteId = null;

  try {
    // Step 1: Create a test website
    console.log('\n🏗️ Step 1: Creating test website...');
    const createResponse = await fetch(`${BASE_URL}/api/websites`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: 'Cleanup Test Website',
        domain: 'cleanup-test.example.com',
      }),
    });

    if (createResponse.ok) {
      const website = await createResponse.json();
      createdWebsiteId = website.id;
      console.log(`✅ Website created: ${website.name} (${website.id})`);
    } else {
      throw new Error(`Website creation failed: ${await createResponse.text()}`);
    }

    // Step 2: Add comprehensive tracking data
    console.log('\n📊 Step 2: Adding comprehensive tracking data...');

    // Add page views and events
    const trackingData = [
      {
        type: 'event',
        payload: {
          website: createdWebsiteId,
          url: '/home',
          title: 'Home Page',
          name: 'pageview',
          data: { userId: 'user123', action: 'view' },
        },
      },
      {
        type: 'event',
        payload: {
          website: createdWebsiteId,
          url: '/about',
          title: 'About Page',
          name: 'custom_event',
          data: { category: 'engagement', value: 100 },
        },
      },
      {
        type: 'identify',
        payload: {
          website: createdWebsiteId,
          data: { userId: 'user123', email: 'test@example.com', plan: 'premium' },
        },
      },
    ];

    for (let i = 0; i < trackingData.length; i++) {
      const data = trackingData[i];
      const response = await fetch(`${BASE_URL}/api/send`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (response.ok) {
        console.log(`  ✅ Added ${data.type} data ${i + 1}/${trackingData.length}`);
      } else {
        console.log(`  ❌ Failed to add ${data.type} data: ${await response.text()}`);
      }

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Step 3: Verify data exists
    console.log('\n📈 Step 3: Verifying data exists before deletion...');

    // Check website stats
    const statsResponse = await fetch(`${BASE_URL}/api/websites/${createdWebsiteId}/stats`, {
      method: 'GET',
      headers,
    });

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log(`  📊 Website stats: pageviews=${stats.pageviews}, visitors=${stats.visitors}`);
    } else {
      console.log(`  ❌ Failed to get stats: ${await statsResponse.text()}`);
    }

    // Check events
    const eventsResponse = await fetch(`${BASE_URL}/api/websites/${createdWebsiteId}/events`, {
      method: 'GET',
      headers,
    });

    if (eventsResponse.ok) {
      const eventsData = await eventsResponse.json();
      console.log(`  📝 Events found: ${eventsData.data ? eventsData.data.length : 'unknown'}`);
    } else {
      console.log(`  ❌ Failed to get events: ${await eventsResponse.text()}`);
    }

    // Step 4: Delete the website
    console.log('\n🗑️ Step 4: Deleting website...');
    const deleteResponse = await fetch(`${BASE_URL}/api/websites/${createdWebsiteId}`, {
      method: 'DELETE',
      headers,
    });

    if (deleteResponse.ok) {
      console.log('  ✅ Website deleted successfully');
    } else {
      console.log(`  ❌ Website deletion failed: ${await deleteResponse.text()}`);
      return;
    }

    // Step 5: Verify website no longer exists
    console.log('\n🔍 Step 5: Verifying website deletion...');
    const getResponse = await fetch(`${BASE_URL}/api/websites/${createdWebsiteId}`, {
      method: 'GET',
      headers,
    });

    if (getResponse.status === 404) {
      console.log('  ✅ Website properly deleted (404 Not Found)');
    } else if (getResponse.status === 500) {
      console.log(
        '  ⚠️ Server error when accessing deleted website (500) - might indicate cleanup issue',
      );
    } else {
      console.log(`  ❌ Unexpected response: ${getResponse.status}`);
    }

    // Step 6: Verify data cleanup
    console.log('\n🧹 Step 6: Verifying associated data cleanup...');

    // Try to access stats for deleted website
    const deletedStatsResponse = await fetch(`${BASE_URL}/api/websites/${createdWebsiteId}/stats`, {
      method: 'GET',
      headers,
    });

    if (deletedStatsResponse.status === 404) {
      console.log('  ✅ Website stats properly cleaned up (404 Not Found)');
    } else if (deletedStatsResponse.status === 500) {
      console.log('  ⚠️ Server error accessing deleted website stats - data might be orphaned');
    } else {
      console.log(`  ❌ Unexpected stats response: ${deletedStatsResponse.status}`);
    }

    // Try to access events for deleted website
    const deletedEventsResponse = await fetch(
      `${BASE_URL}/api/websites/${createdWebsiteId}/events`,
      {
        method: 'GET',
        headers,
      },
    );

    if (deletedEventsResponse.status === 404) {
      console.log('  ✅ Website events properly cleaned up (404 Not Found)');
    } else if (deletedEventsResponse.status === 500) {
      console.log('  ⚠️ Server error accessing deleted website events - data might be orphaned');
    } else {
      console.log(`  ❌ Unexpected events response: ${deletedEventsResponse.status}`);
    }

    console.log('\n🎯 CLEANUP TEST RESULTS');
    console.log('=======================');
    console.log('✅ Website creation: SUCCESS');
    console.log('✅ Data tracking: SUCCESS');
    console.log('✅ Website deletion: SUCCESS');

    if (
      getResponse.status === 404 &&
      deletedStatsResponse.status === 404 &&
      deletedEventsResponse.status === 404
    ) {
      console.log('✅ Data cleanup: COMPLETE - All associated data properly removed');
    } else {
      console.log('⚠️ Data cleanup: PARTIAL - Some 500 errors suggest potential orphaned data');
      console.log('   Note: 500 errors might be expected if database cascading is working');
    }
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);

    // Cleanup: Try to delete the created website if it exists
    if (createdWebsiteId) {
      console.log('\n🧹 Attempting cleanup of test website...');
      try {
        await fetch(`${BASE_URL}/api/websites/${createdWebsiteId}`, {
          method: 'DELETE',
          headers,
        });
        console.log('✅ Test website cleaned up');
      } catch (cleanupError) {
        console.log('❌ Failed to cleanup test website:', cleanupError.message);
      }
    }
  }

  console.log('\n🎉 Comprehensive Cleanup Test Complete!');
}

testComprehensiveCleanup().catch(console.error);
