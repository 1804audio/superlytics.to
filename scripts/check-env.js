/* eslint-disable no-console */
require('dotenv').config();

function checkMissing(vars) {
  const missing = vars.reduce((arr, key) => {
    if (!process.env[key]) {
      arr.push(key);
    }
    return arr;
  }, []);

  if (missing.length) {
    console.log(`The following environment variables are not defined:`);
    for (const item of missing) {
      console.log(' - ', item);
    }
    process.exit(1);
  }
}

if (!process.env.SKIP_DB_CHECK && !process.env.DATABASE_TYPE) {
  checkMissing(['DATABASE_URL']);
}

if (process.env.CLOUD_MODE) {
  checkMissing(['CLOUD_URL', 'KAFKA_BROKER', 'KAFKA_URL', 'REDIS_URL', 'KAFKA_SASL_MECHANISM']);
}

// Check Stripe environment variables (optional but recommended for SaaS features)
if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('⚠️  Warning: STRIPE_SECRET_KEY is set but STRIPE_WEBHOOK_SECRET is missing.');
  console.warn('   Stripe webhooks will not work properly without the webhook secret.');
}

if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️  Warning: STRIPE_SECRET_KEY is set but STRIPE_PUBLISHABLE_KEY is missing.');
  console.warn('   Frontend Stripe integration will not work without the publishable key.');
}
