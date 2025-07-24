#!/usr/bin/env node
/**
 * Fix Stripe Recurring Prices
 *
 * This script creates proper recurring subscription prices for Hobby and Pro plans
 * to replace the incorrect one-time prices created by the MCP.
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('./utils/logger');

const RECURRING_PRICES = [
  {
    productId: 'prod_SjvIZ7ydTyAnmI', // Hobby product
    planName: 'Hobby',
    prices: [
      {
        unitAmount: 900, // $9.00
        interval: 'month',
        nickname: 'Hobby Monthly',
      },
      {
        unitAmount: 9000, // $90.00
        interval: 'year',
        nickname: 'Hobby Yearly',
      },
    ],
  },
  {
    productId: 'prod_SjylF2rSM2ppKz', // Pro product
    planName: 'Pro',
    prices: [
      {
        unitAmount: 1900, // $19.00
        interval: 'month',
        nickname: 'Pro Monthly',
      },
      {
        unitAmount: 19000, // $190.00
        interval: 'year',
        nickname: 'Pro Yearly',
      },
    ],
  },
];

async function createRecurringPrice(productId, unitAmount, interval, nickname) {
  try {
    logger.info(`Creating ${nickname} ($${unitAmount / 100} USD, ${interval}ly)...`);

    const price = await stripe.prices.create({
      product: productId,
      unit_amount: unitAmount,
      currency: 'usd',
      recurring: {
        interval: interval,
      },
      nickname: nickname,
      metadata: {
        created_by: 'fix-recurring-script',
        plan_type: 'subscription',
      },
    });

    logger.success(`Created ${nickname}: ${price.id}`);
    return price;
  } catch (error) {
    logger.error(`Failed to create ${nickname}: ${error.message}`);
    throw error;
  }
}

async function archiveOldPrice(priceId, nickname) {
  try {
    logger.info(`Archiving old one-time price ${nickname}: ${priceId}...`);

    await stripe.prices.update(priceId, {
      active: false,
      metadata: {
        archived_reason: 'replaced_with_recurring',
        archived_by: 'fix-recurring-script',
      },
    });

    logger.success(`Archived ${nickname}: ${priceId}`);
  } catch (error) {
    logger.error(`Failed to archive ${nickname}: ${error.message}`);
    // Don't throw - archiving is not critical
  }
}

async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.error('STRIPE_SECRET_KEY environment variable not set');
    logger.info('Please set your Stripe secret key:');
    logger.info('export STRIPE_SECRET_KEY=sk_test_...');
    process.exit(1);
  }

  logger.info('Starting Stripe recurring prices fix...');
  logger.newline();

  const results = {
    hobby: {},
    pro: {},
  };

  try {
    // Create recurring prices for each plan
    for (const plan of RECURRING_PRICES) {
      logger.section(`Processing ${plan.planName} plan`);

      const planResults = {};

      for (const priceConfig of plan.prices) {
        const price = await createRecurringPrice(
          plan.productId,
          priceConfig.unitAmount,
          priceConfig.interval,
          priceConfig.nickname,
        );
        planResults[priceConfig.interval] = price.id;
      }

      results[plan.planName.toLowerCase()] = planResults;
    }

    // Archive old one-time prices (optional - don't fail if these don't exist)
    logger.section('Archiving old one-time prices');

    const oldPrices = [
      { id: 'price_1RoRRcQAmWLtKTXWVPjfW1hE', name: 'Old Hobby Monthly' },
      { id: 'price_1RoUnsQAmWLtKTXWb02s6G5Q', name: 'Old Hobby Monthly' },
      { id: 'price_1RoUntQAmWLtKTXWFgPOLxlA', name: 'Old Hobby Yearly' },
      { id: 'price_1RoUo9QAmWLtKTXW1CcMfira', name: 'Old Pro Monthly' },
      { id: 'price_1RoUoAQAmWLtKTXWcSsmrD5j', name: 'Old Pro Yearly' },
    ];

    for (const oldPrice of oldPrices) {
      await archiveOldPrice(oldPrice.id, oldPrice.name);
    }

    logger.newline();
    logger.success('All recurring prices created successfully.');
    logger.newline();

    logger.subsection('New Stripe Price IDs');
    logger.separator();
    logger.info('│ HOBBY PLAN                                                  │');
    logger.info(`│ Monthly: ${results.hobby.month || 'ERROR'}                  │`);
    logger.info(`│ Yearly:  ${results.hobby.year || 'ERROR'}                   │`);
    logger.info('├─────────────────────────────────────────────────────────────┤');
    logger.info('│ PRO PLAN                                                    │');
    logger.info(`│ Monthly: ${results.pro.month || 'ERROR'}                    │`);
    logger.info(`│ Yearly:  ${results.pro.year || 'ERROR'}                     │`);
    logger.separator();

    logger.newline();
    logger.info('Next steps:');
    logger.info('1. Update src/lib/config/simplified-plans.ts with these new price IDs');
    logger.info('2. Test your subscription flows to ensure they work properly');
    logger.info('3. Update any existing subscriptions using the old one-time prices');

    logger.newline();
    logger.subsection('Copy these values to simplified-plans.ts');
    logger.newline();
    logger.info('// Hobby plan stripeIds:');
    logger.info('stripeIds: {');
    logger.info(`  monthly: '${results.hobby.month}',`);
    logger.info(`  yearly: '${results.hobby.year}',`);
    logger.info('},');

    logger.newline();
    logger.info('// Pro plan stripeIds:');
    logger.info('stripeIds: {');
    logger.info(`  monthly: '${results.pro.month}',`);
    logger.info(`  yearly: '${results.pro.year}',`);
    logger.info('},');
  } catch (error) {
    logger.newline();
    logger.error(`FAILED! Error creating recurring prices: ${error.message}`);
    logger.info('Please check your Stripe API key and try again.');
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  logger.error(`Script execution failed: ${error.message}`);
  process.exit(1);
});
