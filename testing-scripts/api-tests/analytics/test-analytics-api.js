const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testAnalyticsAPIs() {
  console.log('🔍 Testing analytics API endpoints with API key...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  // Common query parameters for date range (last 30 days)
  const endAt = Date.now();
  const startAt = endAt - 30 * 24 * 60 * 60 * 1000; // 30 days ago
  const commonParams = new URLSearchParams({
    startAt: startAt.toString(),
    endAt: endAt.toString(),
    timezone: 'America/New_York',
  });

  // Test 1: Website stats
  console.log('\n📊 Testing website stats...');
  const statsResponse = await fetch(
    `http://localhost:3000/api/websites/${WEBSITE_ID}/stats?${commonParams}`,
    {
      method: 'GET',
      headers,
    },
  );
  console.log('Website stats:', statsResponse.ok ? '✅ Success' : '❌ Failed');
  if (!statsResponse.ok) {
    console.log('Error:', await statsResponse.text());
  } else {
    const statsData = await statsResponse.json();
    console.log('Sample stats:', {
      pageviews: statsData.pageviews?.value,
      visitors: statsData.visitors?.value,
    });
  }

  // Test 2: Website metrics
  console.log('\n📈 Testing website metrics...');
  const metricsParams = new URLSearchParams({
    ...Object.fromEntries(commonParams),
    type: 'pageview',
  });
  const metricsResponse = await fetch(
    `http://localhost:3000/api/websites/${WEBSITE_ID}/metrics?${metricsParams}`,
    {
      method: 'GET',
      headers,
    },
  );
  console.log('Website metrics:', metricsResponse.ok ? '✅ Success' : '❌ Failed');
  if (!metricsResponse.ok) {
    console.log('Error:', await metricsResponse.text());
  }

  // Test 3: Page views
  console.log('\n📄 Testing page views...');
  const pageviewsParams = new URLSearchParams({
    ...Object.fromEntries(commonParams),
    unit: 'day',
  });
  const pageviewsResponse = await fetch(
    `http://localhost:3000/api/websites/${WEBSITE_ID}/pageviews?${pageviewsParams}`,
    {
      method: 'GET',
      headers,
    },
  );
  console.log('Page views:', pageviewsResponse.ok ? '✅ Success' : '❌ Failed');
  if (!pageviewsResponse.ok) {
    console.log('Error:', await pageviewsResponse.text());
  }

  // Test 4: Events
  console.log('\n🎯 Testing events...');
  const eventsResponse = await fetch(
    `http://localhost:3000/api/websites/${WEBSITE_ID}/events?${commonParams}`,
    {
      method: 'GET',
      headers,
    },
  );
  console.log('Events:', eventsResponse.ok ? '✅ Success' : '❌ Failed');
  if (!eventsResponse.ok) {
    console.log('Error:', await eventsResponse.text());
  } else {
    const eventsData = await eventsResponse.json();
    console.log('Events found:', eventsData.length || 0);
  }

  // Test 5: Sessions
  console.log('\n👥 Testing sessions...');
  const sessionsResponse = await fetch(
    `http://localhost:3000/api/websites/${WEBSITE_ID}/sessions?${commonParams}`,
    {
      method: 'GET',
      headers,
    },
  );
  console.log('Sessions:', sessionsResponse.ok ? '✅ Success' : '❌ Failed');
  if (!sessionsResponse.ok) {
    console.log('Error:', await sessionsResponse.text());
  } else {
    const sessionsData = await sessionsResponse.json();
    console.log('Sessions found:', sessionsData.length || 0);
  }

  console.log('\n🎉 Analytics API testing complete!');
}

testAnalyticsAPIs().catch(console.error);
