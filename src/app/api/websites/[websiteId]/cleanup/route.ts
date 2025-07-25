import { NextRequest } from 'next/server';
import { z } from 'zod';
import { canUpdateWebsite } from '@/lib/auth';
import { deleteWebsiteDataByUrl } from '@/queries';
import { json, unauthorized, badRequest } from '@/lib/response';
import { parseRequest } from '@/lib/request';
import { usageTracker } from '@/lib/services/usage-tracker';

const cleanupRequestSchema = z.object({
  urlPath: z.string().min(1, 'URL path is required'),
  deleteType: z.enum(['exact', 'prefix', 'pattern']).default('exact'),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { auth, body, error } = await parseRequest(request, cleanupRequestSchema);

  if (error) {
    return error();
  }

  const { websiteId } = await params;

  if (!(await canUpdateWebsite(auth, websiteId))) {
    return unauthorized();
  }

  const { urlPath, deleteType, startDate, endDate } = body;

  try {
    // Track data modification operation
    await usageTracker.trackApiCall(auth.user.id, 'website-cleanup');

    const result = await deleteWebsiteDataByUrl(websiteId, {
      urlPath,
      deleteType,
      startDate,
      endDate,
    });

    return json(result);
  } catch {
    return badRequest('Failed to delete website data');
  }
}
