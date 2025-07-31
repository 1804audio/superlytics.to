const { API_KEY, BASE_URL } = require('../config.js');

async function testDataExportAPI() {
  console.log('🔍 Testing data export API with API key...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  // Test data export
  console.log('\n📤 Testing data export...');
  const exportResponse = await fetch(`${BASE_URL}/api/me/data-export`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      type: 'json', // or 'csv'
    }),
  });

  console.log('Data export:', exportResponse.ok ? '✅ Success' : '❌ Failed');
  if (!exportResponse.ok) {
    console.log('Error:', await exportResponse.text());
  } else {
    const exportData = await exportResponse.json();
    console.log('Export status:', exportData.success ? 'Success' : 'Failed');
    if (exportData.data) {
      console.log('Data keys:', Object.keys(exportData.data));
      if (exportData.data.websites) {
        console.log('Websites exported:', exportData.data.websites.length);
      }
    }
  }

  console.log('\n🎉 Data export API testing complete!');
}

testDataExportAPI().catch(console.error);
