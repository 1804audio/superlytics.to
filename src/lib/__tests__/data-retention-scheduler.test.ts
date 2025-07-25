import { DataRetentionScheduler } from '../scheduler/data-retention-scheduler';

// Mock the data retention jobs module
jest.mock('../jobs/data-retention');

describe('DataRetentionScheduler', () => {
  let scheduler: DataRetentionScheduler;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    scheduler = new DataRetentionScheduler();
  });

  afterEach(() => {
    scheduler.shutdown();
    // Restore original environment
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalNodeEnv,
      configurable: true,
    });
  });

  describe('initialization', () => {
    it('should not initialize in non-production environment', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        configurable: true,
      });

      expect(() => scheduler.initialize()).not.toThrow();
      expect(scheduler.getStats().totalRuns).toBe(0);
    });

    it('should not initialize during build phase', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
      Object.defineProperty(process.env, 'NEXT_PHASE', {
        value: 'phase-production-build',
        configurable: true,
      });

      expect(() => scheduler.initialize()).not.toThrow();
      expect(scheduler.getStats().totalRuns).toBe(0);

      delete process.env.NEXT_PHASE;
    });

    it('should initialize successfully in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      expect(() => scheduler.initialize()).not.toThrow();
      expect(scheduler.getNextRunTime()).toBeTruthy();
    });

    it('should prevent multiple initializations', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      scheduler.initialize();
      const firstNextRun = scheduler.getNextRunTime();

      scheduler.initialize();
      const secondNextRun = scheduler.getNextRunTime();

      expect(firstNextRun).toEqual(secondNextRun);
    });
  });

  describe('basic functionality', () => {
    it('should track statistics correctly', () => {
      const stats = scheduler.getStats();
      expect(stats.totalRuns).toBe(0);
      expect(stats.lastRun).toBeNull();
      expect(stats.isRunning).toBe(false);
    });

    it('should provide immutable stats object', () => {
      const stats1 = scheduler.getStats();
      const stats2 = scheduler.getStats();

      expect(stats1).not.toBe(stats2); // Different objects
      expect(stats1).toEqual(stats2); // Same content
    });
  });

  describe('health checking', () => {
    it('should be healthy when never run', () => {
      expect(scheduler.isHealthy()).toBe(true);
    });
  });

  describe('shutdown', () => {
    it('should cancel scheduled jobs on shutdown', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
      scheduler.initialize();

      expect(scheduler.getNextRunTime()).toBeTruthy();

      scheduler.shutdown();

      expect(scheduler.getNextRunTime()).toBeNull();
    });

    it('should handle shutdown when not initialized', () => {
      expect(() => scheduler.shutdown()).not.toThrow();
    });
  });
});
