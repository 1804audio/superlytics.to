import { NextResponse, NextRequest } from 'next/server';
import { parseRequest } from '@/lib/request';
import { createCheckout } from '@/lib/stripe';
import { StripeCheckoutApiResponse } from '@/lib/types/stripe-api';
import { z } from 'zod';

const schema = z.object({
  priceId: z.string(),
  mode: z.enum(['payment', 'subscription']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  couponId: z.string().optional(),
});

// This function is used to create a Stripe Checkout Session (one-time payment or subscription)
// It supports both authenticated and anonymous users
export async function POST(request: NextRequest) {
  const { body, auth, error } = await parseRequest(request, schema, { skipAuth: true });

  if (error) return error();

  const { priceId, mode, successUrl, cancelUrl, couponId } = body;

  try {
    const stripeSessionURL = await createCheckout({
      priceId,
      mode,
      successUrl,
      cancelUrl,
      clientReferenceId: auth?.user?.id || undefined,
      user: auth?.user
        ? {
            id: auth.user.id,
            customerId: auth.user.customerId,
            username: auth.user.username,
          }
        : undefined,
      couponId,
    });

    if (!stripeSessionURL) {
      const response: StripeCheckoutApiResponse = {
        error: 'Failed to create checkout session',
        success: false,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: StripeCheckoutApiResponse = {
      url: stripeSessionURL,
      success: true,
    };
    return NextResponse.json(response);
  } catch (error: any) {
    const response: StripeCheckoutApiResponse = {
      error: error?.message || 'Internal server error',
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
