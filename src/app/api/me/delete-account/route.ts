import { z } from 'zod';
import debug from 'debug';
import { parseRequest } from '@/lib/request';
import { json, badRequest } from '@/lib/response';
import { deleteUser, getUser } from '@/queries';
import { checkPassword } from '@/lib/auth';
import Stripe from 'stripe';

const log = debug('superlytics:delete-account');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

export async function POST(request: Request) {
  const schema = z.object({
    password: z.string().min(1, 'Password is required'),
    confirmDelete: z.literal(true),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { password } = body;
  const userId = auth.user.id;

  // Get user with password for verification
  const user = await getUser(userId, { includePassword: true });
  if (!user) {
    return badRequest('User not found');
  }

  // Verify password for security
  if (!checkPassword(password, user.password)) {
    return badRequest('Invalid password');
  }

  try {
    // Cancel Stripe subscription if exists but keep customer record
    if (user.customerId) {
      try {
        // Get active subscriptions
        const subscriptions = await stripe.subscriptions.list({
          customer: user.customerId,
          status: 'active',
        });

        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          await stripe.subscriptions.cancel(subscription.id, {
            invoice_now: false,
            prorate: false,
          });
        }

        // Note: We intentionally keep the customer record for historical purposes
        // This preserves billing history and allows for potential future reactivation
      } catch (stripeError) {
        // Log error for debugging but continue with account deletion
        log('Stripe subscription cancellation failed:', stripeError);
      }
    }

    // Delete the user and all associated data
    await deleteUser(userId);

    return json({ message: 'Account deleted successfully' });
  } catch {
    return badRequest('Failed to delete account. Please contact support.');
  }
}
