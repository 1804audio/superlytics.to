import { NextRequest } from 'next/server';
import { parseRequest } from '@/lib/request';
import { json, unauthorized } from '@/lib/response';
import { z } from 'zod';
import { requireApiAccess } from '@/lib/middleware/api-middleware';
import {
  executeDataRetentionForAllUsers,
  executeDataRetention,
  getUsersForDataRetention,
  checkUserDataRetention,
} from '@/lib/jobs/data-retention';

/**
 * GET: Check data retention status for all users or specific user
 */
export async function GET(request: NextRequest) {
  const { auth, query, error } = await parseRequest(
    request,
    z.object({
      userId: z.string().uuid().optional(),
    }),
  );

  if (error) return error();

  // Only admins can access this endpoint
  if (!auth.user.isAdmin) {
    return unauthorized('Admin access required');
  }

  // Require full API access for admin operations
  const apiAccessCheck = await requireApiAccess(auth, 'full');
  if (apiAccessCheck) {
    return apiAccessCheck;
  }

  try {
    if (query.userId) {
      // Check specific user
      const result = await checkUserDataRetention(query.userId);
      return json({
        userId: query.userId,
        ...result,
      });
    } else {
      // Get all users who need data retention
      const jobs = await getUsersForDataRetention();

      return json({
        totalUsers: jobs.length,
        users: jobs.map(job => ({
          userId: job.userId,
          planId: job.planId,
          retentionMonths: job.retentionMonths,
          cutoffDate: job.cutoffDate,
          websiteCount: job.websites.length,
        })),
      });
    }
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to check data retention status',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST: Execute data retention manually (for testing/admin use)
 */
export async function POST(request: NextRequest) {
  const { auth, body, error } = await parseRequest(
    request,
    z.object({
      userId: z.string().uuid().optional(),
      dryRun: z.boolean().default(false),
    }),
  );

  if (error) return error();

  // Only admins can trigger manual data retention
  if (!auth.user.isAdmin) {
    return unauthorized('Admin access required');
  }

  // Require full API access for admin operations
  const apiAccessCheck = await requireApiAccess(auth, 'full');
  if (apiAccessCheck) {
    return apiAccessCheck;
  }

  try {
    if (body.dryRun) {
      // Dry run - just show what would be deleted
      if (body.userId) {
        const status = await checkUserDataRetention(body.userId);
        return json({
          dryRun: true,
          userId: body.userId,
          ...status,
          note: 'This is a dry run - no data was actually deleted',
        });
      } else {
        const jobs = await getUsersForDataRetention();
        return json({
          dryRun: true,
          usersToProcess: jobs.length,
          jobs: jobs.map(job => ({
            userId: job.userId,
            planId: job.planId,
            retentionMonths: job.retentionMonths,
            cutoffDate: job.cutoffDate,
            websiteCount: job.websites.length,
          })),
          note: 'This is a dry run - no data was actually deleted',
        });
      }
    }

    const startTime = Date.now();

    if (body.userId) {
      // Execute for specific user
      const jobs = await getUsersForDataRetention();
      const userJob = jobs.find(job => job.userId === body.userId);
      if (!userJob) {
        return Response.json(
          {
            error: 'User not found or does not require data retention',
            userId: body.userId,
          },
          { status: 404 },
        );
      }

      const result = await executeDataRetention(userJob);
      const duration = Date.now() - startTime;

      return json({
        success: true,
        duration: `${duration}ms`,
        result,
      });
    } else {
      // Execute for all users
      const results = await executeDataRetentionForAllUsers();
      const duration = Date.now() - startTime;

      const summary = {
        usersProcessed: results.length,
        eventsDeleted: results.reduce((sum, r) => sum + r.eventsDeleted, 0),
        sessionsDeleted: results.reduce((sum, r) => sum + r.sessionsDeleted, 0),
        reportsDeleted: results.reduce((sum, r) => sum + r.reportsDeleted, 0),
        errors: results.filter(r => r.error).length,
      };

      return json({
        success: true,
        duration: `${duration}ms`,
        summary,
        results,
      });
    }
  } catch (error) {
    return Response.json(
      {
        error: 'Failed to execute data retention',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
