const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testV1APIs() {
  console.log('🔍 Testing V1 API endpoints with API key...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  // Test 1: List websites
  console.log('\n🌐 Testing V1 websites list...');
  const websitesResponse = await fetch(`${BASE_URL}/api/v1/websites`, {
    method: 'GET',
    headers,
  });

  console.log('V1 websites list:', websitesResponse.ok ? '✅ Success' : '❌ Failed');
  if (!websitesResponse.ok) {
    console.log('Error:', await websitesResponse.text());
  } else {
    const websitesData = await websitesResponse.json();
    console.log('Websites found:', websitesData.length || 0);
  }

  // Test 2: Website stats
  console.log('\n📊 Testing V1 website stats...');
  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  const statsParams = new URLSearchParams({
    startAt: startAt.toString(),
    endAt: endAt.toString(),
  });

  const statsResponse = await fetch(
    `${BASE_URL}/api/v1/websites/${WEBSITE_ID}/stats?${statsParams}`,
    {
      method: 'GET',
      headers,
    },
  );

  console.log('V1 website stats:', statsResponse.ok ? '✅ Success' : '❌ Failed');
  if (!statsResponse.ok) {
    console.log('Error:', await statsResponse.text());
  } else {
    const statsData = await statsResponse.json();
    console.log('Stats data:', { pageviews: statsData.pageviews, visitors: statsData.visitors });
  }

  console.log('\n🎉 V1 API testing complete!');
}

testV1APIs().catch(console.error);
