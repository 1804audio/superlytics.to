import debug from 'debug';
import { dataRetentionScheduler } from './data-retention-scheduler';

const log = debug('superlytics:scheduler');

interface SchedulerHealth {
  isHealthy: boolean;
  services: {
    dataRetention: {
      isHealthy: boolean;
      stats: any;
      nextRun: Date | null;
    };
  };
  lastChecked: Date;
}

class SchedulerManager {
  private isInitialized = false;

  /**
   * Initialize all schedulers
   * Only runs in production server environments
   */
  public initialize(): void {
    try {
      // Prevent multiple initializations
      if (this.isInitialized) {
        log('Scheduler manager already initialized');
        return;
      }

      // Environment checks
      if (process.env.NODE_ENV !== 'production') {
        log('Scheduler manager disabled in non-production environment');
        return;
      }

      // Don't run during build
      if (
        process.env.NEXT_PHASE === 'phase-production-build' ||
        process.env.VERCEL_ENV === 'build'
      ) {
        log('Scheduler manager disabled during build phase');
        return;
      }

      // Don't run in edge runtime (Vercel Edge Functions, etc.)
      if (process.env.NEXT_RUNTIME === 'edge') {
        log('Scheduler manager disabled in edge runtime');
        return;
      }

      log('Initializing scheduler manager...');

      // Initialize data retention scheduler
      dataRetentionScheduler.initialize();

      // Set up graceful shutdown handlers
      this.setupGracefulShutdown();

      this.isInitialized = true;
      log('Scheduler manager initialized successfully');
    } catch (error) {
      log('Failed to initialize scheduler manager:', error);
      throw new Error(`Scheduler manager initialization failed: ${error}`);
    }
  }

  /**
   * Set up graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const cleanup = () => {
      log('Shutting down schedulers...');
      dataRetentionScheduler.shutdown();
      process.exit(0);
    };

    // Handle various shutdown signals
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
    process.on('SIGHUP', cleanup);

    // Handle uncaught exceptions to prevent scheduler corruption
    process.on('uncaughtException', error => {
      log('Uncaught exception in scheduler process:', error);
      cleanup();
    });

    process.on('unhandledRejection', (reason, promise) => {
      log('Unhandled rejection in scheduler process:', reason, promise);
      cleanup();
    });
  }

  /**
   * Get health status of all schedulers
   */
  public getHealth(): SchedulerHealth {
    return {
      isHealthy: dataRetentionScheduler.isHealthy(),
      services: {
        dataRetention: {
          isHealthy: dataRetentionScheduler.isHealthy(),
          stats: dataRetentionScheduler.getStats(),
          nextRun: dataRetentionScheduler.getNextRunTime(),
        },
      },
      lastChecked: new Date(),
    };
  }

  /**
   * Manually trigger data retention (for testing/debugging)
   */
  public async triggerDataRetention(): Promise<void> {
    log('Manually triggering data retention');
    await dataRetentionScheduler.triggerManual();
  }

  /**
   * Check if scheduler manager is initialized
   */
  public get initialized(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const schedulerManager = new SchedulerManager();

// Export for testing
export { SchedulerManager };
