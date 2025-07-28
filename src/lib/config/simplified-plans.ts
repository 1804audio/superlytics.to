export interface SimplifiedPlanLimits {
  // Core Limits (only 2 metrics to track!)
  eventsPerMonth: number; // -1 for unlimited
  websites: number; // -1 for unlimited
  teamMembers: number; // -1 for unlimited

  // Data Management
  dataRetentionMonths: number; // -1 for forever
  apiKeys: number; // -1 for unlimited
}

export interface SimplifiedPlanFeatures {
  // Core Features (available to all)
  basicAnalytics: true; // Always true
  reports: true; // Always true
  privacy: true; // Always true
  dataExport: true; // Always true

  // Differentiating Features (plan-specific)
  dataImport: boolean;
  emailReports: boolean;
  apiAccess: 'limited' | 'full';
  whiteLabel: boolean;
  customDomain: boolean;
  prioritySLA: boolean;
  onboardingSupport: boolean;
  apiKeys: boolean; // New feature

  // Support Level
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

export interface PlanConfiguration {
  id: string;
  name: string;
  type: 'subscription' | 'lifetime' | 'custom';
  prices: {
    monthly?: number;
    yearly?: number;
    lifetime?: number;
    appsumo?: number;
    custom?: boolean;
  };
  limits: SimplifiedPlanLimits;
  features: SimplifiedPlanFeatures;
}

export const SIMPLIFIED_PLANS: Record<string, PlanConfiguration> = {
  // Free Plan
  free: {
    id: 'free',
    name: 'Free',
    type: 'subscription',
    prices: {
      monthly: 0,
      yearly: 0,
    },
    limits: {
      eventsPerMonth: 10000, // 10k events
      websites: 1, // Single website
      teamMembers: 1, // Solo user
      dataRetentionMonths: 6,
      apiKeys: 0, // No API keys for free plan
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: false,
      emailReports: false,
      apiAccess: 'limited',
      apiKeys: false, // No API key creation
      whiteLabel: false,
      customDomain: false,
      prioritySLA: false,
      onboardingSupport: false,
      supportLevel: 'community',
    },
  },

  // Regular Subscription Plans
  starter: {
    id: 'starter',
    name: 'Starter',
    type: 'subscription',
    prices: {
      monthly: 9,
      yearly: 90, // 17% discount
    },
    limits: {
      eventsPerMonth: 100000, // 100k
      websites: 5, // Increased from 3
      teamMembers: 3, // Added as requested
      dataRetentionMonths: 36, // 3 years as requested
      apiKeys: 2, // Limited API keys for starter
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: false,
      emailReports: false,
      apiAccess: 'limited',
      apiKeys: true, // API key creation allowed
      whiteLabel: false,
      customDomain: false,
      prioritySLA: false,
      onboardingSupport: false,
      supportLevel: 'community',
    },
  },

  growth: {
    id: 'growth',
    name: 'Growth',
    type: 'subscription',
    prices: {
      monthly: 19,
      yearly: 190,
    },
    limits: {
      eventsPerMonth: 1000000, // 1M
      websites: 25, // Generous limit
      teamMembers: 10, // Reasonable team size
      dataRetentionMonths: 60, // 5 years
      apiKeys: 10, // Full API key access
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true, // ✅ Growth feature
      emailReports: true, // ✅ Growth feature
      apiAccess: 'full',
      apiKeys: true, // Full API key creation
      whiteLabel: false,
      customDomain: false,
      prioritySLA: false,
      onboardingSupport: false,
      supportLevel: 'email',
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    type: 'custom',
    prices: { custom: true },
    limits: {
      eventsPerMonth: -1, // Unlimited
      websites: -1, // Unlimited
      teamMembers: -1, // Unlimited
      dataRetentionMonths: -1, // Forever
      apiKeys: -1, // Unlimited API keys
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true,
      emailReports: true,
      apiAccess: 'full',
      apiKeys: true, // Full API key access
      whiteLabel: true, // ✅ Enterprise feature
      customDomain: true, // ✅ Enterprise feature
      prioritySLA: true, // ✅ Enterprise feature
      onboardingSupport: true, // ✅ Enterprise feature
      supportLevel: 'dedicated',
    },
  },

  // AppSumo Lifetime Plans
  lifetime_starter: {
    id: 'lifetime_starter',
    name: 'Starter Lifetime',
    type: 'lifetime',
    prices: {
      lifetime: 89,
      appsumo: 69, // AppSumo special price
    },
    limits: {
      eventsPerMonth: 250000, // 2.5x Starter
      websites: 10, // 2x Starter
      teamMembers: 5, // Better than Starter
      dataRetentionMonths: 24, // 2 years
      apiKeys: 5, // Lifetime benefit
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true, // ✅ Lifetime benefit
      emailReports: true, // ✅ Lifetime benefit
      apiAccess: 'full', // ✅ Lifetime benefit
      apiKeys: true, // ✅ Lifetime benefit
      whiteLabel: false,
      customDomain: false,
      prioritySLA: false,
      onboardingSupport: false,
      supportLevel: 'email', // Better than Starter
    },
  },

  lifetime_growth: {
    id: 'lifetime_growth',
    name: 'Growth Lifetime',
    type: 'lifetime',
    prices: {
      lifetime: 179,
      appsumo: 138,
    },
    limits: {
      eventsPerMonth: 2000000, // 2x Growth
      websites: 50, // 2x Growth
      teamMembers: 25, // 2.5x Growth
      dataRetentionMonths: -1, // Forever
      apiKeys: 25, // Enhanced for lifetime
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true,
      emailReports: true,
      apiAccess: 'full',
      apiKeys: true, // Full access
      whiteLabel: true, // ✅ Lifetime benefit
      customDomain: true, // ✅ Lifetime benefit
      prioritySLA: true, // ✅ Lifetime benefit
      onboardingSupport: false,
      supportLevel: 'priority',
    },
  },

  lifetime_max: {
    id: 'lifetime_max',
    name: 'Max Lifetime',
    type: 'lifetime',
    prices: {
      lifetime: 299,
      appsumo: 207, // 3-code deal on AppSumo
    },
    limits: {
      eventsPerMonth: 5000000, // 5x Growth
      websites: 100, // 4x Growth
      teamMembers: 50, // 5x Growth
      dataRetentionMonths: -1, // Forever
      apiKeys: -1, // Unlimited for max plan
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true,
      emailReports: true,
      apiAccess: 'full',
      apiKeys: true, // Full unlimited access
      whiteLabel: true,
      customDomain: true,
      prioritySLA: true,
      onboardingSupport: true, // ✅ Max benefit
      supportLevel: 'dedicated',
    },
  },
};

// Helper functions
export function getPlan(planId: string): PlanConfiguration | null {
  return SIMPLIFIED_PLANS[planId] || null;
}

export function isLifetimePlan(planId: string): boolean {
  return planId.startsWith('lifetime_');
}

export function getAppSumoPrice(planId: string): number {
  const plan = getPlan(planId);
  return plan?.prices?.appsumo || plan?.prices?.lifetime || 0;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function getPlanPrice(planId: string, interval: 'monthly' | 'yearly' | 'lifetime'): number {
  const plan = getPlan(planId);
  if (!plan || plan.type === 'custom') return 0;

  if (interval === 'yearly' && plan.prices.monthly) {
    return plan.prices.yearly || plan.prices.monthly * 12 * 0.83; // 17% discount
  }

  if (interval === 'monthly') return plan.prices.monthly || 0;
  if (interval === 'lifetime') return plan.prices.lifetime || 0;

  return 0;
}

export function getAllPlans(): PlanConfiguration[] {
  return Object.values(SIMPLIFIED_PLANS);
}

export function getSubscriptionPlans(): PlanConfiguration[] {
  return getAllPlans().filter(plan => plan.type === 'subscription');
}

export function getLifetimePlans(): PlanConfiguration[] {
  return getAllPlans().filter(plan => plan.type === 'lifetime');
}

// Note: getPlanByStripeId moved to server-side utilities since price IDs are now environment-based

export function getRecommendedPlan(monthlyEvents: number): PlanConfiguration {
  const plans = getSubscriptionPlans().sort(
    (a, b) => a.limits.eventsPerMonth - b.limits.eventsPerMonth,
  );

  // Find the first plan that can handle the event count
  for (const plan of plans) {
    if (isUnlimited(plan.limits.eventsPerMonth) || plan.limits.eventsPerMonth >= monthlyEvents) {
      return plan;
    }
  }

  // If no plan can handle it, return enterprise
  return SIMPLIFIED_PLANS.enterprise;
}

export function getPlanMode(plan: PlanConfiguration): 'subscription' | 'payment' {
  return plan.type === 'lifetime' ? 'payment' : 'subscription';
}
