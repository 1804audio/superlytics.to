import { prisma } from '@/lib/prisma';
import { generateApiKey, hash, uuid, encrypt, decrypt, secret } from '@/lib/crypto';
import debug from 'debug';

const log = debug('superlytics:api-key-service');

export interface ApiKeyData {
  id: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  keySuffix: string;
  permissions: string[];
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateApiKeyData {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
}

export interface ApiKeyWithPlainKey extends Omit<ApiKeyData, 'keyHash'> {
  key: string; // Only returned on creation
  maskedKey: string;
}

export interface PublicApiKeyData extends Omit<ApiKeyData, 'keyHash'> {
  maskedKey: string;
}

export class ApiKeyService {
  /**
   * Create a new API key for a user
   */
  async createApiKey(userId: string, data: CreateApiKeyData): Promise<ApiKeyWithPlainKey> {
    try {
      const id = uuid();
      const key = generateApiKey();
      const keyHash = hash(key);
      const keyEncrypted = encrypt(key, secret());
      const keyPrefix = key.substring(0, 7); // "sly_" + 3 chars
      const keySuffix = key.substring(key.length - 4); // last 4 chars
      const maskedKey = `${keyPrefix}${'*'.repeat(33)}${keySuffix}`;

      const apiKey = await prisma.apiKey.create({
        data: {
          id,
          userId,
          name: data.name,
          keyHash,
          keyEncrypted,
          keyPrefix,
          keySuffix,
          permissions: data.permissions || ['read', 'write'],
          expiresAt: data.expiresAt,
        },
      });

      log('Created API key for user:', userId, 'name:', data.name);

      return {
        id: apiKey.id,
        userId: apiKey.userId,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        keySuffix: apiKey.keySuffix,
        permissions: apiKey.permissions,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        key, // Plain key only returned on creation
        maskedKey,
      };
    } catch (error) {
      log('Failed to create API key:', error);
      throw new Error('Failed to create API key');
    }
  }

  /**
   * Get all API keys for a user (without sensitive data)
   */
  async getUserApiKeys(userId: string): Promise<PublicApiKeyData[]> {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return apiKeys.map(apiKey => ({
        id: apiKey.id,
        userId: apiKey.userId,
        name: apiKey.name,
        keyPrefix: apiKey.keyPrefix,
        keySuffix: apiKey.keySuffix,
        permissions: apiKey.permissions,
        lastUsedAt: apiKey.lastUsedAt,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
        updatedAt: apiKey.updatedAt,
        maskedKey: `${apiKey.keyPrefix}${'*'.repeat(33)}${apiKey.keySuffix}`,
      }));
    } catch (error) {
      log('Failed to get user API keys:', error);
      throw new Error('Failed to retrieve API keys');
    }
  }

  /**
   * Delete an API key
   */
  async deleteApiKey(userId: string, keyId: string): Promise<boolean> {
    try {
      const deleted = await prisma.apiKey.deleteMany({
        where: {
          id: keyId,
          userId, // Ensure user can only delete their own keys
        },
      });

      if (deleted.count === 0) {
        log('API key not found or not owned by user:', keyId, userId);
        return false;
      }

      log('Deleted API key:', keyId, 'for user:', userId);
      return true;
    } catch (error) {
      log('Failed to delete API key:', error);
      throw new Error('Failed to delete API key');
    }
  }

  /**
   * Get the full decrypted API key for a user
   */
  async getFullApiKey(userId: string, keyId: string): Promise<string | null> {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: keyId,
          userId, // Ensure user can only access their own keys
        },
        select: {
          keyEncrypted: true,
        },
      });

      if (!apiKey) {
        log('API key not found or not owned by user:', keyId, userId);
        return null;
      }

      const fullKey = decrypt(apiKey.keyEncrypted, secret());
      log('Retrieved full API key for user:', userId, 'keyId:', keyId);
      return fullKey;
    } catch (error) {
      log('Failed to get full API key:', error);
      throw new Error('Failed to retrieve API key');
    }
  }

  /**
   * Validate an API key and return user information
   */
  async validateApiKey(key: string): Promise<{ userId: string; permissions: string[] } | null> {
    try {
      const keyHash = hash(key);

      const apiKey = await prisma.apiKey.findUnique({
        where: { keyHash },
        include: {
          user: {
            select: {
              id: true,
              hasAccess: true,
              planId: true,
              subscriptionStatus: true,
            },
          },
        },
      });

      if (!apiKey) {
        log('API key not found:', key.substring(0, 7) + '...');
        return null;
      }

      // Check if key is expired
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        log('API key expired:', keyHash);
        return null;
      }

      // Check if user has access
      if (!apiKey.user.hasAccess) {
        log('User does not have access:', apiKey.userId);
        return null;
      }

      // Update last used timestamp (async, don't wait)
      this.updateLastUsed(apiKey.id).catch(error => log('Failed to update last used:', error));

      return {
        userId: apiKey.userId,
        permissions: apiKey.permissions,
      };
    } catch (error) {
      log('Failed to validate API key:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp for an API key
   */
  private async updateLastUsed(keyId: string): Promise<void> {
    try {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      log('Failed to update last used timestamp:', error);
    }
  }

  /**
   * Get API key count for a user
   */
  async getApiKeyCount(userId: string): Promise<number> {
    try {
      return await prisma.apiKey.count({
        where: { userId },
      });
    } catch (error) {
      log('Failed to get API key count:', error);
      return 0;
    }
  }
}

export const apiKeyService = new ApiKeyService();
