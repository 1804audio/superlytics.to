import { SchedulerManager } from '../scheduler';

// Mock the data retention jobs
jest.mock('../jobs/data-retention');

describe('SchedulerManager', () => {
  let schedulerManager: SchedulerManager;
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    schedulerManager = new SchedulerManager();
    jest.clearAllMocks();
  });

  afterEach(() => {
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

      expect(() => schedulerManager.initialize()).not.toThrow();
      expect(schedulerManager.initialized).toBe(false);
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

      expect(() => schedulerManager.initialize()).not.toThrow();
      expect(schedulerManager.initialized).toBe(false);

      delete process.env.NEXT_PHASE;
    });

    it('should not initialize in edge runtime', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });
      Object.defineProperty(process.env, 'NEXT_RUNTIME', {
        value: 'edge',
        configurable: true,
      });

      expect(() => schedulerManager.initialize()).not.toThrow();
      expect(schedulerManager.initialized).toBe(false);

      delete process.env.NEXT_RUNTIME;
    });

    it('should initialize successfully in production', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      expect(() => schedulerManager.initialize()).not.toThrow();
      expect(schedulerManager.initialized).toBe(true);
    });

    it('should prevent multiple initializations', () => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        configurable: true,
      });

      schedulerManager.initialize();
      expect(schedulerManager.initialized).toBe(true);

      schedulerManager.initialize();
      expect(schedulerManager.initialized).toBe(true);
    });
  });

  describe('health monitoring', () => {
    it('should provide health status', () => {
      const health = schedulerManager.getHealth();

      expect(health).toHaveProperty('isHealthy');
      expect(health).toHaveProperty('services');
      expect(health).toHaveProperty('lastChecked');
      expect(health.services).toHaveProperty('dataRetention');
      expect(health.services.dataRetention).toHaveProperty('isHealthy');
      expect(health.services.dataRetention).toHaveProperty('stats');
      expect(health.services.dataRetention).toHaveProperty('nextRun');
    });

    it('should update lastChecked timestamp on each health check', async () => {
      const health1 = schedulerManager.getHealth();

      // Wait a tiny bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 2));

      const health2 = schedulerManager.getHealth();
      expect(health2.lastChecked.getTime()).toBeGreaterThan(health1.lastChecked.getTime());
    });
  });

  describe('basic functionality', () => {
    it('should provide initialization status', () => {
      expect(typeof schedulerManager.initialized).toBe('boolean');
    });
  });
});
