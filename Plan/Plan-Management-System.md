# Superlytics Plan Management & Usage Limitation System
**Version**: 1.0  
**Date**: July 2025  
**Project**: Superlytics SaaS - Plan-Based Feature & Usage Management  

---

## Table of Contents

1. [Plan Architecture Overview](#plan-architecture-overview)
2. [Database Schema for Usage Tracking](#database-schema-for-usage-tracking)
3. [Plan Types & Limitations](#plan-types--limitations)
4. [Usage Tracking System](#usage-tracking-system)
5. [Middleware & Access Control](#middleware--access-control)
6. [Real-Time Usage Monitoring](#real-time-usage-monitoring)
7. [Data Retention Management](#data-retention-management)
8. [Implementation Code](#implementation-code)
9. [Frontend Usage Components](#frontend-usage-components)
10. [Billing Integration](#billing-integration)

---

## Plan Architecture Overview

### Plan Types Structure
```typescript
interface PlanConfiguration {
  id: string;
  name: string;
  type: 'subscription' | 'lifetime' | 'usage_based';
  price: number;
  interval?: 'month' | 'year' | null; // null for lifetime
  stripeIds: {
    monthly?: string;
    yearly?: string;
    lifetime?: string;
  };
  limits: PlanLimits;
  features: PlanFeatures;
}

interface PlanLimits {
  // Core Analytics Limits
  pageViews: number; // -1 for unlimited
  websites: number;
  dataRetentionDays: number;
  
  // Team & Collaboration
  teamMembers: number;
  teamWebsites: number;
  
  // API & Export Limits
  apiCalls: number; // per month
  dataExports: number; // per month
  
  // Advanced Features
  customEvents: number;
  customDomains: number;
  whiteLabel: boolean;
  
  // Support Level
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
  
  // Real-time Features
  realTimeUsers: number; // concurrent users
  alertsCount: number; // custom alerts
}

interface PlanFeatures {
  // Core Features
  basicAnalytics: boolean;
  advancedAnalytics: boolean;
  customDashboards: boolean;
  
  // Data Features
  rawDataAccess: boolean;
  dataExport: boolean;
  apiAccess: boolean;
  
  // Collaboration
  teamCollaboration: boolean;
  roleManagement: boolean;
  
  // Customization
  customBranding: boolean;
  customDomains: boolean;
  whiteLabel: boolean;
  
  // Integrations
  webhooks: boolean;
  slackIntegration: boolean;
  emailReports: boolean;
  
  // Advanced
  anomalyDetection: boolean;
  customAlerts: boolean;
  advancedSegmentation: boolean;
}
```

### Plan Configuration
**File**: `src/lib/config/plans.ts`

```typescript
export const PLAN_CONFIGS: Record<string, PlanConfiguration> = {
  free: {
    id: 'free',
    name: 'Free',
    type: 'subscription',
    price: 0,
    interval: 'month',
    stripeIds: {},
    limits: {
      pageViews: 10000,
      websites: 1,
      dataRetentionDays: 30,
      teamMembers: 1,
      teamWebsites: 1,
      apiCalls: 1000,
      dataExports: 2,
      customEvents: 10,
      customDomains: 0,
      whiteLabel: false,
      supportLevel: 'community',
      realTimeUsers: 100,
      alertsCount: 1,
    },
    features: {
      basicAnalytics: true,
      advancedAnalytics: false,
      customDashboards: false,
      rawDataAccess: false,
      dataExport: true,
      apiAccess: false,
      teamCollaboration: false,
      roleManagement: false,
      customBranding: false,
      customDomains: false,
      whiteLabel: false,
      webhooks: false,
      slackIntegration: false,
      emailReports: false,
      anomalyDetection: false,
      customAlerts: false,
      advancedSegmentation: false,
    },
  },

  starter: {
    id: 'starter',
    name: 'Starter',
    type: 'subscription',
    price: 15,
    interval: 'month',
    stripeIds: {
      monthly: 'price_starter_monthly',
      yearly: 'price_starter_yearly',
    },
    limits: {
      pageViews: 100000,
      websites: 5,
      dataRetentionDays: 90,
      teamMembers: 3,
      teamWebsites: 5,
      apiCalls: 10000,
      dataExports: 10,
      customEvents: 50,
      customDomains: 1,
      whiteLabel: false,
      supportLevel: 'email',
      realTimeUsers: 500,
      alertsCount: 5,
    },
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      customDashboards: true,
      rawDataAccess: false,
      dataExport: true,
      apiAccess: true,
      teamCollaboration: true,
      roleManagement: true,
      customBranding: false,
      customDomains: true,
      whiteLabel: false,
      webhooks: true,
      slackIntegration: true,
      emailReports: true,
      anomalyDetection: false,
      customAlerts: true,
      advancedSegmentation: true,
    },
  },

  professional: {
    id: 'professional',
    name: 'Professional',
    type: 'subscription',
    price: 49,
    interval: 'month',
    stripeIds: {
      monthly: 'price_professional_monthly',
      yearly: 'price_professional_yearly',
    },
    limits: {
      pageViews: 1000000,
      websites: 20,
      dataRetentionDays: 365,
      teamMembers: 10,
      teamWebsites: 20,
      apiCalls: 100000,
      dataExports: 50,
      customEvents: 200,
      customDomains: 5,
      whiteLabel: true,
      supportLevel: 'priority',
      realTimeUsers: 2000,
      alertsCount: 20,
    },
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      customDashboards: true,
      rawDataAccess: true,
      dataExport: true,
      apiAccess: true,
      teamCollaboration: true,
      roleManagement: true,
      customBranding: true,
      customDomains: true,
      whiteLabel: true,
      webhooks: true,
      slackIntegration: true,
      emailReports: true,
      anomalyDetection: true,
      customAlerts: true,
      advancedSegmentation: true,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    type: 'subscription',
    price: 199,
    interval: 'month',
    stripeIds: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly',
    },
    limits: {
      pageViews: -1, // unlimited
      websites: -1,
      dataRetentionDays: -1, // unlimited
      teamMembers: -1,
      teamWebsites: -1,
      apiCalls: -1,
      dataExports: -1,
      customEvents: -1,
      customDomains: -1,
      whiteLabel: true,
      supportLevel: 'dedicated',
      realTimeUsers: -1,
      alertsCount: -1,
    },
    features: {
      basicAnalytics: true,
      advancedAnalytics: true,
      customDashboards: true,
      rawDataAccess: true,
      dataExport: true,
      apiAccess: true,
      teamCollaboration: true,
      roleManagement: true,
      customBranding: true,
      customDomains: true,
      whiteLabel: true,
      webhooks: true,
      slackIntegration: true,
      emailReports: true,
      anomalyDetection: true,
      customAlerts: true,
      advancedSegmentation: true,
    },
  },

  // Lifetime Plans
  lifetime_starter: {
    id: 'lifetime_starter',
    name: 'Lifetime Starter',
    type: 'lifetime',
    price: 299,
    interval: null,
    stripeIds: {
      lifetime: 'price_lifetime_starter',
    },
    limits: {
      ...PLAN_CONFIGS.starter.limits,
      dataRetentionDays: 365, // Better retention for lifetime
    },
    features: {
      ...PLAN_CONFIGS.starter.features,
    },
  },

  lifetime_professional: {
    id: 'lifetime_professional',
    name: 'Lifetime Professional',
    type: 'lifetime',
    price: 999,
    interval: null,
    stripeIds: {
      lifetime: 'price_lifetime_professional',
    },
    limits: {
      ...PLAN_CONFIGS.professional.limits,
      dataRetentionDays: -1, // Unlimited retention
    },
    features: {
      ...PLAN_CONFIGS.professional.features,
    },
  },
};

// Helper functions
export function getPlanConfig(planId: string): PlanConfiguration | null {
  return PLAN_CONFIGS[planId] || null;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function getPlanPrice(planId: string, interval: 'monthly' | 'yearly' | 'lifetime'): number {
  const plan = getPlanConfig(planId);
  if (!plan) return 0;
  
  if (interval === 'yearly' && plan.interval === 'month') {
    return plan.price * 12 * 0.83; // 17% discount for yearly
  }
  
  return plan.price;
}
```

---

## Database Schema for Usage Tracking

### Extended User Model
**File**: `prisma/schema.prisma`

```prisma
model User {
  // Existing fields...
  id          String    @id @unique @map("user_id") @db.Uuid
  username    String    @unique @db.VarChar(255)
  password    String    @db.VarChar(60)
  role        String    @map("role") @db.VarChar(50)
  
  // Subscription & Plan Fields
  customerId         String?   @map("stripe_customer_id") @db.VarChar(255)
  subscriptionId     String?   @map("stripe_subscription_id") @db.VarChar(255)
  planId            String    @default("free") @map("plan_id") @db.VarChar(50)
  planType          String    @default("subscription") @map("plan_type") @db.VarChar(20) // subscription, lifetime, usage_based
  subscriptionStatus String?   @map("subscription_status") @db.VarChar(50)
  hasAccess         Boolean   @default(true) @map("has_access")
  trialEndsAt       DateTime? @map("trial_ends_at") @db.Timestamptz(6)
  lifetimePurchase  Boolean   @default(false) @map("lifetime_purchase")
  
  // Usage Reset Tracking
  currentPeriodStart DateTime? @map("current_period_start") @db.Timestamptz(6)
  currentPeriodEnd   DateTime? @map("current_period_end") @db.Timestamptz(6)
  
  // Relations
  websiteUser       Website[]     @relation("user")
  websiteCreateUser Website[]     @relation("createUser")
  teamUser          TeamUser[]
  report            Report[]
  usageRecords      UsageRecord[]
  quotaOverrides    QuotaOverride[]

  @@index([planId])
  @@index([subscriptionStatus])
  @@index([currentPeriodEnd])
}

// Usage tracking for each user
model UsageRecord {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  websiteId String?   @map("website_id") @db.Uuid
  teamId    String?   @map("team_id") @db.Uuid
  
  // Usage Metrics
  pageViews     Int       @default(0) @map("page_views")
  apiCalls      Int       @default(0) @map("api_calls")
  dataExports   Int       @default(0) @map("data_exports")
  customEvents  Int       @default(0) @map("custom_events")
  
  // Time Period
  periodStart   DateTime  @map("period_start") @db.Timestamptz(6)
  periodEnd     DateTime  @map("period_end") @db.Timestamptz(6)
  recordType    String    @map("record_type") @db.VarChar(20) // monthly, daily, real_time
  
  // Metadata
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  user    User     @relation(fields: [userId], references: [id])
  website Website? @relation(fields: [websiteId], references: [id])

  @@index([userId, periodStart])
  @@index([websiteId, periodStart])
  @@index([recordType, periodStart])
  @@map("usage_record")
}

// Custom quota overrides for specific users
model QuotaOverride {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  limitType String    @map("limit_type") @db.VarChar(50) // pageViews, websites, etc.
  override  Int       @map("override_value") // -1 for unlimited
  reason    String?   @map("reason") @db.Text
  expiresAt DateTime? @map("expires_at") @db.Timestamptz(6)
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  createdBy String    @map("created_by") @db.Uuid

  user User @relation(fields: [userId], references: [id])

  @@index([userId, limitType])
  @@index([expiresAt])
  @@map("quota_override")
}

// Real-time usage tracking (Redis alternative)
model RealTimeUsage {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @map("user_id") @db.Uuid
  websiteId   String   @map("website_id") @db.Uuid
  metric      String   @map("metric") @db.VarChar(50)
  value       Int      @map("value")
  timestamp   DateTime @default(now()) @map("timestamp") @db.Timestamptz(6)
  
  @@index([userId, metric, timestamp])
  @@index([websiteId, metric, timestamp])
  @@index([timestamp]) // For cleanup
  @@map("real_time_usage")
}

// Data retention policies per website
model DataRetentionPolicy {
  id              String   @id @default(uuid()) @db.Uuid
  websiteId       String   @unique @map("website_id") @db.Uuid
  retentionDays   Int      @map("retention_days")
  lastCleanupAt   DateTime? @map("last_cleanup_at") @db.Timestamptz(6)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  website Website @relation(fields: [websiteId], references: [id])

  @@map("data_retention_policy")
}
```

---

## Usage Tracking System

### Usage Manager Service
**File**: `src/lib/services/usage-manager.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { getPlanConfig, isUnlimited } from '@/lib/config/plans';
import { redis } from '@/lib/redis';
import { addDays, startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export class UsageManager {
  
  // Track page view
  async trackPageView(userId: string, websiteId: string): Promise<boolean> {
    const canTrack = await this.checkLimit(userId, 'pageViews', 1);
    
    if (canTrack) {
      await this.incrementUsage(userId, 'pageViews', 1, websiteId);
      
      // Real-time tracking
      await this.updateRealTimeUsage(userId, websiteId, 'pageViews', 1);
    }
    
    return canTrack;
  }

  // Track API call
  async trackApiCall(userId: string): Promise<boolean> {
    const canTrack = await this.checkLimit(userId, 'apiCalls', 1);
    
    if (canTrack) {
      await this.incrementUsage(userId, 'apiCalls', 1);
    }
    
    return canTrack;
  }

  // Track data export
  async trackDataExport(userId: string): Promise<boolean> {
    const canTrack = await this.checkLimit(userId, 'dataExports', 1);
    
    if (canTrack) {
      await this.incrementUsage(userId, 'dataExports', 1);
    }
    
    return canTrack;
  }

  // Check if user can perform action
  async checkLimit(userId: string, limitType: keyof PlanLimits, increment: number = 1): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    // Check quota overrides first
    const override = await this.getQuotaOverride(userId, limitType);
    if (override) {
      if (isUnlimited(override.override)) return true;
      const currentUsage = await this.getCurrentUsage(userId, limitType);
      return (currentUsage + increment) <= override.override;
    }

    // Check plan limits
    const planConfig = getPlanConfig(user.planId);
    if (!planConfig) return false;

    const planLimit = planConfig.limits[limitType] as number;
    if (isUnlimited(planLimit)) return true;

    const currentUsage = await this.getCurrentUsage(userId, limitType);
    return (currentUsage + increment) <= planLimit;
  }

  // Get current usage for user
  async getCurrentUsage(userId: string, limitType: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    const periodStart = user.currentPeriodStart || startOfMonth(new Date());
    const periodEnd = user.currentPeriodEnd || endOfMonth(new Date());

    // Check Redis cache first
    const cacheKey = `usage:${userId}:${limitType}:${periodStart.toISOString()}`;
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    // Get from database
    const usage = await prisma.usageRecord.findFirst({
      where: {
        userId,
        recordType: 'monthly',
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    const currentUsage = usage?.[limitType as keyof typeof usage] as number || 0;
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, currentUsage.toString());
    
    return currentUsage;
  }

  // Increment usage counter
  async incrementUsage(userId: string, limitType: string, increment: number, websiteId?: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const periodStart = user.currentPeriodStart || startOfMonth(new Date());
    const periodEnd = user.currentPeriodEnd || endOfMonth(new Date());

    // Update database
    await prisma.usageRecord.upsert({
      where: {
        userId_periodStart: {
          userId,
          periodStart,
        },
      },
      update: {
        [limitType]: { increment },
        updatedAt: new Date(),
      },
      create: {
        userId,
        websiteId,
        periodStart,
        periodEnd,
        recordType: 'monthly',
        [limitType]: increment,
      },
    });

    // Update Redis cache
    const cacheKey = `usage:${userId}:${limitType}:${periodStart.toISOString()}`;
    await redis.del(cacheKey); // Invalidate cache
  }

  // Real-time usage tracking
  async updateRealTimeUsage(userId: string, websiteId: string, metric: string, value: number): Promise<void> {
    // Store in Redis for real-time access
    const redisKey = `realtime:${userId}:${websiteId}:${metric}`;
    await redis.hincrby(redisKey, 'count', value);
    await redis.expire(redisKey, 3600); // 1 hour TTL

    // Also store in database for persistence (batch this for performance)
    await prisma.realTimeUsage.create({
      data: {
        userId,
        websiteId,
        metric,
        value,
      },
    });
  }

  // Get usage summary for user
  async getUsageSummary(userId: string): Promise<UsageSummary> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const planConfig = getPlanConfig(user.planId);
    if (!planConfig) throw new Error('Plan configuration not found');

    const currentUsage = await this.getCurrentUsageAll(userId);
    const overrides = await this.getQuotaOverrides(userId);

    return {
      planId: user.planId,
      planName: planConfig.name,
      planType: planConfig.type,
      currentPeriod: {
        start: user.currentPeriodStart || startOfMonth(new Date()),
        end: user.currentPeriodEnd || endOfMonth(new Date()),
      },
      usage: Object.keys(planConfig.limits).reduce((acc, key) => {
        const limitType = key as keyof PlanLimits;
        const override = overrides[limitType];
        const limit = override ? override.override : planConfig.limits[limitType] as number;
        
        acc[limitType] = {
          current: currentUsage[limitType] || 0,
          limit: limit,
          unlimited: isUnlimited(limit),
          percentage: isUnlimited(limit) ? 0 : ((currentUsage[limitType] || 0) / limit) * 100,
          nearLimit: isUnlimited(limit) ? false : ((currentUsage[limitType] || 0) / limit) > 0.8,
          overLimit: isUnlimited(limit) ? false : (currentUsage[limitType] || 0) > limit,
        };
        return acc;
      }, {} as Record<keyof PlanLimits, UsageInfo>),
    };
  }

  // Helper methods
  private async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        planId: true,
        planType: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        lifetimePurchase: true,
      },
    });
  }

  private async getQuotaOverride(userId: string, limitType: string) {
    return prisma.quotaOverride.findFirst({
      where: {
        userId,
        limitType,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });
  }

  private async getQuotaOverrides(userId: string) {
    const overrides = await prisma.quotaOverride.findMany({
      where: {
        userId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return overrides.reduce((acc, override) => {
      acc[override.limitType] = override;
      return acc;
    }, {} as Record<string, any>);
  }

  private async getCurrentUsageAll(userId: string) {
    const user = await this.getUser(userId);
    if (!user) return {};

    const periodStart = user.currentPeriodStart || startOfMonth(new Date());
    const periodEnd = user.currentPeriodEnd || endOfMonth(new Date());

    const usage = await prisma.usageRecord.findFirst({
      where: {
        userId,
        recordType: 'monthly',
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    return {
      pageViews: usage?.pageViews || 0,
      apiCalls: usage?.apiCalls || 0,
      dataExports: usage?.dataExports || 0,
      customEvents: usage?.customEvents || 0,
    };
  }
}

// Types
interface UsageSummary {
  planId: string;
  planName: string;
  planType: string;
  currentPeriod: {
    start: Date;
    end: Date;
  };
  usage: Record<keyof PlanLimits, UsageInfo>;
}

interface UsageInfo {
  current: number;
  limit: number;
  unlimited: boolean;
  percentage: number;
  nearLimit: boolean;
  overLimit: boolean;
}

// Export singleton instance
export const usageManager = new UsageManager();
```

---

## Middleware & Access Control

### Plan-Based Middleware
**File**: `src/lib/middleware/plan-middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { usageManager } from '@/lib/services/usage-manager';
import { getPlanConfig } from '@/lib/config/plans';

// Middleware for checking plan features
export async function withPlanFeature(featureName: keyof PlanFeatures) {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);
    
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = auth.user;
    const planConfig = getPlanConfig(user.planId);
    
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 });
    }

    if (!planConfig.features[featureName]) {
      return NextResponse.json(
        { 
          error: 'Feature not available in your current plan',
          feature: featureName,
          currentPlan: planConfig.name,
          upgradeRequired: true
        }, 
        { status: 403 }
      );
    }

    return null; // Continue with request
  };
}

// Middleware for checking usage limits
export async function withUsageLimit(limitType: keyof PlanLimits, increment: number = 1) {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);
    
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canProceed = await usageManager.checkLimit(auth.user.id, limitType, increment);
    
    if (!canProceed) {
      const usageSummary = await usageManager.getUsageSummary(auth.user.id);
      const limitInfo = usageSummary.usage[limitType];
      
      return NextResponse.json(
        {
          error: 'Usage limit exceeded',
          limitType,
          current: limitInfo.current,
          limit: limitInfo.limit,
          planName: usageSummary.planName,
          upgradeRequired: true
        },
        { status: 429 } // Too Many Requests
      );
    }

    return null; // Continue with request
  };
}

// Combined middleware factory
export function createPlanMiddleware(options: {
  features?: (keyof PlanFeatures)[];
  limits?: { type: keyof PlanLimits; increment?: number }[];
}) {
  return async (request: NextRequest) => {
    // Check features
    if (options.features) {
      for (const feature of options.features) {
        const featureCheck = await withPlanFeature(feature)(request);
        if (featureCheck) return featureCheck;
      }
    }

    // Check limits
    if (options.limits) {
      for (const limit of options.limits) {
        const limitCheck = await withUsageLimit(limit.type, limit.increment)(request);
        if (limitCheck) return limitCheck;
      }
    }

    return null; // All checks passed
  };
}
```

### Usage in API Routes
**Example**: `src/app/api/websites/[id]/data/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { createPlanMiddleware } from '@/lib/middleware/plan-middleware';
import { parseRequest } from '@/lib/request';
import { usageManager } from '@/lib/services/usage-manager';
import { getWebsiteData } from '@/lib/queries/analytics';

const planMiddleware = createPlanMiddleware({
  features: ['rawDataAccess'],
  limits: [{ type: 'apiCalls', increment: 1 }],
});

export async function GET(request: NextRequest) {
  // Check plan restrictions
  const planCheck = await planMiddleware(request);
  if (planCheck) return planCheck;

  const { auth, query, error } = await parseRequest(request);
  if (error) return error();

  try {
    // Track the API call
    await usageManager.trackApiCall(auth.user.id);

    // Get the data
    const data = await getWebsiteData(query.websiteId, {
      startDate: query.startDate,
      endDate: query.endDate,
      includeRawData: true, // Only available with rawDataAccess feature
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}
```

---

## Data Retention Management

### Automated Data Cleanup Service
**File**: `src/lib/services/data-retention.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { getPlanConfig, isUnlimited } from '@/lib/config/plans';
import { subDays } from 'date-fns';
import { log } from '@/lib/debug';

const prisma = new PrismaClient();

export class DataRetentionManager {
  
  // Clean up expired data for all users
  async cleanupExpiredData(): Promise<void> {
    log('Starting data retention cleanup...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        planId: true,
        websiteUser: {
          select: { id: true }
        }
      }
    });

    for (const user of users) {
      await this.cleanupUserData(user.id, user.planId);
    }

    log('Data retention cleanup completed');
  }

  // Clean up data for specific user
  async cleanupUserData(userId: string, planId: string): Promise<void> {
    const planConfig = getPlanConfig(planId);
    if (!planConfig) return;

    const retentionDays = planConfig.limits.dataRetentionDays;
    if (isUnlimited(retentionDays)) return; // No cleanup needed

    const cutoffDate = subDays(new Date(), retentionDays);
    
    // Get user's websites
    const websites = await prisma.website.findMany({
      where: { userId },
      select: { id: true }
    });

    for (const website of websites) {
      await this.cleanupWebsiteData(website.id, cutoffDate);
    }

    log(`Cleaned up data for user ${userId}, retention: ${retentionDays} days`);
  }

  // Clean up specific website data
  async cleanupWebsiteData(websiteId: string, cutoffDate: Date): Promise<void> {
    const deleteCounts = {
      sessions: 0,
      events: 0,
      sessionData: 0,
    };

    // Delete old sessions
    const deletedSessions = await prisma.session.deleteMany({
      where: {
        websiteId,
        createdAt: { lt: cutoffDate }
      }
    });
    deleteCounts.sessions = deletedSessions.count;

    // Delete old events
    const deletedEvents = await prisma.websiteEvent.deleteMany({
      where: {
        websiteId,
        createdAt: { lt: cutoffDate }
      }
    });
    deleteCounts.events = deletedEvents.count;

    // Delete old session data
    const deletedSessionData = await prisma.sessionData.deleteMany({
      where: {
        website: { id: websiteId },
        createdAt: { lt: cutoffDate }
      }
    });
    deleteCounts.sessionData = deletedSessionData.count;

    // Update retention policy record
    await prisma.dataRetentionPolicy.upsert({
      where: { websiteId },
      update: {
        lastCleanupAt: new Date(),
      },
      create: {
        websiteId,
        retentionDays: Math.floor((new Date().getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24)),
        lastCleanupAt: new Date(),
      }
    });

    if (deleteCounts.sessions > 0 || deleteCounts.events > 0) {
      log(`Website ${websiteId} cleanup: ${deleteCounts.sessions} sessions, ${deleteCounts.events} events, ${deleteCounts.sessionData} session data deleted`);
    }
  }

  // Get retention status for website
  async getRetentionStatus(websiteId: string): Promise<RetentionStatus> {
    const website = await prisma.website.findUnique({
      where: { id: websiteId },
      include: {
        user: { select: { planId: true } }
      }
    });

    if (!website) throw new Error('Website not found');

    const planConfig = getPlanConfig(website.user.planId);
    if (!planConfig) throw new Error('Plan configuration not found');

    const retentionDays = planConfig.limits.dataRetentionDays;
    const unlimited = isUnlimited(retentionDays);

    // Get oldest data
    const oldestSession = await prisma.session.findFirst({
      where: { websiteId },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true }
    });

    const dataAge = oldestSession 
      ? Math.floor((new Date().getTime() - oldestSession.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    // Get cleanup history
    const retentionPolicy = await prisma.dataRetentionPolicy.findUnique({
      where: { websiteId }
    });

    return {
      websiteId,
      planId: website.user.planId,
      retentionDays: unlimited ? -1 : retentionDays,
      unlimited,
      currentDataAge: dataAge,
      lastCleanupAt: retentionPolicy?.lastCleanupAt || null,
      nextCleanupDue: unlimited ? null : subDays(new Date(), retentionDays),
      cleanupNeeded: !unlimited && dataAge > retentionDays,
    };
  }

  // Schedule cleanup job (to be called by cron job)
  async scheduleCleanup(): Promise<void> {
    // This would typically be called by a cron job or scheduled task
    // For now, we'll implement a simple version
    try {
      await this.cleanupExpiredData();
    } catch (error) {
      log('Error during scheduled cleanup:', error);
      throw error;
    }
  }
}

interface RetentionStatus {
  websiteId: string;
  planId: string;
  retentionDays: number;
  unlimited: boolean;
  currentDataAge: number;
  lastCleanupAt: Date | null;
  nextCleanupDue: Date | null;
  cleanupNeeded: boolean;
}

// Export singleton
export const dataRetentionManager = new DataRetentionManager();

// Cron job setup (would be in a separate file or service)
export function setupDataRetentionCron() {
  // Run cleanup daily at 2 AM
  // This would use node-cron or similar in production
  setInterval(async () => {
    const now = new Date();
    if (now.getHours() === 2 && now.getMinutes() === 0) {
      await dataRetentionManager.scheduleCleanup();
    }
  }, 60000); // Check every minute
}
```

---

## Frontend Usage Components

### Usage Dashboard Component
**File**: `src/components/billing/UsageDashboard.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/Progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, TrendingUp, Calendar, Zap } from 'react-icons/fa';
import { formatNumber, formatPercentage } from '@/lib/utils';

interface UsageDashboardProps {
  userId: string;
}

export function UsageDashboard({ userId }: UsageDashboardProps) {
  const { data: usageSummary, isLoading } = useQuery({
    queryKey: ['usage-summary', userId],
    queryFn: () => fetch(`/api/usage/${userId}`).then(res => res.json()),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <div className="animate-pulse">Loading usage data...</div>;
  }

  if (!usageSummary) {
    return <div className="text-red-500">Failed to load usage data</div>;
  }

  return (
    <div className="space-y-6">
      {/* Plan Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan: {usageSummary.planName}</span>
            <Badge variant={usageSummary.planType === 'lifetime' ? 'success' : 'default'}>
              {usageSummary.planType === 'lifetime' ? 'Lifetime' : 'Subscription'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <Calendar className="w-4 h-4" />
              <span>
                Period: {new Date(usageSummary.currentPeriod.start).toLocaleDateString()} - 
                {new Date(usageSummary.currentPeriod.end).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(usageSummary.usage).map(([key, usage]) => (
          <UsageCard
            key={key}
            title={formatLimitType(key)}
            usage={usage}
            onUpgrade={() => window.location.href = '/pricing'}
          />
        ))}
      </div>

      {/* Alerts */}
      <UsageAlerts usage={usageSummary.usage} planName={usageSummary.planName} />
    </div>
  );
}

// Individual usage card component
function UsageCard({ 
  title, 
  usage, 
  onUpgrade 
}: { 
  title: string; 
  usage: UsageInfo; 
  onUpgrade: () => void;
}) {
  const getStatusColor = (usage: UsageInfo) => {
    if (usage.unlimited) return 'text-green-600';
    if (usage.overLimit) return 'text-red-600';
    if (usage.nearLimit) return 'text-yellow-600';
    return 'text-blue-600';
  };

  const getProgressColor = (usage: UsageInfo) => {
    if (usage.overLimit) return 'bg-red-500';
    if (usage.nearLimit) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <Card className={usage.overLimit ? 'border-red-200 bg-red-50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-700">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Usage numbers */}
          <div className="flex items-baseline justify-between">
            <span className={`text-2xl font-bold ${getStatusColor(usage)}`}>
              {formatNumber(usage.current)}
            </span>
            {!usage.unlimited && (
              <span className="text-sm text-gray-500">
                of {formatNumber(usage.limit)}
              </span>
            )}
          </div>

          {/* Progress bar */}
          {!usage.unlimited && (
            <div className="space-y-1">
              <Progress 
                value={Math.min(usage.percentage, 100)} 
                className="h-2"
                color={getProgressColor(usage)}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatPercentage(usage.percentage / 100)}</span>
                {usage.overLimit && (
                  <span className="text-red-500 font-medium">Over limit!</span>
                )}
              </div>
            </div>
          )}

          {usage.unlimited && (
            <Badge variant="success" className="w-full justify-center">
              <Zap className="w-3 h-3 mr-1" />
              Unlimited
            </Badge>
          )}

          {/* Upgrade button for over limit */}
          {usage.overLimit && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={onUpgrade}
              className="w-full"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Upgrade Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Usage alerts component
function UsageAlerts({ 
  usage, 
  planName 
}: { 
  usage: Record<string, UsageInfo>; 
  planName: string;
}) {
  const overLimitItems = Object.entries(usage).filter(([_, u]) => u.overLimit);
  const nearLimitItems = Object.entries(usage).filter(([_, u]) => u.nearLimit && !u.overLimit);

  if (overLimitItems.length === 0 && nearLimitItems.length === 0) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center text-yellow-800">
          <AlertTriangle className="w-5 h-5 mr-2" />
          Usage Alerts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {overLimitItems.map(([key, usage]) => (
          <div key={key} className="p-3 bg-red-100 border border-red-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-800">
                {formatLimitType(key)} limit exceeded
              </span>
              <Badge variant="destructive">
                {formatNumber(usage.current)} / {formatNumber(usage.limit)}
              </Badge>
            </div>
            <p className="text-sm text-red-600 mt-1">
              You've reached your {planName} plan limit. Upgrade to continue using this feature.
            </p>
          </div>
        ))}

        {nearLimitItems.map(([key, usage]) => (
          <div key={key} className="p-3 bg-yellow-100 border border-yellow-200 rounded-md">
            <div className="flex items-center justify-between">
              <span className="font-medium text-yellow-800">
                {formatLimitType(key)} nearly at limit
              </span>
              <Badge variant="warning">
                {formatPercentage(usage.percentage / 100)}
              </Badge>
            </div>
            <p className="text-sm text-yellow-600 mt-1">
              You're at {Math.round(usage.percentage)}% of your {planName} plan limit.
            </p>
          </div>
        ))}

        <div className="pt-2 border-t border-yellow-200">
          <Button asChild className="w-full">
            <a href="/pricing">Upgrade Your Plan</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to format limit type names
function formatLimitType(key: string): string {
  const formatMap: Record<string, string> = {
    pageViews: 'Page Views',
    websites: 'Websites',
    dataRetentionDays: 'Data Retention',
    teamMembers: 'Team Members',
    apiCalls: 'API Calls',
    dataExports: 'Data Exports',
    customEvents: 'Custom Events',
    customDomains: 'Custom Domains',
    realTimeUsers: 'Real-time Users',
    alertsCount: 'Custom Alerts',
  };

  return formatMap[key] || key;
}
```

### Usage API Endpoint
**File**: `src/app/api/usage/[userId]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseRequest } from '@/lib/request';
import { usageManager } from '@/lib/services/usage-manager';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  const { auth, error } = await parseRequest(request);
  if (error) return error();

  // Check if user can access this usage data
  if (auth.user.id !== params.userId && !auth.user.isAdmin) {
    return NextResponse.json(
      { error: 'Access denied' },
      { status: 403 }
    );
  }

  try {
    const usageSummary = await usageManager.getUsageSummary(params.userId);
    return NextResponse.json(usageSummary);
  } catch (error) {
    console.error('Usage summary error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage summary' },
      { status: 500 }
    );
  }
}
```

---

## Billing Integration

### Plan Upgrade Component
**File**: `src/components/billing/PlanUpgrade.tsx`

```typescript
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, Star, Zap } from 'react-icons/fa';
import { PLAN_CONFIGS, getPlanPrice } from '@/lib/config/plans';

interface PlanUpgradeProps {
  currentPlanId: string;
  onUpgrade?: (planId: string) => void;
}

export function PlanUpgrade({ currentPlanId, onUpgrade }: PlanUpgradeProps) {
  const { mutate: createCheckout, isPending } = useMutation({
    mutationFn: async ({ planId, interval }: { planId: string; interval: 'monthly' | 'yearly' | 'lifetime' }) => {
      const plan = PLAN_CONFIGS[planId];
      const priceId = interval === 'yearly' 
        ? plan.stripeIds.yearly 
        : interval === 'lifetime'
        ? plan.stripeIds.lifetime
        : plan.stripeIds.monthly;

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceId,
          mode: interval === 'lifetime' ? 'payment' : 'subscription',
          successUrl: `${window.location.origin}/dashboard/billing/success`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) throw new Error('Failed to create checkout');
      
      const { url } = await response.json();
      window.location.href = url;
    },
  });

  const handleUpgrade = (planId: string, interval: 'monthly' | 'yearly' | 'lifetime') => {
    createCheckout({ planId, interval });
    onUpgrade?.(planId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Upgrade Your Plan</h2>
        <p className="text-gray-600 mt-2">Choose the plan that fits your needs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.values(PLAN_CONFIGS)
          .filter(plan => plan.id !== 'free') // Don't show free plan in upgrade
          .map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currentPlanId={currentPlanId}
              onUpgrade={handleUpgrade}
              isLoading={isPending}
            />
          ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  currentPlanId,
  onUpgrade,
  isLoading,
}: {
  plan: PlanConfiguration;
  currentPlanId: string;
  onUpgrade: (planId: string, interval: 'monthly' | 'yearly' | 'lifetime') => void;
  isLoading: boolean;
}) {
  const isCurrent = currentPlanId === plan.id;
  const isLifetime = plan.type === 'lifetime';
  const monthlyPrice = getPlanPrice(plan.id, 'monthly');
  const yearlyPrice = getPlanPrice(plan.id, 'yearly');

  return (
    <Card className={`relative ${isCurrent ? 'ring-2 ring-blue-500' : ''} ${plan.id === 'professional' ? 'border-blue-200 shadow-lg' : ''}`}>
      {plan.id === 'professional' && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-blue-500 text-white px-3 py-1">
            <Star className="w-3 h-3 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl font-bold">
          {plan.name}
        </CardTitle>
        
        {isLifetime ? (
          <div className="mt-2">
            <div className="text-3xl font-bold text-green-600">
              ${plan.price}
            </div>
            <div className="text-sm text-gray-500">one-time</div>
          </div>
        ) : (
          <div className="mt-2 space-y-1">
            <div className="text-3xl font-bold">
              ${monthlyPrice}
              <span className="text-sm font-normal text-gray-500">/month</span>
            </div>
            {yearlyPrice !== monthlyPrice && (
              <div className="text-sm text-green-600">
                ${Math.round(yearlyPrice)}/year (save 17%)
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key limits */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Page views</span>
            <span className="font-medium">
              {plan.limits.pageViews === -1 ? 'Unlimited' : plan.limits.pageViews.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Websites</span>
            <span className="font-medium">
              {plan.limits.websites === -1 ? 'Unlimited' : plan.limits.websites}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Data retention</span>
            <span className="font-medium">
              {plan.limits.dataRetentionDays === -1 ? 'Forever' : `${plan.limits.dataRetentionDays} days`}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Team members</span>
            <span className="font-medium">
              {plan.limits.teamMembers === -1 ? 'Unlimited' : plan.limits.teamMembers}
            </span>
          </div>
        </div>

        {/* Key features */}
        <div className="space-y-2 pt-2 border-t">
          {Object.entries(plan.features)
            .filter(([_, enabled]) => enabled)
            .slice(0, 5) // Show top 5 features
            .map(([feature, _]) => (
              <div key={feature} className="flex items-center text-sm">
                <Check className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                <span>{formatFeatureName(feature)}</span>
              </div>
            ))}
        </div>

        {/* Action buttons */}
        <div className="pt-4 space-y-2">
          {isCurrent ? (
            <Button disabled className="w-full">
              Current Plan
            </Button>
          ) : isLifetime ? (
            <Button
              onClick={() => onUpgrade(plan.id, 'lifetime')}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Buy Lifetime
            </Button>
          ) : (
            <>
              <Button
                onClick={() => onUpgrade(plan.id, 'monthly')}
                disabled={isLoading}
                className="w-full"
              >
                Start Monthly
              </Button>
              <Button
                onClick={() => onUpgrade(plan.id, 'yearly')}
                disabled={isLoading}
                variant="outline"
                className="w-full"
              >
                Start Yearly (Save 17%)
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatFeatureName(feature: string): string {
  const formatMap: Record<string, string> = {
    basicAnalytics: 'Basic Analytics',
    advancedAnalytics: 'Advanced Analytics',
    customDashboards: 'Custom Dashboards',
    rawDataAccess: 'Raw Data Access',
    dataExport: 'Data Export',
    apiAccess: 'API Access',
    teamCollaboration: 'Team Collaboration',
    roleManagement: 'Role Management',
    customBranding: 'Custom Branding',
    customDomains: 'Custom Domains',
    whiteLabel: 'White Label',
    webhooks: 'Webhooks',
    slackIntegration: 'Slack Integration',
    emailReports: 'Email Reports',
    anomalyDetection: 'Anomaly Detection',
    customAlerts: 'Custom Alerts',
    advancedSegmentation: 'Advanced Segmentation',
  };

  return formatMap[feature] || feature;
}
```

---

## Implementation Summary

This comprehensive plan management system provides:

### ✅ **Complete Usage Tracking**
- Real-time usage monitoring for all plan limits
- Automatic usage increments with API calls
- Redis caching for performance
- Historical usage data storage

### ✅ **Flexible Plan System**
- Subscription plans (monthly/yearly)
- Lifetime purchase options  
- Usage-based limitations
- Feature-based restrictions

### ✅ **Data Retention Management**
- Automatic cleanup based on plan limits
- Configurable retention policies
- Background cleanup jobs
- Retention status monitoring

### ✅ **Frontend Integration**
- Usage dashboard with real-time updates
- Plan upgrade interfaces
- Usage alerts and notifications
- Progress indicators and limits

### ✅ **Middleware Protection**
- API endpoint protection based on plan features
- Usage limit enforcement
- Automatic upgrade prompts
- Graceful error handling

This system will seamlessly integrate with your existing Stripe implementation to provide complete SaaS functionality with proper usage limitations and plan management.

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Design plan management architecture with usage limits", "status": "completed", "priority": "high"}, {"id": "2", "content": "Create database schema for usage tracking", "status": "completed", "priority": "high"}, {"id": "3", "content": "Implement middleware for plan-based restrictions", "status": "completed", "priority": "high"}, {"id": "4", "content": "Design lifetime vs subscription plan handling", "status": "completed", "priority": "high"}, {"id": "5", "content": "Create usage monitoring and alerts system", "status": "completed", "priority": "high"}]