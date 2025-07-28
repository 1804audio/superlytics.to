/**
 * Plan Limitations Tests
 * Tests plan feature access and limitations enforcement
 */

import {
  SIMPLIFIED_PLANS,
  getPlan,
  isUnlimited,
  getPlanPrice,
  isLifetimePlan,
} from '@/lib/config/simplified-plans';

describe('Plan Limitations and Features', () => {
  describe('Free Plan Limitations', () => {
    const freePlan = SIMPLIFIED_PLANS.free;

    it('should enforce free plan event limits', () => {
      expect(freePlan.limits.eventsPerMonth).toBe(10000);
      expect(isUnlimited(freePlan.limits.eventsPerMonth)).toBe(false);
    });

    it('should enforce free plan website limits', () => {
      expect(freePlan.limits.websites).toBe(1);
      expect(isUnlimited(freePlan.limits.websites)).toBe(false);
    });

    it('should enforce free plan team member limits', () => {
      expect(freePlan.limits.teamMembers).toBe(1);
      expect(isUnlimited(freePlan.limits.teamMembers)).toBe(false);
    });

    it('should have limited data retention', () => {
      expect(freePlan.limits.dataRetentionMonths).toBe(6);
      expect(isUnlimited(freePlan.limits.dataRetentionMonths)).toBe(false);
    });

    it('should restrict premium features', () => {
      expect(freePlan.features.dataImport).toBe(false);
      expect(freePlan.features.emailReports).toBe(false);
      expect(freePlan.features.whiteLabel).toBe(false);
      expect(freePlan.features.customDomain).toBe(false);
      expect(freePlan.features.prioritySLA).toBe(false);
      expect(freePlan.features.onboardingSupport).toBe(false);
    });

    it('should have limited API access', () => {
      expect(freePlan.features.apiAccess).toBe('limited');
    });

    it('should have community support only', () => {
      expect(freePlan.features.supportLevel).toBe('community');
    });
  });

  describe('Starter Plan Limitations', () => {
    const starterPlan = SIMPLIFIED_PLANS.starter;

    it('should have 10x more events than free plan', () => {
      expect(starterPlan.limits.eventsPerMonth).toBe(100000);
      expect(starterPlan.limits.eventsPerMonth).toBe(
        SIMPLIFIED_PLANS.free.limits.eventsPerMonth * 10,
      );
    });

    it('should allow multiple websites', () => {
      expect(starterPlan.limits.websites).toBe(5);
      expect(starterPlan.limits.websites).toBeGreaterThan(SIMPLIFIED_PLANS.free.limits.websites);
    });

    it('should allow team collaboration', () => {
      expect(starterPlan.limits.teamMembers).toBe(3);
      expect(starterPlan.limits.teamMembers).toBeGreaterThan(
        SIMPLIFIED_PLANS.free.limits.teamMembers,
      );
    });

    it('should have 3 years data retention', () => {
      expect(starterPlan.limits.dataRetentionMonths).toBe(36);
      expect(starterPlan.limits.dataRetentionMonths).toBeGreaterThan(
        SIMPLIFIED_PLANS.free.limits.dataRetentionMonths,
      );
    });

    it('should still restrict premium features', () => {
      expect(starterPlan.features.dataImport).toBe(false);
      expect(starterPlan.features.emailReports).toBe(false);
      expect(starterPlan.features.whiteLabel).toBe(false);
      expect(starterPlan.features.customDomain).toBe(false);
    });
  });

  describe('Growth Plan Features', () => {
    const growthPlan = SIMPLIFIED_PLANS.growth;

    it('should have significantly higher limits', () => {
      expect(growthPlan.limits.eventsPerMonth).toBe(1000000);
      expect(growthPlan.limits.websites).toBe(25);
      expect(growthPlan.limits.teamMembers).toBe(10);
      expect(growthPlan.limits.dataRetentionMonths).toBe(60); // 5 years
    });

    it('should unlock growth features', () => {
      expect(growthPlan.features.dataImport).toBe(true);
      expect(growthPlan.features.emailReports).toBe(true);
      expect(growthPlan.features.apiAccess).toBe('full');
      expect(growthPlan.features.supportLevel).toBe('email');
    });

    it('should still restrict enterprise features', () => {
      expect(growthPlan.features.whiteLabel).toBe(false);
      expect(growthPlan.features.customDomain).toBe(false);
      expect(growthPlan.features.prioritySLA).toBe(false);
      expect(growthPlan.features.onboardingSupport).toBe(false);
    });
  });

  describe('Enterprise Plan Features', () => {
    const enterprisePlan = SIMPLIFIED_PLANS.enterprise;

    it('should have unlimited limits', () => {
      expect(isUnlimited(enterprisePlan.limits.eventsPerMonth)).toBe(true);
      expect(isUnlimited(enterprisePlan.limits.websites)).toBe(true);
      expect(isUnlimited(enterprisePlan.limits.teamMembers)).toBe(true);
      expect(isUnlimited(enterprisePlan.limits.dataRetentionMonths)).toBe(true);
    });

    it('should unlock all features', () => {
      expect(enterprisePlan.features.dataImport).toBe(true);
      expect(enterprisePlan.features.emailReports).toBe(true);
      expect(enterprisePlan.features.apiAccess).toBe('full');
      expect(enterprisePlan.features.whiteLabel).toBe(true);
      expect(enterprisePlan.features.customDomain).toBe(true);
      expect(enterprisePlan.features.prioritySLA).toBe(true);
      expect(enterprisePlan.features.onboardingSupport).toBe(true);
      expect(enterprisePlan.features.supportLevel).toBe('dedicated');
    });

    it('should be custom pricing type', () => {
      expect(enterprisePlan.type).toBe('custom');
      expect(enterprisePlan.prices.custom).toBe(true);
    });
  });

  describe('Lifetime Plans', () => {
    it('should identify lifetime plans correctly', () => {
      expect(isLifetimePlan('lifetime_starter')).toBe(true);
      expect(isLifetimePlan('lifetime_growth')).toBe(true);
      expect(isLifetimePlan('lifetime_max')).toBe(true);
      expect(isLifetimePlan('starter')).toBe(false);
      expect(isLifetimePlan('growth')).toBe(false);
    });

    it('should have better limits than subscription equivalents', () => {
      const lifetimeStarter = SIMPLIFIED_PLANS.lifetime_starter;
      const lifetimeGrowth = SIMPLIFIED_PLANS.lifetime_growth;
      const starter = SIMPLIFIED_PLANS.starter;
      const growth = SIMPLIFIED_PLANS.growth;

      // Lifetime Starter vs Starter
      expect(lifetimeStarter.limits.eventsPerMonth).toBeGreaterThan(starter.limits.eventsPerMonth);
      expect(lifetimeStarter.limits.websites).toBeGreaterThan(starter.limits.websites);

      // Lifetime Pro vs Growth
      expect(lifetimeGrowth.limits.eventsPerMonth).toBeGreaterThan(growth.limits.eventsPerMonth);
      expect(lifetimeGrowth.limits.websites).toBeGreaterThan(growth.limits.websites);
    });

    it('should include premium features for lifetime plans', () => {
      const lifetimeStarter = SIMPLIFIED_PLANS.lifetime_starter;
      const lifetimeGrowth = SIMPLIFIED_PLANS.lifetime_growth;

      // Lifetime Starter gets Growth features
      expect(lifetimeStarter.features.dataImport).toBe(true);
      expect(lifetimeStarter.features.emailReports).toBe(true);
      expect(lifetimeStarter.features.apiAccess).toBe('full');

      // Lifetime Pro gets Enterprise features
      expect(lifetimeGrowth.features.whiteLabel).toBe(true);
      expect(lifetimeGrowth.features.customDomain).toBe(true);
      expect(lifetimeGrowth.features.prioritySLA).toBe(true);
    });
  });

  describe('Plan Helper Functions', () => {
    it('should get plan by ID', () => {
      expect(getPlan('free')).toEqual(SIMPLIFIED_PLANS.free);
      expect(getPlan('starter')).toEqual(SIMPLIFIED_PLANS.starter);
      expect(getPlan('nonexistent')).toBeNull();
    });

    it('should calculate pricing correctly', () => {
      expect(getPlanPrice('free', 'monthly')).toBe(0);
      expect(getPlanPrice('starter', 'monthly')).toBe(9);
      expect(getPlanPrice('starter', 'yearly')).toBe(90);
      expect(getPlanPrice('growth', 'monthly')).toBe(19);
      expect(getPlanPrice('growth', 'yearly')).toBe(190);
    });

    it('should handle unlimited values', () => {
      expect(isUnlimited(-1)).toBe(true);
      expect(isUnlimited(0)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
    });
  });

  describe('Plan Progression Logic', () => {
    it('should have logical progression in limits', () => {
      const plans = [SIMPLIFIED_PLANS.free, SIMPLIFIED_PLANS.starter, SIMPLIFIED_PLANS.growth];

      for (let i = 1; i < plans.length; i++) {
        const current = plans[i];
        const previous = plans[i - 1];

        // Each plan should have more events than the previous
        if (!isUnlimited(current.limits.eventsPerMonth)) {
          expect(current.limits.eventsPerMonth).toBeGreaterThan(previous.limits.eventsPerMonth);
        }

        // Each plan should allow more websites
        if (!isUnlimited(current.limits.websites)) {
          expect(current.limits.websites).toBeGreaterThan(previous.limits.websites);
        }

        // Each plan should have longer retention
        if (!isUnlimited(current.limits.dataRetentionMonths)) {
          expect(current.limits.dataRetentionMonths).toBeGreaterThanOrEqual(
            previous.limits.dataRetentionMonths,
          );
        }
      }
    });

    it('should have logical pricing progression', () => {
      expect(SIMPLIFIED_PLANS.free.prices.monthly).toBe(0);
      expect(SIMPLIFIED_PLANS.starter.prices.monthly).toBeGreaterThan(
        SIMPLIFIED_PLANS.free.prices.monthly,
      );
      expect(SIMPLIFIED_PLANS.growth.prices.monthly).toBeGreaterThan(
        SIMPLIFIED_PLANS.starter.prices.monthly,
      );
    });
  });
});
