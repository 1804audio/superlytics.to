import { PrismaClient, AuthTokenType } from '@prisma/client';
import { randomBytes } from 'crypto';
import debug from 'debug';

const log = debug('superlytics:auth-tokens');
const prisma = new PrismaClient();

export interface CreateTokenOptions {
  userId: string;
  type: AuthTokenType;
  expiresInHours?: number;
}

export interface TokenValidationResult {
  isValid: boolean;
  token?: {
    id: string;
    userId: string;
    type: AuthTokenType;
    user: {
      id: string;
      email: string;
      username: string;
      emailVerified: boolean;
    };
  };
  error?: string;
}

export class AuthTokenService {
  /**
   * Generate a secure random token
   */
  private generateToken(): string {
    // Generate 32 random bytes and convert to hex (64 characters)
    return randomBytes(32).toString('hex');
  }

  /**
   * Create a new auth token
   */
  async createToken(options: CreateTokenOptions): Promise<string> {
    const { userId, type, expiresInHours = this.getDefaultExpiration(type) } = options;

    try {
      // Clean up any existing tokens of the same type for this user
      await this.cleanupUserTokens(userId, type);

      // Generate new token
      const token = this.generateToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + expiresInHours);

      // Store in database
      await prisma.authToken.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          type,
          token,
          expiresAt,
        },
      });

      log(`Created ${type} token for user ${userId}, expires in ${expiresInHours}h`);
      return token;
    } catch (error) {
      log('Error creating auth token:', error);
      throw new Error('Failed to create authentication token');
    }
  }

  /**
   * Validate and retrieve token information
   */
  async validateToken(token: string, type: AuthTokenType): Promise<TokenValidationResult> {
    try {
      const authToken = await prisma.authToken.findFirst({
        where: {
          token,
          type,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              emailVerified: true,
            },
          },
        },
      });

      if (!authToken) {
        return {
          isValid: false,
          error: 'Invalid or expired token',
        };
      }

      return {
        isValid: true,
        token: {
          id: authToken.id,
          userId: authToken.userId,
          type: authToken.type,
          user: authToken.user,
        },
      };
    } catch (error) {
      log('Error validating token:', error);
      return {
        isValid: false,
        error: 'Token validation failed',
      };
    }
  }

  /**
   * Mark a token as used (one-time use)
   */
  async useToken(tokenId: string): Promise<boolean> {
    try {
      await prisma.authToken.update({
        where: { id: tokenId },
        data: { used: true },
      });

      log(`Marked token ${tokenId} as used`);
      return true;
    } catch (error) {
      log('Error marking token as used:', error);
      return false;
    }
  }

  /**
   * Clean up expired or unused tokens for a user
   */
  async cleanupUserTokens(userId: string, type?: AuthTokenType): Promise<void> {
    try {
      const where: any = { userId };
      if (type) {
        where.type = type;
      }

      // Delete expired tokens
      await prisma.authToken.deleteMany({
        where: {
          ...where,
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      // For password reset and email verification, also delete any existing unused tokens
      // This ensures only one active token per type per user
      if (type && (type === 'PASSWORD_RESET' || type === 'EMAIL_VERIFICATION')) {
        await prisma.authToken.deleteMany({
          where: {
            ...where,
            used: false,
          },
        });
      }

      log(`Cleaned up tokens for user ${userId}${type ? ` of type ${type}` : ''}`);
    } catch (error) {
      log('Error cleaning up tokens:', error);
    }
  }

  /**
   * Clean up all expired tokens (for scheduled cleanup)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.authToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      log(`Cleaned up ${result.count} expired tokens`);
      return result.count;
    } catch (error) {
      log('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Get user's active tokens
   */
  async getUserTokens(userId: string, type?: AuthTokenType) {
    try {
      const where: any = {
        userId,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      };

      if (type) {
        where.type = type;
      }

      return await prisma.authToken.findMany({
        where,
        select: {
          id: true,
          type: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      log('Error fetching user tokens:', error);
      return [];
    }
  }

  /**
   * Get default expiration hours for token types
   */
  private getDefaultExpiration(type: AuthTokenType): number {
    switch (type) {
      case 'PASSWORD_RESET':
        return 1; // 1 hour for password reset
      case 'EMAIL_VERIFICATION':
        return 24; // 24 hours for email verification
      default:
        return 1;
    }
  }

  /**
   * Check if user has pending verification
   */
  async hasPendingVerification(userId: string): Promise<boolean> {
    try {
      const count = await prisma.authToken.count({
        where: {
          userId,
          type: 'EMAIL_VERIFICATION',
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      return count > 0;
    } catch (error) {
      log('Error checking pending verification:', error);
      return false;
    }
  }
}

export const authTokenService = new AuthTokenService();
