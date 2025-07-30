import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { json, badRequest } from '@/lib/response';
import { authTokenService } from '@/lib/auth-tokens';
import { emailService } from '@/lib/email';
import debug from 'debug';

const log = debug('superlytics:auth:verify-email');
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // Validate input
    if (!token || typeof token !== 'string') {
      return badRequest('Verification token is required');
    }

    log(`Email verification attempt with token: ${token.substring(0, 8)}...`);

    // Validate and retrieve token
    const tokenValidation = await authTokenService.validateToken(token, 'EMAIL_VERIFICATION');

    if (!tokenValidation.isValid || !tokenValidation.token) {
      log(`Invalid or expired verification token: ${token.substring(0, 8)}...`);
      return badRequest(
        'Invalid or expired verification token. Please request a new verification email.',
      );
    }

    const { token: authToken } = tokenValidation;
    const userId = authToken.userId;

    log(`Valid verification token for user: ${userId}`);

    // Check if user is already verified
    if (authToken.user.emailVerified) {
      log(`User ${userId} already verified, marking token as used`);
      await authTokenService.useToken(authToken.id);
      return json({
        success: true,
        message: 'Your email is already verified. You can now access your account.',
        alreadyVerified: true,
      });
    }

    // Update user's email verification status and mark token as used
    await prisma.$transaction(async tx => {
      // Mark email as verified
      await tx.user.update({
        where: { id: userId },
        data: {
          emailVerified: true,
          updatedAt: new Date(),
        },
      });

      // Mark token as used
      await tx.authToken.update({
        where: { id: authToken.id },
        data: { used: true },
      });

      // Clean up any other email verification tokens for this user
      await tx.authToken.deleteMany({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
          id: { not: authToken.id },
        },
      });
    });

    log(`Email successfully verified for user: ${userId}`);

    // Send welcome email
    try {
      await emailService.sendWelcomeEmail(authToken.user.email, authToken.user.username);
      log(`Welcome email sent to: ${authToken.user.email}`);
    } catch (error) {
      log('Welcome email failed, but verification succeeded:', error);
    }

    return json({
      success: true,
      message: 'Your email has been verified successfully! Welcome to SuperLytics.',
      user: {
        email: authToken.user.email,
        username: authToken.user.username,
        emailVerified: true,
      },
    });
  } catch (error) {
    log('Email verification error:', error);
    return json(
      {
        success: false,
        message: 'An error occurred while verifying your email. Please try again.',
      },
      { status: 500 },
    );
  }
}

// Resend verification email
export async function PUT(request: NextRequest) {
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

    log(`Resend verification requested for email: ${normalizedEmail}`);

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
    if (!user) {
      log(`Resend verification requested for non-existent email: ${normalizedEmail}`);
      return json({
        success: true,
        message:
          'If an account with that email exists and is unverified, a verification email has been sent.',
      });
    }

    // Check if user is already verified
    if (user.emailVerified) {
      log(`Resend verification requested for already verified email: ${normalizedEmail}`);
      return json({
        success: true,
        message: 'Your email is already verified.',
        alreadyVerified: true,
      });
    }

    // Check rate limiting (no more than 3 verification emails per hour)
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);

    const recentTokens = await prisma.authToken.count({
      where: {
        userId: user.id,
        type: 'EMAIL_VERIFICATION',
        createdAt: {
          gte: oneHourAgo,
        },
      },
    });

    if (recentTokens >= 3) {
      log(`Rate limit exceeded for user: ${user.id}`);
      return badRequest(
        'Too many verification emails sent. Please wait before requesting another.',
      );
    }

    // Generate new email verification token (24 hour expiration)
    const verificationToken = await authTokenService.createToken({
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      expiresInHours: 24,
    });

    // Send verification email
    const emailSent = await emailService.sendEmailVerification(
      user.email,
      verificationToken,
      user.username,
    );

    if (!emailSent) {
      log(`Failed to send verification email to: ${normalizedEmail}`);
      return json(
        {
          success: false,
          message: 'Failed to send verification email. Please try again later.',
        },
        { status: 500 },
      );
    }

    log(`Verification email sent successfully to: ${normalizedEmail}`);

    return json({
      success: true,
      message: 'A new verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    log('Resend verification error:', error);
    return json(
      {
        success: false,
        message: 'An error occurred while sending the verification email. Please try again.',
      },
      { status: 500 },
    );
  }
}
