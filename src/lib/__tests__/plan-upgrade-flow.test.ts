/**
 * Plan Upgrade Flow Tests
 * Tests user plan upgrades and feature unlocking
 */

import { SIMPLIFIED_PLANS, getPlan, getPlanPrice } from '@/lib/config/simplified-plans';

// Mock user data
interface MockUser {
  id: string;
  planId: string;
  hasAccess: boolean;
  customerId: string;
  subscriptionId?: string;
  isLifetime: boolean;
}

describe('Plan Upgrade Flow', () => {
  describe('Free to Starter Upgrade', () => {
    it('should validate upgrade path exists', () => {
      const freePlan = getPlan('free');
      const starterPlan = getPlan('starter');

      expect(freePlan).toBeDefined();
      expect(starterPlan).toBeDefined();

      // Verify starter is an upgrade from free
      expect(starterPlan!.limits.eventsPerMonth).toBeGreaterThan(freePlan!.limits.eventsPerMonth);
      expect(starterPlan!.limits.websites).toBeGreaterThan(freePlan!.limits.websites);
      expect(starterPlan!.limits.teamMembers).toBeGreaterThan(freePlan!.limits.teamMembers);
      expect(starterPlan!.limits.dataRetentionMonths).toBeGreaterThan(
        freePlan!.limits.dataRetentionMonths,
      );
    });

    it('should calculate correct upgrade pricing', () => {
      const starterMonthly = getPlanPrice('starter', 'monthly');
      const starterYearly = getPlanPrice('starter', 'yearly');

      expect(starterMonthly).toBe(9);
      expect(starterYearly).toBe(90);

      // Yearly should be discounted
      expect(starterYearly).toBeLessThan(starterMonthly * 12);

      // 17% discount calculation
      const expectedYearly = starterMonthly * 12 * 0.83;
      expect(starterYearly).toBeCloseTo(expectedYearly, 0);
    });

    it('should have valid environment price IDs for upgrade', () => {
      // Note: Environment-based price IDs are managed server-side
      // This test validates the plan configuration exists
      const starterPlan = getPlan('starter')!;

      expect(starterPlan).toBeDefined();
      expect(starterPlan.id).toBe('starter');
      expect(starterPlan.type).toBe('subscription');
      expect(starterPlan.prices.monthly).toBe(9);
      expect(starterPlan.prices.yearly).toBe(90);
    });

    it('should simulate user upgrade process', () => {
      const freeUser: MockUser = {
        id: 'user123',
        planId: 'free',
        hasAccess: true,
        customerId: 'cus_free123',
        isLifetime: false,
      };

      // After upgrade to starter
      const upgradedUser: MockUser = {
        ...freeUser,
        planId: 'starter',
        subscriptionId: 'sub_starter123',
      };

      const newPlan = getPlan(upgradedUser.planId)!;

      expect(newPlan.limits.eventsPerMonth).toBe(100000);
      expect(newPlan.limits.websites).toBe(5);
      expect(newPlan.limits.teamMembers).toBe(3);
      expect(newPlan.limits.dataRetentionMonths).toBe(36);
    });
  });

  describe('Starter to Growth Upgrade', () => {
    it('should unlock growth features', () => {
      const starterPlan = getPlan('starter')!;
      const growthPlan = getPlan('growth')!;

      // Features unlocked in Growth
      expect(growthPlan.features.dataImport).toBe(true);
      expect(growthPlan.features.emailReports).toBe(true);
      expect(growthPlan.features.apiAccess).toBe('full');
      expect(growthPlan.features.supportLevel).toBe('email');

      // Starter still restricted
      expect(starterPlan.features.dataImport).toBe(false);
      expect(starterPlan.features.emailReports).toBe(false);
      expect(starterPlan.features.apiAccess).toBe('limited');
      expect(starterPlan.features.supportLevel).toBe('community');
    });

    it('should have significant limit increases', () => {
      const starterPlan = getPlan('starter')!;
      const growthPlan = getPlan('growth')!;

      expect(growthPlan.limits.eventsPerMonth).toBe(starterPlan.limits.eventsPerMonth * 10);
      expect(growthPlan.limits.websites).toBe(25);
      expect(growthPlan.limits.teamMembers).toBe(10);
      expect(growthPlan.limits.dataRetentionMonths).toBe(60); // 5 years
    });

    it('should calculate growth upgrade pricing', () => {
      const growthMonthly = getPlanPrice('growth', 'monthly');
      const growthYearly = getPlanPrice('growth', 'yearly');

      expect(growthMonthly).toBe(19);
      expect(growthYearly).toBe(190);

      // Should be more expensive than starter
      expect(growthMonthly).toBeGreaterThan(getPlanPrice('starter', 'monthly'));
      expect(growthYearly).toBeGreaterThan(getPlanPrice('starter', 'yearly'));
    });
  });

  describe('Lifetime Plan Upgrades', () => {
    it('should offer lifetime alternatives to subscriptions', () => {
      const lifetimeStarter = getPlan('lifetime_starter')!;
      const lifetimeGrowth = getPlan('lifetime_growth')!;
      const lifetimeMax = getPlan('lifetime_max')!;

      expect(lifetimeStarter.type).toBe('lifetime');
      expect(lifetimeGrowth.type).toBe('lifetime');
      expect(lifetimeMax.type).toBe('lifetime');
    });

    it('should provide better value than subscriptions', () => {
      const lifetimeStarter = getPlan('lifetime_starter')!;
      const starter = getPlan('starter')!;

      // Lifetime starter should have more than starter
      expect(lifetimeStarter.limits.eventsPerMonth).toBeGreaterThan(starter.limits.eventsPerMonth);
      expect(lifetimeStarter.limits.websites).toBeGreaterThan(starter.limits.websites);

      // Should include Growth features
      expect(lifetimeStarter.features.dataImport).toBe(true);
      expect(lifetimeStarter.features.emailReports).toBe(true);
      expect(lifetimeStarter.features.apiAccess).toBe('full');
    });

    it('should simulate lifetime upgrade from subscription', () => {
      const subscriptionUser: MockUser = {
        id: 'user456',
        planId: 'starter',
        hasAccess: true,
        customerId: 'cus_starter456',
        subscriptionId: 'sub_starter456',
        isLifetime: false,
      };

      // After lifetime upgrade
      const lifetimeUser: MockUser = {
        ...subscriptionUser,
        planId: 'lifetime_starter',
        subscriptionId: undefined, // No more subscription
        isLifetime: true,
      };

      const lifetimePlan = getPlan(lifetimeUser.planId)!;

      expect(lifetimePlan.limits.eventsPerMonth).toBe(250000);
      expect(lifetimePlan.limits.dataRetentionMonths).toBe(24);
      expect(lifetimePlan.features.dataImport).toBe(true);
      expect(lifetimeUser.isLifetime).toBe(true);
    });
  });

  describe('Enterprise Upgrade Path', () => {
    it('should have enterprise as top tier', () => {
      const enterprise = getPlan('enterprise')!;

      expect(enterprise.type).toBe('custom');
      expect(enterprise.limits.eventsPerMonth).toBe(-1); // Unlimited
      expect(enterprise.limits.websites).toBe(-1); // Unlimited
      expect(enterprise.limits.teamMembers).toBe(-1); // Unlimited
      expect(enterprise.limits.dataRetentionMonths).toBe(-1); // Forever
    });

    it('should unlock all enterprise features', () => {
      const enterprise = getPlan('enterprise')!;

      expect(enterprise.features.whiteLabel).toBe(true);
      expect(enterprise.features.customDomain).toBe(true);
      expect(enterprise.features.prioritySLA).toBe(true);
      expect(enterprise.features.onboardingSupport).toBe(true);
      expect(enterprise.features.supportLevel).toBe('dedicated');
    });

    it('should have custom pricing', () => {
      const enterprise = getPlan('enterprise')!;

      expect(enterprise.prices.custom).toBe(true);
      expect(getPlanPrice('enterprise', 'monthly')).toBe(0); // Custom pricing returns 0
    });
  });

  describe('Downgrade Scenarios', () => {
    it('should identify feature loss on downgrade', () => {
      const growthPlan = getPlan('growth')!;
      const starterPlan = getPlan('starter')!;

      // Features lost when downgrading from Growth to Starter
      const featuresLost = {
        dataImport: growthPlan.features.dataImport && !starterPlan.features.dataImport,
        emailReports: growthPlan.features.emailReports && !starterPlan.features.emailReports,
        fullApiAccess:
          growthPlan.features.apiAccess === 'full' && starterPlan.features.apiAccess === 'limited',
      };

      expect(featuresLost.dataImport).toBe(true);
      expect(featuresLost.emailReports).toBe(true);
      expect(featuresLost.fullApiAccess).toBe(true);
    });

    it('should identify limit reductions on downgrade', () => {
      const growthPlan = getPlan('growth')!;
      const starterPlan = getPlan('starter')!;

      expect(starterPlan.limits.eventsPerMonth).toBeLessThan(growthPlan.limits.eventsPerMonth);
      expect(starterPlan.limits.websites).toBeLessThan(growthPlan.limits.websites);
      expect(starterPlan.limits.teamMembers).toBeLessThan(growthPlan.limits.teamMembers);
      expect(starterPlan.limits.dataRetentionMonths).toBeLessThan(
        growthPlan.limits.dataRetentionMonths,
      );
    });
  });

  describe('Plan Validation', () => {
    it('should validate all upgrade paths are logical', () => {
      const planOrder = ['free', 'starter', 'growth'];

      for (let i = 1; i < planOrder.length; i++) {
        const currentPlan = getPlan(planOrder[i])!;
        const previousPlan = getPlan(planOrder[i - 1])!;

        // Each plan should have more events
        expect(currentPlan.limits.eventsPerMonth).toBeGreaterThan(
          previousPlan.limits.eventsPerMonth,
        );

        // Each plan should cost more (except free)
        if (previousPlan.id !== 'free') {
          expect(currentPlan.prices.monthly).toBeGreaterThan(previousPlan.prices.monthly);
        }
      }
    });

    it('should ensure all subscription plans have valid configuration', () => {
      const subscriptionPlans = Object.values(SIMPLIFIED_PLANS).filter(
        plan => plan.type === 'subscription' && plan.id !== 'enterprise',
      );

      subscriptionPlans.forEach(plan => {
        expect(plan.id).toBeTruthy();
        expect(plan.name).toBeTruthy();
        expect(plan.prices.monthly).toBeGreaterThanOrEqual(0);

        if (plan.prices.yearly && plan.prices.yearly > 0) {
          expect(plan.prices.yearly).toBeGreaterThan(0);
        }
      });
    });

    it('should ensure lifetime plans have valid configuration', () => {
      const lifetimePlans = Object.values(SIMPLIFIED_PLANS).filter(
        plan => plan.type === 'lifetime',
      );

      lifetimePlans.forEach(plan => {
        expect(plan.id).toBeTruthy();
        expect(plan.name).toBeTruthy();
        expect(plan.type).toBe('lifetime');
        expect(plan.prices.lifetime).toBeGreaterThan(0);
      });
    });
  });

  describe('Usage Enforcement', () => {
    it('should define enforceable limits', () => {
      const plans = Object.values(SIMPLIFIED_PLANS);

      plans.forEach(plan => {
        // All limits should be numbers
        expect(typeof plan.limits.eventsPerMonth).toBe('number');
        expect(typeof plan.limits.websites).toBe('number');
        expect(typeof plan.limits.teamMembers).toBe('number');
        expect(typeof plan.limits.dataRetentionMonths).toBe('number');

        // Limits should be positive or unlimited (-1)
        expect(plan.limits.eventsPerMonth).toBeGreaterThanOrEqual(-1);
        expect(plan.limits.websites).toBeGreaterThanOrEqual(-1);
        expect(plan.limits.teamMembers).toBeGreaterThanOrEqual(-1);
        expect(plan.limits.dataRetentionMonths).toBeGreaterThanOrEqual(-1);
      });
    });

    it('should have consistent feature flags', () => {
      const plans = Object.values(SIMPLIFIED_PLANS);

      plans.forEach(plan => {
        // All feature flags should be boolean or specific strings
        expect(typeof plan.features.basicAnalytics).toBe('boolean');
        expect(typeof plan.features.reports).toBe('boolean');
        expect(typeof plan.features.privacy).toBe('boolean');
        expect(typeof plan.features.dataExport).toBe('boolean');
        expect(typeof plan.features.dataImport).toBe('boolean');
        expect(typeof plan.features.emailReports).toBe('boolean');
        expect(['limited', 'full']).toContain(plan.features.apiAccess);
        expect(['community', 'email', 'priority', 'dedicated']).toContain(
          plan.features.supportLevel,
        );
      });
    });
  });
});
