import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { hash } from 'bcryptjs';
import { createSecureToken } from '@/lib/jwt';
import redis from '@/lib/redis';
import { getUserByUsername } from '@/queries';
import { json, badRequest } from '@/lib/response';
import { parseRequest } from '@/lib/request';
import { saveAuth } from '@/lib/auth';
import { secret } from '@/lib/crypto';
import { ROLES } from '@/lib/constants';
import { createStripeCustomer, createFreeSubscription } from '@/lib/stripe';
import { getPriceId } from '@/lib/server/plan-price-ids';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const schema = z
    .object({
      username: z
        .string()
        .min(3, 'Username must be at least 3 characters')
        .max(50, 'Username must be less than 50 characters'),
      email: z.string().email('Invalid email address'),
      password: z.string().min(8, 'Password must be at least 8 characters'),
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ['confirmPassword'],
    });

  const { body, error } = await parseRequest(request, schema, { skipAuth: true });

  if (error) {
    return error();
  }

  const { username, email, password } = body;

  // Check if user already exists by username or email
  const existingUserByUsername = await getUserByUsername(username);
  if (existingUserByUsername) {
    return badRequest('User with this username already exists');
  }

  const existingUserByEmail = await prisma.client.user.findUnique({
    where: { email },
  });
  if (existingUserByEmail) {
    return badRequest('User with this email already exists');
  }

  try {
    // Create Stripe customer first
    const stripeCustomer = await createStripeCustomer({
      email: email,
      name: username, // Use username as display name
    });

    // Get free plan price ID
    const freePriceId = getPriceId('free', 'monthly');
    if (!freePriceId) {
      throw new Error('Free plan price ID not configured');
    }

    // Create free subscription in Stripe
    const freeSubscription = await createFreeSubscription({
      customerId: stripeCustomer.id,
      priceId: freePriceId,
    });

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Use transaction to ensure atomicity of user creation and Stripe integration
    const userId = uuid();
    const user = await prisma.transaction(async tx => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          id: userId,
          username,
          email,
          password: hashedPassword,
          role: ROLES.user,
          customerId: stripeCustomer.id,
          subscriptionId: freeSubscription.id,
          subscriptionStatus: freeSubscription.status,
          planId: 'free',
          hasAccess: true,
          isLifetime: false,
        },
      });

      return newUser;
    });

    // Create JWT token and log user in
    let token: string;

    if (redis.enabled) {
      token = await saveAuth({ userId: user.id, role: user.role });
    } else {
      token = createSecureToken({ userId: user.id, role: user.role }, secret());
    }

    return json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isAdmin: user.role === ROLES.admin,
        planId: user.planId,
        hasAccess: user.hasAccess,
        isLifetime: user.isLifetime,
        customerId: user.customerId,
        subscriptionId: user.subscriptionId,
        subscriptionStatus: user.subscriptionStatus,
      },
      message: 'Account created successfully! Welcome to Superlytics.',
    });
  } catch {
    return badRequest('Failed to create account. Please try again.');
  }
}
