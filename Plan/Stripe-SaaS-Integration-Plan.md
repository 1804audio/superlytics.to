# Stripe SaaS Integration Plan for Superlytics
**Version**: 1.0  
**Date**: July 2025  
**Project**: Superlytics - Privacy-Focused Web Analytics SaaS  
**Technology Stack**: Next.js 15.4.2, TypeScript, Prisma, PostgreSQL, Stripe

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Technical Architecture Overview](#technical-architecture-overview)
4. [Database Schema Changes](#database-schema-changes)
5. [Implementation Phases](#implementation-phases)
6. [Code Changes Specification](#code-changes-specification)
7. [Environment Configuration](#environment-configuration)
8. [Testing Strategy](#testing-strategy)
9. [Security Considerations](#security-considerations)
10. [Team Subscription Model](#team-subscription-model)
11. [Timeline & Resources](#timeline--resources)
12. [Risk Assessment](#risk-assessment)
13. [Success Metrics](#success-metrics)

---

## Executive Summary

This document outlines the comprehensive integration plan for transforming Superlytics into a fully-functional SaaS platform using Stripe for payment processing. The existing Stripe code from another application will be adapted to work seamlessly with Superlytics' sophisticated JWT-based authentication system and PostgreSQL database architecture.

### Key Objectives
- **Seamless Integration**: Adapt existing Stripe code to Superlytics architecture
- **Multi-Tenant Support**: Enable both individual and team-based subscriptions
- **Enterprise Security**: Maintain Superlytics' security standards while adding billing
- **Scalable Architecture**: Design for future growth and feature expansion

### Expected Outcomes
- **Recurring Revenue Model**: Subscription-based billing system
- **Role-Based Access**: Subscription tiers with different permission levels
- **Team Billing**: Multi-tenant subscription management
- **Production Ready**: Battle-tested integration with comprehensive error handling

---

## Current State Analysis

### Existing Stripe Code Quality Assessment
✅ **Strengths Identified**:
- Well-structured utility functions in `src/lib/stripe.ts`
- Comprehensive webhook event handling
- Proper security with signature verification
- Clean separation of concerns
- Production-ready error handling

❌ **Integration Challenges**:
- **Architecture Mismatch**: MongoDB + NextAuth vs PostgreSQL + JWT
- **Missing Dependencies**: References to `@/libs/next-auth`, `@/models/User`
- **Authentication System**: Incompatible with Superlytics' JWT implementation
- **Database Layer**: MongoDB queries need conversion to Prisma PostgreSQL

### Superlytics Authentication System Analysis
✅ **Current Advantages**:
- Enterprise-grade JWT with AES-256-GCM encryption
- Multi-tenant architecture with team support
- 7-tier role-based access control system
- Redis-backed sessions with JWT fallback
- UUID-based user identification
- Comprehensive audit logging

---

## Technical Architecture Overview

### Integration Strategy
The integration will follow a **hybrid approach** that preserves the best aspects of both systems:

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend Layer                       │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   Pricing Page  │  │ Billing Portal  │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                   API Layer                             │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │ Stripe Checkout │  │ Stripe Webhooks │             │
│  │    Routes       │  │    Handler      │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│               Authentication Layer                      │
│         Superlytics JWT + Role-Based Access            │
└─────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────┐
│                Database Layer                           │
│  ┌─────────────────┐  ┌─────────────────┐             │
│  │   User Model    │  │ Team Subscription│             │
│  │ + Stripe Fields │  │     Model       │             │
│  └─────────────────┘  └─────────────────┘             │
└─────────────────────────────────────────────────────────┘
```

### Core Components Integration

1. **Authentication Flow**: Maintain Superlytics JWT system
2. **Database Operations**: Convert from MongoDB to Prisma PostgreSQL
3. **User Management**: Extend existing User model with subscription data
4. **Team Subscriptions**: Add team-level billing support
5. **Webhook Processing**: Adapt event handlers for Prisma integration

---

## Database Schema Changes

### User Model Extensions
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

  // New Stripe Integration Fields
  customerId         String?   @map("stripe_customer_id") @db.VarChar(255)
  subscriptionId     String?   @map("stripe_subscription_id") @db.VarChar(255)
  priceId           String?   @map("stripe_price_id") @db.VarChar(255)
  hasAccess         Boolean   @default(false) @map("has_access")
  planType          String?   @map("plan_type") @db.VarChar(50)
  subscriptionStatus String?   @map("subscription_status") @db.VarChar(50)
  trialEndsAt       DateTime? @map("trial_ends_at") @db.Timestamptz(6)
  billingEmail      String?   @map("billing_email") @db.VarChar(255)
  
  // Existing relations
  websiteUser       Website[]  @relation("user")
  websiteCreateUser Website[]  @relation("createUser")
  teamUser          TeamUser[]
  report            Report[]

  // New indexes for performance
  @@index([customerId])
  @@index([subscriptionId])
  @@index([subscriptionStatus])
  @@map("user")
}
```

### Team Subscription Model
**New Model for Team-Based Billing**:

```prisma
model TeamSubscription {
  id                String    @id @default(uuid()) @db.Uuid
  teamId           String    @map("team_id") @db.Uuid
  customerId       String    @map("stripe_customer_id") @db.VarChar(255)
  subscriptionId   String?   @map("stripe_subscription_id") @db.VarChar(255)
  priceId          String?   @map("stripe_price_id") @db.VarChar(255)
  status           String    @map("status") @db.VarChar(50)
  planType         String    @map("plan_type") @db.VarChar(50)
  quantity         Int       @default(1) // For seat-based pricing
  currentPeriodEnd DateTime? @map("current_period_end") @db.Timestamptz(6)
  trialEndsAt      DateTime? @map("trial_ends_at") @db.Timestamptz(6)
  billingEmail     String?   @map("billing_email") @db.VarChar(255)
  createdAt        DateTime  @default(now()) @map("created_at") @db.Timestamptz(6)
  updatedAt        DateTime  @updatedAt @map("updated_at") @db.Timestamptz(6)

  team Team @relation(fields: [teamId], references: [id])

  @@index([customerId])
  @@index([subscriptionId])
  @@index([teamId])
  @@index([status])
  @@map("team_subscription")
}
```

### Migration Script
**File**: `prisma/migrations/add_stripe_integration.sql`

```sql
-- Add Stripe fields to User table
ALTER TABLE "user" ADD COLUMN "stripe_customer_id" VARCHAR(255);
ALTER TABLE "user" ADD COLUMN "stripe_subscription_id" VARCHAR(255);
ALTER TABLE "user" ADD COLUMN "stripe_price_id" VARCHAR(255);
ALTER TABLE "user" ADD COLUMN "has_access" BOOLEAN DEFAULT false;
ALTER TABLE "user" ADD COLUMN "plan_type" VARCHAR(50);
ALTER TABLE "user" ADD COLUMN "subscription_status" VARCHAR(50);
ALTER TABLE "user" ADD COLUMN "trial_ends_at" TIMESTAMPTZ(6);
ALTER TABLE "user" ADD COLUMN "billing_email" VARCHAR(255);

-- Create indexes for performance
CREATE INDEX "user_stripe_customer_id_idx" ON "user"("stripe_customer_id");
CREATE INDEX "user_stripe_subscription_id_idx" ON "user"("stripe_subscription_id");
CREATE INDEX "user_subscription_status_idx" ON "user"("subscription_status");

-- Create TeamSubscription table
CREATE TABLE "team_subscription" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "team_id" UUID NOT NULL,
  "stripe_customer_id" VARCHAR(255) NOT NULL,
  "stripe_subscription_id" VARCHAR(255),
  "stripe_price_id" VARCHAR(255),
  "status" VARCHAR(50) NOT NULL,
  "plan_type" VARCHAR(50) NOT NULL,
  "quantity" INTEGER DEFAULT 1,
  "current_period_end" TIMESTAMPTZ(6),
  "trial_ends_at" TIMESTAMPTZ(6),
  "billing_email" VARCHAR(255),
  "created_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ(6) DEFAULT NOW(),
  FOREIGN KEY ("team_id") REFERENCES "team"("team_id")
);

-- Create indexes for TeamSubscription
CREATE INDEX "team_subscription_customer_id_idx" ON "team_subscription"("stripe_customer_id");
CREATE INDEX "team_subscription_subscription_id_idx" ON "team_subscription"("stripe_subscription_id");
CREATE INDEX "team_subscription_team_id_idx" ON "team_subscription"("team_id");
CREATE INDEX "team_subscription_status_idx" ON "team_subscription"("status");
```

---

## Implementation Phases

### Phase 1: Foundation Setup (2-3 hours)
**Priority**: Critical  
**Dependencies**: None

#### Tasks:
1. **Add Stripe Dependencies**
   ```bash
   pnpm add stripe
   pnpm add -D @types/stripe
   ```

2. **Environment Configuration**
   - Add Stripe API keys to `.env`
   - Configure webhook endpoints
   - Set up Stripe dashboard

3. **Database Schema Migration**
   - Create and run migration scripts
   - Update Prisma client
   - Verify schema changes

4. **Basic Configuration Files**
   - Create Stripe configuration constants
   - Set up pricing plans configuration
   - Add environment validation

**Deliverables**:
- ✅ Stripe dependency installed
- ✅ Database schema updated
- ✅ Environment configured
- ✅ Configuration files created

---

### Phase 2: Core Integration (4-5 hours)
**Priority**: Critical  
**Dependencies**: Phase 1 complete

#### Tasks:
1. **Update Stripe Utility Functions**
   - Adapt `src/lib/stripe.ts` for Superlytics
   - Add TypeScript interfaces
   - Implement error handling patterns

2. **Migrate API Routes**
   - Convert authentication to Superlytics JWT
   - Replace MongoDB queries with Prisma
   - Update user lookup logic

3. **Webhook Handler Rewrite**
   - Integrate with Prisma User model
   - Handle UUID-based user IDs
   - Add comprehensive event logging

4. **Authentication Middleware Updates**
   - Add subscription status checks
   - Implement role-based access with subscriptions
   - Create subscription validation utilities

**Key Files to Modify**:
- `src/lib/stripe.ts` - Update utility functions
- `src/app/api/stripe/create-checkout/route.ts` - Auth integration
- `src/app/api/stripe/create-portal/route.ts` - Auth integration
- `src/app/api/webhook/stripe/route.ts` - Complete rewrite

**Deliverables**:
- ✅ Stripe utilities adapted
- ✅ API routes updated
- ✅ Webhook handler working
- ✅ Authentication integrated

---

### Phase 3: Frontend Components (3-4 hours)
**Priority**: High  
**Dependencies**: Phase 2 complete

#### Tasks:
1. **Pricing Page Component**
   ```typescript
   // src/components/billing/PricingPage.tsx
   interface PricingTier {
     id: string;
     name: string;
     price: number;
     priceId: string;
     features: string[];
     recommended?: boolean;
   }
   ```

2. **Subscription Dashboard**
   - Current plan display
   - Usage metrics
   - Billing history
   - Payment method management

3. **Billing Management Interface**
   - Update payment methods
   - Download invoices
   - Manage subscription
   - Cancel/upgrade flows

4. **Usage-Based Restrictions**
   - Feature gate components
   - Usage limit warnings
   - Upgrade prompts

**Component Structure**:
```
src/components/billing/
├── PricingPage.tsx
├── SubscriptionDashboard.tsx
├── BillingPortal.tsx
├── UsageMetrics.tsx
├── PaymentMethodCard.tsx
└── UpgradePrompt.tsx
```

**Deliverables**:
- ✅ Pricing page implemented
- ✅ Subscription dashboard built
- ✅ Billing management UI
- ✅ Usage restrictions active

---

### Phase 4: Team Subscriptions (2-3 hours)
**Priority**: Medium  
**Dependencies**: Phase 3 complete

#### Tasks:
1. **Team Billing Model**
   - Implement TeamSubscription operations
   - Add team-level subscription checks
   - Create team billing dashboard

2. **Multi-Tenant Authorization**
   - Update permission checks for team subscriptions
   - Add team subscription middleware
   - Implement seat-based access control

3. **Team Management UI**
   - Team subscription overview
   - Member seat management
   - Team billing settings

4. **Webhook Extensions**
   - Handle team subscription events
   - Manage team member access
   - Process team billing updates

**New Files**:
- `src/lib/team-subscriptions.ts` - Team billing utilities
- `src/components/teams/TeamBilling.tsx` - Team billing UI
- `src/app/api/teams/[id]/subscription/route.ts` - Team subscription API

**Deliverables**:
- ✅ Team subscriptions functional
- ✅ Multi-tenant billing
- ✅ Team management UI
- ✅ Seat-based access control

---

### Phase 5: Testing & Polish (2-3 hours)
**Priority**: High  
**Dependencies**: All phases complete

#### Tasks:
1. **Webhook Testing**
   - Set up Stripe CLI for local testing
   - Test all webhook events
   - Verify database updates

2. **Payment Flow Testing**
   - End-to-end checkout testing
   - Subscription management testing
   - Error scenario handling

3. **Integration Testing**
   - Authentication + billing integration
   - Role-based access with subscriptions
   - Team subscription workflows

4. **Documentation & Monitoring**
   - Update API documentation
   - Add monitoring alerts
   - Create troubleshooting guides

**Testing Checklist**:
- [ ] Successful subscription creation
- [ ] Failed payment handling
- [ ] Subscription cancellation
- [ ] Plan upgrades/downgrades
- [ ] Team subscription management
- [ ] Webhook signature validation
- [ ] Database consistency checks
- [ ] Error handling verification

**Deliverables**:
- ✅ Comprehensive testing complete
- ✅ Error handling verified
- ✅ Documentation updated
- ✅ Monitoring configured

---

## Code Changes Specification

### 1. Stripe Utilities Update
**File**: `src/lib/stripe.ts`

```typescript
import Stripe from "stripe";
import { getUser, updateUser } from '@/lib/queries/users';
import { log } from '@/lib/debug';

// Superlytics-specific interfaces
interface CreateCheckoutParams {
  priceId: string;
  mode: "payment" | "subscription";
  successUrl: string;
  cancelUrl: string;
  couponId?: string | null;
  clientReferenceId?: string;
  user?: {
    id: string;
    customerId?: string;
    email?: string;
  };
}

interface StripeConfig {
  secretKey: string;
  apiVersion: "2023-08-16";
  typescript: true;
}

// Initialize Stripe with error handling
function getStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-08-16",
    typescript: true,
  });
}

// Updated for Superlytics auth system
export const createCheckout = async ({
  user,
  mode,
  clientReferenceId,
  successUrl,
  cancelUrl,
  priceId,
  couponId,
}: CreateCheckoutParams): Promise<string | null> => {
  try {
    const stripe = getStripeInstance();

    const extraParams: Partial<Stripe.Checkout.SessionCreateParams> = {};

    if (user?.customerId) {
      extraParams.customer = user.customerId;
    } else {
      if (mode === "payment") {
        extraParams.customer_creation = "always";
        extraParams.payment_intent_data = { setup_future_usage: "on_session" };
      }
      if (user?.email) {
        extraParams.customer_email = user.email;
      }
      extraParams.tax_id_collection = { enabled: true };
    }

    const stripeSession = await stripe.checkout.sessions.create({
      mode,
      allow_promotion_codes: true,
      client_reference_id: clientReferenceId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      discounts: couponId
        ? [{ coupon: couponId }]
        : [],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...extraParams,
    });

    log('Stripe checkout session created:', { sessionId: stripeSession.id });
    return stripeSession.url;
  } catch (error) {
    log('Error creating Stripe checkout:', error);
    return null;
  }
};

// Updated for Superlytics patterns
export const createCustomerPortal = async ({
  customerId,
  returnUrl,
}: CreateCustomerPortalParams): Promise<string | null> => {
  try {
    const stripe = getStripeInstance();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    log('Customer portal session created:', { customerId });
    return portalSession.url;
  } catch (error) {
    log('Error creating customer portal:', error);
    return null;
  }
};

// Updated for Prisma integration
export const findCheckoutSession = async (sessionId: string) => {
  try {
    const stripe = getStripeInstance();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    return session;
  } catch (error) {
    log('Error finding checkout session:', error);
    return null;
  }
};

// New utility functions for Superlytics
export const syncStripeCustomer = async (userId: string, stripeCustomer: Stripe.Customer) => {
  return updateUser(userId, {
    customerId: stripeCustomer.id,
    billingEmail: stripeCustomer.email,
  });
};

export const getSubscriptionStatus = (subscription: Stripe.Subscription): string => {
  // Map Stripe statuses to Superlytics internal statuses
  const statusMap = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };

  return statusMap[subscription.status] || 'unknown';
};
```

### 2. Authentication Integration
**File**: `src/app/api/stripe/create-checkout/route.ts`

```typescript
import { NextResponse, NextRequest } from "next/server";
import { parseRequest } from '@/lib/request';
import { createCheckout } from '@/lib/stripe';
import { getUser } from '@/lib/queries/users';
import { z } from 'zod';

const schema = z.object({
  priceId: z.string(),
  mode: z.enum(['payment', 'subscription']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const { body, auth, error } = await parseRequest(request, schema);

  if (error) return error();

  const { priceId, mode, successUrl, cancelUrl, couponId } = body;
  
  let user = null;
  if (auth?.user) {
    user = await getUser(auth.user.id);
  }

  try {
    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      clientReferenceId: user?.id,
      user: user ? {
        id: user.id,
        customerId: user.customerId,
        email: user.username, // Using username as email in Superlytics
      } : undefined,
      couponId,
    });

    if (!stripeSessionURL) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: stripeSessionURL });
  } catch (error) {
    console.error('Checkout creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Webhook Handler Rewrite
**File**: `src/app/api/webhook/stripe/route.ts`

```typescript
import { NextResponse, NextRequest } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { findCheckoutSession, getSubscriptionStatus } from '@/lib/stripe';
import { getUser, getUserByCustomerId, updateUser, createUser } from '@/lib/queries/users';
import { log } from '@/lib/debug';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16",
  typescript: true,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get("stripe-signature");

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    log('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        log('Unhandled event type:', event.type);
    }
  } catch (error: any) {
    log('Webhook processing error:', error.message);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}

// Webhook event handlers
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  log('Processing checkout.session.completed:', session.id);

  const fullSession = await findCheckoutSession(session.id);
  if (!fullSession) return;

  const customerId = fullSession.customer as string;
  const priceId = fullSession.line_items?.data[0]?.price?.id;
  const userId = session.client_reference_id;

  if (!priceId) {
    log('No price ID found in session');
    return;
  }

  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  let user;

  // Find or create user
  if (userId) {
    user = await getUser(userId);
  } else if (customer.email) {
    user = await getUserByCustomerId(customerId);
    
    if (!user) {
      // Create new user for checkout without account
      user = await createUser({
        username: customer.email,
        password: '', // Will need to set password later
        role: 'user',
        displayName: customer.name || undefined,
        customerId,
        hasAccess: true,
        priceId,
        subscriptionStatus: 'active',
      });
    }
  }

  if (!user) {
    log('No user found for checkout session');
    return;
  }

  // Update user with subscription data
  await updateUser(user.id, {
    customerId,
    priceId,
    hasAccess: true,
    subscriptionStatus: 'active',
    billingEmail: customer.email,
  });

  log('User subscription activated:', { userId: user.id, priceId });
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  log('Processing customer.subscription.updated:', subscription.id);

  const user = await getUserByCustomerId(subscription.customer as string);
  if (!user) return;

  const status = getSubscriptionStatus(subscription);
  const priceId = subscription.items.data[0]?.price?.id;

  await updateUser(user.id, {
    subscriptionId: subscription.id,
    priceId,
    subscriptionStatus: status,
    hasAccess: ['active', 'trialing'].includes(status),
  });

  log('User subscription updated:', { userId: user.id, status });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  log('Processing customer.subscription.deleted:', subscription.id);

  const user = await getUserByCustomerId(subscription.customer as string);
  if (!user) return;

  await updateUser(user.id, {
    hasAccess: false,
    subscriptionStatus: 'canceled',
  });

  log('User subscription canceled:', { userId: user.id });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  log('Processing invoice.paid:', invoice.id);

  const user = await getUserByCustomerId(invoice.customer as string);
  if (!user) return;

  const priceId = invoice.lines.data[0]?.price?.id;
  
  // Ensure user has access after successful payment
  await updateUser(user.id, {
    hasAccess: true,
    subscriptionStatus: 'active',
    priceId,
  });

  log('User access granted after payment:', { userId: user.id });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  log('Processing invoice.payment_failed:', invoice.id);

  const user = await getUserByCustomerId(invoice.customer as string);
  if (!user) return;

  // Optionally revoke access or mark as past due
  await updateUser(user.id, {
    subscriptionStatus: 'past_due',
    // hasAccess: false, // Decide based on grace period policy
  });

  log('User payment failed:', { userId: user.id });
}
```

---

## Environment Configuration

### Required Environment Variables

```env
# Existing Superlytics variables
DATABASE_URL="postgresql://..."
APP_SECRET="your-app-secret"
REDIS_URL="redis://..." # Optional

# New Stripe Integration Variables
STRIPE_SECRET_KEY="sk_test_..." # Use sk_live_ for production
STRIPE_PUBLISHABLE_KEY="pk_test_..." # Use pk_live_ for production
STRIPE_WEBHOOK_SECRET="whsec_..."

# Public keys for frontend
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Optional Stripe Configuration
STRIPE_WEBHOOK_TOLERANCE=300 # 5 minutes tolerance for webhooks
STRIPE_API_VERSION="2023-08-16"
```

### Stripe Configuration Constants
**File**: `src/lib/config/stripe.ts`

```typescript
export const STRIPE_CONFIG = {
  // Pricing Plans
  plans: [
    {
      id: 'starter',
      name: 'Starter',
      priceId: process.env.NODE_ENV === 'production' 
        ? 'price_live_starter' 
        : 'price_test_starter',
      price: 9.99,
      interval: 'month',
      features: [
        'Up to 10,000 page views/month',
        'Basic analytics dashboard',
        'Email support',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      priceId: process.env.NODE_ENV === 'production' 
        ? 'price_live_professional' 
        : 'price_test_professional',
      price: 29.99,
      interval: 'month',
      features: [
        'Up to 100,000 page views/month',
        'Advanced analytics',
        'Custom events',
        'Priority support',
        'Data export',
      ],
      recommended: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      priceId: process.env.NODE_ENV === 'production' 
        ? 'price_live_enterprise' 
        : 'price_test_enterprise',
      price: 99.99,
      interval: 'month',
      features: [
        'Unlimited page views',
        'White-label analytics',
        'API access',
        'Dedicated support',
        'Custom integrations',
        'Team collaboration',
      ],
    },
  ],

  // Feature limits by plan
  limits: {
    starter: {
      pageViews: 10000,
      websites: 3,
      teamMembers: 1,
      dataRetention: 90, // days
    },
    professional: {
      pageViews: 100000,
      websites: 10,
      teamMembers: 5,
      dataRetention: 365,
    },
    enterprise: {
      pageViews: -1, // unlimited
      websites: -1,
      teamMembers: -1,
      dataRetention: -1,
    },
  },

  // URLs
  urls: {
    success: '/dashboard/billing/success',
    cancel: '/pricing',
    portal: '/dashboard/billing',
  },
} as const;

export type PlanId = keyof typeof STRIPE_CONFIG.limits;
export type Plan = typeof STRIPE_CONFIG.plans[number];
```

---

## Testing Strategy

### 1. Unit Testing
**Coverage Areas**:
- Stripe utility functions
- Webhook event handlers
- User subscription queries
- Payment validation logic

**Example Test**: `src/lib/__tests__/stripe.test.ts`

```typescript
import { createCheckout, getSubscriptionStatus } from '@/lib/stripe';
import Stripe from 'stripe';

// Mock Stripe
jest.mock('stripe');

describe('Stripe Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCheckout', () => {
    it('should create checkout session successfully', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      };

      const mockStripe = {
        checkout: {
          sessions: {
            create: jest.fn().mockResolvedValue(mockSession),
          },
        },
      };

      (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(() => mockStripe as any);

      const result = await createCheckout({
        priceId: 'price_test_123',
        mode: 'subscription',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        clientReferenceId: 'user_123',
      });

      expect(result).toBe(mockSession.url);
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        allow_promotion_codes: true,
        client_reference_id: 'user_123',
        line_items: [{ price: 'price_test_123', quantity: 1 }],
        discounts: [],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        customer_creation: 'always',
        tax_id_collection: { enabled: true },
      });
    });
  });

  describe('getSubscriptionStatus', () => {
    it('should map Stripe statuses correctly', () => {
      const testCases = [
        { stripe: 'active', expected: 'active' },
        { stripe: 'canceled', expected: 'canceled' },
        { stripe: 'past_due', expected: 'past_due' },
        { stripe: 'trialing', expected: 'trialing' },
      ];

      testCases.forEach(({ stripe, expected }) => {
        const mockSubscription = { status: stripe } as Stripe.Subscription;
        expect(getSubscriptionStatus(mockSubscription)).toBe(expected);
      });
    });
  });
});
```

### 2. Integration Testing
**Webhook Testing with Stripe CLI**:

```bash
# Install Stripe CLI
curl -s https://packages.stripe.com/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:3000/api/webhook/stripe

# Test webhook events
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### 3. End-to-End Testing
**Cypress Tests**: `cypress/e2e/stripe-integration.cy.ts`

```typescript
describe('Stripe Integration E2E', () => {
  beforeEach(() => {
    cy.task('db:seed');
    cy.login('testuser', 'password123');
  });

  it('should complete subscription checkout flow', () => {
    // Visit pricing page
    cy.visit('/pricing');
    
    // Select professional plan
    cy.get('[data-testid="plan-professional"]').within(() => {
      cy.get('[data-testid="subscribe-button"]').click();
    });

    // Should redirect to Stripe checkout
    cy.url().should('include', 'checkout.stripe.com');

    // Fill Stripe checkout form (using test card)
    cy.get('#email').type('test@example.com');
    cy.get('#cardNumber').type('4242424242424242');
    cy.get('#cardExpiry').type('12/34');
    cy.get('#cardCvc').type('123');
    cy.get('#billingName').type('Test User');

    // Submit payment
    cy.get('[data-testid="submit-button"]').click();

    // Should redirect back to success page
    cy.url().should('include', '/dashboard/billing/success');
    cy.contains('Subscription activated successfully');

    // Verify user has access
    cy.visit('/dashboard');
    cy.get('[data-testid="plan-indicator"]').should('contain', 'Professional');
  });

  it('should handle failed payment gracefully', () => {
    cy.visit('/pricing');
    
    cy.get('[data-testid="plan-starter"]').within(() => {
      cy.get('[data-testid="subscribe-button"]').click();
    });

    // Use declined card
    cy.get('#cardNumber').type('4000000000000002');
    cy.get('#cardExpiry').type('12/34');
    cy.get('#cardCvc').type('123');
    
    cy.get('[data-testid="submit-button"]').click();
    
    // Should show error message
    cy.contains('Your card was declined');
  });

  it('should allow subscription management', () => {
    // Setup: User with active subscription
    cy.task('db:createSubscribedUser', {
      username: 'subscriber',
      planId: 'professional'
    });
    
    cy.login('subscriber', 'password123');
    cy.visit('/dashboard/billing');

    // Should show current subscription
    cy.get('[data-testid="current-plan"]').should('contain', 'Professional');
    
    // Test billing portal access
    cy.get('[data-testid="manage-billing"]').click();
    cy.url().should('include', 'billing.stripe.com');
  });
});
```

---

## Security Considerations

### 1. Webhook Security
- **Signature Verification**: All webhooks verified using Stripe signature
- **Idempotency**: Duplicate event handling prevention
- **Error Handling**: Secure error responses without data leakage

### 2. Data Protection
- **PCI Compliance**: No credit card data stored in application
- **Customer Data**: Minimal Stripe customer data retention
- **Encryption**: All sensitive data encrypted at rest and in transit

### 3. Access Control
- **Subscription Validation**: Real-time subscription status checks
- **Role Integration**: Subscription tiers mapped to Superlytics roles
- **Team Permissions**: Team-level subscription access control

### 4. Payment Security
- **Stripe Elements**: Secure payment form handling
- **HTTPS Only**: All payment-related endpoints require HTTPS
- **Token Validation**: JWT tokens include subscription metadata

---

## Team Subscription Model

### Architecture Overview
Teams in Superlytics can have their own subscriptions, separate from individual user subscriptions. This enables:

- **Centralized Billing**: One payment method for entire team
- **Seat Management**: Add/remove team members based on subscription
- **Role-Based Access**: Team subscription level determines available features
- **Usage Aggregation**: Team-wide usage limits and monitoring

### Implementation Details

#### 1. Team Subscription Creation
```typescript
// src/lib/team-subscriptions.ts
export async function createTeamSubscription(
  teamId: string,
  ownerId: string,
  priceId: string
) {
  const team = await getTeam(teamId);
  const owner = await getUser(ownerId);

  // Verify ownership
  const teamUser = await getTeamUser(teamId, ownerId);
  if (teamUser?.role !== 'team-owner') {
    throw new Error('Only team owners can create subscriptions');
  }

  // Create Stripe customer for team
  const customer = await stripe.customers.create({
    name: team.name,
    email: owner.username,
    metadata: {
      teamId,
      ownerId,
    },
  });

  // Create checkout session for team subscription
  return createCheckout({
    priceId,
    mode: 'subscription',
    successUrl: `/teams/${teamId}/billing/success`,
    cancelUrl: `/teams/${teamId}/billing`,
    clientReferenceId: teamId,
    user: {
      id: teamId,
      customerId: customer.id,
      email: owner.username,
    },
  });
}
```

#### 2. Team Access Control
```typescript
// src/lib/auth.ts - Extension
export async function checkTeamSubscriptionAccess(
  teamId: string,
  feature: string
): Promise<boolean> {
  const teamSubscription = await getTeamSubscription(teamId);
  
  if (!teamSubscription || teamSubscription.status !== 'active') {
    return false;
  }

  const planLimits = STRIPE_CONFIG.limits[teamSubscription.planType];
  return hasFeatureAccess(planLimits, feature);
}

export async function canViewWebsite(
  { user, shareToken }: Auth,
  websiteId: string
): Promise<boolean> {
  // Existing individual checks...
  
  const website = await getWebsite(websiteId);
  
  if (website.teamId) {
    const teamUser = await getTeamUser(website.teamId, user.id);
    if (!teamUser) return false;

    // Check team subscription access
    return checkTeamSubscriptionAccess(website.teamId, 'website:view');
  }

  return false;
}
```

#### 3. Team Billing Dashboard
**Component**: `src/components/teams/TeamBilling.tsx`

```typescript
interface TeamBillingProps {
  teamId: string;
}

export function TeamBilling({ teamId }: TeamBillingProps) {
  const { data: subscription } = useTeamSubscription(teamId);
  const { data: usage } = useTeamUsage(teamId);
  const { mutate: createPortalSession } = useCreatePortalSession();

  const handleManageBilling = () => {
    createPortalSession({
      teamId,
      returnUrl: `/teams/${teamId}/billing`,
    });
  };

  return (
    <div className="team-billing">
      <h2>Team Subscription</h2>
      
      {subscription ? (
        <div className="subscription-active">
          <div className="plan-info">
            <h3>{subscription.planType} Plan</h3>
            <p>Status: {subscription.status}</p>
            <p>Next billing: {subscription.currentPeriodEnd}</p>
          </div>

          <div className="usage-info">
            <h4>Current Usage</h4>
            <UsageBar
              current={usage.pageViews}
              limit={subscription.limits.pageViews}
              label="Page Views"
            />
            <UsageBar
              current={usage.teamMembers}
              limit={subscription.limits.teamMembers}
              label="Team Members"
            />
          </div>

          <button onClick={handleManageBilling}>
            Manage Billing
          </button>
        </div>
      ) : (
        <div className="no-subscription">
          <p>No active team subscription</p>
          <Link href={`/teams/${teamId}/pricing`}>
            Choose a Plan
          </Link>
        </div>
      )}
    </div>
  );
}
```

---

## Timeline & Resources

### Development Timeline
**Total Estimated Time**: 13-18 hours over 1-2 weeks

| Phase | Duration | Dependencies | Priority |
|-------|----------|--------------|----------|
| Phase 1: Foundation | 2-3 hours | None | Critical |
| Phase 2: Core Integration | 4-5 hours | Phase 1 | Critical |
| Phase 3: Frontend Components | 3-4 hours | Phase 2 | High |
| Phase 4: Team Subscriptions | 2-3 hours | Phase 3 | Medium |
| Phase 5: Testing & Polish | 2-3 hours | All phases | High |

### Resource Requirements

#### **Developer Skills Needed**:
- Next.js/React development
- TypeScript proficiency
- Prisma/PostgreSQL experience
- Stripe API knowledge
- JWT authentication understanding

#### **Third-Party Services**:
- Stripe account (Test + Production)
- Database migration capabilities
- Redis instance (optional, for sessions)

#### **Infrastructure Requirements**:
- Webhook endpoint configuration
- HTTPS certificate for webhooks
- Environment variable management

### Deployment Checklist

#### **Pre-Production**:
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Stripe webhooks configured
- [ ] Test payments verified
- [ ] Error monitoring setup

#### **Production Deployment**:
- [ ] Switch to Stripe live keys
- [ ] Update webhook endpoints
- [ ] Monitor error rates
- [ ] Verify payment flows
- [ ] Check subscription synchronization

---

## Risk Assessment

### High Risk Items

#### **1. Data Migration Complexity**
**Risk**: Existing user data corruption during schema migration  
**Mitigation**:
- Comprehensive backup before migration
- Gradual rollout with rollback plan
- Extensive testing in staging environment

#### **2. Webhook Reliability**
**Risk**: Failed webhook processing causing subscription sync issues  
**Mitigation**:
- Idempotent webhook handlers
- Retry mechanism for failed webhooks
- Manual sync tools for edge cases
- Real-time monitoring and alerts

#### **3. Payment Processing Errors**
**Risk**: Failed payments not properly handled  
**Mitigation**:
- Comprehensive error handling
- Grace period for failed payments
- Customer notification system
- Manual intervention procedures

### Medium Risk Items

#### **1. Team Subscription Complexity**
**Risk**: Team billing logic introduces bugs  
**Mitigation**:
- Thorough testing of team scenarios
- Clear permission hierarchy
- Fallback to individual subscriptions

#### **2. Authentication Integration**
**Risk**: JWT + Stripe integration causes auth issues  
**Mitigation**:
- Maintain existing auth as primary
- Subscription data as secondary validation
- Clear separation of concerns

### Low Risk Items

#### **1. Frontend Component Issues**
**Risk**: UI/UX problems with billing interfaces  
**Mitigation**:
- User testing feedback
- Progressive rollout
- Easy rollback for UI changes

#### **2. Performance Impact**
**Risk**: Additional database queries slow down app  
**Mitigation**:
- Database query optimization
- Caching for subscription status
- Performance monitoring

---

## Success Metrics

### Business Metrics
- **Subscription Conversion Rate**: Target >15% from free to paid
- **Monthly Recurring Revenue (MRR)**: Track growth month-over-month
- **Churn Rate**: Target <5% monthly churn
- **Average Revenue Per User (ARPU)**: Measure plan distribution

### Technical Metrics
- **Payment Success Rate**: Target >99% successful payments
- **Webhook Processing Rate**: Target <1s average processing time
- **API Response Time**: Maintain <200ms for billing endpoints
- **Error Rate**: Target <0.1% for payment-related errors

### User Experience Metrics
- **Checkout Completion Rate**: Target >85% checkout completion
- **Support Ticket Reduction**: Measure billing-related tickets
- **Feature Adoption**: Track usage of subscription-gated features
- **User Satisfaction**: Survey feedback on billing experience

### Monitoring & Alerting
- Real-time payment failure alerts
- Webhook processing failure notifications
- Subscription sync error monitoring
- Database performance impact tracking

---

## Conclusion

This comprehensive integration plan transforms Superlytics into a fully-functional SaaS platform while preserving its core strengths:

### **Key Advantages**:
- **Proven Foundation**: Builds on working Stripe code and battle-tested Superlytics auth
- **Enterprise Scale**: Supports both individual and team subscriptions
- **Security First**: Maintains Superlytics' security standards
- **Scalable Architecture**: Designed for growth and feature expansion

### **Implementation Benefits**:
- **Minimal Risk**: Leverages existing, working components
- **Fast Time-to-Market**: 1-2 week implementation timeline
- **Flexible Pricing**: Supports multiple subscription models
- **Professional Grade**: Production-ready with comprehensive testing

### **Next Steps**:
1. **Approve Plan**: Review and approve implementation approach
2. **Setup Environment**: Configure Stripe account and webhooks
3. **Begin Phase 1**: Start with foundation setup and database migration
4. **Iterative Development**: Implement phases sequentially with testing
5. **Production Deployment**: Launch with monitoring and support ready

This plan provides a clear roadmap for successful Stripe integration while maintaining Superlytics' high standards for security, performance, and user experience.

---

*This document serves as the definitive guide for Stripe SaaS integration with Superlytics. All implementation should follow this specification to ensure consistency and reliability.*