import { parseRequest } from '@/lib/request';
import { json, badRequest, notFound } from '@/lib/response';
import { apiKeyService } from '@/lib/services/api-key-service';
import debug from 'debug';

const log = debug('superlytics:api-key-reveal');

export async function GET(request: Request, { params }: { params: Promise<{ keyId: string }> }) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  try {
    const { keyId } = await params;
    const userId = auth.user.id;

    if (!keyId) {
      return badRequest('API key ID is required');
    }

    const fullKey = await apiKeyService.getFullApiKey(userId, keyId);

    if (!fullKey) {
      return notFound('API key not found');
    }

    log('Revealed full API key:', keyId, 'for user:', userId);
    return json({ success: true, key: fullKey });
  } catch (err) {
    log('Failed to reveal API key:', err);
    return badRequest('Failed to retrieve API key');
  }
}
