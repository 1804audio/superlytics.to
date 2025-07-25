import { scheduleJob, Job } from 'node-schedule';
import debug from 'debug';
import { executeDataRetentionForAllUsers } from '@/lib/jobs/data-retention';

const log = debug('superlytics:scheduler:data-retention');

interface SchedulerStats {
  lastRun: Date | null;
  lastSuccess: Date | null;
  lastError: Date | null;
  errorCount: number;
  totalRuns: number;
  isRunning: boolean;
}

class DataRetentionScheduler {
  private job: Job | null = null;
  private stats: SchedulerStats = {
    lastRun: null,
    lastSuccess: null,
    lastError: null,
    errorCount: 0,
    totalRuns: 0,
    isRunning: false,
  };
  private maxConcurrentRuns = 1;
  private isInitialized = false;

  /**
   * Initialize the scheduler - only runs in production and server environments
   */
  public initialize(): void {
    // Only run in production and server environments
    if (process.env.NODE_ENV !== 'production') {
      log('Scheduler disabled in non-production environment');
      return;
    }

    // Prevent multiple initializations
    if (this.isInitialized) {
      log('Scheduler already initialized');
      return;
    }

    // Don't run during build or in edge runtime
    if (process.env.NEXT_PHASE === 'phase-production-build' || process.env.VERCEL_ENV === 'build') {
      log('Scheduler disabled during build phase');
      return;
    }

    try {
      // Schedule data retention job to run daily at 2 AM
      this.job = scheduleJob('data-retention', '0 2 * * *', async () => {
        await this.executeDataRetention();
      });

      this.isInitialized = true;
      log('Data retention scheduler initialized successfully - will run daily at 2 AM');
    } catch (error) {
      log('Failed to initialize scheduler:', error);
      throw new Error(`Scheduler initialization failed: ${error}`);
    }
  }

  /**
   * Execute data retention with comprehensive error handling and logging
   */
  private async executeDataRetention(): Promise<void> {
    // Prevent concurrent executions
    if (this.stats.isRunning) {
      log('Data retention job already running, skipping this execution');
      return;
    }

    const startTime = new Date();
    this.stats.isRunning = true;
    this.stats.lastRun = startTime;
    this.stats.totalRuns++;

    log('Starting data retention job execution');

    try {
      // Execute the data retention
      const results = await executeDataRetentionForAllUsers();

      // Log success
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.stats.lastSuccess = endTime;
      this.stats.isRunning = false;

      // Calculate summary statistics
      const totalEventsDeleted = (results || []).reduce((sum, r) => sum + r.eventsDeleted, 0);
      const totalSessionsDeleted = (results || []).reduce((sum, r) => sum + r.sessionsDeleted, 0);
      const totalReportsDeleted = (results || []).reduce((sum, r) => sum + r.reportsDeleted, 0);
      const errors = (results || []).filter(r => r.error).length;

      log(
        'Data retention job completed successfully in %dms: %d users processed, %d events deleted, %d sessions deleted, %d reports deleted, %d errors',
        duration,
        (results || []).length,
        totalEventsDeleted,
        totalSessionsDeleted,
        totalReportsDeleted,
        errors,
      );

      // Log individual errors if any
      if (errors > 0) {
        (results || [])
          .filter(r => r.error)
          .forEach(r => {
            log('Error processing user %s: %s', r.userId, r.error);
          });
      }
    } catch (error) {
      // Log error and update stats
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      this.stats.lastError = endTime;
      this.stats.errorCount++;
      this.stats.isRunning = false;

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      log('Data retention job failed after %dms: %s', duration, errorMessage);

      // In production, we should also send alerts (email, Slack, etc.)
      if (process.env.NODE_ENV === 'production') {
        // TODO: Add alert system for production failures
        // eslint-disable-next-line no-console
        console.error('CRITICAL: Data retention job failed in production:', {
          error: errorMessage,
          duration,
          timestamp: endTime.toISOString(),
          stats: this.stats,
        });
      }

      // Re-throw to ensure the error is visible
      throw error;
    }
  }

  /**
   * Manually trigger data retention (for testing or manual execution)
   */
  public async triggerManual(): Promise<void> {
    log('Manually triggering data retention job');
    await this.executeDataRetention();
  }

  /**
   * Get scheduler statistics
   */
  public getStats(): SchedulerStats {
    return { ...this.stats };
  }

  /**
   * Check if scheduler is healthy
   */
  public isHealthy(): boolean {
    // If never run, that's okay for a new instance
    if (!this.stats.lastRun) {
      return true;
    }

    // If currently running, that's healthy
    if (this.stats.isRunning) {
      return true;
    }

    // If last run was successful within 25 hours (allowing for some schedule drift)
    const now = new Date();
    const lastSuccess = this.stats.lastSuccess;
    if (lastSuccess && now.getTime() - lastSuccess.getTime() < 25 * 60 * 60 * 1000) {
      return true;
    }

    // If too many recent errors
    if (this.stats.errorCount > 3) {
      return false;
    }

    return true;
  }

  /**
   * Shutdown the scheduler gracefully
   */
  public shutdown(): void {
    if (this.job) {
      this.job.cancel();
      this.job = null;
      log('Data retention scheduler shut down');
    }
  }

  /**
   * Get next scheduled run time
   */
  public getNextRunTime(): Date | null {
    return this.job?.nextInvocation() || null;
  }
}

// Export singleton instance
export const dataRetentionScheduler = new DataRetentionScheduler();

// Export for testing
export { DataRetentionScheduler };
