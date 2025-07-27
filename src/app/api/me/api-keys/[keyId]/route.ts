import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, badRequest, notFound } from '@/lib/response';

// Import the same interface and storage from the main route
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

// Note: In production, this should be replaced with actual database storage
const apiKeys = new Map<string, ApiKey[]>();

export async function DELETE(request: Request, { params }: { params: Promise<{ keyId: string }> }) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  const { keyId } = await params;
  const userId = auth.user.id;

  if (!keyId) {
    return badRequest('API key ID is required');
  }

  // Get user's API keys
  const userKeys = apiKeys.get(userId) || [];
  const keyIndex = userKeys.findIndex(key => key.id === keyId);

  if (keyIndex === -1) {
    return notFound('API key not found');
  }

  // Remove the API key
  userKeys.splice(keyIndex, 1);
  apiKeys.set(userId, userKeys);

  return json({ success: true, message: 'API key deleted successfully' });
}
