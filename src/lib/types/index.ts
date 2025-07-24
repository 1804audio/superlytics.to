// Central export file for all Stripe integration types

// Re-export from existing types file
export * from '../types';

// Re-export Stripe-specific types
export * from './stripe-api';
export * from './stripe-webhooks';

// Re-export plan configuration types
export * from '../config/simplified-plans';

// Re-export Stripe service types
export * from '../stripe';
export * from '../services/simple-usage-manager';

// Additional utility types for Stripe integration
export interface StripeIntegrationConfig {
  secretKey: string;
  webhookSecret: string;
  publicKey?: string;
  apiVersion: string;
}

export interface BillingPeriod {
  start: Date;
  end: Date;
  daysRemaining: number;
  isExpired: boolean;
}

export interface PlanLimitsStatus {
  events: {
    used: number;
    limit: number;
    percentage: number;
    isOverLimit: boolean;
  };
  websites: {
    used: number;
    limit: number;
    percentage: number;
    isOverLimit: boolean;
  };
  teamMembers: {
    used: number;
    limit: number;
    percentage: number;
    isOverLimit: boolean;
  };
}
