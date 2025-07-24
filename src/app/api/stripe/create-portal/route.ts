import { NextResponse, NextRequest } from 'next/server';
import { parseRequest } from '@/lib/request';
import { createCustomerPortal } from '@/lib/stripe';
import { StripePortalApiResponse } from '@/lib/types/stripe-api';
import { z } from 'zod';

const schema = z.object({
  returnUrl: z.string().url(),
});

export async function POST(request: NextRequest) {
  const { body, auth, error } = await parseRequest(request, schema);

  if (error) return error();

  const { returnUrl } = body;

  try {
    if (!auth.user.customerId) {
      const response: StripePortalApiResponse = {
        error: "You don't have a billing account yet. Make a purchase first.",
        success: false,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const stripePortalUrl = await createCustomerPortal({
      customerId: auth.user.customerId,
      returnUrl,
    });

    if (!stripePortalUrl) {
      const response: StripePortalApiResponse = {
        error: 'Failed to create portal session',
        success: false,
      };
      return NextResponse.json(response, { status: 500 });
    }

    const response: StripePortalApiResponse = {
      url: stripePortalUrl,
      success: true,
    };
    return NextResponse.json(response);
  } catch (error: any) {
    const response: StripePortalApiResponse = {
      error: error?.message || 'Internal server error',
      success: false,
    };
    return NextResponse.json(response, { status: 500 });
  }
}
