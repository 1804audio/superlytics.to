export interface SimplifiedPlanLimits {
  // Core Limits (only 2 metrics to track!)
  eventsPerMonth: number; // -1 for unlimited
  websites: number; // -1 for unlimited
  teamMembers: number; // -1 for unlimited

  // Data Management
  dataRetentionMonths: number; // -1 for forever
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
  stripeIds: {
    monthly?: string;
    yearly?: string;
    lifetime?: string;
  };
  limits: SimplifiedPlanLimits;
  features: SimplifiedPlanFeatures;
}

export const SIMPLIFIED_PLANS: Record<string, PlanConfiguration> = {
  // Regular Subscription Plans
  hobby: {
    id: 'hobby',
    name: 'Hobby',
    type: 'subscription',
    prices: {
      monthly: 9,
      yearly: 90, // 17% discount
    },
    stripeIds: {
      monthly: 'price_1RoVBJQAmWLtKTXWEv6JtObj',
      yearly: 'price_1RoVBJQAmWLtKTXWeuZJeqpI',
    },
    limits: {
      eventsPerMonth: 100000, // 100k
      websites: 5, // Increased from 3
      teamMembers: 3, // Added as requested
      dataRetentionMonths: 6,
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: false,
      emailReports: false,
      apiAccess: 'limited',
      whiteLabel: false,
      customDomain: false,
      prioritySLA: false,
      onboardingSupport: false,
      supportLevel: 'community',
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    type: 'subscription',
    prices: {
      monthly: 19,
      yearly: 190,
    },
    stripeIds: {
      monthly: 'price_1RoVBKQAmWLtKTXWl2AROSCJ',
      yearly: 'price_1RoVBKQAmWLtKTXW9Vm1ouMS',
    },
    limits: {
      eventsPerMonth: 1000000, // 1M
      websites: 25, // Generous limit
      teamMembers: 10, // Reasonable team size
      dataRetentionMonths: 60, // 5 years
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true, // ✅ Pro feature
      emailReports: true, // ✅ Pro feature
      apiAccess: 'full',
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
    stripeIds: {},
    limits: {
      eventsPerMonth: -1, // Unlimited
      websites: -1, // Unlimited
      teamMembers: -1, // Unlimited
      dataRetentionMonths: -1, // Forever
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true,
      emailReports: true,
      apiAccess: 'full',
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
    stripeIds: {
      lifetime: 'price_1RoUoUQAmWLtKTXWFMYzRdai',
    },
    limits: {
      eventsPerMonth: 250000, // 2.5x Hobby
      websites: 10, // 2x Hobby
      teamMembers: 5, // Better than Hobby
      dataRetentionMonths: 24, // 2 years
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true, // ✅ Lifetime benefit
      emailReports: true, // ✅ Lifetime benefit
      apiAccess: 'full', // ✅ Lifetime benefit
      whiteLabel: false,
      customDomain: false,
      prioritySLA: false,
      onboardingSupport: false,
      supportLevel: 'email', // Better than Hobby
    },
  },

  lifetime_pro: {
    id: 'lifetime_pro',
    name: 'Pro Lifetime',
    type: 'lifetime',
    prices: {
      lifetime: 179,
      appsumo: 138,
    },
    stripeIds: {
      lifetime: 'price_1RoUoiQAmWLtKTXW0m5z801x',
    },
    limits: {
      eventsPerMonth: 2000000, // 2x Pro
      websites: 50, // 2x Pro
      teamMembers: 25, // 2.5x Pro
      dataRetentionMonths: -1, // Forever
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true,
      emailReports: true,
      apiAccess: 'full',
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
    stripeIds: {
      lifetime: 'price_1RoUotQAmWLtKTXWcrnT1iBt',
    },
    limits: {
      eventsPerMonth: 5000000, // 5x Pro
      websites: 100, // 4x Pro
      teamMembers: 50, // 5x Pro
      dataRetentionMonths: -1, // Forever
    },
    features: {
      basicAnalytics: true,
      reports: true,
      privacy: true,
      dataExport: true,
      dataImport: true,
      emailReports: true,
      apiAccess: 'full',
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

export function getPlanByStripeId(stripeId: string): PlanConfiguration | null {
  for (const plan of getAllPlans()) {
    if (Object.values(plan.stripeIds).includes(stripeId)) {
      return plan;
    }
  }
  return null;
}
