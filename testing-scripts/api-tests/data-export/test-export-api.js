const API_KEY = 'sly_bb5f9889f804da5e6c4846a467d06779903d39b0';

async function testDataExportAPI() {
  console.log('🔍 Testing data export API with API key...');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  // Test data export
  console.log('\n📤 Testing data export...');
  const exportResponse = await fetch('http://localhost:3000/api/me/data-export', {
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
