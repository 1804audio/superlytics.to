import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import { hash } from 'bcryptjs';
import { createSecureToken } from '@/lib/jwt';
import redis from '@/lib/redis';
import { getUserByUsername, createUser } from '@/queries';
import { json, badRequest } from '@/lib/response';
import { parseRequest } from '@/lib/request';
import { saveAuth } from '@/lib/auth';
import { secret } from '@/lib/crypto';
import { ROLES } from '@/lib/constants';
import { createStripeCustomer } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  const schema = z
    .object({
      username: z.string().email('Invalid email address'),
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

  const { username, password } = body;

  // Check if user already exists
  const existingUser = await getUserByUsername(username);
  if (existingUser) {
    return badRequest('User with this email already exists');
  }

  try {
    // Create Stripe customer first
    const stripeCustomer = await createStripeCustomer({
      email: username,
      name: username.split('@')[0], // Use email prefix as name
    });

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user with Stripe integration
    const userId = uuid();
    const user = await createUser({
      id: userId,
      username,
      password: hashedPassword,
      role: ROLES.user, // Default role
    });

    // Update user with Stripe customer ID (separate update due to createUser interface)
    await prisma.client.user.update({
      where: { id: userId },
      data: {
        customerId: stripeCustomer.id,
        planId: 'free', // Start with free plan
        hasAccess: true, // Free plan gets access
        isLifetime: false,
      },
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
        role: user.role,
        isAdmin: user.role === ROLES.admin,
        planId: 'free',
        hasAccess: true,
      },
      message: 'Account created successfully! Welcome to Superlytics.',
    });
  } catch {
    return badRequest('Failed to create account. Please try again.');
  }
}
