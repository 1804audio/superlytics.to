// Comprehensive Stripe Webhook Event Types

import Stripe from 'stripe';

// Supported webhook event types
export type StripeWebhookEventType =
  | 'checkout.session.completed'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'customer.created'
  | 'customer.updated'
  | 'customer.deleted'
  | 'payment_intent.succeeded'
  | 'payment_intent.payment_failed';

// Event handler function types
export type CheckoutSessionCompletedHandler = (session: Stripe.Checkout.Session) => Promise<void>;
export type SubscriptionUpdatedHandler = (subscription: Stripe.Subscription) => Promise<void>;
export type SubscriptionDeletedHandler = (subscription: Stripe.Subscription) => Promise<void>;
export type InvoicePaidHandler = (invoice: Stripe.Invoice) => Promise<void>;
export type InvoicePaymentFailedHandler = (invoice: Stripe.Invoice) => Promise<void>;
export type CustomerCreatedHandler = (customer: Stripe.Customer) => Promise<void>;
export type CustomerUpdatedHandler = (customer: Stripe.Customer) => Promise<void>;
export type CustomerDeletedHandler = (customer: Stripe.Customer) => Promise<void>;
export type PaymentIntentSucceededHandler = (paymentIntent: Stripe.PaymentIntent) => Promise<void>;
export type PaymentIntentFailedHandler = (paymentIntent: Stripe.PaymentIntent) => Promise<void>;

// Webhook event handler map
export interface StripeWebhookHandlers {
  'checkout.session.completed'?: CheckoutSessionCompletedHandler;
  'customer.subscription.updated'?: SubscriptionUpdatedHandler;
  'customer.subscription.deleted'?: SubscriptionDeletedHandler;
  'invoice.paid'?: InvoicePaidHandler;
  'invoice.payment_failed'?: InvoicePaymentFailedHandler;
  'customer.created'?: CustomerCreatedHandler;
  'customer.updated'?: CustomerUpdatedHandler;
  'customer.deleted'?: CustomerDeletedHandler;
  'payment_intent.succeeded'?: PaymentIntentSucceededHandler;
  'payment_intent.payment_failed'?: PaymentIntentFailedHandler;
}

// Webhook processing result
export interface WebhookProcessingResult {
  success: boolean;
  eventType: string;
  eventId: string;
  error?: string;
  processingTime?: number;
}

// Extended webhook event with metadata
export interface ProcessedWebhookEvent {
  event: Stripe.Event;
  processed: boolean;
  processingTime: number;
  error?: string;
  metadata?: {
    userId?: string;
    customerId?: string;
    subscriptionId?: string;
    planId?: string;
  };
}

// User data for webhook processing
export interface WebhookUserData {
  id: string;
  username: string;
  customerId?: string;
  subscriptionId?: string;
  planId?: string;
  hasAccess: boolean;
  isLifetime: boolean;
  subscriptionStatus?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

// Plan data for webhook processing
export interface WebhookPlanData {
  id: string;
  name: string;
  type: 'subscription' | 'lifetime' | 'custom';
  stripeIds: {
    monthly?: string;
    yearly?: string;
    lifetime?: string;
  };
}
