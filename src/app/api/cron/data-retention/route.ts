import { NextRequest } from 'next/server';
import { executeDataRetentionForAllUsers } from '@/lib/jobs/data-retention';
import { json } from '@/lib/response';

/**
 * Data Retention Cron Job Endpoint
 *
 * This endpoint should be called periodically (e.g., daily) to enforce
 * data retention policies based on user plans.
 *
 * Authentication: Requires CRON_SECRET environment variable
 *
 * Usage with cron services:
 * - Vercel Cron: Add to vercel.json
 * - External cron: Call this endpoint with proper auth header
 */
export async function POST(request: NextRequest) {
  // Verify this is a legitimate cron request
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.CRON_SECRET;
  if (!expectedAuth) {
    return Response.json(
      {
        error: 'Cron jobs not configured - missing CRON_SECRET',
      },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${expectedAuth}`) {
    return Response.json(
      {
        error: 'Unauthorized cron request',
      },
      { status: 401 },
    );
  }

  try {
    const startTime = Date.now();

    // Execute data retention for all users
    const results = await executeDataRetentionForAllUsers();

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate summary statistics
    const totalEventsDeleted = results.reduce((sum, r) => sum + r.eventsDeleted, 0);
    const totalSessionsDeleted = results.reduce((sum, r) => sum + r.sessionsDeleted, 0);
    const totalReportsDeleted = results.reduce((sum, r) => sum + r.reportsDeleted, 0);
    const errors = results.filter(r => r.error);
    return json({
      success: true,
      duration: `${duration}ms`,
      summary: {
        usersProcessed: results.length,
        eventsDeleted: totalEventsDeleted,
        sessionsDeleted: totalSessionsDeleted,
        reportsDeleted: totalReportsDeleted,
        errors: errors.length,
      },
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Data retention cron job failed:', error);

    return Response.json(
      {
        success: false,
        error: 'Data retention job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * GET endpoint for checking data retention status (for monitoring)
 */
export async function GET(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedAuth = process.env.CRON_SECRET;
  if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // This could be expanded to show next scheduled run, etc.
    return json({
      status: 'ready',
      lastRun: process.env.LAST_DATA_RETENTION_RUN || 'never',
      cronSecretConfigured: !!process.env.CRON_SECRET,
    });
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
