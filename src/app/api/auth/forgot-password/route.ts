import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { json, badRequest } from '@/lib/response';
import { authTokenService } from '@/lib/auth-tokens';
import { emailService } from '@/lib/email';
import debug from 'debug';

const log = debug('superlytics:auth:forgot-password');
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    if (!email || typeof email !== 'string') {
      return badRequest('Email is required');
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return badRequest('Please provide a valid email address');
    }

    log(`Password reset requested for email: ${normalizedEmail}`);

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        username: true,
        emailVerified: true,
      },
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      log(`Password reset requested for non-existent email: ${normalizedEmail}`);
      // Still return success to prevent email enumeration
      return json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if user's email is verified
    if (!user.emailVerified) {
      log(`Password reset requested for unverified email: ${normalizedEmail}`);
      return badRequest('Please verify your email address before resetting your password');
    }

    // Generate password reset token (1 hour expiration)
    const resetToken = await authTokenService.createToken({
      userId: user.id,
      type: 'PASSWORD_RESET',
      expiresInHours: 1,
    });

    // Send password reset email
    const emailSent = await emailService.sendPasswordReset(user.email, resetToken, user.username);

    if (!emailSent) {
      log(`Failed to send password reset email to: ${normalizedEmail}`);
      // Don't expose email service failures to prevent enumeration
      return json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    log(`Password reset email sent successfully to: ${normalizedEmail}`);

    return json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    log('Password reset error:', error);
    return json(
      {
        success: false,
        message: 'An error occurred while processing your request. Please try again.',
      },
      { status: 500 },
    );
  }
}
