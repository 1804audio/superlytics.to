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
    STRIPE_PRICE_HOBBY_MONTHLY: 'price_test_hobby_monthly',
    STRIPE_PRICE_HOBBY_YEARLY: 'price_test_hobby_yearly',
    STRIPE_PRICE_PRO_MONTHLY: 'price_test_pro_monthly',
    STRIPE_PRICE_PRO_YEARLY: 'price_test_pro_yearly',
    STRIPE_PRICE_LIFETIME_STARTER: 'price_test_lifetime_starter',
    STRIPE_PRICE_LIFETIME_PRO: 'price_test_lifetime_pro',
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
            id => id && id.startsWith('price_') && id.length > 10,
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

    it('should have correct hobby plan configuration', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const hobbyPlan = SIMPLIFIED_PLANS.hobby;
      const planPriceIds = getPlanPriceIds();
      const hobbyPrices = planPriceIds.hobby;

      expect(hobbyPrices.monthly).toBeDefined();
      expect(hobbyPrices.yearly).toBeDefined();
      expect(hobbyPlan.prices.monthly).toBe(9);
      expect(hobbyPlan.prices.yearly).toBe(90);
    });

    it('should have correct pro plan configuration', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const proPlan = SIMPLIFIED_PLANS.pro;
      const planPriceIds = getPlanPriceIds();
      const proPrices = planPriceIds.pro;

      expect(proPrices.monthly).toBeDefined();
      expect(proPrices.yearly).toBeDefined();
      expect(proPlan.prices.monthly).toBe(19);
      expect(proPlan.prices.yearly).toBe(190);
    });

    it('should have lifetime plans with valid price IDs', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const lifetimePlans = ['lifetime_starter', 'lifetime_pro', 'lifetime_max'];
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
      const requiredPlans = ['free', 'hobby', 'pro'];
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

      // Hobby plan should be $9/$90
      expect(SIMPLIFIED_PLANS.hobby.prices.monthly).toBe(9);
      expect(SIMPLIFIED_PLANS.hobby.prices.yearly).toBe(90);

      // Pro plan should be $19/$190
      expect(SIMPLIFIED_PLANS.pro.prices.monthly).toBe(19);
      expect(SIMPLIFIED_PLANS.pro.prices.yearly).toBe(190);
    });
  });

  describe('Plan Upgrade Flow', () => {
    it('should support upgrade from free to hobby', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const freePlan = SIMPLIFIED_PLANS.free;
      const hobbyPlan = SIMPLIFIED_PLANS.hobby;
      const planPriceIds = getPlanPriceIds();
      const hobbyPrices = planPriceIds.hobby;

      // Hobby should be better than free
      expect(hobbyPlan.limits.eventsPerMonth).toBeGreaterThan(freePlan.limits.eventsPerMonth);
      expect(hobbyPlan.limits.websites).toBeGreaterThan(freePlan.limits.websites);
      expect(hobbyPlan.limits.teamMembers).toBeGreaterThan(freePlan.limits.teamMembers);
      expect(hobbyPlan.limits.dataRetentionMonths).toBeGreaterThan(
        freePlan.limits.dataRetentionMonths,
      );

      // Should have valid environment price IDs for upgrade
      expect(hobbyPrices.monthly).toBeTruthy();
      expect(hobbyPrices.yearly).toBeTruthy();
    });

    it('should support upgrade from hobby to pro', () => {
      // Import here to get fresh module with mocked env vars
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getPlanPriceIds } = require('@/lib/server/plan-price-ids');
      const hobbyPlan = SIMPLIFIED_PLANS.hobby;
      const proPlan = SIMPLIFIED_PLANS.pro;
      const planPriceIds = getPlanPriceIds();
      const proPrices = planPriceIds.pro;

      // Pro should be better than hobby
      expect(proPlan.limits.eventsPerMonth).toBeGreaterThan(hobbyPlan.limits.eventsPerMonth);
      expect(proPlan.limits.websites).toBeGreaterThan(hobbyPlan.limits.websites);
      expect(proPlan.limits.teamMembers).toBeGreaterThan(hobbyPlan.limits.teamMembers);
      expect(proPlan.limits.dataRetentionMonths).toBeGreaterThan(
        hobbyPlan.limits.dataRetentionMonths,
      );

      // Pro should have additional features
      expect(proPlan.features.dataImport).toBe(true);
      expect(proPlan.features.emailReports).toBe(true);
      expect(proPlan.features.apiAccess).toBe('full');

      // Should have valid environment price IDs for upgrade
      expect(proPrices.monthly).toBeTruthy();
      expect(proPrices.yearly).toBeTruthy();
    });
  });
});
