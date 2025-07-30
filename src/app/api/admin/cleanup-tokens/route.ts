import { NextRequest } from 'next/server';
import { json, unauthorized, forbidden } from '@/lib/response';
import { getAuth } from '@/lib/auth';
import { cleanupExpiredTokens } from '@/lib/jobs/cleanup-expired-tokens';
import { ROLES } from '@/lib/constants';
import debug from 'debug';

const log = debug('superlytics:admin:cleanup-tokens');

/**
 * Manual token cleanup endpoint - Admin only
 * POST /api/admin/cleanup-tokens
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin privileges
    const auth = await getAuth(request);
    if (!auth?.user) {
      return unauthorized('Authentication required');
    }

    if (auth.user.role !== ROLES.admin) {
      return forbidden('Admin privileges required');
    }

    log(`Manual token cleanup triggered by admin: ${auth.user.id}`);

    // Run the cleanup job
    const result = await cleanupExpiredTokens();

    if (!result.success) {
      log(`Manual cleanup failed: ${result.error}`);
      return json(
        {
          success: false,
          message: 'Token cleanup failed',
          error: result.error,
        },
        { status: 500 },
      );
    }

    log(`Manual cleanup completed successfully. Deleted ${result.deletedCount} tokens`);

    return json({
      success: true,
      message: `Successfully deleted ${result.deletedCount} expired tokens`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    log('Manual cleanup error:', error);
    return json(
      {
        success: false,
        message: 'An error occurred during token cleanup',
      },
      { status: 500 },
    );
  }
}
