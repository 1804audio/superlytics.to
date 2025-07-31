const { API_KEY, BASE_URL } = require('../config.js');

async function testWebsiteManagement() {
  console.log('🔍 Testing Website Management & Cleanup APIs');
  console.log('===========================================');
  console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  let testWebsiteId = null;

  // Test 1: List existing websites
  console.log('\n📋 Testing website listing...');
  const listResponse = await fetch(`${BASE_URL}/api/websites`, {
    method: 'GET',
    headers,
  });

  console.log('List websites:', listResponse.ok ? '✅ Success' : '❌ Failed');
  if (listResponse.ok) {
    const websites = await listResponse.json();
    console.log(`Found ${websites.length} existing websites`);
    if (websites.length > 0) {
      console.log('Sample website:', {
        id: websites[0].id,
        name: websites[0].name,
        domain: websites[0].domain,
      });
    }
  } else {
    console.log('Error:', await listResponse.text());
  }

  // Test 2: Create a test website
  console.log('\n🏗️ Testing website creation...');
  const createResponse = await fetch(`${BASE_URL}/api/websites`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'API Test Website - Cleanup Test',
      domain: 'api-cleanup-test.example.com',
      shareId: null,
    }),
  });

  console.log('Create website:', createResponse.ok ? '✅ Success' : '❌ Failed');
  if (createResponse.ok) {
    const newWebsite = await createResponse.json();
    testWebsiteId = newWebsite.id;
    console.log('Created website:', { id: newWebsite.id, name: newWebsite.name });
  } else {
    const error = await createResponse.text();
    console.log('Error:', error);

    // If creation failed due to limits, that's actually expected behavior
    if (error.includes('WEBSITE_LIMIT_EXCEEDED')) {
      console.log('✅ Website limit protection working correctly');
    }
    return; // Can't continue without a website
  }

  // Test 3: Add some test data to the website
  console.log('\n📊 Adding test tracking data...');
  const trackingData = [
    {
      type: 'event',
      payload: {
        website: testWebsiteId,
        url: 'https://api-cleanup-test.example.com/',
        title: 'Home Page',
        hostname: 'api-cleanup-test.example.com',
        timestamp: Math.floor(Date.now() / 1000) - 100,
      },
    },
    {
      type: 'event',
      payload: {
        website: testWebsiteId,
        url: 'https://api-cleanup-test.example.com/products',
        title: 'Products Page',
        hostname: 'api-cleanup-test.example.com',
        timestamp: Math.floor(Date.now() / 1000) - 50,
      },
    },
    {
      type: 'event',
      payload: {
        website: testWebsiteId,
        name: 'test_cleanup_event',
        tag: 'cleanup_test',
        data: { test: 'cleanup' },
        hostname: 'api-cleanup-test.example.com',
        timestamp: Math.floor(Date.now() / 1000),
      },
    },
  ];

  for (let i = 0; i < trackingData.length; i++) {
    const trackResponse = await fetch(`${BASE_URL}/api/send`, {
      method: 'POST',
      headers,
      body: JSON.stringify(trackingData[i]),
    });

    if (trackResponse.ok) {
      console.log(`✅ Test data ${i + 1}/3 added`);
    } else {
      console.log(`❌ Failed to add test data ${i + 1}/3`);
    }
  }

  // Test 4: Verify data exists by checking website stats
  console.log('\n📈 Verifying test data exists...');
  const endAt = Date.now();
  const startAt = endAt - 24 * 60 * 60 * 1000; // 24 hours ago
  const statsParams = new URLSearchParams({
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    timezone: 'America/New_York',
  });

  const statsResponse = await fetch(
    `${BASE_URL}/api/websites/${testWebsiteId}/stats?${statsParams}`,
    {
      method: 'GET',
      headers,
    },
  );

  if (statsResponse.ok) {
    const stats = await statsResponse.json();
    console.log('✅ Website stats:', {
      pageviews: stats.pageviews?.value || 0,
      visitors: stats.visitors?.value || 0,
    });
  } else {
    console.log('❌ Failed to get website stats');
  }

  // Test 5: Test data cleanup by URL
  console.log('\n🧹 Testing data cleanup by URL...');
  const cleanupResponse = await fetch(`${BASE_URL}/api/websites/${testWebsiteId}/cleanup`, {
    method: 'DELETE',
    headers,
    body: JSON.stringify({
      urlPath: '/products',
      deleteType: 'exact',
    }),
  });

  console.log('Data cleanup by URL:', cleanupResponse.ok ? '✅ Success' : '❌ Failed');
  if (!cleanupResponse.ok) {
    console.log('Cleanup error:', await cleanupResponse.text());
  } else {
    const cleanupResult = await cleanupResponse.json();
    console.log('Cleanup result:', cleanupResult);
  }

  // Test 6: Get website details
  console.log('\n🔍 Testing website details retrieval...');
  const detailsResponse = await fetch(`${BASE_URL}/api/websites/${testWebsiteId}`, {
    method: 'GET',
    headers,
  });

  console.log('Get website details:', detailsResponse.ok ? '✅ Success' : '❌ Failed');
  if (detailsResponse.ok) {
    const details = await detailsResponse.json();
    console.log('Website details:', { id: details.id, name: details.name, domain: details.domain });
  } else {
    console.log('Error:', await detailsResponse.text());
  }

  // Test 7: Update website
  console.log('\n✏️ Testing website update...');
  const updateResponse = await fetch(`${BASE_URL}/api/websites/${testWebsiteId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'API Test Website - Updated',
      domain: 'api-cleanup-test-updated.example.com',
      shareId: null,
    }),
  });

  console.log('Update website:', updateResponse.ok ? '✅ Success' : '❌ Failed');
  if (!updateResponse.ok) {
    console.log('Update error:', await updateResponse.text());
  }

  // Test 8: Delete the entire website (CRITICAL TEST)
  console.log('\n🗑️ Testing complete website deletion...');
  const deleteResponse = await fetch(`${BASE_URL}/api/websites/${testWebsiteId}`, {
    method: 'DELETE',
    headers,
  });

  console.log('Delete website:', deleteResponse.ok ? '✅ Success' : '❌ Failed');
  if (!deleteResponse.ok) {
    console.log('Delete error:', await deleteResponse.text());
  }

  // Test 9: Verify website is gone
  console.log('\n✅ Verifying website deletion...');
  const verifyResponse = await fetch(`${BASE_URL}/api/websites/${testWebsiteId}`, {
    method: 'GET',
    headers,
  });

  if (verifyResponse.ok) {
    console.log('❌ WARNING: Website still exists after deletion!');
  } else if (verifyResponse.status === 404 || verifyResponse.status === 401) {
    console.log('✅ Website successfully deleted (no longer accessible)');
  } else {
    console.log(`❓ Unexpected response: ${verifyResponse.status}`);
  }

  // Test 10: Verify data is cleaned up
  console.log('\n🔍 Verifying data cleanup after website deletion...');
  const dataVerifyResponse = await fetch(
    `${BASE_URL}/api/websites/${testWebsiteId}/stats?${statsParams}`,
    {
      method: 'GET',
      headers,
    },
  );

  if (dataVerifyResponse.ok) {
    console.log('❌ WARNING: Website data still accessible after website deletion!');
  } else if (dataVerifyResponse.status === 404 || dataVerifyResponse.status === 401) {
    console.log('✅ Website data successfully cleaned up');
  } else {
    console.log(`❓ Unexpected data cleanup response: ${dataVerifyResponse.status}`);
  }

  console.log('\n🎉 Website Management & Cleanup Test Complete!');
}

testWebsiteManagement().catch(console.error);
