import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, forbidden } from '@/lib/response';
import { uuid, hash } from '@/lib/crypto';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { SIMPLIFIED_PLANS } from '@/lib/config/simplified-plans';

// For now, we'll store API keys in memory/cache
// In production, you'd want to store these in the database
interface ApiKey {
  id: string;
  userId: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

// Temporary in-memory storage (replace with database in production)
const apiKeys = new Map<string, ApiKey[]>();

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  const userId = auth.user.id;
  const userKeys = apiKeys.get(userId) || [];

  // Return keys without the actual key values
  const sanitizedKeys = userKeys.map(key => ({
    id: key.id,
    name: key.name,
    maskedKey: key.maskedKey,
    createdAt: key.createdAt,
    lastUsed: key.lastUsed,
    permissions: key.permissions,
  }));

  return json(sanitizedKeys);
}

export async function POST(request: Request) {
  const schema = z.object({
    name: z.string().min(1).max(100),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const userId = auth.user.id;
  const { name } = body;

  // Check if user has API key feature access
  const hasApiKeys = await simpleUsageManager.hasFeature(userId, 'apiKeys');
  if (!hasApiKeys) {
    return forbidden(
      'API keys are not available in your current plan. Please upgrade to access this feature.',
    );
  }

  // Get user's plan configuration
  const userPlan = SIMPLIFIED_PLANS[auth.user.planId || 'free'];
  const apiKeyLimit = userPlan?.limits?.apiKeys || 0;

  // Check current API key count
  const userKeys = apiKeys.get(userId) || [];

  // Check plan limits (if not unlimited)
  if (apiKeyLimit !== -1 && userKeys.length >= apiKeyLimit) {
    return forbidden(
      `Maximum number of API keys reached (${apiKeyLimit}) for your ${userPlan.name} plan. Please upgrade for more API keys.`,
    );
  }

  // Generate a secure API key
  const keyId = uuid();
  const apiKey = `sly_${hash(keyId + userId + Date.now()).substring(0, 40)}`;
  const maskedKey = `sly_${'*'.repeat(36)}${apiKey.substring(apiKey.length - 4)}`;

  const newApiKey: ApiKey = {
    id: keyId,
    userId,
    name,
    key: apiKey,
    maskedKey,
    createdAt: new Date().toISOString(),
    permissions: ['read', 'write'], // Default permissions
  };

  // Store the API key
  if (!apiKeys.has(userId)) {
    apiKeys.set(userId, []);
  }
  apiKeys.get(userId)!.push(newApiKey);

  // Return the new API key (including the actual key only once)
  return json({
    id: newApiKey.id,
    name: newApiKey.name,
    key: newApiKey.key, // Only returned on creation
    maskedKey: newApiKey.maskedKey,
    createdAt: newApiKey.createdAt,
    permissions: newApiKey.permissions,
  });
}
