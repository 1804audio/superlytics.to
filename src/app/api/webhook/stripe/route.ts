import { NextResponse, NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { findCheckoutSession, getSubscriptionStatus, cancelOtherSubscriptions } from '@/lib/stripe';
import { getPlanByPriceId } from '@/lib/server/plan-price-ids';
import { getPlan } from '@/lib/config/simplified-plans';
import { StripeWebhookResponse } from '@/lib/types/stripe-api';
import {
  CheckoutSessionCompletedHandler,
  SubscriptionUpdatedHandler,
  SubscriptionDeletedHandler,
  InvoicePaidHandler,
  InvoicePaymentFailedHandler,
} from '@/lib/types/stripe-webhooks';
import { startOfMonth, endOfMonth } from 'date-fns';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
  typescript: true,
});
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const prisma = new PrismaClient();

// Simplified Stripe webhook handler for Superlytics
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = (await headers()).get('stripe-signature');

  let event: Stripe.Event;

  // Verify Stripe event is legitimate
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case 'customer.subscription.created': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case 'customer.subscription.updated': {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      case 'invoice.paid': {
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      }

      case 'invoice.payment_failed': {
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      }

      default:
        // Silently ignore unhandled events
        break;
    }
  } catch {
    const response: StripeWebhookResponse = {
      error: 'Webhook processing failed',
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }

  const response: StripeWebhookResponse = {
    received: true,
    success: true,
  };
  return NextResponse.json(response);
}

// Webhook event handlers
const handleCheckoutCompleted: CheckoutSessionCompletedHandler = async (
  session: Stripe.Checkout.Session,
) => {
  const fullSession = await findCheckoutSession(session.id);
  if (!fullSession) {
    return;
  }

  // Extract customer ID properly - it can be a string or object
  const customerId =
    typeof fullSession.customer === 'string' ? fullSession.customer : fullSession.customer?.id;

  if (!customerId) {
    return;
  }

  const priceId = fullSession.line_items?.data[0]?.price?.id;
  const userId = session.client_reference_id;

  if (!priceId) {
    return;
  }

  // Get plan configuration from Stripe price ID
  const planInfo = getPlanByPriceId(priceId);
  if (!planInfo) {
    return;
  }

  const planConfig = getPlan(planInfo.planId);
  if (!planConfig) {
    return;
  }

  const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
  let user;

  // Find or create user
  if (userId) {
    // User was logged in during checkout
    user = await prisma.user.findUnique({
      where: { id: userId },
    });
  } else if (customer.email) {
    // Anonymous checkout - find by email or create new user
    user = await prisma.user.findUnique({
      where: { username: customer.email },
    });

    if (!user) {
      // Create new user account
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          username: customer.email,
          password: '', // Will need to set password later
          role: 'user',
          displayName: customer.name || undefined,
          planId: planConfig.id,
          customerId,
          hasAccess: true,
          isLifetime: planConfig.type === 'lifetime',
          subscriptionStatus: planConfig.type === 'subscription' ? 'active' : undefined,
          currentPeriodStart: startOfMonth(new Date()),
          currentPeriodEnd: endOfMonth(new Date()),
        },
      });
    }
  }

  if (!user) {
    return;
  }

  // Cancel all other active subscriptions for this customer
  await cancelOtherSubscriptions(customerId, session.subscription as string);

  // Update user with subscription data
  await prisma.user.update({
    where: { id: user.id },
    data: {
      planId: planConfig.id,
      customerId,
      subscriptionId: session.subscription as string,
      hasAccess: true,
      isLifetime: planConfig.type === 'lifetime',
      subscriptionStatus: planConfig.type === 'subscription' ? 'active' : undefined,
      currentPeriodStart: planConfig.type === 'subscription' ? startOfMonth(new Date()) : undefined,
      currentPeriodEnd: planConfig.type === 'subscription' ? endOfMonth(new Date()) : undefined,
    },
  });
};

const handleSubscriptionUpdated: SubscriptionUpdatedHandler = async (
  subscription: Stripe.Subscription,
) => {
  const customerId = subscription.customer as string;

  const user = await prisma.user.findFirst({
    where: { customerId },
  });

  if (!user) {
    return;
  }

  const status = getSubscriptionStatus(subscription);
  const priceId = subscription.items.data[0]?.price?.id;
  let planConfig = null;

  if (priceId) {
    const planInfo = getPlanByPriceId(priceId);
    if (planInfo) {
      planConfig = getPlan(planInfo.planId);
    }
  }

  const newPlanId = planConfig?.id || user.planId;

  // Cancel all other active subscriptions for this customer
  await cancelOtherSubscriptions(customerId, subscription.id);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: status,
      planId: newPlanId,
      hasAccess: ['active', 'trialing'].includes(status),
    },
  });
};

const handleSubscriptionDeleted: SubscriptionDeletedHandler = async (
  subscription: Stripe.Subscription,
) => {
  const user = await prisma.user.findFirst({
    where: { customerId: subscription.customer as string },
  });

  if (!user) {
    return;
  }

  // For lifetime users, don't revoke access when subscription is deleted
  if (user.isLifetime) {
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasAccess: false,
      subscriptionStatus: 'canceled',
    },
  });
};

const handleInvoicePaid: InvoicePaidHandler = async (invoice: Stripe.Invoice) => {
  const user = await prisma.user.findFirst({
    where: { customerId: invoice.customer as string },
  });

  if (!user) {
    return;
  }

  // Ensure user has access after successful payment
  await prisma.user.update({
    where: { id: user.id },
    data: {
      hasAccess: true,
      subscriptionStatus: 'active',
    },
  });
};

const handleInvoicePaymentFailed: InvoicePaymentFailedHandler = async (invoice: Stripe.Invoice) => {
  const user = await prisma.user.findFirst({
    where: { customerId: invoice.customer as string },
  });

  if (!user) {
    return;
  }

  // Mark as past due but don't immediately revoke access
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'past_due',
      // hasAccess: false, // Decide based on grace period policy
    },
  });
};
