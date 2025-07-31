const { API_KEY, BASE_URL } = require('../config.js');

async function testDeletionVerification() {
  console.log('🔍 Testing Website Deletion Verification');
  console.log('=======================================');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };

  // First, get the current list of websites
  console.log('\n📋 Getting current websites list...');
  const listResponse = await fetch(`${BASE_URL}/api/websites`, {
    method: 'GET',
    headers,
  });

  if (listResponse.ok) {
    const websites = await listResponse.json();
    console.log(`Current websites: ${websites.length}`);

    if (websites.length > 0) {
      console.log('Available websites:');
      websites.forEach((website, index) => {
        console.log(`  ${index + 1}. ${website.name} (${website.id})`);
      });

      // Test accessing an existing website
      const testWebsiteId = websites[0].id;
      console.log(`\n🔍 Testing access to existing website: ${testWebsiteId}`);

      const accessResponse = await fetch(`${BASE_URL}/api/websites/${testWebsiteId}`, {
        method: 'GET',
        headers,
      });

      console.log(
        'Access existing website:',
        accessResponse.ok ? '✅ Success' : `❌ Failed (${accessResponse.status})`,
      );
      if (!accessResponse.ok) {
        const errorText = await accessResponse.text();
        console.log('Error details:', errorText);
      }
    } else {
      console.log('No websites found - this might be why we get 500 errors');
    }
  } else {
    console.log('Failed to get websites list:', await listResponse.text());
  }

  // Test accessing a non-existent website
  console.log('\n❌ Testing access to non-existent website...');
  const fakeId = '00000000-0000-0000-0000-000000000000';
  const fakeResponse = await fetch(`${BASE_URL}/api/websites/${fakeId}`, {
    method: 'GET',
    headers,
  });

  console.log(`Access fake website: ${fakeResponse.status} (${fakeResponse.statusText})`);
  if (!fakeResponse.ok) {
    const errorText = await fakeResponse.text();
    console.log('Error details:', errorText);
  }

  console.log('\n🎉 Deletion verification complete!');
}

testDeletionVerification().catch(console.error);
