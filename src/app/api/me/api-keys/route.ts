import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, forbidden, badRequest } from '@/lib/response';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { SIMPLIFIED_PLANS } from '@/lib/config/simplified-plans';
import { apiKeyService } from '@/lib/services/api-key-service';
import debug from 'debug';

const log = debug('superlytics:api-keys-route');

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  try {
    const userId = auth.user.id;
    const apiKeys = await apiKeyService.getUserApiKeys(userId);

    log('Retrieved API keys for user:', userId, 'count:', apiKeys.length);
    return json(apiKeys);
  } catch (err) {
    log('Failed to get API keys:', err);
    return badRequest('Failed to retrieve API keys');
  }
}

export async function POST(request: Request) {
  const schema = z.object({
    name: z.string().min(1).max(100),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  try {
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
    const currentCount = await apiKeyService.getApiKeyCount(userId);

    // Check plan limits (if not unlimited)
    if (apiKeyLimit !== -1 && currentCount >= apiKeyLimit) {
      return forbidden(
        `Maximum number of API keys reached (${apiKeyLimit}) for your ${userPlan.name} plan. Please upgrade for more API keys.`,
      );
    }

    // Create the API key
    const newApiKey = await apiKeyService.createApiKey(userId, {
      name,
    });

    log('Created API key for user:', userId, 'name:', name);
    return json(newApiKey);
  } catch (err) {
    log('Failed to create API key:', err);
    return badRequest('Failed to create API key');
  }
}
