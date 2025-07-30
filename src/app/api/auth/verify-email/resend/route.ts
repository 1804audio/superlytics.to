import { parseRequest } from '@/lib/request';
import { json, badRequest, tooManyRequests } from '@/lib/response';
import { authTokenService } from '@/lib/auth-tokens';
import { emailService } from '@/lib/email';
import debug from 'debug';

const log = debug('superlytics:auth:resend-verification');

// Rate limiting: track resend attempts per user
const resendAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_RESEND_ATTEMPTS = 3;
const RESEND_WINDOW = 60 * 60 * 1000; // 1 hour

export async function POST(request: Request) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const user = auth.user;

  // Check if user is already verified
  if (user.emailVerified) {
    return badRequest('Email is already verified');
  }

  // Rate limiting check
  const userId = user.id;
  const now = Date.now();
  const userAttempts = resendAttempts.get(userId);

  if (userAttempts) {
    // Reset counter if window has passed
    if (now - userAttempts.lastAttempt > RESEND_WINDOW) {
      resendAttempts.delete(userId);
    } else if (userAttempts.count >= MAX_RESEND_ATTEMPTS) {
      log(`Rate limit exceeded for user ${userId}`);
      return tooManyRequests('Too many resend attempts. Please try again in an hour.');
    }
  }

  try {
    // Create new verification token
    const verificationToken = await authTokenService.createToken({
      userId: user.id,
      type: 'EMAIL_VERIFICATION',
      expiresInHours: 24,
    });

    // Send verification email
    await emailService.sendEmailVerification(user.email, verificationToken, user.username);

    // Update rate limiting
    const currentAttempts = resendAttempts.get(userId);
    resendAttempts.set(userId, {
      count: currentAttempts ? currentAttempts.count + 1 : 1,
      lastAttempt: now,
    });

    log(`Verification email resent to user ${userId}`);

    return json({
      success: true,
      message: 'Verification email sent successfully',
    });
  } catch (error) {
    log('Failed to resend verification email:', error);
    return badRequest('Failed to send verification email');
  }
}
