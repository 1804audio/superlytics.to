const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

async function testBatchAPI() {
  console.log('🔍 Testing batch API functionality...');

  const batchData = [
    {
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        url: 'https://api-test.example.com/page1',
        title: 'Page 1',
        hostname: 'api-test.example.com',
        timestamp: Math.floor(Date.now() / 1000) - 100,
      },
    },
    {
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        name: 'form_submit',
        tag: 'conversion',
        data: { form_name: 'contact' },
        hostname: 'api-test.example.com',
        timestamp: Math.floor(Date.now() / 1000) - 50,
      },
    },
    {
      type: 'identify',
      payload: {
        website: WEBSITE_ID,
        data: {
          userId: 'batch_user_456',
          email: 'batch@example.com',
          name: 'Batch User',
        },
        hostname: 'api-test.example.com',
        timestamp: Math.floor(Date.now() / 1000),
      },
    },
  ];

  const response = await fetch(`${BASE_URL}/api/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
    },
    body: JSON.stringify(batchData),
  });

  console.log('📦 Batch API test:', response.ok ? '✅ Success' : '❌ Failed');

  if (response.ok) {
    const result = await response.json();
    console.log(
      `📊 Batch results: ${result.processed}/${result.size} processed, ${result.errors} errors`,
    );
    if (result.details && result.details.length > 0) {
      console.log('Error details:', result.details);
    }
  } else {
    console.log('Error:', await response.text());
  }

  console.log('\n🎉 Batch API functionality test complete!');
}

testBatchAPI().catch(console.error);
