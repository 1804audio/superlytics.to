const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';
const WEBSITE_ID = '77b5aae8-8e1c-4604-a4cc-a4de2b9e3b7e';

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

  const response = await fetch('http://localhost:3000/api/batch', {
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
