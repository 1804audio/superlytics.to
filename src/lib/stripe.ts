import Stripe from 'stripe';
import debug from 'debug';

export interface CreateCheckoutParams {
  priceId: string;
  mode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
  couponId?: string | null;
  clientReferenceId?: string;
  user?: {
    id: string;
    customerId?: string;
    username: string; // Superlytics uses username as email
  };
}

export interface CreateCustomerPortalParams {
  customerId: string;
  returnUrl: string;
}

export interface StripeUser {
  id: string;
  customerId?: string;
  subscriptionId?: string;
  planId?: string;
  hasAccess: boolean;
  isLifetime: boolean;
  subscriptionStatus?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

export interface StripeCheckoutResponse {
  url: string | null;
}

export interface StripePortalResponse {
  url: string | null;
}

export type StripeSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid';

export type SuperlyticsSubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'incomplete'
  | 'expired'
  | 'past_due'
  | 'paused'
  | 'trialing'
  | 'unpaid'
  | 'unknown';

// Initialize Stripe instance with error handling
function getStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-07-30.basil',
    typescript: true,
  });
}

// Create a new Stripe customer
export const createStripeCustomer = async ({
  email,
  name,
  metadata = {},
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> => {
  const stripe = getStripeInstance();

  return stripe.customers.create({
    email,
    name: name || email.split('@')[0],
    metadata: {
      source: 'superlytics_registration',
      ...metadata,
    },
  });
};

// This is used to create a Stripe Checkout for one-time payments and subscriptions
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

    const extraParams: {
      customer?: string;
      customer_creation?: 'always';
      customer_email?: string;
      invoice_creation?: { enabled: boolean };
      payment_intent_data?: { setup_future_usage: 'on_session' };
      tax_id_collection?: { enabled: boolean };
    } = {};

    if (user?.customerId) {
      extraParams.customer = user.customerId;
    } else {
      if (mode === 'payment') {
        extraParams.customer_creation = 'always';
        // The option below costs 0.4% (up to $2) per invoice. Alternatively, you can use https://zenvoice.io/ to create unlimited invoices automatically.
        // extraParams.invoice_creation = { enabled: true };
        extraParams.payment_intent_data = { setup_future_usage: 'on_session' };
      }
      if (user?.username) {
        extraParams.customer_email = user.username;
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
        ? [
            {
              coupon: couponId,
            },
          ]
        : [],
      success_url: successUrl,
      cancel_url: cancelUrl,
      ...extraParams,
    });

    return stripeSession.url;
  } catch {
    return null;
  }
};

// This is used to create Customer Portal sessions, so users can manage their subscriptions (payment methods, cancel, etc..)
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

    return portalSession.url;
  } catch (error) {
    const log = debug('superlytics:stripe');
    log('Stripe portal creation failed:', error);

    throw new Error(
      `Failed to create Stripe portal: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

// This is used to get the user checkout session and populate the data so we get the planId the user subscribed to
export const findCheckoutSession = async (
  sessionId: string,
): Promise<Stripe.Checkout.Session | null> => {
  try {
    const stripe = getStripeInstance();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items', 'customer'],
    });

    return session;
  } catch {
    return null;
  }
};

// Create a free subscription for new users
export const createFreeSubscription = async ({
  customerId,
  priceId,
}: {
  customerId: string;
  priceId: string;
}): Promise<Stripe.Subscription> => {
  const stripe = getStripeInstance();

  return stripe.subscriptions.create({
    customer: customerId,
    items: [
      {
        price: priceId,
      },
    ],
    // Free subscriptions should start immediately
    trial_end: 'now',
    metadata: {
      source: 'superlytics_registration',
      plan_type: 'free',
    },
  });
};

// Cancel all active subscriptions for a customer except the specified one
export const cancelOtherSubscriptions = async (
  customerId: string,
  keepSubscriptionId?: string,
): Promise<void> => {
  const stripe = getStripeInstance();

  try {
    // List all active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      limit: 100,
    });

    // Cancel all subscriptions except the one we want to keep
    const cancelPromises = subscriptions.data
      .filter(sub => sub.id !== keepSubscriptionId)
      .map(async subscription => {
        try {
          await stripe.subscriptions.cancel(subscription.id);
        } catch {
          // Silently handle individual subscription cancellation errors
        }
      });

    await Promise.all(cancelPromises);
  } catch {
    // Silently handle errors - this is a cleanup operation
  }
};

// New utility functions for Superlytics integration
export const syncStripeCustomer = async () => {
  // This will be implemented when we have the Prisma integration
};

export const getSubscriptionStatus = (
  subscription: Stripe.Subscription,
): SuperlyticsSubscriptionStatus => {
  // Map Stripe statuses to Superlytics internal statuses
  const statusMap: Record<StripeSubscriptionStatus, SuperlyticsSubscriptionStatus> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'expired',
    past_due: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
    unpaid: 'unpaid',
  };

  return statusMap[subscription.status as StripeSubscriptionStatus] || 'unknown';
};
