import { parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { getPlanByPriceId } from '@/lib/server/plan-price-ids';
import Stripe from 'stripe';

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!auth?.user) {
    return unauthorized('Authentication required');
  }

  const user = auth.user;

  // If user doesn't have a subscription, return basic info
  if (!user.subscriptionId || !user.customerId) {
    return json({
      success: true,
      subscription: {
        planId: user.planId || 'free',
        billingInterval: 'monthly', // Default for free plans
        status: user.subscriptionStatus || 'active',
        isLifetime: user.isLifetime || false,
      },
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-07-30.basil',
      typescript: true,
    });

    // Get the subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);

    if (!subscription) {
      return json({
        success: true,
        subscription: {
          planId: user.planId || 'free',
          billingInterval: 'monthly',
          status: user.subscriptionStatus || 'active',
          isLifetime: user.isLifetime || false,
        },
      });
    }

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price?.id;
    let billingInterval: 'monthly' | 'yearly' | 'lifetime' = 'monthly';

    if (priceId) {
      // Use our utility to get plan info from price ID
      const planInfo = getPlanByPriceId(priceId);
      if (planInfo) {
        billingInterval = planInfo.interval;
      }
    }

    return json({
      success: true,
      subscription: {
        planId: user.planId || 'free',
        billingInterval,
        status: user.subscriptionStatus || subscription.status,
        isLifetime: user.isLifetime || false,
        currentPeriodStart: (subscription as any).current_period_start
          ? new Date((subscription as any).current_period_start * 1000)
          : null,
        currentPeriodEnd: (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000)
          : null,
      },
    });
  } catch {
    // If Stripe call fails, return user data
    return json({
      success: true,
      subscription: {
        planId: user.planId || 'free',
        billingInterval: 'monthly',
        status: user.subscriptionStatus || 'active',
        isLifetime: user.isLifetime || false,
      },
    });
  }
}
