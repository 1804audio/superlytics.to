const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testAuthEdgeCases() {
  console.log('🔍 Testing authentication edge cases...');

  // Test 1: Invalid API key
  console.log('\n❌ Testing invalid API key...');
  const invalidResponse = await fetch('http://localhost:3000/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'sly_invalid_key_123',
    },
    body: JSON.stringify({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        url: 'https://test.example.com/invalid-test',
        hostname: 'test.example.com',
      },
    }),
  });

  console.log('Invalid API key response:', invalidResponse.status, await invalidResponse.text());

  // Test 2: No API key
  console.log('\n❌ Testing no API key...');
  const noKeyResponse = await fetch('http://localhost:3000/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // No API key provided
    },
    body: JSON.stringify({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        url: 'https://test.example.com/no-key-test',
        hostname: 'test.example.com',
      },
    }),
  });

  console.log('No API key response:', noKeyResponse.status, await noKeyResponse.text());

  // Test 3: Valid API key (should work)
  console.log('\n✅ Testing valid API key...');
  const validResponse = await fetch('http://localhost:3000/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        url: 'https://test.example.com/valid-test',
        hostname: 'test.example.com',
        timestamp: Math.floor(Date.now() / 1000),
      },
    }),
  });

  console.log(
    'Valid API key response:',
    validResponse.status,
    validResponse.ok ? 'SUCCESS' : await validResponse.text(),
  );

  console.log('\n🎉 Authentication edge case testing complete!');
}

testAuthEdgeCases().catch(console.error);
