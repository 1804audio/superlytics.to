import { authTokenService } from '@/lib/auth-tokens';
import debug from 'debug';

const log = debug('superlytics:jobs:cleanup-tokens');

/**
 * Cleanup job for expired authentication tokens
 * Should be run periodically (e.g., every hour) to remove expired tokens
 */
export async function cleanupExpiredTokens(): Promise<{
  success: boolean;
  deletedCount: number;
  error?: string;
}> {
  try {
    log('Starting expired token cleanup job');

    const deletedCount = await authTokenService.cleanupExpiredTokens();

    log(`Cleanup job completed successfully. Deleted ${deletedCount} expired tokens`);

    return {
      success: true,
      deletedCount,
    };
  } catch (error) {
    log('Cleanup job failed:', error);

    return {
      success: false,
      deletedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Schedule the cleanup job to run periodically
 * This would typically be called from a cron job or scheduled task
 */
export function scheduleTokenCleanup() {
  // Run cleanup every hour
  const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

  log('Scheduling token cleanup job to run every hour');

  setInterval(async () => {
    await cleanupExpiredTokens();
  }, CLEANUP_INTERVAL);

  // Run initial cleanup on startup
  setTimeout(async () => {
    await cleanupExpiredTokens();
  }, 5000); // Wait 5 seconds after startup
}
