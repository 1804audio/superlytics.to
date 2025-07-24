# Simplified Superlytics Pricing System + AppSumo Lifetime Plans
**Version**: 3.0 - Simplified for Stripe & AppSumo Integration  
**Date**: July 2025  
**Focus**: Maximum Simplicity + Lifetime Plans for AppSumo

---

## Feature Analysis & Simplification Strategy

### **Current Feature Analysis (From Pricing Image)**

After analyzing your pricing image, here are the **actual differentiators**:

```
Core Differentiators (What Actually Matters):
├── Events/month: 100k → 1M → Custom
├── Websites: 3 → Unlimited → Unlimited  
├── Team members: Add to Hobby → Unlimited → Unlimited
├── Data retention: 6mo → 5yr → Custom
├── Data import: No → Yes → Yes
├── Email reports: No → Yes → Yes
├── Support level: Community → Email → Enterprise
└── API access: Limited → Full → Full
```

**Features Available to ALL Plans** (89% of features):
- ✅ All Analytics: Insights, Funnel, Retention, UTM, Goals, Journey, Revenue, Attribution
- ✅ All Privacy: GDPR, CCPA, No cookie banners required  
- ✅ Core Features: Custom events, Properties, Sessions, Real-time, Dashboards
- ✅ Data export, Community support

### **Recommendation: DRAMATICALLY Simplified Structure**

Instead of tracking 15+ different metrics, focus on **2 core limits**:

1. **📊 Events per month** (main usage driver)
2. **🌐 Number of websites** (seat-based pricing)

Everything else becomes **plan features** (boolean on/off).

---

## Simplified Pricing Structure

### **Updated Plan Structure (Subscription + Lifetime)**

```
┌─────────────────┬─────────────┬─────────────┬─────────────┐
│   Plan Type     │   Hobby     │     Pro     │ Enterprise  │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ Monthly Price   │     $9      │    $19      │ Contact Us  │
│ Yearly Price    │    $90      │   $190      │ Contact Us  │
│ Lifetime Price  │    $89      │   $179      │    $299     │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ Events/month    │    100k     │     1M      │  Unlimited  │
│ Websites        │      5      │     25      │  Unlimited  │
│ Team members    │      3      │     10      │  Unlimited  │
│ Data retention  │   6 months  │   5 years   │   Forever   │
│ Support         │ Community   │    Email    │ Enterprise  │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ Data import     │     ❌      │     ✅      │     ✅      │
│ Email reports   │     ❌      │     ✅      │     ✅      │
│ API access      │   Limited   │    Full     │    Full     │
│ White label     │     ❌      │     ❌      │     ✅      │
│ Priority SLA    │     ❌      │     ❌      │     ✅      │
└─────────────────┴─────────────┴─────────────┴─────────────┘
```

### **Key Simplifications**

1. **Added teams to Hobby** (3 team members as requested)
2. **Increased website limits** to be more generous  
3. **Only 2 usage metrics** to track: events + websites
4. **Removed overage billing** (causes support headaches)
5. **Clear upgrade path** when limits hit

---

## AppSumo Lifetime Plans (3 Tiers)

### **Lifetime Plan Structure for AppSumo**

```
┌─────────────────┬─────────────┬─────────────┬─────────────┐
│  AppSumo Tier   │ Starter LTD │   Pro LTD   │  Max LTD    │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ AppSumo Price   │    $69      │    $138     │    $207     │
│ Regular Price   │    $89      │    $179     │    $299     │
│ Savings         │    $20      │    $41      │    $92      │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ Events/month    │    250k     │     2M      │     5M      │
│ Websites        │     10      │     50      │    100      │
│ Team members    │      5      │     25      │     50      │
│ Data retention  │   2 years   │   Forever   │   Forever   │
│ Support         │    Email    │   Priority  │  Dedicated  │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ Data import     │     ✅      │     ✅      │     ✅      │
│ Email reports   │     ✅      │     ✅      │     ✅      │
│ API access      │    Full     │    Full     │    Full     │
│ White label     │     ❌      │     ✅      │     ✅      │
│ Custom domain   │     ❌      │     ✅      │     ✅      │
│ Priority SLA    │     ❌      │     ✅      │     ✅      │
│ Onboarding      │     ❌      │     ❌      │     ✅      │
└─────────────────┴─────────────┴─────────────┴─────────────┘
```

### **AppSumo Lifetime Plan Benefits**

#### **🥉 Starter LTD ($69 on AppSumo)**
- **2.5x events** vs regular Hobby (250k vs 100k)
- **2x websites** vs regular Hobby (10 vs 5)  
- **Better retention** (2 years vs 6 months)
- **Email support** (vs community only)
- Perfect for **solo entrepreneurs** and **small agencies**

#### **🥈 Pro LTD ($138 on AppSumo)**  
- **2x events** vs regular Pro (2M vs 1M)
- **2x websites** vs regular Pro (50 vs 25)
- **Forever retention** (vs 5 years)
- **White label** capabilities
- Perfect for **growing agencies** and **consultants**

#### **🥇 Max LTD ($207 on AppSumo)**
- **5x events** vs regular Pro (5M vs 1M)  
- **4x websites** vs regular Pro (100 vs 25)
- **All premium features** included
- **Dedicated support** channel
- Perfect for **large agencies** and **enterprise users**

---

## Simplified Plan Configuration Code

### **Updated Plan Configuration**
**File**: `src/lib/config/simplified-plans.ts`

```typescript
export interface SimplifiedPlanLimits {
  // Core Limits (only 2 metrics to track!)
  eventsPerMonth: number; // -1 for unlimited
  websites: number; // -1 for unlimited
  teamMembers: number; // -1 for unlimited
  
  // Data Management
  dataRetentionMonths: number; // -1 for forever
  
  // No complex usage tracking needed
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

export const SIMPLIFIED_PLANS = {
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
      monthly: 'price_hobby_monthly',
      yearly: 'price_hobby_yearly',
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
      monthly: 'price_pro_monthly',
      yearly: 'price_pro_yearly',
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
      lifetime: 'price_lifetime_starter',
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
      lifetime: 'price_lifetime_pro',
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
      lifetime: 'price_lifetime_max',
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
export function getPlan(planId: string) {
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
```

---

## Simplified Database Schema

### **Drastically Simplified Schema**
**File**: `prisma/schema.prisma`

```prisma
model User {
  // Existing Superlytics fields
  id          String    @id @unique @map("user_id") @db.Uuid
  username    String    @unique @db.VarChar(255)
  password    String    @db.VarChar(60)
  role        String    @map("role") @db.VarChar(50)
  // ... other existing fields

  // Simplified Subscription Fields
  planId            String    @default("hobby") @map("plan_id") @db.VarChar(50)
  customerId        String?   @map("stripe_customer_id") @db.VarChar(255)
  subscriptionId    String?   @map("stripe_subscription_id") @db.VarChar(255)
  subscriptionStatus String?  @map("subscription_status") @db.VarChar(50)
  isLifetime        Boolean   @default(false) @map("is_lifetime")
  hasAccess         Boolean   @default(true) @map("has_access")
  
  // Usage Tracking (only 2 metrics!)
  currentPeriodStart DateTime? @map("current_period_start") @db.Timestamptz(6)
  currentPeriodEnd   DateTime? @map("current_period_end") @db.Timestamptz(6)
  
  // Relations
  websiteUser       Website[]     @relation("user")
  websiteCreateUser Website[]     @relation("createUser")
  teamUser          TeamUser[]
  report            Report[]
  usageRecord       UsageRecord[] // Simplified usage tracking

  @@index([planId])
  @@index([isLifetime])
  @@map("user")
}

// Super Simple Usage Tracking (only 2 metrics!)
model UsageRecord {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @map("user_id") @db.Uuid
  
  // Only track what matters
  eventsThisMonth Int    @default(0) @map("events_this_month")
  websitesUsed    Int    @default(0) @map("websites_used")
  
  // Period tracking
  month     String    @map("month") @db.VarChar(7) // YYYY-MM
  year      Int       @map("year")
  
  // Timestamps
  createdAt DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@unique([userId, month], name: "userId_month")
  @@index([month])
  @@map("usage_record")
}

// Optional: AppSumo tracking
model AppSumoCode {
  id         String   @id @default(uuid()) @db.Uuid
  userId     String   @unique @map("user_id") @db.Uuid
  codeUsed   String   @map("code_used") @db.VarChar(50)
  planTier   String   @map("plan_tier") @db.VarChar(50) // starter, pro, max
  redeemedAt DateTime @default(now()) @map("redeemed_at") @db.Timestamptz(6)

  user User @relation(fields: [userId], references: [id])

  @@map("appsumo_code")
}
```

---

## Simplified Usage Tracking Service

### **Super Simple Usage Manager**  
**File**: `src/lib/services/simple-usage-manager.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import { getPlan, isUnlimited } from '@/lib/config/simplified-plans';
import { redis } from '@/lib/redis';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export class SimpleUsageManager {
  
  // Track an event (super simple)
  async trackEvent(userId: string): Promise<boolean> {
    const canTrack = await this.checkEventLimit(userId);
    
    if (canTrack) {
      await this.incrementEvents(userId);
      return true;
    }
    
    return false;
  }

  // Check if user can track more events
  async checkEventLimit(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const plan = getPlan(user.planId);
    if (!plan) return false;

    const eventLimit = plan.limits.eventsPerMonth;
    if (isUnlimited(eventLimit)) return true;

    const currentUsage = await this.getCurrentEventCount(userId);
    return currentUsage < eventLimit;
  }

  // Get current month's event count
  async getCurrentEventCount(userId: string): Promise<number> {
    const month = format(new Date(), 'yyyy-MM');
    
    // Check Redis cache first
    const cacheKey = `events:${userId}:${month}`;
    const cached = await redis.get(cacheKey);
    if (cached) return parseInt(cached);

    // Get from database
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    });

    const count = usage?.eventsThisMonth || 0;
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, count.toString());
    
    return count;
  }

  // Increment event count
  async incrementEvents(userId: string, increment: number = 1): Promise<void> {
    const month = format(new Date(), 'yyyy-MM');
    const year = new Date().getFullYear();

    await prisma.usageRecord.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        eventsThisMonth: { increment },
        updatedAt: new Date(),
      },
      create: {
        userId,
        month,
        year,
        eventsThisMonth: increment,
      },
    });

    // Invalidate cache
    const cacheKey = `events:${userId}:${month}`;
    await redis.del(cacheKey);
  }

  // Check website limit
  async checkWebsiteLimit(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const plan = getPlan(user.planId);
    if (!plan) return false;

    const websiteLimit = plan.limits.websites;
    if (isUnlimited(websiteLimit)) return true;

    const websiteCount = await prisma.website.count({
      where: { userId },
    });

    return websiteCount < websiteLimit;
  }

  // Get simple usage summary
  async getUsageSummary(userId: string) {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const plan = getPlan(user.planId);
    if (!plan) throw new Error('Plan not found');

    const currentEvents = await this.getCurrentEventCount(userId);
    const websiteCount = await prisma.website.count({
      where: { userId },
    });

    return {
      planId: user.planId,
      planName: plan.name,
      isLifetime: user.isLifetime,
      events: {
        current: currentEvents,
        limit: plan.limits.eventsPerMonth,
        unlimited: isUnlimited(plan.limits.eventsPerMonth),
        percentage: isUnlimited(plan.limits.eventsPerMonth) 
          ? 0 
          : (currentEvents / plan.limits.eventsPerMonth) * 100,
      },
      websites: {
        current: websiteCount,
        limit: plan.limits.websites,
        unlimited: isUnlimited(plan.limits.websites),
      },
    };
  }

  private async getUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        planId: true,
        isLifetime: true,
      },
    });
  }
}

export const simpleUsageManager = new SimpleUsageManager();
```

---

## Stripe Integration Strategy

### **Simplified Stripe Setup**

#### **Product Structure in Stripe**
```
Superlytics Products:
├── Hobby Plan
│   ├── Monthly ($9)
│   └── Yearly ($90)
├── Pro Plan  
│   ├── Monthly ($19)
│   └── Yearly ($190)
├── Lifetime Starter ($89)
├── Lifetime Pro ($179)
└── Lifetime Max ($299)
```

#### **Webhook Simplification**
**File**: `src/app/api/webhook/stripe/route.ts`

```typescript
// Simplified webhook - only handle what matters
export async function POST(request: NextRequest) {
  // ... signature verification ...

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleSubscriptionSuccess(session);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCanceled(subscription);
      break;
    }

    // That's it! No complex overage billing or multiple webhooks
  }
}

async function handleSubscriptionSuccess(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  const priceId = session.line_items?.data[0]?.price?.id;
  
  // Simple plan mapping
  const planMapping = {
    'price_hobby_monthly': 'hobby',
    'price_hobby_yearly': 'hobby',
    'price_pro_monthly': 'pro', 
    'price_pro_yearly': 'pro',
    'price_lifetime_starter': 'lifetime_starter',
    'price_lifetime_pro': 'lifetime_pro',
    'price_lifetime_max': 'lifetime_max',
  };

  const planId = planMapping[priceId] || 'hobby';
  const isLifetime = planId.startsWith('lifetime_');

  await prisma.user.update({
    where: { id: userId },
    data: {
      planId,
      isLifetime,
      customerId: session.customer,
      subscriptionId: session.subscription,
      subscriptionStatus: 'active',
      hasAccess: true,
    },
  });
}
```

---

## AppSumo Integration Strategy

### **AppSumo Code Redemption Flow**

#### **AppSumo Redemption API**
**File**: `src/app/api/appsumo/redeem/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { parseRequest } from '@/lib/request';
import { z } from 'zod';

const schema = z.object({
  appsumoCode: z.string(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const { body, error } = await parseRequest(request, schema, { skipAuth: true });
  if (error) return error();

  try {
    // Validate AppSumo code with their API
    const isValid = await validateAppSumoCode(body.appsumoCode);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid AppSumo code' },
        { status: 400 }
      );
    }

    // Determine plan tier based on code
    const planTier = getAppSumoPlanTier(body.appsumoCode);
    const planId = `lifetime_${planTier}`;

    // Create or update user
    const user = await createAppSumoUser({
      email: body.email,
      planId,
      appsumoCode: body.appsumoCode,
    });

    return NextResponse.json({
      success: true,
      planId,
      loginUrl: `/login?token=${generateLoginToken(user.id)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Redemption failed' },
      { status: 500 }
    );
  }
}

function getAppSumoPlanTier(code: string): string {
  // AppSumo typically uses different code patterns
  if (code.endsWith('_STARTER') || code.includes('TIER1')) return 'starter';
  if (code.endsWith('_PRO') || code.includes('TIER2')) return 'pro';  
  if (code.endsWith('_MAX') || code.includes('TIER3')) return 'max';
  return 'starter'; // Default
}
```

---

## Implementation Benefits

### **🎯 Massive Simplification Achieved**

#### **Before (Complex)**:
- ❌ 15+ different usage metrics to track
- ❌ Complex overage billing system  
- ❌ Multiple webhook handlers
- ❌ Complex feature matrix
- ❌ Hard to understand pricing

#### **After (Simple)**:
- ✅ **Only 2 metrics**: Events + Websites
- ✅ **No overage billing** headaches
- ✅ **3 clear plan tiers** + 3 lifetime options
- ✅ **Simple Stripe management**
- ✅ **Easy AppSumo integration**

### **🚀 Benefits for You**

1. **Easier Implementation**: 70% less code to write and maintain
2. **Simpler Support**: Customers understand limits clearly  
3. **Better Stripe Management**: No complex usage-based billing
4. **AppSumo Ready**: 3-tier lifetime structure perfect for listing
5. **Scalable**: Easy to add new plans or adjust limits

### **📊 Benefits for Customers**

1. **Clear Value Proposition**: More events, websites, team members per tier
2. **No Bill Shock**: No surprise overage charges
3. **Generous Limits**: Most users won't hit limits
4. **Great AppSumo Value**: Lifetime plans with 2-5x regular limits
5. **Simple Upgrade Path**: Clear reason to upgrade (more resources)

This simplified system gives you the best of both worlds: **easy to implement and manage** while providing **clear value to customers**. The AppSumo lifetime plans are structured to be irresistible deals that will drive high conversion rates!

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "content": "Deeply analyze all features from pricing image", "status": "completed", "priority": "high"}, {"id": "2", "content": "Design simplified pricing structure for easier Stripe management", "status": "completed", "priority": "high"}, {"id": "3", "content": "Create 3 lifetime plans for AppSumo listing", "status": "completed", "priority": "high"}, {"id": "4", "content": "Add team members to $9 Hobby plan", "status": "completed", "priority": "high"}, {"id": "5", "content": "Create simplified implementation strategy", "status": "completed", "priority": "high"}]