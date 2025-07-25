import { canUpdateWebsite } from '@/lib/auth';
import { resetWebsite } from '@/queries';
import { unauthorized, ok } from '@/lib/response';
import { parseRequest } from '@/lib/request';
import { requireApiAccess } from '@/lib/middleware/api-middleware';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const { websiteId } = await params;

  if (!(await canUpdateWebsite(auth, websiteId))) {
    return unauthorized();
  }

  // Require full API access for destructive operations
  const apiAccessCheck = await requireApiAccess(auth, 'full');
  if (apiAccessCheck) {
    return apiAccessCheck;
  }

  await resetWebsite(websiteId);

  return ok();
}
