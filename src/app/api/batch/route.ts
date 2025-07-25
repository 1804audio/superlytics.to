import { z } from 'zod';
import * as send from '@/app/api/send/route';
import { parseRequest } from '@/lib/request';
import { json, serverError } from '@/lib/response';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';

const schema = z.array(z.object({}).passthrough());

export async function POST(request: Request) {
  try {
    const { auth, body, error } = await parseRequest(request, schema);

    if (error) {
      return error();
    }

    // Check if user has data import feature access
    const hasDataImport = await simpleUsageManager.hasFeature(auth.user.id, 'dataImport');
    if (!hasDataImport) {
      return Response.json(
        {
          error:
            'Data import is not available in your current plan. Please upgrade to access this feature.',
          feature: 'dataImport',
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const errors = [];

    let index = 0;
    for (const data of body) {
      const newRequest = new Request(request, { body: JSON.stringify(data) });
      const response = await send.POST(newRequest);

      if (!response.ok) {
        errors.push({ index, response: await response.json() });
      }

      index++;
    }

    return json({
      size: body.length,
      processed: body.length - errors.length,
      errors: errors.length,
      details: errors,
    });
  } catch (e) {
    return serverError(e);
  }
}
