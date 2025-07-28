/**
 * Server-side utility for managing Stripe price IDs from environment variables
 * This ensures price IDs are never exposed to the client-side
 */

interface PlanPriceMapping {
  [planId: string]: {
    monthly?: string;
    yearly?: string;
    lifetime?: string;
  };
}

/**
 * Get all plan price IDs from environment variables
 */
export function getPlanPriceIds(): PlanPriceMapping {
  return {
    free: {
      monthly: process.env.STRIPE_PRICE_FREE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_FREE_YEARLY || process.env.STRIPE_PRICE_FREE_MONTHLY,
    },
    starter: {
      monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY,
      yearly: process.env.STRIPE_PRICE_STARTER_YEARLY,
    },
    growth: {
      monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY,
      yearly: process.env.STRIPE_PRICE_GROWTH_YEARLY,
    },
    lifetime_starter: {
      lifetime: process.env.STRIPE_PRICE_LIFETIME_STARTER,
    },
    lifetime_growth: {
      lifetime: process.env.STRIPE_PRICE_LIFETIME_GROWTH,
    },
    lifetime_max: {
      lifetime: process.env.STRIPE_PRICE_LIFETIME_MAX,
    },
  };
}

/**
 * Get price ID for a specific plan and billing interval
 */
export function getPriceId(
  planId: string,
  interval: 'monthly' | 'yearly' | 'lifetime',
): string | null {
  const planPrices = getPlanPriceIds()[planId];
  if (!planPrices) {
    return null;
  }

  return planPrices[interval] || null;
}

/**
 * Find plan ID by Stripe price ID (reverse lookup)
 */
export function getPlanByPriceId(
  priceId: string,
): { planId: string; interval: 'monthly' | 'yearly' | 'lifetime' } | null {
  const allPlans = getPlanPriceIds();

  for (const [planId, prices] of Object.entries(allPlans)) {
    for (const [interval, envPriceId] of Object.entries(prices)) {
      if (envPriceId === priceId) {
        return {
          planId,
          interval: interval as 'monthly' | 'yearly' | 'lifetime',
        };
      }
    }
  }

  return null;
}

/**
 * Validate that all required price IDs are configured
 */
export function validatePriceConfiguration(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'STRIPE_PRICE_FREE_MONTHLY',
    'STRIPE_PRICE_STARTER_MONTHLY',
    'STRIPE_PRICE_STARTER_YEARLY',
    'STRIPE_PRICE_GROWTH_MONTHLY',
    'STRIPE_PRICE_GROWTH_YEARLY',
    'STRIPE_PRICE_LIFETIME_STARTER',
    'STRIPE_PRICE_LIFETIME_GROWTH',
    'STRIPE_PRICE_LIFETIME_MAX',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}
