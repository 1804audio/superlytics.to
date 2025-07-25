import { NextRequest } from 'next/server';
// Note: Using basic auth check since canViewAdmin doesn't exist
import { parseRequest } from '@/lib/request';
import { unauthorized, json, badRequest } from '@/lib/response';
import { schedulerManager } from '@/lib/scheduler';
import { z } from 'zod';

// GET /api/admin/scheduler - Get scheduler health status
export async function GET(request: NextRequest) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  // Basic admin check - only authenticated users can access this
  if (!auth.user) {
    return unauthorized();
  }

  try {
    const health = schedulerManager.getHealth();
    return json({
      success: true,
      health,
      initialized: schedulerManager.initialized,
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return json(
      {
        success: false,
        error,
        initialized: schedulerManager.initialized,
      },
      { status: 500 },
    );
  }
}

// POST /api/admin/scheduler - Manually trigger scheduler jobs
export async function POST(request: NextRequest) {
  const schema = z.object({
    action: z.enum(['trigger-data-retention']),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  // Basic admin check - only authenticated users can access this
  if (!auth.user) {
    return unauthorized();
  }

  const { action } = body;

  try {
    switch (action) {
      case 'trigger-data-retention':
        await schedulerManager.triggerDataRetention();
        return json({
          success: true,
          message: 'Data retention job triggered successfully',
          timestamp: new Date().toISOString(),
        });

      default:
        return badRequest('Invalid action');
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    return json(
      {
        success: false,
        error,
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
