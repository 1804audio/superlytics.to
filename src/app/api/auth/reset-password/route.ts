import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { json, badRequest } from '@/lib/response';
import { authTokenService } from '@/lib/auth-tokens';
import { hashPassword } from '@/lib/auth';
import debug from 'debug';

const log = debug('superlytics:auth:reset-password');
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validate input
    if (!token || typeof token !== 'string') {
      return badRequest('Reset token is required');
    }

    if (!password || typeof password !== 'string') {
      return badRequest('Password is required');
    }

    if (!confirmPassword || typeof confirmPassword !== 'string') {
      return badRequest('Password confirmation is required');
    }

    if (password !== confirmPassword) {
      return badRequest('Passwords do not match');
    }

    // Validate password strength
    if (password.length < 8) {
      return badRequest('Password must be at least 8 characters long');
    }

    // Check password complexity
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return badRequest(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }

    log(`Password reset attempt with token: ${token.substring(0, 8)}...`);

    // Validate and retrieve token
    const tokenValidation = await authTokenService.validateToken(token, 'PASSWORD_RESET');

    if (!tokenValidation.isValid || !tokenValidation.token) {
      log(`Invalid or expired reset token: ${token.substring(0, 8)}...`);
      return badRequest('Invalid or expired reset token. Please request a new password reset.');
    }

    const { token: authToken } = tokenValidation;
    const userId = authToken.userId;

    log(`Valid reset token for user: ${userId}`);

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password and mark token as used
    await prisma.$transaction(async tx => {
      // Update password
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      });

      // Mark token as used
      await tx.authToken.update({
        where: { id: authToken.id },
        data: { used: true },
      });

      // Clean up any other password reset tokens for this user
      await tx.authToken.deleteMany({
        where: {
          userId,
          type: 'PASSWORD_RESET',
          id: { not: authToken.id },
        },
      });
    });

    log(`Password successfully reset for user: ${userId}`);

    return json({
      success: true,
      message:
        'Your password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    log('Password reset error:', error);
    return json(
      {
        success: false,
        message: 'An error occurred while resetting your password. Please try again.',
      },
      { status: 500 },
    );
  }
}
