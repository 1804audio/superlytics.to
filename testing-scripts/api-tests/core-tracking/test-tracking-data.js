const { API_KEY, WEBSITE_ID, BASE_URL } = require('../config.js');

// Realistic data sets
const PAGES = [
  { url: '/', title: 'Home - API Test Website' },
  { url: '/about', title: 'About Us - API Test Website' },
  { url: '/products', title: 'Products - API Test Website' },
  { url: '/contact', title: 'Contact - API Test Website' },
  { url: '/blog', title: 'Blog - API Test Website' },
  { url: '/blog/how-to-get-started', title: 'How to Get Started - Blog' },
  { url: '/blog/best-practices', title: 'Best Practices - Blog' },
  { url: '/pricing', title: 'Pricing - API Test Website' },
  { url: '/features', title: 'Features - API Test Website' },
  { url: '/support', title: 'Support - API Test Website' },
];

const REFERRERS = [
  'https://google.com/search?q=api+test+website',
  'https://twitter.com/share',
  'https://facebook.com/share',
  'https://linkedin.com/share',
  'https://github.com/awesome-list',
  'https://dev.to/article/awesome-apis',
  'https://reddit.com/r/webdev',
  null, // Direct traffic
];

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-G996B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
];

const LANGUAGES = ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR', 'ja-JP', 'zh-CN'];
const SCREENS = ['1920x1080', '1366x768', '1440x900', '1536x864', '375x812', '414x896', '360x640'];

const EVENTS = [
  { name: 'button_click', tag: 'engagement' },
  { name: 'form_submit', tag: 'conversion' },
  { name: 'newsletter_signup', tag: 'conversion' },
  { name: 'download_start', tag: 'engagement' },
  { name: 'video_play', tag: 'engagement' },
  { name: 'search_performed', tag: 'engagement' },
  { name: 'product_view', tag: 'ecommerce' },
  { name: 'add_to_cart', tag: 'ecommerce' },
  { name: 'checkout_start', tag: 'conversion' },
  { name: 'purchase_complete', tag: 'conversion' },
];

// UTM Campaign data
const UTM_CAMPAIGNS = [
  {
    source: 'google',
    medium: 'cpc',
    campaign: 'winter_sale',
    content: 'ad_1',
    term: 'api+testing',
  },
  { source: 'facebook', medium: 'social', campaign: 'brand_awareness', content: 'post_1' },
  { source: 'twitter', medium: 'social', campaign: 'product_launch', content: 'tweet_1' },
  { source: 'newsletter', medium: 'email', campaign: 'monthly_digest', content: 'cta_button' },
  { source: 'github', medium: 'referral', campaign: 'developer_outreach' },
];

// Helper functions
function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSessionId() {
  return 'sess_' + Math.random().toString(36).substring(2, 15);
}

function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 12);
}

// Generate realistic timestamp (last 30 days) - returns seconds since epoch
function generateTimestamp() {
  const now = Math.floor(Date.now() / 1000); // Convert to seconds
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60; // 30 days in seconds
  return randomBetween(thirtyDaysAgo, now);
}

// Send tracking data
async function sendTrackingData(data) {
  try {
    const response = await fetch(`${BASE_URL}/api/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(data),
    });

    const result = await response.text();
    if (!response.ok) {
      console.error('Failed to send data:', response.status, result);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending data:', error);
    return false;
  }
}

// Generate a realistic user session
async function generateUserSession() {
  const sessionId = generateSessionId();
  const userId = generateUserId();
  const userAgent = randomChoice(USER_AGENTS);
  const language = randomChoice(LANGUAGES);
  const screen = randomChoice(SCREENS);
  const referrer = randomChoice(REFERRERS);

  // Add UTM parameters to referrer sometimes
  let finalReferrer = referrer;
  if (referrer && Math.random() < 0.3) {
    const utm = randomChoice(UTM_CAMPAIGNS);
    const params = new URLSearchParams();
    params.set('utm_source', utm.source);
    params.set('utm_medium', utm.medium);
    params.set('utm_campaign', utm.campaign);
    if (utm.content) params.set('utm_content', utm.content);
    if (utm.term) params.set('utm_term', utm.term);
    finalReferrer = `${referrer}?${params.toString()}`;
  }

  console.log(`\n🟢 Starting session for ${userId} (${sessionId})`);

  // Session starts with page view
  const entryPage = randomChoice(PAGES);
  const timestamp = generateTimestamp();

  let success = await sendTrackingData({
    type: 'event',
    payload: {
      website: WEBSITE_ID,
      url: `https://api-test-unique.example.com${entryPage.url}`,
      title: entryPage.title,
      referrer: finalReferrer,
      hostname: 'api-test-unique.example.com',
      language,
      screen,
      userAgent,
      timestamp,
      id: sessionId,
    },
  });

  if (!success) return false;

  // User browses 2-5 more pages
  const pageViews = randomBetween(2, 5);
  let currentTimestamp = timestamp;

  for (let i = 0; i < pageViews; i++) {
    // Time between pages: 30 seconds to 5 minutes (in seconds)
    currentTimestamp += randomBetween(30, 300);
    const page = randomChoice(PAGES);

    success = await sendTrackingData({
      type: 'event',
      payload: {
        website: WEBSITE_ID,
        url: `https://api-test-unique.example.com${page.url}`,
        title: page.title,
        hostname: 'api-test-unique.example.com',
        language,
        screen,
        userAgent,
        timestamp: currentTimestamp,
        id: sessionId,
      },
    });

    if (!success) return false;

    // Sometimes trigger events
    if (Math.random() < 0.4) {
      currentTimestamp += randomBetween(5, 30);
      const event = randomChoice(EVENTS);

      // Create event-specific data
      let eventData = { page: page.url };

      if (event.name === 'search_performed') {
        eventData.query = randomChoice([
          'api testing',
          'documentation',
          'integration',
          'analytics',
        ]);
      } else if (event.name === 'product_view') {
        eventData.product_id = `product_${randomBetween(1, 20)}`;
      } else if (event.name === 'add_to_cart') {
        eventData.product_id = `product_${randomBetween(1, 20)}`;
        eventData.quantity = randomBetween(1, 3);
      } else if (event.name === 'purchase_complete') {
        eventData.order_id = `order_${Date.now()}`;
        eventData.value = randomBetween(2999, 19999) / 100; // $29.99 to $199.99
        eventData.currency = 'USD';
      }

      success = await sendTrackingData({
        type: 'event',
        payload: {
          website: WEBSITE_ID,
          name: event.name,
          tag: event.tag,
          data: eventData,
          hostname: 'api-test-unique.example.com',
          language,
          screen,
          userAgent,
          timestamp: currentTimestamp,
          id: sessionId,
        },
      });

      if (!success) return false;
    }
  }

  // Sometimes identify user with additional data
  if (Math.random() < 0.3) {
    currentTimestamp += randomBetween(10, 60);

    success = await sendTrackingData({
      type: 'identify',
      payload: {
        website: WEBSITE_ID,
        data: {
          userId,
          email: `user${randomBetween(1000, 9999)}@example.com`,
          name: `User ${randomBetween(1000, 9999)}`,
          plan: randomChoice(['free', 'starter', 'growth', 'enterprise']),
          signup_date: new Date(timestamp).toISOString().split('T')[0],
          country: randomChoice(['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'ES', 'BR', 'JP']),
        },
        hostname: 'api-test-unique.example.com',
        language,
        screen,
        userAgent,
        timestamp: currentTimestamp,
        id: sessionId,
      },
    });
  }

  console.log(`✅ Completed session for ${userId} with ${pageViews + 1} page views`);
  return true;
}

// Main function to generate test data
async function generateMockData() {
  console.log('🚀 Starting comprehensive tracking data generation...');
  console.log(`📊 Target: ${WEBSITE_ID}`);
  console.log(`🔑 API Key: ${API_KEY.substring(0, 12)}...`);

  let successCount = 0;
  let failCount = 0;

  // Generate 50 realistic user sessions
  const totalSessions = 50;

  for (let i = 0; i < totalSessions; i++) {
    console.log(`\n📈 Progress: ${i + 1}/${totalSessions} sessions`);

    const success = await generateUserSession();
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between sessions
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n🎉 Mock data generation complete!');
  console.log(`✅ Successful sessions: ${successCount}`);
  console.log(`❌ Failed sessions: ${failCount}`);
  console.log(`📊 Success rate: ${((successCount / totalSessions) * 100).toFixed(1)}%`);
}

// Run the data generation
generateMockData().catch(console.error);
