# Superlytics Pricing Plan Management System
**Version**: 2.0 - Based on Actual Pricing Structure  
**Date**: July 2025  
**Project**: Superlytics SaaS - Event-Based Pricing Implementation

---

## Table of Contents

1. [Pricing Structure Analysis](#pricing-structure-analysis)
2. [Plan Configuration System](#plan-configuration-system)
3. [Event-Based Usage Tracking](#event-based-usage-tracking)
4. [Database Schema Design](#database-schema-design)
5. [Usage Management & Overage Billing](#usage-management--overage-billing)
6. [Feature Access Control](#feature-access-control)
7. [Implementation Code](#implementation-code)
8. [Migration Strategy](#migration-strategy)
9. [Stripe Integration](#stripe-integration)
10. [Frontend Components](#frontend-components)

---

## Pricing Structure Analysis

Based on the provided pricing image, here's the exact structure we need to implement:

### **Plan Overview**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│    Plan     │   Hobby     │     Pro     │ Enterprise  │
├─────────────┼─────────────┼─────────────┼─────────────┤
│    Price    │   $9/month  │  $19/month  │ Contact us  │
│   Events    │    100k     │   1 million │   Custom    │
│  Websites   │    Up to 3  │  Unlimited  │  Unlimited  │
│ Retention   │  6 months   │   5 years   │   Custom    │
│  Support    │ Community   │    Email    │ Enterprise  │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

### **Key Differentiators by Plan**

#### **Hobby Plan ($9/month)**
- ✅ **Core Features**: All basic analytics, reports, privacy features
- 📊 **Limits**: 100k events/month, 3 websites, 6-month retention
- 🚫 **Excluded**: Teams, data import, email reports, unlimited API
- 🆘 **Support**: Community only

#### **Pro Plan ($19/month)**
- ✅ **Everything in Hobby**, plus:
- 📊 **Expanded**: 1M events/month, unlimited websites & team members
- 💰 **Overage**: $0.00005 per additional event
- 🗄️ **Extended Retention**: 5 years
- ✉️ **Email Support & Reports**
- 🔄 **Data Import & Full API Access**

#### **Enterprise Plan (Custom)**
- ✅ **Everything in Pro**, plus:
- 🎯 **Custom**: Pricing, events, retention
- 🏢 **Enterprise Features**: SLA, dedicated support, onboarding
- 👨‍💼 **Assigned Support Engineer**

---

## Plan Configuration System

### **Updated Plan Configuration**
**File**: `src/lib/config/plans.ts`

```typescript
export interface PlanLimits {
  // Core Usage Limits
  eventsPerMonth: number; // -1 for unlimited/custom
  websites: number; // -1 for unlimited
  dataRetentionMonths: number; // -1 for unlimited/custom
  
  // Team Limits
  teamMembers: number; // -1 for unlimited, 0 for no teams
  
  // API Limits
  apiAccess: 'none' | 'limited' | 'full';
  
  // Overage Pricing
  overageEnabled: boolean;
  overagePricePerEvent?: number; // price per event over limit
}

export interface PlanFeatures {
  // Data Features
  dataExport: boolean;
  dataImport: boolean;
  
  // Analytics Features (most are available to all plans)
  customEvents: boolean;
  eventProperties: boolean;
  sessionProperties: boolean;
  realtimeEvents: boolean;
  customDashboards: boolean;
  
  // Reports (available to all plans)
  insights: boolean;
  funnelAnalysis: boolean;
  userRetention: boolean;
  utmParameters: boolean;
  goals: boolean;
  userJourney: boolean;
  revenue: boolean;
  attribution: boolean;
  
  // Team Features
  teams: boolean;
  
  // Communication
  emailReports: boolean;
  
  // Privacy (available to all plans)
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  noCookieBanners: boolean;
  
  // Support Level
  supportLevel: 'community' | 'email' | 'enterprise';
  
  // Enterprise Features
  uptimeSLA: boolean;
  onboardingAssistance: boolean;
  designatedSupportEngineer: boolean;
}

export const SUPERLYTICS_PLANS: Record<string, PlanConfiguration> = {
  hobby: {
    id: 'hobby',
    name: 'Hobby',
    type: 'subscription',
    price: 9,
    interval: 'month',
    stripeIds: {
      monthly: 'price_hobby_monthly',
      yearly: 'price_hobby_yearly', // 17% discount
    },
    limits: {
      eventsPerMonth: 100000, // 100k events
      websites: 3,
      dataRetentionMonths: 6,
      teamMembers: 0, // No teams
      apiAccess: 'limited',
      overageEnabled: false,
    },
    features: {
      // Data
      dataExport: true,
      dataImport: false, // ❌ Pro+ only
      
      // Analytics (all available)
      customEvents: true,
      eventProperties: true,
      sessionProperties: true,
      realtimeEvents: true,
      customDashboards: true,
      
      // Reports (all available)
      insights: true,
      funnelAnalysis: true,
      userRetention: true,
      utmParameters: true,
      goals: true,
      userJourney: true,
      revenue: true,
      attribution: true,
      
      // Team Features
      teams: false, // ❌ Pro+ only
      
      // Communication
      emailReports: false, // ❌ Pro+ only
      
      // Privacy (all available)
      gdprCompliant: true,
      ccpaCompliant: true,
      noCookieBanners: true,
      
      // Support
      supportLevel: 'community',
      uptimeSLA: false,
      onboardingAssistance: false,
      designatedSupportEngineer: false,
    },
  },

  pro: {
    id: 'pro',
    name: 'Pro',
    type: 'subscription',
    price: 19,
    interval: 'month',
    stripeIds: {
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly',
    },
    limits: {
      eventsPerMonth: 1000000, // 1 million events
      websites: -1, // Unlimited
      dataRetentionMonths: 60, // 5 years
      teamMembers: -1, // Unlimited
      apiAccess: 'full',
      overageEnabled: true,
      overagePricePerEvent: 0.00005, // $0.00005 per additional event
    },
    features: {
      // Data
      dataExport: true,
      dataImport: true, // ✅ Pro feature
      
      // Analytics (all available)
      customEvents: true,
      eventProperties: true,
      sessionProperties: true,
      realtimeEvents: true,
      customDashboards: true,
      
      // Reports (all available)
      insights: true,
      funnelAnalysis: true,
      userRetention: true,
      utmParameters: true,
      goals: true,
      userJourney: true,
      revenue: true,
      attribution: true,
      
      // Team Features
      teams: true, // ✅ Pro feature
      
      // Communication
      emailReports: true, // ✅ Pro feature
      
      // Privacy (all available)
      gdprCompliant: true,
      ccpaCompliant: true,
      noCookieBanners: true,
      
      // Support
      supportLevel: 'email',
      uptimeSLA: false,
      onboardingAssistance: false,
      designatedSupportEngineer: false,
    },
  },

  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    type: 'custom', // Contact-based pricing
    price: 0, // Custom pricing
    interval: null,
    stripeIds: {}, // No Stripe IDs - custom pricing
    limits: {
      eventsPerMonth: -1, // Custom
      websites: -1, // Unlimited
      dataRetentionMonths: -1, // Custom
      teamMembers: -1, // Unlimited
      apiAccess: 'full',
      overageEnabled: false, // Custom pricing handles this
    },
    features: {
      // Data
      dataExport: true,
      dataImport: true,
      
      // Analytics (all available)
      customEvents: true,
      eventProperties: true,
      sessionProperties: true,
      realtimeEvents: true,
      customDashboards: true,
      
      // Reports (all available)
      insights: true,
      funnelAnalysis: true,
      userRetention: true,
      utmParameters: true,
      goals: true,
      userJourney: true,
      revenue: true,
      attribution: true,
      
      // Team Features
      teams: true,
      
      // Communication
      emailReports: true,
      
      // Privacy (all available)
      gdprCompliant: true,
      ccpaCompliant: true,
      noCookieBanners: true,
      
      // Support
      supportLevel: 'enterprise',
      uptimeSLA: true, // ✅ Enterprise feature
      onboardingAssistance: true, // ✅ Enterprise feature
      designatedSupportEngineer: true, // ✅ Enterprise feature
    },
  },
};

// Helper functions
export function getPlanConfig(planId: string): PlanConfiguration | null {
  return SUPERLYTICS_PLANS[planId] || null;
}

export function isUnlimited(value: number): boolean {
  return value === -1;
}

export function getPlanPrice(planId: string, interval: 'monthly' | 'yearly'): number {
  const plan = getPlanConfig(planId);
  if (!plan || plan.type === 'custom') return 0;
  
  if (interval === 'yearly') {
    return plan.price * 12 * 0.83; // 17% discount for yearly
  }
  
  return plan.price;
}

export function calculateOverage(planId: string, eventsUsed: number): number {
  const plan = getPlanConfig(planId);
  if (!plan || !plan.limits.overageEnabled) return 0;
  
  const limit = plan.limits.eventsPerMonth;
  if (isUnlimited(limit) || eventsUsed <= limit) return 0;
  
  const overage = eventsUsed - limit;
  return overage * (plan.limits.overagePricePerEvent || 0);
}
```

---

## Event-Based Usage Tracking

### **Event Tracking Service**
**File**: `src/lib/services/event-tracker.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { getPlanConfig, isUnlimited, calculateOverage } from '@/lib/config/plans';
import { redis } from '@/lib/redis';
import { startOfMonth, endOfMonth } from 'date-fns';

const prisma = new PrismaClient();

export class EventTracker {
  
  // Track a single event
  async trackEvent(
    userId: string, 
    websiteId: string, 
    eventType: string = 'pageview'
  ): Promise<{ success: boolean; overLimit?: boolean; overageCharge?: number }> {
    
    // Check if user can track this event
    const canTrack = await this.checkEventLimit(userId);
    
    if (canTrack.allowed) {
      // Increment usage counters
      await this.incrementEventCount(userId, websiteId, 1);
      
      // Update real-time cache
      await this.updateRealTimeEvents(userId, websiteId);
      
      return { success: true };
    } else {
      // Check if this is a Pro plan with overage billing
      const user = await this.getUser(userId);
      const planConfig = getPlanConfig(user?.planId || 'hobby');
      
      if (planConfig?.limits.overageEnabled) {
        // Allow the event but calculate overage
        await this.incrementEventCount(userId, websiteId, 1);
        await this.updateRealTimeEvents(userId, websiteId);
        
        const currentUsage = await this.getCurrentEventCount(userId);
        const overageCharge = calculateOverage(user.planId, currentUsage + 1);
        
        return { 
          success: true, 
          overLimit: true, 
          overageCharge 
        };
      }
      
      return { success: false, overLimit: true };
    }
  }

  // Check if user can track more events
  async checkEventLimit(userId: string): Promise<{ allowed: boolean; currentUsage: number; limit: number }> {
    const user = await this.getUser(userId);
    if (!user) return { allowed: false, currentUsage: 0, limit: 0 };

    const planConfig = getPlanConfig(user.planId);
    if (!planConfig) return { allowed: false, currentUsage: 0, limit: 0 };

    const eventLimit = planConfig.limits.eventsPerMonth;
    if (isUnlimited(eventLimit)) {
      return { allowed: true, currentUsage: 0, limit: -1 };
    }

    const currentUsage = await this.getCurrentEventCount(userId);
    
    // If overage is enabled (Pro plan), always allow but flag as over limit
    if (planConfig.limits.overageEnabled) {
      return { 
        allowed: true, 
        currentUsage, 
        limit: eventLimit 
      };
    }

    // For plans without overage (Hobby), enforce hard limit
    return { 
      allowed: currentUsage < eventLimit, 
      currentUsage, 
      limit: eventLimit 
    };
  }

  // Get current event count for user this month
  async getCurrentEventCount(userId: string): Promise<number> {
    const user = await this.getUser(userId);
    if (!user) return 0;

    const periodStart = user.currentPeriodStart || startOfMonth(new Date());
    const periodEnd = user.currentPeriodEnd || endOfMonth(new Date());

    // Check Redis cache first
    const cacheKey = `events:${userId}:${periodStart.toISOString().slice(0, 7)}`; // YYYY-MM format
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    // Get from database
    const usage = await prisma.eventUsage.findFirst({
      where: {
        userId,
        periodStart: { gte: periodStart },
        periodEnd: { lte: periodEnd },
      },
    });

    const currentUsage = usage?.eventCount || 0;
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, currentUsage.toString());
    
    return currentUsage;
  }

  // Increment event counter
  async incrementEventCount(userId: string, websiteId: string, increment: number = 1): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) return;

    const periodStart = user.currentPeriodStart || startOfMonth(new Date());
    const periodEnd = user.currentPeriodEnd || endOfMonth(new Date());

    // Update database
    await prisma.eventUsage.upsert({
      where: {
        userId_periodStart: {
          userId,
          periodStart,
        },
      },
      update: {
        eventCount: { increment },
        updatedAt: new Date(),
      },
      create: {
        userId,
        websiteId,
        periodStart,
        periodEnd,
        eventCount: increment,
      },
    });

    // Update Redis cache
    const cacheKey = `events:${userId}:${periodStart.toISOString().slice(0, 7)}`;
    await redis.del(cacheKey); // Invalidate cache
  }

  // Real-time event tracking for dashboards
  async updateRealTimeEvents(userId: string, websiteId: string): Promise<void> {
    const redisKey = `realtime:events:${userId}:${websiteId}`;
    await redis.hincrby(redisKey, 'count', 1);
    await redis.expire(redisKey, 3600); // 1 hour TTL
  }

  // Get usage summary with overage calculations
  async getEventUsageSummary(userId: string): Promise<EventUsageSummary> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const planConfig = getPlanConfig(user.planId);
    if (!planConfig) throw new Error('Plan configuration not found');

    const currentUsage = await this.getCurrentEventCount(userId);
    const limit = planConfig.limits.eventsPerMonth;
    const unlimited = isUnlimited(limit);
    
    // Calculate overage if applicable
    let overageAmount = 0;
    let overageEvents = 0;
    if (planConfig.limits.overageEnabled && !unlimited && currentUsage > limit) {
      overageEvents = currentUsage - limit;
      overageAmount = calculateOverage(user.planId, currentUsage);
    }

    return {
      planId: user.planId,
      planName: planConfig.name,
      currentPeriod: {
        start: user.currentPeriodStart || startOfMonth(new Date()),
        end: user.currentPeriodEnd || endOfMonth(new Date()),
      },
      events: {
        current: currentUsage,
        limit: unlimited ? -1 : limit,
        unlimited,
        percentage: unlimited ? 0 : (currentUsage / limit) * 100,
        nearLimit: unlimited ? false : (currentUsage / limit) > 0.8,
        overLimit: unlimited ? false : currentUsage > limit,
      },
      overage: {
        enabled: planConfig.limits.overageEnabled,
        events: overageEvents,
        amount: overageAmount,
        pricePerEvent: planConfig.limits.overagePricePerEvent || 0,
      },
    };
  }

  // Helper methods
  private async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        planId: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    });
  }
}

// Types
interface EventUsageSummary {
  planId: string;
  planName: string;
  currentPeriod: {
    start: Date;
    end: Date;
  };
  events: {
    current: number;
    limit: number;
    unlimited: boolean;
    percentage: number;
    nearLimit: boolean;
    overLimit: boolean;
  };
  overage: {
    enabled: boolean;
    events: number;
    amount: number;
    pricePerEvent: number;
  };
}

// Export singleton
export const eventTracker = new EventTracker();
```

---

## Database Schema Design

### **Updated Database Schema**
**File**: `prisma/schema.prisma`

```prisma
model User {
  // Existing Superlytics fields
  id          String    @id @unique @map("user_id") @db.Uuid
  username    String    @unique @db.VarChar(255)
  password    String    @db.VarChar(60)
  role        String    @map("role") @db.VarChar(50)
  logoUrl     String?   @map("logo_url") @db.VarChar(2183)
  displayName String?   @map("display_name") @db.VarChar(255)
  createdAt   DateTime? @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt   DateTime? @updatedAt @map("updated_at") @db.Timestamptz(6)
  deletedAt   DateTime? @map("deleted_at") @db.Timestamptz(6)

  // Subscription & Plan Fields
  customerId         String?   @map("stripe_customer_id") @db.VarChar(255)
  subscriptionId     String?   @map("stripe_subscription_id") @db.VarChar(255)
  planId            String    @default("hobby") @map("plan_id") @db.VarChar(50)
  subscriptionStatus String?   @map("subscription_status") @db.VarChar(50)
  hasAccess         Boolean   @default(true) @map("has_access")
  trialEndsAt       DateTime? @map("trial_ends_at") @db.Timestamptz(6)
  
  // Billing Period Tracking
  currentPeriodStart DateTime? @map("current_period_start") @db.Timestamptz(6)
  currentPeriodEnd   DateTime? @map("current_period_end") @db.Timestamptz(6)
  
  // Relations
  websiteUser       Website[]     @relation("user")
  websiteCreateUser Website[]     @relation("createUser")
  teamUser          TeamUser[]
  report            Report[]
  eventUsage        EventUsage[]
  overageCharges    OverageCharge[]

  @@index([planId])
  @@index([subscriptionStatus])
  @@index([currentPeriodEnd])
  @@map("user")
}

// Event usage tracking (simplified from previous complex system)
model EventUsage {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  websiteId String?   @map("website_id") @db.Uuid
  
  // Usage Metrics
  eventCount    Int       @default(0) @map("event_count")
  
  // Time Period
  periodStart   DateTime  @map("period_start") @db.Timestamptz(6)
  periodEnd     DateTime  @map("period_end") @db.Timestamptz(6)
  
  // Metadata
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  user    User     @relation(fields: [userId], references: [id])
  website Website? @relation(fields: [websiteId], references: [id])

  @@unique([userId, periodStart], name: "userId_periodStart")
  @@index([userId, periodStart])
  @@index([websiteId, periodStart])
  @@map("event_usage")
}

// Overage charges for Pro plan users
model OverageCharge {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  
  // Overage Details
  period      String    @map("period") @db.VarChar(7) // YYYY-MM format
  overageEvents Int     @map("overage_events")
  pricePerEvent Decimal @map("price_per_event") @db.Decimal(10, 8)
  totalAmount   Decimal @map("total_amount") @db.Decimal(10, 2)
  
  // Billing Status
  billed        Boolean   @default(false) @map("billed")
  billedAt      DateTime? @map("billed_at") @db.Timestamptz(6)
  stripeInvoiceId String? @map("stripe_invoice_id") @db.VarChar(255)
  
  // Metadata
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, period], name: "userId_period")
  @@index([billed, period])
  @@map("overage_charge")
}

// Data retention policies (simplified)
model DataRetentionPolicy {
  id              String   @id @default(uuid()) @db.Uuid
  websiteId       String   @unique @map("website_id") @db.Uuid
  retentionMonths Int      @map("retention_months") // Based on plan
  lastCleanupAt   DateTime? @map("last_cleanup_at") @db.Timestamptz(6)
  createdAt       DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt       DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)

  website Website @relation(fields: [websiteId], references: [id])

  @@map("data_retention_policy")
}

// Add the relation to Website model
model Website {
  // ... existing fields ...
  
  // New relations
  eventUsage          EventUsage[]
  dataRetentionPolicy DataRetentionPolicy?
}
```

### **Migration Script**
**File**: `prisma/migrations/add_event_billing.sql`

```sql
-- Add plan fields to User table
ALTER TABLE "user" ADD COLUMN "plan_id" VARCHAR(50) DEFAULT 'hobby';
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" VARCHAR(255);
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" VARCHAR(255);
ALTER TABLE "user" ADD COLUMN "subscription_status" VARCHAR(50);
ALTER TABLE "user" ADD COLUMN "has_access" BOOLEAN DEFAULT true;
ALTER TABLE "user" ADD COLUMN "trial_ends_at" TIMESTAMPTZ(6);
ALTER TABLE "user" ADD COLUMN "current_period_start" TIMESTAMPTZ(6);
ALTER TABLE "user" ADD COLUMN "current_period_end" TIMESTAMPTZ(6);

-- Create indexes for performance
CREATE INDEX "user_plan_id_idx" ON "user"("plan_id");
CREATE INDEX "user_subscription_status_idx" ON "user"("subscription_status");
CREATE INDEX "user_current_period_end_idx" ON "user"("current_period_end");

-- Create EventUsage table
CREATE TABLE "event_usage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "website_id" UUID,
  "event_count" INTEGER DEFAULT 0,
  "period_start" TIMESTAMPTZ(6) NOT NULL,
  "period_end" TIMESTAMPTZ(6) NOT NULL,
  "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "user"("user_id"),
  FOREIGN KEY ("website_id") REFERENCES "website"("website_id")
);

-- Create unique constraint and indexes for EventUsage
CREATE UNIQUE INDEX "event_usage_user_id_period_start_key" ON "event_usage"("user_id", "period_start");
CREATE INDEX "event_usage_user_id_period_start_idx" ON "event_usage"("user_id", "period_start");
CREATE INDEX "event_usage_website_id_period_start_idx" ON "event_usage"("website_id", "period_start");

-- Create OverageCharge table
CREATE TABLE "overage_charge" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "period" VARCHAR(7) NOT NULL, -- YYYY-MM format
  "overage_events" INTEGER NOT NULL,
  "price_per_event" DECIMAL(10, 8) NOT NULL,
  "total_amount" DECIMAL(10, 2) NOT NULL,
  "billed" BOOLEAN DEFAULT false,
  "billed_at" TIMESTAMPTZ(6),
  "stripe_invoice_id" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY ("user_id") REFERENCES "user"("user_id")
);

-- Create unique constraint and indexes for OverageCharge
CREATE UNIQUE INDEX "overage_charge_user_id_period_key" ON "overage_charge"("user_id", "period");
CREATE INDEX "overage_charge_billed_period_idx" ON "overage_charge"("billed", "period");

-- Create DataRetentionPolicy table
CREATE TABLE "data_retention_policy" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "website_id" UUID UNIQUE NOT NULL,
  "retention_months" INTEGER NOT NULL,
  "last_cleanup_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY ("website_id") REFERENCES "website"("website_id")
);

-- Initialize current users with hobby plan
UPDATE "user" SET 
  "plan_id" = 'hobby',
  "has_access" = true,
  "current_period_start" = DATE_TRUNC('month', NOW()),
  "current_period_end" = DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day'
WHERE "plan_id" IS NULL;
```

---

## Usage Management & Overage Billing

### **Overage Billing Service**
**File**: `src/lib/services/overage-billing.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { eventTracker } from './event-tracker';
import { calculateOverage, getPlanConfig } from '@/lib/config/plans';
import { format, subMonths } from 'date-fns';
import Stripe from 'stripe';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export class OverageBillingService {
  
  // Calculate and create overage charges for the previous month
  async processMonthlyOverages(targetMonth?: Date): Promise<void> {
    const month = targetMonth || subMonths(new Date(), 1);
    const monthString = format(month, 'yyyy-MM');
    
    console.log(`Processing overage charges for ${monthString}...`);
    
    // Get all Pro plan users
    const proUsers = await prisma.user.findMany({
      where: {
        planId: 'pro',
        subscriptionStatus: 'active',
      },
      select: {
        id: true,
        customerId: true,
        planId: true,
      },
    });

    for (const user of proUsers) {
      await this.processUserOverage(user.id, monthString);
    }
    
    console.log(`Completed overage processing for ${monthString}`);
  }

  // Process overage for a specific user and month
  async processUserOverage(userId: string, monthString: string): Promise<void> {
    // Check if already processed
    const existingCharge = await prisma.overageCharge.findUnique({
      where: {
        userId_period: {
          userId,
          period: monthString,
        },
      },
    });

    if (existingCharge) {
      console.log(`Overage already processed for user ${userId}, month ${monthString}`);
      return;
    }

    // Get usage for that month
    const monthStart = new Date(`${monthString}-01`);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);

    const usage = await prisma.eventUsage.findFirst({
      where: {
        userId,
        periodStart: { gte: monthStart },
        periodEnd: { lte: monthEnd },
      },
    });

    if (!usage) {
      console.log(`No usage found for user ${userId}, month ${monthString}`);
      return;
    }

    // Calculate overage
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    const planConfig = getPlanConfig(user.planId);
    if (!planConfig?.limits.overageEnabled) return;

    const overageEvents = Math.max(0, usage.eventCount - planConfig.limits.eventsPerMonth);
    if (overageEvents === 0) {
      console.log(`No overage for user ${userId}, month ${monthString}`);
      return;
    }

    const pricePerEvent = planConfig.limits.overagePricePerEvent || 0;
    const totalAmount = overageEvents * pricePerEvent;

    // Create overage charge record
    await prisma.overageCharge.create({
      data: {
        userId,
        period: monthString,
        overageEvents,
        pricePerEvent,
        totalAmount,
      },
    });

    console.log(`Created overage charge for user ${userId}: ${overageEvents} events, $${totalAmount}`);
  }

  // Bill all unbilled overage charges
  async billPendingOverages(): Promise<void> {
    const pendingCharges = await prisma.overageCharge.findMany({
      where: { billed: false },
      include: {
        user: {
          select: {
            customerId: true,
            username: true,
          },
        },
      },
    });

    for (const charge of pendingCharges) {
      if (charge.user.customerId) {
        await this.createStripeInvoice(charge);
      }
    }
  }

  // Create Stripe invoice for overage charge
  async createStripeInvoice(overageCharge: any): Promise<void> {
    try {
      // Create invoice item
      await stripe.invoiceItems.create({
        customer: overageCharge.user.customerId,
        amount: Math.round(overageCharge.totalAmount * 100), // Convert to cents
        currency: 'usd',
        description: `Overage charges for ${overageCharge.period} - ${overageCharge.overageEvents.toLocaleString()} additional events`,
        metadata: {
          overageChargeId: overageCharge.id,
          period: overageCharge.period,
          events: overageCharge.overageEvents.toString(),
        },
      });

      // Create and finalize invoice
      const invoice = await stripe.invoices.create({
        customer: overageCharge.user.customerId,
        auto_advance: true, // Automatically finalize and attempt payment
        collection_method: 'charge_automatically',
      });

      await stripe.invoices.finalizeInvoice(invoice.id);

      // Update overage charge record
      await prisma.overageCharge.update({
        where: { id: overageCharge.id },
        data: {
          billed: true,
          billedAt: new Date(),
          stripeInvoiceId: invoice.id,
        },
      });

      console.log(`Billed overage charge ${overageCharge.id} via invoice ${invoice.id}`);
    } catch (error) {
      console.error(`Failed to bill overage charge ${overageCharge.id}:`, error);
    }
  }

  // Get overage summary for user
  async getUserOverageSummary(userId: string): Promise<OverageSummary> {
    const charges = await prisma.overageCharge.findMany({
      where: { userId },
      orderBy: { period: 'desc' },
      take: 12, // Last 12 months
    });

    const totalOverageEvents = charges.reduce((sum, charge) => sum + charge.overageEvents, 0);
    const totalOverageAmount = charges.reduce((sum, charge) => sum + Number(charge.totalAmount), 0);
    const pendingCharges = charges.filter(charge => !charge.billed);

    return {
      totalOverageEvents,
      totalOverageAmount,
      pendingCharges: pendingCharges.length,
      pendingAmount: pendingCharges.reduce((sum, charge) => sum + Number(charge.totalAmount), 0),
      recentCharges: charges.slice(0, 6), // Last 6 months
    };
  }
}

interface OverageSummary {
  totalOverageEvents: number;
  totalOverageAmount: number;
  pendingCharges: number;
  pendingAmount: number;
  recentCharges: any[];
}

export const overageBillingService = new OverageBillingService();

// Cron job setup for monthly processing
export function setupOverageBilling() {
  // Process overage charges on the 1st of each month
  setInterval(async () => {
    const now = new Date();
    if (now.getDate() === 1 && now.getHours() === 2) {
      await overageBillingService.processMonthlyOverages();
      await overageBillingService.billPendingOverages();
    }
  }, 60 * 60 * 1000); // Check every hour
}
```

---

## Feature Access Control

### **Simplified Middleware**
**File**: `src/lib/middleware/feature-middleware.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { getPlanConfig } from '@/lib/config/plans';

// Feature-based middleware (much simpler than before)
export async function withFeature(featureName: keyof PlanFeatures) {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);
    
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const planConfig = getPlanConfig(auth.user.planId || 'hobby');
    
    if (!planConfig?.features[featureName]) {
      return NextResponse.json(
        { 
          error: `${featureName} is not available in your ${planConfig?.name || 'current'} plan`,
          feature: featureName,
          planName: planConfig?.name,
          upgradeRequired: true
        }, 
        { status: 403 }
      );
    }

    return null; // Continue with request
  };
}

// Event tracking middleware
export async function withEventTracking() {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);
    
    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Import here to avoid circular dependency
    const { eventTracker } = await import('@/lib/services/event-tracker');
    
    const limitCheck = await eventTracker.checkEventLimit(auth.user.id);
    
    if (!limitCheck.allowed) {
      const planConfig = getPlanConfig(auth.user.planId || 'hobby');
      
      return NextResponse.json(
        {
          error: 'Event limit exceeded',
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit,
          planName: planConfig?.name,
          overageEnabled: planConfig?.limits.overageEnabled || false,
          upgradeRequired: !planConfig?.limits.overageEnabled
        },
        { status: 429 }
      );
    }

    return null; // Continue with request
  };
}

// Combined middleware for common API patterns
export function createFeatureMiddleware(features: (keyof PlanFeatures)[]) {
  return async (request: NextRequest) => {
    for (const feature of features) {
      const featureCheck = await withFeature(feature)(request);
      if (featureCheck) return featureCheck;
    }
    return null;
  };
}
```

### **Usage in API Routes**
**Example**: `src/app/api/data/import/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createFeatureMiddleware } from '@/lib/middleware/feature-middleware';
import { parseRequest } from '@/lib/request';

const featureMiddleware = createFeatureMiddleware(['dataImport']);

export async function POST(request: NextRequest) {
  // Check if data import is available in user's plan
  const featureCheck = await featureMiddleware(request);
  if (featureCheck) return featureCheck;

  const { auth, body, error } = await parseRequest(request);
  if (error) return error();

  try {
    // Process data import
    const result = await processDataImport(body.data, auth.user.id);
    
    return NextResponse.json({ 
      success: true, 
      imported: result.count 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Import failed' },
      { status: 500 }
    );
  }
}
```

---

## Frontend Components

### **Updated Usage Dashboard**
**File**: `src/components/billing/EventUsageDashboard.tsx`

```typescript
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/Progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, TrendingUp, Zap, DollarSign } from 'react-icons/fa';
import { formatNumber, formatCurrency } from '@/lib/utils';

export function EventUsageDashboard({ userId }: { userId: string }) {
  const { data: usage, isLoading } = useQuery({
    queryKey: ['event-usage', userId],
    queryFn: () => fetch(`/api/usage/events/${userId}`).then(res => res.json()),
    refetchInterval: 30000,
  });

  if (isLoading) return <div className="animate-pulse">Loading usage data...</div>;
  if (!usage) return <div className="text-red-500">Failed to load usage data</div>;

  return (
    <div className="space-y-6">
      {/* Plan & Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Event Usage Card */}
        <Card className={usage.events.overLimit ? 'border-red-200 bg-red-50' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Event Usage</span>
              <Badge variant={usage.planId === 'pro' ? 'default' : 'secondary'}>
                {usage.planName}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-bold text-blue-600">
                {formatNumber(usage.events.current)}
              </span>
              {!usage.events.unlimited && (
                <span className="text-sm text-gray-500">
                  of {formatNumber(usage.events.limit)}
                </span>
              )}
            </div>

            {!usage.events.unlimited && (
              <div className="space-y-2">
                <Progress 
                  value={Math.min(usage.events.percentage, 100)} 
                  className="h-3"
                  color={usage.events.overLimit ? 'bg-red-500' : usage.events.nearLimit ? 'bg-yellow-500' : 'bg-blue-500'}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{Math.round(usage.events.percentage)}% used</span>
                  {usage.events.overLimit && (
                    <span className="text-red-500 font-medium">Over limit!</span>
                  )}
                </div>
              </div>
            )}

            {usage.events.unlimited && (
              <Badge variant="success" className="w-full justify-center">
                <Zap className="w-3 h-3 mr-1" />
                Unlimited Events
              </Badge>
            )}
          </CardContent>
        </Card>

        {/* Overage Card (Pro Plan Only) */}
        {usage.overage.enabled && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center text-orange-800">
                <DollarSign className="w-5 h-5 mr-2" />
                Overage Charges
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {usage.overage.events > 0 ? (
                <>
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-orange-600">
                      {formatNumber(usage.overage.events)}
                    </span>
                    <span className="text-sm text-gray-600">extra events</span>
                  </div>
                  <div className="text-lg font-semibold text-orange-800">
                    {formatCurrency(usage.overage.amount)} this month
                  </div>
                  <div className="text-xs text-orange-600">
                    @ {formatCurrency(usage.overage.pricePerEvent)} per event
                  </div>
                </>
              ) : (
                <div className="text-center py-2">
                  <div className="text-sm text-gray-600">No overage charges this month</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Additional events: {formatCurrency(usage.overage.pricePerEvent)} each
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Alerts */}
      <UsageAlerts usage={usage} />
      
      {/* Period Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Billing period: {new Date(usage.currentPeriod.start).toLocaleDateString()} - 
              {new Date(usage.currentPeriod.end).toLocaleDateString()}
            </span>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/billing">Manage Billing</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UsageAlerts({ usage }: { usage: any }) {
  const alerts = [];

  if (usage.events.overLimit && !usage.overage.enabled) {
    alerts.push({
      type: 'error',
      title: 'Event limit exceeded',
      message: `You've used ${formatNumber(usage.events.current)} events out of your ${formatNumber(usage.events.limit)} limit. Upgrade to Pro for unlimited events with overage billing.`,
      action: 'Upgrade to Pro'
    });
  }

  if (usage.events.nearLimit && !usage.events.overLimit) {
    alerts.push({
      type: 'warning',
      title: 'Approaching event limit',
      message: `You're at ${Math.round(usage.events.percentage)}% of your monthly event limit.`,
      action: usage.overage.enabled ? null : 'Consider upgrading'
    });
  }

  if (usage.overage.events > 0) {
    alerts.push({
      type: 'info',
      title: 'Overage charges this month',
      message: `You have ${formatNumber(usage.overage.events)} additional events (${formatCurrency(usage.overage.amount)}) that will be billed at the end of the month.`,
      action: null
    });
  }

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-3">
      {alerts.map((alert, index) => (
        <Card key={index} className={`border-${alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-200 bg-${alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-50`}>
          <CardContent className="pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <AlertTriangle className={`w-4 h-4 mr-2 text-${alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-600`} />
                  <h4 className={`font-medium text-${alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-800`}>
                    {alert.title}
                  </h4>
                </div>
                <p className={`text-sm text-${alert.type === 'error' ? 'red' : alert.type === 'warning' ? 'yellow' : 'blue'}-600`}>
                  {alert.message}
                </p>
              </div>
              {alert.action && (
                <Button size="sm" asChild>
                  <a href="/pricing">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {alert.action}
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

---

## Implementation Summary

This updated plan management system is perfectly aligned with your pricing image:

### ✅ **Exact Pricing Structure**
- **Hobby**: $9/month, 100k events, 3 websites, 6-month retention
- **Pro**: $19/month, 1M events + overage, unlimited websites/teams, 5-year retention  
- **Enterprise**: Custom pricing with all features

### ✅ **Event-Based Billing**
- Real-time event tracking and limits
- Automatic overage billing for Pro users ($0.00005/event)
- Monthly billing cycle with Stripe integration

### ✅ **Simplified Feature Matrix**
- Most features available to all plans
- Key differentiators: events, websites, teams, data retention, support
- Clean access control without complex feature gates

### ✅ **Production Ready**
- Database schema optimized for event tracking
- Automated overage billing system
- Data retention policies based on plan limits
- Real-time usage monitoring

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Analyze pricing image and extract exact plan structure", "status": "completed", "priority": "high"}, {"id": "2", "content": "Create updated plan configuration based on image", "status": "completed", "priority": "high"}, {"id": "3", "content": "Design event-based usage tracking system", "status": "completed", "priority": "high"}, {"id": "4", "content": "Update database schema for event-based billing", "status": "completed", "priority": "high"}, {"id": "5", "content": "Create documentation for the new plan system", "status": "completed", "priority": "high"}]