const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testBasicTracking() {
  console.log('🔍 Testing basic API key functionality...');

  // Test 1: Basic page view
  const response1 = await fetch(`${BASE_URL}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        url: 'https://api-test.example.com/',
        title: 'Test Page',
        hostname: 'api-test.example.com',
        timestamp: Math.floor(Date.now() / 1000),
      },
    }),
  });

  console.log('📄 Page view test:', response1.ok ? '✅ Success' : '❌ Failed');
  if (!response1.ok) {
    console.log('Error:', await response1.text());
  }

  // Test 2: Custom event
  const response2 = await fetch(`${BASE_URL}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        name: 'button_click',
        tag: 'engagement',
        data: { button_text: 'Sign Up' },
        hostname: 'api-test.example.com',
        timestamp: Math.floor(Date.now() / 1000),
      },
    }),
  });

  console.log('🎯 Custom event test:', response2.ok ? '✅ Success' : '❌ Failed');
  if (!response2.ok) {
    console.log('Error:', await response2.text());
  }

  // Test 3: User identification
  const response3 = await fetch(`${BASE_URL}/api/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      type: 'identify',
      payload: {
        website: WEBSITE_ID,
        data: {
          userId: 'test_user_123',
          email: 'test@example.com',
          name: 'Test User',
        },
        hostname: 'api-test.example.com',
        timestamp: Math.floor(Date.now() / 1000),
      },
    }),
  });

  console.log('👤 User identify test:', response3.ok ? '✅ Success' : '❌ Failed');
  if (!response3.ok) {
    console.log('Error:', await response3.text());
  }

  console.log('\n🎉 API key functionality test complete!');
}

testBasicTracking().catch(console.error);
