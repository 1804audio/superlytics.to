# 🚀 Superlytics SaaS Implementation Plan
*Comprehensive guide for transforming Superlytics into a subscription-based analytics platform*

## 📋 Executive Summary

This document outlines the complete implementation plan for converting Superlytics from a self-hosted analytics platform into a full-featured SaaS solution. The plan leverages Supabase for user management and Stripe for billing while maintaining the existing analytics infrastructure.

### Key Components
- **Supabase**: User authentication, profiles, subscriptions, usage tracking
- **Stripe**: Payment processing, subscription management, billing automation
- **Existing Infrastructure**: Analytics data (Prisma/PostgreSQL) remains unchanged
- **Integration**: Seamless connection between all systems via user IDs and RLS policies

---

## 🏗️ Architecture Overview

### Database Strategy
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Supabase      │    │   Next.js App    │    │   Existing      │
│                 │    │                  │    │   Analytics DB  │
│ • Users/Auth    │◄──►│ • Plan Logic     │◄──►│                 │
│ • Subscriptions │    │ • Usage Tracking │    │ • Websites      │
│ • Usage Limits  │    │ • Limits Check   │    │ • Events        │
│ • Billing Data  │    │ • API Routes     │    │ • Sessions      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         ▲                       ▲
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌──────────────────┐
│     Stripe      │    │   Frontend       │
│                 │    │                  │
│ • Payments      │    │ • Dashboard      │
│ • Subscriptions │    │ • Pricing Page   │
│ • Webhooks      │    │ • Settings       │
│ • Customer      │    │ • Billing UI     │
│   Portal        │    │                  │
└─────────────────┘    └──────────────────┘
```

### Integration Points
- **User Authentication**: Supabase Auth handles all user management
- **Billing Integration**: Stripe manages subscriptions, Supabase stores billing metadata
- **Usage Enforcement**: Real-time usage tracking with automatic limit enforcement
- **Data Isolation**: Row Level Security (RLS) ensures tenant data separation

---

## 💰 Pricing Strategy

### Subscription Tiers

| Plan | Price | Websites | Events/Month | Data Retention | Key Features |
|------|-------|----------|--------------|----------------|--------------|
| **Free** | $0 | 2 | 10,000 | 30 days | Basic analytics |
| **Starter** | $9/month | 5 | 100,000 | 6 months | Custom events, email support |
| **Professional** | $29/month | 25 | 1,000,000 | 2 years | Advanced reports, API access, teams |
| **Enterprise** | $99/month | Unlimited | Unlimited | Unlimited | White-label, SSO, dedicated support |

### Plan Configuration
```typescript
// src/lib/plans.ts
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    stripePriceId: null,
    limits: {
      websites: 2,
      eventsPerMonth: 10000,
      dataRetentionDays: 30,
      teamMembers: 1,
      apiCalls: 1000
    },
    features: {
      basicAnalytics: true,
      customEvents: false,
      advancedReports: false,
      apiAccess: false,
      teamCollaboration: false,
      whiteLabel: false,
      prioritySupport: false
    }
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    stripePriceId: 'price_starter_monthly',
    limits: {
      websites: 5,
      eventsPerMonth: 100000,
      dataRetentionDays: 180,
      teamMembers: 3,
      apiCalls: 10000
    },
    features: {
      basicAnalytics: true,
      customEvents: true,
      advancedReports: false,
      apiAccess: false,
      teamCollaboration: true,
      whiteLabel: false,
      prioritySupport: false
    }
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 29,
    stripePriceId: 'price_professional_monthly',
    limits: {
      websites: 25,
      eventsPerMonth: 1000000,
      dataRetentionDays: 730,
      teamMembers: 10,
      apiCalls: 100000
    },
    features: {
      basicAnalytics: true,
      customEvents: true,
      advancedReports: true,
      apiAccess: true,
      teamCollaboration: true,
      whiteLabel: false,
      prioritySupport: true
    }
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    stripePriceId: 'price_enterprise_monthly',
    limits: {
      websites: -1, // Unlimited
      eventsPerMonth: -1, // Unlimited
      dataRetentionDays: -1, // Unlimited
      teamMembers: -1, // Unlimited
      apiCalls: -1 // Unlimited
    },
    features: {
      basicAnalytics: true,
      customEvents: true,
      advancedReports: true,
      apiAccess: true,
      teamCollaboration: true,
      whiteLabel: true,
      prioritySupport: true,
      sso: true,
      customIntegrations: true
    }
  }
};
```

---

## 🔐 Supabase Integration

### Database Schema

#### 1. User Profiles with RLS
```sql
-- User profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  plan_id TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT UNIQUE,
  trial_ends_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### 2. Subscription Management
```sql
-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL, -- active, canceled, past_due, trialing, incomplete
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
```

#### 3. Usage Tracking with Real-time
```sql
-- Usage metrics table
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL, -- 'events', 'websites', 'api_calls'
  current_count INTEGER DEFAULT 0,
  limit_count INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, metric_type, period_start)
);

ALTER TABLE usage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_metrics
  FOR SELECT USING (auth.uid() = user_id);

-- Enable real-time updates for usage metrics
ALTER PUBLICATION supabase_realtime ADD TABLE usage_metrics;

-- Indexes for performance
CREATE INDEX idx_usage_metrics_user_id ON usage_metrics(user_id);
CREATE INDEX idx_usage_metrics_period ON usage_metrics(user_id, period_start, period_end);
```

#### 4. Database Functions
```sql
-- Function to get user's plan limits
CREATE OR REPLACE FUNCTION get_plan_limits(p_user_id UUID)
RETURNS TABLE(
  websites_limit INTEGER,
  events_limit INTEGER,
  retention_days INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_plan_id TEXT;
BEGIN
  SELECT plan_id INTO user_plan_id
  FROM profiles
  WHERE id = p_user_id;
  
  -- Return limits based on plan
  CASE user_plan_id
    WHEN 'free' THEN
      RETURN QUERY SELECT 2, 10000, 30;
    WHEN 'starter' THEN
      RETURN QUERY SELECT 5, 100000, 180;
    WHEN 'professional' THEN
      RETURN QUERY SELECT 25, 1000000, 730;
    WHEN 'enterprise' THEN
      RETURN QUERY SELECT -1, -1, -1; -- Unlimited
    ELSE
      RETURN QUERY SELECT 2, 10000, 30; -- Default to free
  END CASE;
END;
$$;

-- Function for atomic usage increment
CREATE OR REPLACE FUNCTION increment_usage(
  p_user_id UUID,
  p_metric_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_period_start TIMESTAMPTZ;
  current_period_end TIMESTAMPTZ;
  metric_limit INTEGER;
BEGIN
  -- Calculate current billing period (monthly)
  current_period_start := date_trunc('month', NOW());
  current_period_end := current_period_start + INTERVAL '1 month';
  
  -- Get the limit for this metric type
  CASE p_metric_type
    WHEN 'events' THEN
      SELECT events_limit INTO metric_limit FROM get_plan_limits(p_user_id);
    WHEN 'websites' THEN
      SELECT websites_limit INTO metric_limit FROM get_plan_limits(p_user_id);
    ELSE
      metric_limit := 1000; -- Default limit
  END CASE;
  
  -- Insert or update usage metric
  INSERT INTO usage_metrics (
    user_id, 
    metric_type, 
    current_count, 
    limit_count,
    period_start, 
    period_end
  )
  VALUES (
    p_user_id,
    p_metric_type,
    p_increment,
    metric_limit,
    current_period_start,
    current_period_end
  )
  ON CONFLICT (user_id, metric_type, period_start)
  DO UPDATE SET 
    current_count = usage_metrics.current_count + p_increment,
    updated_at = NOW();
END;
$$;
```

### Authentication Setup
```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )
}
```

---

## 💳 Stripe Integration

### Setup and Configuration
```typescript
// src/lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  appInfo: {
    name: 'Superlytics',
    version: '1.0.0',
  },
})

// Stripe price IDs (set these in your Stripe Dashboard)
export const STRIPE_PRICE_IDS = {
  starter: process.env.STRIPE_STARTER_PRICE_ID!,
  professional: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
}
```

### Checkout Session API
```typescript
// src/app/api/billing/checkout/route.ts
import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'

export async function POST(request: NextRequest) {
  try {
    const { planId, returnUrl } = await request.json()
    
    // Get current user
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return Response.json({ error: 'Profile not found' }, { status: 404 })
    }

    const plan = PLANS[planId]
    if (!plan || !plan.stripePriceId) {
      return Response.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Create or retrieve Stripe customer
    let customerId = profile.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email!,
        name: profile.full_name,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id
      
      // Update profile with customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: {
        user_id: user.id,
        plan_id: planId,
      },
      subscription_data: {
        metadata: {
          user_id: user.id,
          plan_id: planId,
        },
      },
      automatic_tax: { enabled: true },
      billing_address_collection: 'required',
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    })

    return Response.json({ sessionId: session.id })
  } catch (error) {
    console.error('Checkout session creation failed:', error)
    return Response.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
```

### Customer Portal API
```typescript
// src/app/api/billing/portal/route.ts
import { NextRequest } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { returnUrl } = await request.json()
    
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (!profile?.stripe_customer_id) {
      return Response.json({ error: 'No billing account found' }, { status: 404 })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard`,
    })

    return Response.json({ url: session.url })
  } catch (error) {
    console.error('Portal session creation failed:', error)
    return Response.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    )
  }
}
```

### Webhook Handler
```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')!
    
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    const supabase = createClient()

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription, supabase)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase)
        break
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(null, { status: 200 })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return new Response('Webhook handler failed', { status: 500 })
  }
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: any
) {
  const userId = session.metadata?.user_id
  const planId = session.metadata?.plan_id
  
  if (!userId || !planId) return

  // Update user's plan
  await supabase
    .from('profiles')
    .update({ 
      plan_id: planId,
      stripe_customer_id: session.customer as string
    })
    .eq('id', userId)
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.user_id
  const planId = subscription.metadata?.plan_id
  
  if (!userId) return

  // Create subscription record
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer as string,
      plan_id: planId || 'starter',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      trial_ends_at: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
    })

  // Initialize usage metrics for new subscription
  await initializeUsageMetrics(userId, planId || 'starter', supabase)
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.user_id
  const planId = subscription.metadata?.plan_id
  
  if (!userId) return

  // Update subscription record
  await supabase
    .from('subscriptions')
    .update({
      plan_id: planId,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    })
    .eq('stripe_subscription_id', subscription.id)

  // Update user's plan
  if (planId) {
    await supabase
      .from('profiles')
      .update({ plan_id: planId })
      .eq('id', userId)
  }
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: any
) {
  const userId = subscription.metadata?.user_id
  
  if (!userId) return

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id)

  // Downgrade user to free plan
  await supabase
    .from('profiles')
    .update({ plan_id: 'free' })
    .eq('id', userId)
}

async function initializeUsageMetrics(userId: string, planId: string, supabase: any) {
  const currentPeriodStart = new Date()
  currentPeriodStart.setDate(1) // First day of month
  const currentPeriodEnd = new Date(currentPeriodStart)
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

  const plan = PLANS[planId]
  
  const metrics = [
    {
      user_id: userId,
      metric_type: 'events',
      current_count: 0,
      limit_count: plan.limits.eventsPerMonth,
      period_start: currentPeriodStart.toISOString(),
      period_end: currentPeriodEnd.toISOString(),
    },
    {
      user_id: userId,
      metric_type: 'websites',
      current_count: 0,
      limit_count: plan.limits.websites,
      period_start: currentPeriodStart.toISOString(),
      period_end: currentPeriodEnd.toISOString(),
    },
  ]

  await supabase.from('usage_metrics').insert(metrics)
}
```

---

## ⚡ Usage Tracking System

### Core Usage Tracker
```typescript
// src/lib/usage-tracker.ts
import { createClient } from '@/lib/supabase/server'
import { PLANS } from '@/lib/plans'

export class UsageTracker {
  private supabase = createClient()

  async trackEvent(userId: string, websiteId: string, eventData: any) {
    // Check event limit before processing
    await this.checkEventLimit(userId)
    
    // Save event to existing Prisma database
    const event = await this.saveEventToPrisma(websiteId, eventData)
    
    // Update usage in Supabase
    await this.supabase.rpc('increment_usage', {
      p_user_id: userId,
      p_metric_type: 'events',
      p_increment: 1
    })
    
    return event
  }

  async checkEventLimit(userId: string) {
    const { data: usage, error } = await this.supabase
      .from('usage_metrics')
      .select('current_count, limit_count')
      .eq('user_id', userId)
      .eq('metric_type', 'events')
      .gte('period_end', new Date().toISOString())
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error('Failed to check usage limits')
    }

    if (usage && usage.limit_count > 0 && usage.current_count >= usage.limit_count) {
      throw new LimitExceededError('Monthly event limit exceeded. Please upgrade your plan.')
    }
  }

  async checkWebsiteLimit(userId: string) {
    // Get website count from existing Prisma database
    const websiteCount = await this.getWebsiteCount(userId)
    
    // Get user's plan limits
    const { data: profile } = await this.supabase
      .from('profiles')
      .select('plan_id')
      .eq('id', userId)
      .single()

    if (!profile) {
      throw new Error('User profile not found')
    }

    const plan = PLANS[profile.plan_id]
    if (plan.limits.websites > 0 && websiteCount >= plan.limits.websites) {
      throw new LimitExceededError('Website limit reached. Please upgrade your plan.')
    }
  }

  async getCurrentUsage(userId: string) {
    const currentPeriodStart = new Date()
    currentPeriodStart.setDate(1) // First day of month
    
    const { data: usage } = await this.supabase
      .from('usage_metrics')
      .select('*')
      .eq('user_id', userId)
      .gte('period_start', currentPeriodStart.toISOString())

    return usage || []
  }

  async resetUsageForNewPeriod(userId: string, planId: string) {
    const currentPeriodStart = new Date()
    currentPeriodStart.setDate(1)
    const currentPeriodEnd = new Date(currentPeriodStart)
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

    const plan = PLANS[planId]
    
    // Reset all usage metrics for new billing period
    const metrics = [
      {
        user_id: userId,
        metric_type: 'events',
        current_count: 0,
        limit_count: plan.limits.eventsPerMonth,
        period_start: currentPeriodStart.toISOString(),
        period_end: currentPeriodEnd.toISOString(),
      },
      {
        user_id: userId,
        metric_type: 'websites',
        current_count: 0,
        limit_count: plan.limits.websites,
        period_start: currentPeriodStart.toISOString(),
        period_end: currentPeriodEnd.toISOString(),
      },
    ]

    await this.supabase.from('usage_metrics').upsert(metrics)
  }

  private async saveEventToPrisma(websiteId: string, eventData: any) {
    // This connects to your existing Prisma database
    // Implementation depends on your current event saving logic
    return fetch('/api/internal/save-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ websiteId, ...eventData })
    })
  }

  private async getWebsiteCount(userId: string) {
    // This connects to your existing Prisma database
    const response = await fetch(`/api/internal/website-count?userId=${userId}`)
    const data = await response.json()
    return data.count || 0
  }
}

export class LimitExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LimitExceededError'
  }
}

// Singleton instance
export const usageTracker = new UsageTracker()
```

### Updated Analytics API
```typescript
// src/app/api/send/route.ts
import { NextRequest } from 'next/server'
import { usageTracker, LimitExceededError } from '@/lib/usage-tracker'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { websiteId } = data
    
    if (!websiteId) {
      return Response.json({ error: 'Website ID required' }, { status: 400 })
    }
    
    // Get website owner from your existing database
    const website = await getWebsiteOwner(websiteId)
    if (!website) {
      return Response.json({ error: 'Website not found' }, { status: 404 })
    }
    
    // Check and track usage
    try {
      await usageTracker.trackEvent(website.userId, websiteId, data)
    } catch (error) {
      if (error instanceof LimitExceededError) {
        return Response.json(
          { 
            error: error.message,
            code: 'LIMIT_EXCEEDED',
            upgradeUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`
          }, 
          { status: 429 }
        )
      }
      throw error
    }
    
    return Response.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getWebsiteOwner(websiteId: string) {
  // This should connect to your existing Prisma database
  // Return the website with userId
  const response = await fetch(`/api/internal/website/${websiteId}`)
  return response.json()
}
```

### Real-time Usage Dashboard Hook
```typescript
// src/hooks/useUsageMetrics.ts
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

interface UsageMetric {
  id: string
  metric_type: string
  current_count: number
  limit_count: number
  period_start: string
  period_end: string
}

export function useUsageMetrics(userId: string) {
  const [metrics, setMetrics] = useState<UsageMetric[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMetrics() {
      const currentPeriodStart = new Date()
      currentPeriodStart.setDate(1)
      
      const { data, error } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('period_start', currentPeriodStart.toISOString())

      if (error) {
        console.error('Error fetching usage metrics:', error)
      } else {
        setMetrics(data || [])
      }
      setLoading(false)
    }

    fetchMetrics()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel(`usage_metrics:${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'usage_metrics',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        setMetrics(current => {
          const updated = [...current]
          const index = updated.findIndex(m => m.id === payload.new?.id)
          
          if (payload.eventType === 'INSERT') {
            updated.push(payload.new as UsageMetric)
          } else if (payload.eventType === 'UPDATE' && index >= 0) {
            updated[index] = payload.new as UsageMetric
          } else if (payload.eventType === 'DELETE' && index >= 0) {
            updated.splice(index, 1)
          }
          
          return updated
        })
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [userId, supabase])

  return { metrics, loading }
}
```

---

## 🗑️ Data Retention System

### Supabase Edge Function
```typescript
// supabase/functions/data-retention/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Get all active users with their plans
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, plan_id')
      .neq('plan_id', 'deleted')

    if (error) {
      throw error
    }

    const results = []
    
    for (const profile of profiles) {
      const result = await processUserRetention(profile.id, profile.plan_id)
      results.push(result)
    }

    return new Response(JSON.stringify({
      success: true,
      processed: results.length,
      results
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Data retention job failed:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

async function processUserRetention(userId: string, planId: string) {
  const plans = {
    free: { retentionDays: 30 },
    starter: { retentionDays: 180 },
    professional: { retentionDays: 730 },
    enterprise: { retentionDays: -1 } // Unlimited
  }

  const plan = plans[planId] || plans.free
  
  // Skip if unlimited retention
  if (plan.retentionDays === -1) {
    return { userId, action: 'skipped', reason: 'unlimited_retention' }
  }

  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - plan.retentionDays)
  
  try {
    // Call your main application's cleanup API
    const response = await fetch(`${Deno.env.get('APP_URL')}/api/internal/cleanup`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${Deno.env.get('INTERNAL_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays: plan.retentionDays
      })
    })

    if (!response.ok) {
      throw new Error(`Cleanup API returned ${response.status}`)
    }

    const result = await response.json()
    
    return { 
      userId, 
      action: 'cleaned', 
      retentionDays: plan.retentionDays,
      cutoffDate: cutoffDate.toISOString(),
      result 
    }
  } catch (error) {
    return { 
      userId, 
      action: 'failed', 
      error: error.message 
    }
  }
}
```

### Internal Cleanup API
```typescript
// src/app/api/internal/cleanup/route.ts
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma' // Your existing Prisma client

export async function POST(request: NextRequest) {
  try {
    // Verify internal API key
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, cutoffDate, retentionDays } = await request.json()
    
    if (!userId || !cutoffDate) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const cutoff = new Date(cutoffDate)
    let deletedEvents = 0
    let deletedSessions = 0
    let deletedEventData = 0
    let deletedSessionData = 0

    // Delete old website events
    const eventResult = await prisma.websiteEvent.deleteMany({
      where: {
        website: { userId },
        createdAt: { lt: cutoff }
      }
    })
    deletedEvents = eventResult.count

    // Delete old sessions
    const sessionResult = await prisma.session.deleteMany({
      where: {
        website: { userId },
        createdAt: { lt: cutoff }
      }
    })
    deletedSessions = sessionResult.count

    // Delete old event data
    const eventDataResult = await prisma.eventData.deleteMany({
      where: {
        websiteEvent: {
          website: { userId },
          createdAt: { lt: cutoff }
        }
      }
    })
    deletedEventData = eventDataResult.count

    // Delete old session data
    const sessionDataResult = await prisma.sessionData.deleteMany({
      where: {
        session: {
          website: { userId },
          createdAt: { lt: cutoff }
        }
      }
    })
    deletedSessionData = sessionDataResult.count

    // Log the cleanup operation
    console.log(`Data cleanup completed for user ${userId}:`, {
      retentionDays,
      cutoffDate,
      deletedEvents,
      deletedSessions,
      deletedEventData,
      deletedSessionData
    })

    return Response.json({
      success: true,
      userId,
      retentionDays,
      cutoffDate,
      summary: {
        deletedEvents,
        deletedSessions,
        deletedEventData,
        deletedSessionData,
        totalDeleted: deletedEvents + deletedSessions + deletedEventData + deletedSessionData
      }
    })
  } catch (error) {
    console.error('Cleanup operation failed:', error)
    return Response.json(
      { error: 'Cleanup operation failed', details: error.message },
      { status: 500 }
    )
  }
}
```

### Automated Cleanup Scheduler
```typescript
// src/lib/cron/data-retention.ts
import { createClient } from '@/lib/supabase/server'

export async function scheduleDataRetention() {
  const supabase = createClient()
  
  try {
    // Call the Edge Function for data retention
    const { data, error } = await supabase.functions.invoke('data-retention', {
      body: { trigger: 'scheduled' }
    })

    if (error) {
      console.error('Data retention function failed:', error)
      return false
    }

    console.log('Data retention completed:', data)
    return true
  } catch (error) {
    console.error('Failed to schedule data retention:', error)
    return false
  }
}

// Set up cron job (if using Vercel, add to vercel.json)
// For other platforms, use their cron scheduling mechanism
```

---

## 🎨 Frontend Implementation

### Pricing Page Component
```typescript
// src/components/pricing/PricingPage.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS } from '@/lib/plans'

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const handleSelectPlan = async (planId: string) => {
    setLoading(planId)
    
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Redirect to signup with selected plan
        window.location.href = `/signup?plan=${planId}`
        return
      }

      // Create checkout session
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          planId,
          returnUrl: window.location.origin + '/dashboard'
        })
      })

      const { sessionId, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }

      // Redirect to Stripe Checkout
      const stripe = (await import('@stripe/stripe-js')).loadStripe(
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
      )
      
      const stripeInstance = await stripe
      await stripeInstance?.redirectToCheckout({ sessionId })
    } catch (error) {
      console.error('Failed to start checkout:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h1>
          <p className="text-xl text-gray-600">
            Choose the perfect plan for your analytics needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {Object.values(PLANS).map((plan) => (
            <div 
              key={plan.id}
              className={`border rounded-lg p-6 ${
                plan.id === 'professional' 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-gray-200'
              }`}
            >
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && <span className="text-gray-500">/month</span>}
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {plan.limits.websites === -1 ? 'Unlimited' : plan.limits.websites} websites
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {plan.limits.eventsPerMonth === -1 
                    ? 'Unlimited' 
                    : plan.limits.eventsPerMonth.toLocaleString()
                  } events/month
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  {plan.limits.dataRetentionDays === -1 
                    ? 'Unlimited' 
                    : `${plan.limits.dataRetentionDays} days`
                  } data retention
                </li>
                {plan.features.customEvents && (
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Custom events
                  </li>
                )}
                {plan.features.advancedReports && (
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    Advanced reports
                  </li>
                )}
                {plan.features.apiAccess && (
                  <li className="flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    API access
                  </li>
                )}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading === plan.id || plan.id === 'free'}
                className={`w-full py-2 px-4 rounded-md font-medium ${
                  plan.id === 'free'
                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                    : plan.id === 'professional'
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }`}
              >
                {loading === plan.id ? 'Loading...' : 
                 plan.id === 'free' ? 'Current Plan' : 'Get Started'
                }
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Usage Dashboard Component
```typescript
// src/components/dashboard/UsageDashboard.tsx
'use client'

import { useUsageMetrics } from '@/hooks/useUsageMetrics'
import { PLANS } from '@/lib/plans'

interface UsageDashboardProps {
  userId: string
  planId: string
}

export default function UsageDashboard({ userId, planId }: UsageDashboardProps) {
  const { metrics, loading } = useUsageMetrics(userId)
  const plan = PLANS[planId]

  if (loading) {
    return <div>Loading usage data...</div>
  }

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === -1) return 0 // Unlimited
    return Math.min((current / limit) * 100, 100)
  }

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500'
    if (percentage >= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Usage Overview</h2>
        <div className="text-sm text-gray-500">
          Current plan: <span className="font-medium">{plan.name}</span>
        </div>
      </div>

      <div className="grid gap-4">
        {metrics.map((metric) => {
          const percentage = getUsagePercentage(metric.current_count, metric.limit_count)
          const isUnlimited = metric.limit_count === -1
          
          return (
            <div key={metric.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium capitalize">
                  {metric.metric_type.replace('_', ' ')}
                </h3>
                <div className="text-sm text-gray-500">
                  {metric.current_count.toLocaleString()} 
                  {!isUnlimited && ` / ${metric.limit_count.toLocaleString()}`}
                  {isUnlimited && ' (Unlimited)'}
                </div>
              </div>
              
              {!isUnlimited && (
                <>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div 
                      className={`h-2 rounded-full ${getUsageColor(percentage)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  
                  {percentage >= 90 && (
                    <div className="text-sm text-red-600 mt-2">
                      ⚠️ You're approaching your {metric.metric_type} limit. 
                      <a href="/pricing" className="underline ml-1">
                        Upgrade your plan
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div className="border rounded-lg p-4 bg-gray-50">
        <h3 className="font-medium mb-2">Billing Period</h3>
        <div className="text-sm text-gray-600">
          Current period: {new Date().toLocaleDateString()} - {
            new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toLocaleDateString()
          }
        </div>
        <div className="text-sm text-gray-600 mt-1">
          Usage resets on the 1st of each month
        </div>
      </div>
    </div>
  )
}
```

### Billing Management Component
```typescript
// src/components/billing/BillingManagement.tsx
'use client'

import { useState } from 'react'

export default function BillingManagement() {
  const [loading, setLoading] = useState(false)

  const handleOpenPortal = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          returnUrl: window.location.href 
        })
      })

      const { url, error } = await response.json()
      
      if (error) {
        throw new Error(error)
      }

      window.location.href = url
    } catch (error) {
      console.error('Failed to open billing portal:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-medium mb-4">Billing Management</h3>
      
      <p className="text-gray-600 mb-4">
        Manage your subscription, update payment methods, and view billing history 
        in the customer portal.
      </p>

      <button
        onClick={handleOpenPortal}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Manage Billing'}
      </button>
    </div>
  )
}
```

---

## 🚀 Implementation Timeline

### Phase 1: Foundation (Weeks 1-2)
#### Week 1: Supabase Setup
- [ ] Create Supabase project
- [ ] Set up authentication
- [ ] Create database schema
- [ ] Implement RLS policies
- [ ] Set up environment variables

#### Week 2: Basic Integration
- [ ] Connect Supabase to Next.js app
- [ ] Implement user registration/login
- [ ] Create user profile management
- [ ] Test authentication flow

### Phase 2: Stripe Integration (Weeks 3-4)
#### Week 3: Stripe Setup
- [ ] Configure Stripe account
- [ ] Create products and prices
- [ ] Implement checkout API
- [ ] Set up webhook handler
- [ ] Test payment flow

#### Week 4: Subscription Management
- [ ] Build subscription creation flow
- [ ] Implement webhook event handling
- [ ] Create customer portal integration
- [ ] Add plan management logic

### Phase 3: Usage Tracking (Weeks 5-6)
#### Week 5: Core Tracking
- [ ] Build usage tracking system
- [ ] Implement limit checking
- [ ] Update analytics API
- [ ] Add real-time usage updates

#### Week 6: Dashboard Integration
- [ ] Create usage dashboard component
- [ ] Add limit enforcement UI
- [ ] Build upgrade prompts
- [ ] Test limit scenarios

### Phase 4: Data Retention (Weeks 7-8)
#### Week 7: Retention System
- [ ] Build Edge Function for cleanup
- [ ] Create internal cleanup API
- [ ] Implement retention policies
- [ ] Add scheduling mechanism

#### Week 8: UI and Polish
- [ ] Build pricing page
- [ ] Create billing management UI
- [ ] Add user onboarding flow
- [ ] Final testing and bug fixes

---

## 🔧 Environment Variables

### Required Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_starter_monthly
STRIPE_PROFESSIONAL_PRICE_ID=price_professional_monthly
STRIPE_ENTERPRISE_PRICE_ID=price_enterprise_monthly

# Application
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
INTERNAL_API_KEY=your-internal-api-key-for-cleanup

# Existing (keep these)
DATABASE_URL=your-existing-database-url
APP_SECRET=your-app-secret
```

---

## 📊 Success Metrics

### Key Performance Indicators (KPIs)
- **Sign-up Conversion Rate**: Target 15-25% of visitors
- **Free-to-Paid Conversion**: Target 2-5% monthly
- **Monthly Churn Rate**: Target <5%
- **Average Revenue Per User (ARPU)**: Target $35-45
- **Customer Acquisition Cost (CAC)**: Target <3x LTV

### Monitoring and Analytics
- Track user onboarding completion rates
- Monitor usage patterns by plan tier
- Analyze upgrade/downgrade patterns
- Track payment success/failure rates
- Monitor API response times and errors

---

## 🛡️ Security Considerations

### Data Protection
- All sensitive data encrypted at rest and in transit
- Row Level Security (RLS) enforces data isolation
- Regular security audits and vulnerability scanning
- GDPR-compliant data handling and retention

### API Security
- Rate limiting on all public endpoints
- Webhook signature verification
- Secure API key management
- Input validation and sanitization

### Compliance
- SOC 2 Type II compliance roadmap
- GDPR data processing documentation
- Privacy policy and terms of service
- Regular compliance audits

---

## 📞 Support and Maintenance

### Customer Support
- In-app help documentation
- Email support for all paid plans
- Priority support for Professional/Enterprise
- Community forum for free users

### Monitoring
- Real-time error tracking with Sentry
- Performance monitoring with application insights
- Usage analytics and alerting
- Regular health checks and uptime monitoring

### Updates and Maintenance
- Regular security updates
- Feature rollouts with feature flags
- Database maintenance windows
- Backup and disaster recovery procedures

---

## 🎯 Next Steps

1. **Review and Approve Plan**: Stakeholder review of implementation strategy
2. **Environment Setup**: Create Supabase and Stripe accounts
3. **Development Start**: Begin with Phase 1 foundation work
4. **Testing Strategy**: Set up staging environment for testing
5. **Launch Preparation**: Marketing site, documentation, support systems

This comprehensive plan provides a roadmap for successfully transforming Superlytics into a competitive SaaS analytics platform while maintaining the core privacy-focused values that differentiate it in the market.