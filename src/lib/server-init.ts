import debug from 'debug';
import { schedulerManager } from './scheduler';

const log = debug('superlytics:server-init');

let isInitialized = false;

/**
 * Initialize server-side services
 * This should be called once when the server starts
 */
export function initializeServerServices(): void {
  // Prevent multiple initializations
  if (isInitialized) {
    return;
  }

  try {
    log('Initializing server services...');

    // Initialize schedulers
    schedulerManager.initialize();

    isInitialized = true;
    log('Server services initialized successfully');
  } catch (error) {
    log('Failed to initialize server services:', error);
    // Don't throw - we want the app to start even if schedulers fail
    // But make sure we log the error prominently
    // eslint-disable-next-line no-console
    console.error('CRITICAL: Failed to initialize server services:', error);
  }
}

// Auto-initialize in production
if (
  process.env.NODE_ENV === 'production' &&
  typeof window === 'undefined' && // Server-side only
  process.env.NEXT_PHASE !== 'phase-production-build' && // Not during build
  process.env.VERCEL_ENV !== 'build' && // Not during Vercel build
  process.env.NEXT_RUNTIME !== 'edge' // Not in edge runtime
) {
  // Delay initialization slightly to ensure all modules are loaded
  setImmediate(() => {
    initializeServerServices();
  });
}
