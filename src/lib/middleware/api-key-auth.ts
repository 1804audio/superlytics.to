import { NextRequest } from 'next/server';
import { apiKeyService } from '@/lib/services/api-key-service';
import debug from 'debug';

const log = debug('superlytics:api-key-auth');

export interface ApiKeyAuthResult {
  success: boolean;
  userId?: string;
  permissions?: string[];
  error?: string;
}

/**
 * Authenticate API key from request headers
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiKeyAuthResult> {
  try {
    // Check for API key in Authorization header
    const authHeader = request.headers.get('authorization');
    let apiKey: string | null = null;

    if (authHeader) {
      // Support both "Bearer {key}" and "ApiKey {key}" formats
      if (authHeader.startsWith('Bearer ')) {
        apiKey = authHeader.substring(7);
      } else if (authHeader.startsWith('ApiKey ')) {
        apiKey = authHeader.substring(7);
      } else if (authHeader.startsWith('sly_')) {
        // Direct API key in Authorization header
        apiKey = authHeader;
      }
    }

    // Also check for API key in x-api-key header
    if (!apiKey) {
      const apiKeyHeader = request.headers.get('x-api-key');
      if (apiKeyHeader) {
        apiKey = apiKeyHeader;
      }
    }

    if (!apiKey) {
      log('No API key found in request headers');
      return {
        success: false,
        error:
          'API key required. Provide it in Authorization header as "Bearer {key}" or in x-api-key header.',
      };
    }

    // Validate API key format
    if (!apiKey.startsWith('sly_')) {
      log('Invalid API key format:', apiKey.substring(0, 7) + '...');
      return {
        success: false,
        error: 'Invalid API key format. API keys must start with "sly_".',
      };
    }

    // Validate the API key
    const validation = await apiKeyService.validateApiKey(apiKey);

    if (!validation) {
      log('API key validation failed');
      return {
        success: false,
        error: 'Invalid or expired API key.',
      };
    }

    log('API key authenticated successfully for user:', validation.userId);
    return {
      success: true,
      userId: validation.userId,
      permissions: validation.permissions,
    };
  } catch (error) {
    log('API key authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed.',
    };
  }
}

/**
 * Check if user has required permission
 */
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
}

/**
 * Extract API key from various header formats
 */
export function extractApiKeyFromHeaders(headers: Headers): string | null {
  // Check Authorization header
  const authHeader = headers.get('authorization');
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }
    if (authHeader.startsWith('sly_')) {
      return authHeader;
    }
  }

  // Check x-api-key header
  const apiKeyHeader = headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}
