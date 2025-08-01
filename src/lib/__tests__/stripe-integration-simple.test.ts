/**
 * Simplified Stripe Integration Tests
 * Tests plan configuration and environment-based price mapping
 */

import { SIMPLIFIED_PLANS } from '@/lib/config/simplified-plans';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  process.env = {
    ...originalEnv,
    STRIPE_PRICE_FREE_MONTHLY: 'price_test_free_monthly',
    STRIPE_PRICE_FREE_YEARLY: 'price_test_free_yearly',
    STRIPE_PRICE_STARTER_MONTHLY: 'price_test_starter_monthly',
    STRIPE_PRICE_STARTER_YEARLY: 'price_test_starter_yearly',
    STRIPE_PRICE_GROWTH_MONTHLY: 'price_test_growth_monthly',
    STRIPE_PRICE_GROWTH_YEARLY: 'price_test_growth_yearly',
    STRIPE_PRICE_LIFETIME_STARTER: 'price_test_lifetime_starter',
    STRIPE_PRICE_LIFETIME_GROWTH: 'price_test_lifetime_growth',
    STRIPE_PRICE_LIFETIME_MAX: 'price_test_lifetime_max',
  };
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Stripe Integration (Environment-Based)', () => {
  describe('Plan Price Mapping', () => {
    it('should validate environment variable configuration', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { validatePriceConfiguration } = require('@/lib/server/plan-price-ids');
      const { isValid, missingVars } = validatePriceConfiguration();

      // Configuration should be valid (all required ENV vars present)
      expect(isValid).toBe(true);
      expect(missingVars).toHaveLength(0);
    });

    it('should have valid environment-based price IDs for all plans', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const planPriceIds = getPlanPriceIds();
      const plans = Object.values(SIMPLIFIED_PLANS);

      plans.forEach(plan => {
        if (plan.type === 'subscription' || plan.type === 'lifetime') {
          // Skip enterprise as it has custom pricing
          if (plan.id === 'enterprise') return;

          const priceConfig = planPriceIds[plan.id];
          expect(priceConfig).toBeDefined();

          // Should have at least one valid price ID
          const hasValidPriceId = Object.values(priceConfig).some(
            id => typeof id === 'string' && id.startsWith('price_') && id.length > 10,
          );

          expect(hasValidPriceId).toBe(true);
        }
      });
    });

    it('should find plans by environment-based price ID', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds, getPlanByPriceId } = require('@/lib/server/plan-price-ids');
      const planPriceIds = getPlanPriceIds();

      // Test that we can reverse lookup plans from their environment price IDs
      Object.entries(planPriceIds).forEach(([planId, prices]) => {
        Object.entries(prices).forEach(([interval, priceId]) => {
          if (priceId) {
            const planInfo = getPlanByPriceId(priceId);
            expect(planInfo).toBeDefined();
            expect(planInfo?.planId).toBe(planId);
            expect(planInfo?.interval).toBe(interval);
          }
        });
      });

      // Test non-existent price ID
      const nonExistent = getPlanByPriceId('price_nonexistent');
      expect(nonExistent).toBeNull();
    });

    it('should have correct free plan configuration', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const freePlan = SIMPLIFIED_PLANS.free;
      const planPriceIds = getPlanPriceIds();
      const freePrices = planPriceIds.free;

      expect(freePrices.monthly).toBeDefined();
      expect(freePrices.yearly).toBeDefined();
      expect(freePlan.prices.monthly).toBe(0);
      expect(freePlan.prices.yearly).toBe(0);
    });

    it('should have correct starter plan configuration', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const starterPlan = SIMPLIFIED_PLANS.starter;
      const planPriceIds = getPlanPriceIds();
      const starterPrices = planPriceIds.starter;

      expect(starterPrices.monthly).toBeDefined();
      expect(starterPrices.yearly).toBeDefined();
      expect(starterPlan.prices.monthly).toBe(9);
      expect(starterPlan.prices.yearly).toBe(90);
    });

    it('should have correct growth plan configuration', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const growthPlan = SIMPLIFIED_PLANS.growth;
      const planPriceIds = getPlanPriceIds();
      const growthPrices = planPriceIds.growth;

      expect(growthPrices.monthly).toBeDefined();
      expect(growthPrices.yearly).toBeDefined();
      expect(growthPlan.prices.monthly).toBe(19);
      expect(growthPlan.prices.yearly).toBe(190);
    });

    it('should have lifetime plans with valid price IDs', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const lifetimePlans = ['lifetime_starter', 'lifetime_growth', 'lifetime_max'];
      const planPriceIds = getPlanPriceIds();

      lifetimePlans.forEach(planId => {
        const plan = SIMPLIFIED_PLANS[planId];
        const priceConfig = planPriceIds[planId];
        expect(priceConfig.lifetime).toBeDefined();
        expect(priceConfig.lifetime).toMatch(/^price_/);
        expect(plan.prices.lifetime).toBeGreaterThan(0);
      });
    });
  });

  describe('Environment-Based Product Configuration', () => {
    it('should validate all plans have proper environment setup', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const requiredPlans = ['free', 'starter', 'growth'];
      const planPriceIds = getPlanPriceIds();

      requiredPlans.forEach(planId => {
        const plan = SIMPLIFIED_PLANS[planId];
        const priceConfig = planPriceIds[planId];

        // Should have plan configuration
        expect(plan).toBeDefined();
        expect(plan.id).toBe(planId);

        // Should have pricing
        expect(plan.prices).toBeDefined();
        expect(typeof plan.prices.monthly).toBe('number');

        // Should have environment price IDs (except for enterprise)
        if (planId !== 'enterprise') {
          expect(priceConfig).toBeDefined();
          expect(priceConfig.monthly).toBeTruthy();
        }
      });
    });

    it('should have consistent pricing between plan config and Stripe', () => {
      // Free plan should be $0
      expect(SIMPLIFIED_PLANS.free.prices.monthly).toBe(0);
      expect(SIMPLIFIED_PLANS.free.prices.yearly).toBe(0);

      // Starter plan should be $9/$90
      expect(SIMPLIFIED_PLANS.starter.prices.monthly).toBe(9);
      expect(SIMPLIFIED_PLANS.starter.prices.yearly).toBe(90);

      // Growth plan should be $19/$190
      expect(SIMPLIFIED_PLANS.growth.prices.monthly).toBe(19);
      expect(SIMPLIFIED_PLANS.growth.prices.yearly).toBe(190);
    });
  });

  describe('Plan Upgrade Flow', () => {
    it('should support upgrade from free to starter', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const freePlan = SIMPLIFIED_PLANS.free;
      const starterPlan = SIMPLIFIED_PLANS.starter;
      const planPriceIds = getPlanPriceIds();
      const starterPrices = planPriceIds.starter;

      // Starter should be better than free
      expect(starterPlan.limits.eventsPerMonth).toBeGreaterThan(freePlan.limits.eventsPerMonth);
      expect(starterPlan.limits.websites).toBeGreaterThan(freePlan.limits.websites);
      expect(starterPlan.limits.teamMembers).toBeGreaterThan(freePlan.limits.teamMembers);
      expect(starterPlan.limits.dataRetentionMonths).toBeGreaterThan(
        freePlan.limits.dataRetentionMonths,
      );

      // Should have valid environment price IDs for upgrade
      expect(starterPrices.monthly).toBeTruthy();
      expect(starterPrices.yearly).toBeTruthy();
    });

    it('should support upgrade from starter to growth', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const starterPlan = SIMPLIFIED_PLANS.starter;
      const growthPlan = SIMPLIFIED_PLANS.growth;
      const planPriceIds = getPlanPriceIds();
      const growthPrices = planPriceIds.growth;

      // Growth should be better than starter
      expect(growthPlan.limits.eventsPerMonth).toBeGreaterThan(starterPlan.limits.eventsPerMonth);
      expect(growthPlan.limits.websites).toBeGreaterThan(starterPlan.limits.websites);
      expect(growthPlan.limits.teamMembers).toBeGreaterThan(starterPlan.limits.teamMembers);
      expect(growthPlan.limits.dataRetentionMonths).toBeGreaterThan(
        starterPlan.limits.dataRetentionMonths,
      );

      // Growth should have additional features
      expect(growthPlan.features.dataImport).toBe(true);
      expect(growthPlan.features.emailReports).toBe(true);
      expect(growthPlan.features.apiAccess).toBe('full');

      // Should have valid environment price IDs for upgrade
      expect(growthPrices.monthly).toBeTruthy();
      expect(growthPrices.yearly).toBeTruthy();
    });
  });
});
