/**
 * Simplified Stripe Integration Tests
 * Tests Stripe plan configuration and price mapping
 */

import { SIMPLIFIED_PLANS, getPlanByStripeId } from '@/lib/config/simplified-plans';

describe('Stripe Integration (Config Only)', () => {
  describe('Plan Price Mapping', () => {
    it('should have valid Stripe price IDs for all plans', () => {
      const plans = Object.values(SIMPLIFIED_PLANS);

      plans.forEach(plan => {
        if (plan.type === 'subscription' || plan.type === 'lifetime') {
          // Skip enterprise as it has custom pricing
          if (plan.id === 'enterprise') return;

          // Each plan should have at least one valid Stripe price ID
          const hasValidPriceId = Object.values(plan.stripeIds).some(
            id => id && id.startsWith('price_') && id.length > 10,
          );

          expect(hasValidPriceId).toBe(true);
        }
      });
    });

    it('should find plans by Stripe price ID', () => {
      // Test Free plan
      const freePlan = getPlanByStripeId('price_1RoVxtQAmWLtKTXWZM9N0JvP');
      expect(freePlan?.id).toBe('free');

      // Test Hobby plan
      const hobbyPlanMonthly = getPlanByStripeId('price_1RoVBJQAmWLtKTXWEv6JtObj');
      expect(hobbyPlanMonthly?.id).toBe('hobby');

      const hobbyPlanYearly = getPlanByStripeId('price_1RoVBJQAmWLtKTXWeuZJeqpI');
      expect(hobbyPlanYearly?.id).toBe('hobby');

      // Test Pro plan
      const proPlanMonthly = getPlanByStripeId('price_1RoVBKQAmWLtKTXWl2AROSCJ');
      expect(proPlanMonthly?.id).toBe('pro');

      // Test non-existent price ID
      const nonExistent = getPlanByStripeId('price_nonexistent');
      expect(nonExistent).toBeNull();
    });

    it('should have correct free plan Stripe configuration', () => {
      const freePlan = SIMPLIFIED_PLANS.free;

      expect(freePlan.stripeIds.monthly).toBe('price_1RoVxtQAmWLtKTXWZM9N0JvP');
      expect(freePlan.stripeIds.yearly).toBe('price_1RoVxtQAmWLtKTXWZM9N0JvP');
      expect(freePlan.prices.monthly).toBe(0);
      expect(freePlan.prices.yearly).toBe(0);
    });

    it('should have correct hobby plan Stripe configuration', () => {
      const hobbyPlan = SIMPLIFIED_PLANS.hobby;

      expect(hobbyPlan.stripeIds.monthly).toBe('price_1RoVBJQAmWLtKTXWEv6JtObj');
      expect(hobbyPlan.stripeIds.yearly).toBe('price_1RoVBJQAmWLtKTXWeuZJeqpI');
      expect(hobbyPlan.prices.monthly).toBe(9);
      expect(hobbyPlan.prices.yearly).toBe(90);
    });

    it('should have correct pro plan Stripe configuration', () => {
      const proPlan = SIMPLIFIED_PLANS.pro;

      expect(proPlan.stripeIds.monthly).toBe('price_1RoVBKQAmWLtKTXWl2AROSCJ');
      expect(proPlan.stripeIds.yearly).toBe('price_1RoVBKQAmWLtKTXW9Vm1ouMS');
      expect(proPlan.prices.monthly).toBe(19);
      expect(proPlan.prices.yearly).toBe(190);
    });

    it('should have lifetime plans with valid Stripe price IDs', () => {
      const lifetimePlans = ['lifetime_starter', 'lifetime_pro', 'lifetime_max'];

      lifetimePlans.forEach(planId => {
        const plan = SIMPLIFIED_PLANS[planId];
        expect(plan.stripeIds.lifetime).toBeDefined();
        expect(plan.stripeIds.lifetime).toMatch(/^price_/);
        expect(plan.prices.lifetime).toBeGreaterThan(0);
      });
    });
  });

  describe('Stripe Product Configuration', () => {
    it('should validate all plans have proper Stripe setup', () => {
      const requiredPlans = ['free', 'hobby', 'pro'];

      requiredPlans.forEach(planId => {
        const plan = SIMPLIFIED_PLANS[planId];

        // Should have plan configuration
        expect(plan).toBeDefined();
        expect(plan.id).toBe(planId);

        // Should have pricing
        expect(plan.prices).toBeDefined();
        expect(typeof plan.prices.monthly).toBe('number');

        // Should have Stripe IDs (except for enterprise)
        if (planId !== 'enterprise') {
          expect(plan.stripeIds).toBeDefined();
          expect(plan.stripeIds.monthly).toBeTruthy();
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
      const freePlan = SIMPLIFIED_PLANS.free;
      const hobbyPlan = SIMPLIFIED_PLANS.hobby;

      // Hobby should be better than free
      expect(hobbyPlan.limits.eventsPerMonth).toBeGreaterThan(freePlan.limits.eventsPerMonth);
      expect(hobbyPlan.limits.websites).toBeGreaterThan(freePlan.limits.websites);
      expect(hobbyPlan.limits.teamMembers).toBeGreaterThan(freePlan.limits.teamMembers);
      expect(hobbyPlan.limits.dataRetentionMonths).toBeGreaterThan(
        freePlan.limits.dataRetentionMonths,
      );

      // Should have valid Stripe IDs for upgrade
      expect(hobbyPlan.stripeIds.monthly).toBeTruthy();
      expect(hobbyPlan.stripeIds.yearly).toBeTruthy();
    });

    it('should support upgrade from hobby to pro', () => {
      const hobbyPlan = SIMPLIFIED_PLANS.hobby;
      const proPlan = SIMPLIFIED_PLANS.pro;

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

      // Should have valid Stripe IDs for upgrade
      expect(proPlan.stripeIds.monthly).toBeTruthy();
      expect(proPlan.stripeIds.yearly).toBeTruthy();
    });
  });
});
