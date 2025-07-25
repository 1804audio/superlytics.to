import { simpleUsageManager } from './simple-usage-manager';
import debug from 'debug';

const log = debug('superlytics:usage-tracker');

/**
 * Usage tracking helper for API endpoints
 * Provides a simple way to track various types of usage across the application
 */
export class UsageTracker {
  /**
   * Track API usage for endpoints with rate limiting
   */
  static async trackApiCall(userId: string, endpoint: string): Promise<void> {
    try {
      // This could be expanded to track API calls per endpoint
      // For now, we'll just log it for monitoring
      log('API call tracked: user=%s, endpoint=%s', userId, endpoint);
    } catch (error) {
      log('Error tracking API call: %s', error);
    }
  }

  /**
   * Track data export usage (for plans that limit exports)
   */
  static async trackDataExport(
    userId: string,
    exportType: string,
    recordCount: number,
  ): Promise<void> {
    try {
      // Future: Track export usage against plan limits
      log('Data export tracked: user=%s, type=%s, records=%d', userId, exportType, recordCount);
    } catch (error) {
      log('Error tracking data export: %s', error);
    }
  }

  /**
   * Track report generation (for plans that limit report generation)
   */
  static async trackReportGeneration(userId: string, reportType: string): Promise<void> {
    try {
      // Future: Track report generation against plan limits
      log('Report generation tracked: user=%s, type=%s', userId, reportType);
    } catch (error) {
      log('Error tracking report generation: %s', error);
    }
  }

  /**
   * Get comprehensive usage summary for a user
   */
  static async getUserUsageSummary(userId: string) {
    return await simpleUsageManager.getUsageSummary(userId);
  }

  /**
   * Check if user can perform a specific action based on their plan
   */
  static async canPerformAction(
    userId: string,
    action: 'website_create' | 'team_create' | 'event_track' | 'data_import' | 'data_export',
  ): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    try {
      switch (action) {
        case 'website_create': {
          const canCreateWebsite = await simpleUsageManager.checkWebsiteLimit(userId);
          return {
            allowed: canCreateWebsite,
            reason: canCreateWebsite ? undefined : 'Website limit exceeded',
            upgradeRequired: !canCreateWebsite,
          };
        }

        case 'event_track': {
          const canTrackEvent = await simpleUsageManager.checkEventLimit(userId);
          return {
            allowed: canTrackEvent,
            reason: canTrackEvent ? undefined : 'Monthly event limit exceeded',
            upgradeRequired: !canTrackEvent,
          };
        }

        case 'data_import': {
          const hasDataImport = await simpleUsageManager.hasFeature(userId, 'dataImport');
          return {
            allowed: hasDataImport,
            reason: hasDataImport ? undefined : 'Data import not available in current plan',
            upgradeRequired: !hasDataImport,
          };
        }

        case 'data_export': {
          const hasDataExport = await simpleUsageManager.hasFeature(userId, 'dataExport');
          return {
            allowed: hasDataExport,
            reason: hasDataExport ? undefined : 'Data export not available in current plan',
            upgradeRequired: !hasDataExport,
          };
        }

        default:
          return {
            allowed: false,
            reason: 'Unknown action',
          };
      }
    } catch (error) {
      log('Error checking user action permission: %s', error);
      return {
        allowed: false,
        reason: 'Error checking permissions',
      };
    }
  }

  /**
   * Middleware helper to check and track usage in one call
   */
  static async checkAndTrack(
    userId: string,
    action: 'website_create' | 'team_create' | 'event_track' | 'data_import' | 'data_export',
    metadata?: any,
  ): Promise<{
    allowed: boolean;
    reason?: string;
    upgradeRequired?: boolean;
  }> {
    const check = await this.canPerformAction(userId, action);
    if (check.allowed) {
      // Track the successful action
      switch (action) {
        case 'event_track':
          // Event tracking is handled in the send endpoint directly
          break;
        case 'data_import':
          await this.trackDataExport(userId, 'import', metadata?.recordCount || 0);
          break;
        case 'data_export':
          await this.trackDataExport(userId, 'export', metadata?.recordCount || 0);
          break;
        default:
          await this.trackApiCall(userId, action);
      }
    }
    return check;
  }
}

export const usageTracker = UsageTracker;
