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

  describe('Hobby Plan Limitations', () => {
    const hobbyPlan = SIMPLIFIED_PLANS.hobby;

    it('should have 10x more events than free plan', () => {
      expect(hobbyPlan.limits.eventsPerMonth).toBe(100000);
      expect(hobbyPlan.limits.eventsPerMonth).toBe(
        SIMPLIFIED_PLANS.free.limits.eventsPerMonth * 10,
      );
    });

    it('should allow multiple websites', () => {
      expect(hobbyPlan.limits.websites).toBe(5);
      expect(hobbyPlan.limits.websites).toBeGreaterThan(SIMPLIFIED_PLANS.free.limits.websites);
    });

    it('should allow team collaboration', () => {
      expect(hobbyPlan.limits.teamMembers).toBe(3);
      expect(hobbyPlan.limits.teamMembers).toBeGreaterThan(
        SIMPLIFIED_PLANS.free.limits.teamMembers,
      );
    });

    it('should have 3 years data retention', () => {
      expect(hobbyPlan.limits.dataRetentionMonths).toBe(36);
      expect(hobbyPlan.limits.dataRetentionMonths).toBeGreaterThan(
        SIMPLIFIED_PLANS.free.limits.dataRetentionMonths,
      );
    });

    it('should still restrict premium features', () => {
      expect(hobbyPlan.features.dataImport).toBe(false);
      expect(hobbyPlan.features.emailReports).toBe(false);
      expect(hobbyPlan.features.whiteLabel).toBe(false);
      expect(hobbyPlan.features.customDomain).toBe(false);
    });
  });

  describe('Pro Plan Features', () => {
    const proPlan = SIMPLIFIED_PLANS.pro;

    it('should have significantly higher limits', () => {
      expect(proPlan.limits.eventsPerMonth).toBe(1000000);
      expect(proPlan.limits.websites).toBe(25);
      expect(proPlan.limits.teamMembers).toBe(10);
      expect(proPlan.limits.dataRetentionMonths).toBe(60); // 5 years
    });

    it('should unlock pro features', () => {
      expect(proPlan.features.dataImport).toBe(true);
      expect(proPlan.features.emailReports).toBe(true);
      expect(proPlan.features.apiAccess).toBe('full');
      expect(proPlan.features.supportLevel).toBe('email');
    });

    it('should still restrict enterprise features', () => {
      expect(proPlan.features.whiteLabel).toBe(false);
      expect(proPlan.features.customDomain).toBe(false);
      expect(proPlan.features.prioritySLA).toBe(false);
      expect(proPlan.features.onboardingSupport).toBe(false);
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
      expect(isLifetimePlan('lifetime_pro')).toBe(true);
      expect(isLifetimePlan('lifetime_max')).toBe(true);
      expect(isLifetimePlan('hobby')).toBe(false);
      expect(isLifetimePlan('pro')).toBe(false);
    });

    it('should have better limits than subscription equivalents', () => {
      const lifetimeStarter = SIMPLIFIED_PLANS.lifetime_starter;
      const lifetimePro = SIMPLIFIED_PLANS.lifetime_pro;
      const hobby = SIMPLIFIED_PLANS.hobby;
      const pro = SIMPLIFIED_PLANS.pro;

      // Lifetime Starter vs Hobby
      expect(lifetimeStarter.limits.eventsPerMonth).toBeGreaterThan(hobby.limits.eventsPerMonth);
      expect(lifetimeStarter.limits.websites).toBeGreaterThan(hobby.limits.websites);

      // Lifetime Pro vs Pro
      expect(lifetimePro.limits.eventsPerMonth).toBeGreaterThan(pro.limits.eventsPerMonth);
      expect(lifetimePro.limits.websites).toBeGreaterThan(pro.limits.websites);
    });

    it('should include premium features for lifetime plans', () => {
      const lifetimeStarter = SIMPLIFIED_PLANS.lifetime_starter;
      const lifetimePro = SIMPLIFIED_PLANS.lifetime_pro;

      // Lifetime Starter gets Pro features
      expect(lifetimeStarter.features.dataImport).toBe(true);
      expect(lifetimeStarter.features.emailReports).toBe(true);
      expect(lifetimeStarter.features.apiAccess).toBe('full');

      // Lifetime Pro gets Enterprise features
      expect(lifetimePro.features.whiteLabel).toBe(true);
      expect(lifetimePro.features.customDomain).toBe(true);
      expect(lifetimePro.features.prioritySLA).toBe(true);
    });
  });

  describe('Plan Helper Functions', () => {
    it('should get plan by ID', () => {
      expect(getPlan('free')).toEqual(SIMPLIFIED_PLANS.free);
      expect(getPlan('hobby')).toEqual(SIMPLIFIED_PLANS.hobby);
      expect(getPlan('nonexistent')).toBeNull();
    });

    it('should calculate pricing correctly', () => {
      expect(getPlanPrice('free', 'monthly')).toBe(0);
      expect(getPlanPrice('hobby', 'monthly')).toBe(9);
      expect(getPlanPrice('hobby', 'yearly')).toBe(90);
      expect(getPlanPrice('pro', 'monthly')).toBe(19);
      expect(getPlanPrice('pro', 'yearly')).toBe(190);
    });

    it('should handle unlimited values', () => {
      expect(isUnlimited(-1)).toBe(true);
      expect(isUnlimited(0)).toBe(false);
      expect(isUnlimited(100)).toBe(false);
    });
  });

  describe('Plan Progression Logic', () => {
    it('should have logical progression in limits', () => {
      const plans = [SIMPLIFIED_PLANS.free, SIMPLIFIED_PLANS.hobby, SIMPLIFIED_PLANS.pro];

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
      expect(SIMPLIFIED_PLANS.hobby.prices.monthly).toBeGreaterThan(
        SIMPLIFIED_PLANS.free.prices.monthly,
      );
      expect(SIMPLIFIED_PLANS.pro.prices.monthly).toBeGreaterThan(
        SIMPLIFIED_PLANS.hobby.prices.monthly,
      );
    });
  });
});
