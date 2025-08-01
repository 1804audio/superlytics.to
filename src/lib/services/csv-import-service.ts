import { parse } from 'csv-parse/sync';
import { parseISO, isValid } from 'date-fns';
import debug from 'debug';

const log = debug('superlytics:csv-import-service');

// Platform-specific CSV format definitions
export interface PlatformMapping {
  name: string;
  description: string;
  columns?: {
    [key: string]: {
      required: boolean;
      transform?: (value: string) => any;
      default?: any;
    };
  };
  tableTypes?: {
    [key: string]: {
      columns: {
        [key: string]: {
          required: boolean;
          transform?: (value: string) => any;
          default?: any;
        };
      };
      eventTransform?: (row: any, websiteId: string, tableType?: string) => ImportEvent[];
    };
  };
  detectTableType?: (filename: string, headers: string[]) => string | null;
  eventTransform?: (row: any, websiteId: string, tableType?: string) => ImportEvent[];
}

export interface ImportEvent {
  type: 'event' | 'identify';
  payload: {
    website: string;
    url?: string;
    title?: string;
    hostname?: string;
    name?: string;
    data?: any;
    timestamp?: number;
  };
}

// Platform configurations
export const PLATFORM_MAPPINGS: Record<string, PlatformMapping> = {
  google_analytics: {
    name: 'Google Analytics',
    description: 'Google Analytics export (aggregated data converted to events)',
    columns: {
      date: { required: true },
      page_path: { required: true },
      page_title: { required: false, default: '' },
      sessions: { required: true, transform: v => parseInt(v) || 0 },
      users: { required: false, transform: v => parseInt(v) || 0, default: 0 },
      pageviews: { required: true, transform: v => parseInt(v) || 0 },
      bounce_rate: { required: false, transform: v => parseFloat(v) || 0, default: 0 },
      avg_session_duration: { required: false, transform: v => parseFloat(v) || 0, default: 0 },
    },
    eventTransform: (row, websiteId) => {
      const events: ImportEvent[] = [];
      const date = parseISO(row.date);
      const baseTimestamp = Math.floor(date.getTime() / 1000);

      // Generate pageview events based on pageviews count
      const pageviews = row.pageviews || 1;
      const sessions = row.sessions || 1;

      // Distribute pageviews across the day (every hour)
      const hoursInDay = 24;
      const pageviewsPerHour = Math.max(1, Math.floor(pageviews / hoursInDay));

      for (let hour = 0; hour < hoursInDay; hour++) {
        for (let i = 0; i < pageviewsPerHour; i++) {
          const hourOffset = hour * 3600; // seconds in hour
          const minuteOffset = Math.floor(Math.random() * 3600); // random within hour

          events.push({
            type: 'event',
            payload: {
              website: websiteId,
              url: row.page_path,
              title: row.page_title || `Page: ${row.page_path}`,
              name: 'pageview',
              timestamp: baseTimestamp + hourOffset + minuteOffset,
              data: {
                source: 'google_analytics_import',
                original_sessions: sessions,
                original_users: row.users,
                bounce_rate: row.bounce_rate,
                avg_duration: row.avg_session_duration,
              },
            },
          });
        }
      }

      return events;
    },
  },

  plausible: {
    name: 'Plausible Analytics',
    description: 'Plausible Analytics CSV import (supports all 10 official table types)',
    tableTypes: {
      imported_visitors: {
        columns: {
          date: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_pages: {
        columns: {
          date: { required: true },
          page: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
          pageviews: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_entry_pages: {
        columns: {
          date: { required: true },
          entry_page: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
          entrances: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_exit_pages: {
        columns: {
          date: { required: true },
          exit_page: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
          exits: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_sources: {
        columns: {
          date: { required: true },
          source: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_locations: {
        columns: {
          date: { required: true },
          country: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_devices: {
        columns: {
          date: { required: true },
          device: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_browsers: {
        columns: {
          date: { required: true },
          browser: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_operating_systems: {
        columns: {
          date: { required: true },
          operating_system: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
      imported_custom_events: {
        columns: {
          date: { required: true },
          name: { required: true },
          visitors: { required: true, transform: v => parseInt(v) || 0 },
        },
      },
    },
    // Auto-detect table type from CSV content or filename
    detectTableType: (filename: string, headers: string[]) => {
      // Try to detect from filename first (e.g., "imported_visitors_20240101_20240131.csv")
      if (filename) {
        const match = filename.match(/^(imported_\w+)_\d{8}_\d{8}\.csv$/);
        if (match && PLATFORM_MAPPINGS.plausible.tableTypes[match[1]]) {
          return match[1];
        }
      }

      // Fallback: detect from column headers
      if (headers.length > 0) {
        const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

        // Check for specific column combinations
        if (normalizedHeaders.includes('page') && normalizedHeaders.includes('pageviews'))
          return 'imported_pages';
        if (normalizedHeaders.includes('entry_page') && normalizedHeaders.includes('entrances'))
          return 'imported_entry_pages';
        if (normalizedHeaders.includes('exit_page') && normalizedHeaders.includes('exits'))
          return 'imported_exit_pages';
        if (normalizedHeaders.includes('source') && !normalizedHeaders.includes('page'))
          return 'imported_sources';
        if (normalizedHeaders.includes('country')) return 'imported_locations';
        if (normalizedHeaders.includes('device')) return 'imported_devices';
        if (normalizedHeaders.includes('browser')) return 'imported_browsers';
        if (normalizedHeaders.includes('operating_system')) return 'imported_operating_systems';
        if (
          normalizedHeaders.includes('name') &&
          normalizedHeaders.includes('visitors') &&
          !normalizedHeaders.includes('page')
        )
          return 'imported_custom_events';
        if (normalizedHeaders.includes('visitors') && normalizedHeaders.length === 2)
          return 'imported_visitors';
      }

      // Default fallback
      return 'imported_visitors';
    },
    eventTransform: (row, websiteId, tableType = 'imported_visitors') => {
      const events: ImportEvent[] = [];
      const date = parseISO(row.date);
      const baseTimestamp = Math.floor(date.getTime() / 1000);
      const visitors = row.visitors || 1;

      // Create events based on table type and distribute across the day
      const hoursInDay = 24;
      const eventsPerHour = Math.max(1, Math.floor(visitors / hoursInDay));

      for (let hour = 0; hour < hoursInDay; hour++) {
        for (let i = 0; i < eventsPerHour; i++) {
          const hourOffset = hour * 3600;
          const minuteOffset = Math.floor(Math.random() * 3600);
          const timestamp = baseTimestamp + hourOffset + minuteOffset;

          const eventData: any = {
            source: 'plausible_import',
            table_type: tableType,
            original_visitors: visitors,
          };

          let eventName = 'pageview';
          let url = '/';

          // Customize event based on table type
          switch (tableType) {
            case 'imported_pages':
              url = row.page || '/';
              eventData.pageviews = row.pageviews;
              break;

            case 'imported_entry_pages':
              url = row.entry_page || '/';
              eventName = 'entry';
              eventData.entrances = row.entrances;
              break;

            case 'imported_exit_pages':
              url = row.exit_page || '/';
              eventName = 'exit';
              eventData.exits = row.exits;
              break;

            case 'imported_sources':
              eventData.referrer_source = row.source;
              break;

            case 'imported_locations':
              eventData.country = row.country;
              break;

            case 'imported_devices':
              eventData.device = row.device;
              break;

            case 'imported_browsers':
              eventData.browser = row.browser;
              break;

            case 'imported_operating_systems':
              eventData.operating_system = row.operating_system;
              break;

            case 'imported_custom_events':
              eventName = row.name;
              break;

            case 'imported_visitors':
            default:
              // Basic visitor event
              break;
          }

          events.push({
            type: 'event',
            payload: {
              website: websiteId,
              url,
              name: eventName,
              timestamp,
              data: eventData,
            },
          });
        }
      }

      return events;
    },
  },

  custom: {
    name: 'Custom CSV',
    description: 'Custom CSV format with flexible column mapping',
    columns: {
      timestamp: {
        required: true,
        transform: v => {
          const date = new Date(v);
          return isValid(date) ? Math.floor(date.getTime() / 1000) : Math.floor(Date.now() / 1000);
        },
      },
      url: { required: false, default: '/' },
      title: { required: false, default: '' },
      event_name: { required: false, default: 'pageview' },
    },
    eventTransform: (row, websiteId) => {
      return [
        {
          type: 'event',
          payload: {
            website: websiteId,
            url: row.url || '/',
            title: row.title || '',
            name: row.event_name || 'pageview',
            timestamp: row.timestamp,
            data: {
              source: 'custom_csv_import',
              ...Object.fromEntries(
                Object.entries(row).filter(
                  ([key]) => !['timestamp', 'url', 'title', 'event_name'].includes(key),
                ),
              ),
            },
          },
        },
      ];
    },
  },
};

// CSV Import Service
class CsvImportService {
  /**
   * Parse CSV content and convert to SuperLytics events
   */
  async parseCsvToEvents(
    csvContent: string,
    websiteId: string,
    platformType: string,
    customMapping?: Record<string, string>,
    filename?: string,
  ): Promise<{ events: ImportEvent[]; errors: string[]; summary: ImportSummary }> {
    const errors: string[] = [];
    const events: ImportEvent[] = [];

    try {
      log(`Parsing CSV for platform: ${platformType}`);

      // Get platform mapping
      const platform = PLATFORM_MAPPINGS[platformType];
      if (!platform) {
        throw new Error(`Unsupported platform: ${platformType}`);
      }

      // For Plausible, detect the table type
      let plausibleTableType: string | undefined;
      if (platformType === 'plausible' && platform.detectTableType) {
        const firstLine = csvContent.split('\n')[0];
        const headers = firstLine.split(',').map(h => h.trim());
        plausibleTableType = platform.detectTableType(filename || '', headers);
        log(`Detected Plausible table type: ${plausibleTableType}`);
      }

      // Parse CSV
      const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        auto_parse: false, // Keep as strings for custom transformation
      });

      log(`Parsed ${records.length} CSV rows`);

      // Process each row
      for (let i = 0; i < records.length; i++) {
        try {
          const row = records[i];

          // Apply custom column mapping if provided
          const mappedRow = customMapping ? this.applyColumnMapping(row, customMapping) : row;

          // Validate and transform row data
          const transformedRow = this.validateAndTransformRow(
            mappedRow,
            platform,
            plausibleTableType,
          );

          // Convert to events using platform-specific logic
          const rowEvents =
            platformType === 'plausible' && plausibleTableType
              ? platform.eventTransform(transformedRow, websiteId, plausibleTableType)
              : platform.eventTransform(transformedRow, websiteId);
          events.push(...rowEvents);
        } catch (error) {
          const errorMsg = `Row ${i + 1}: ${error instanceof Error ? error.message : 'Invalid data'}`;
          errors.push(errorMsg);
          log(`Error processing row ${i + 1}:`, error);
        }
      }

      const summary: ImportSummary = {
        totalRows: records.length,
        processedRows: records.length - errors.length,
        generatedEvents: events.length,
        errorRows: errors.length,
        platform: platform.name,
      };

      log(`Import summary:`, summary);

      return { events, errors, summary };
    } catch (error) {
      const errorMsg = `CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      errors.push(errorMsg);
      log('CSV parsing error:', error);

      return {
        events: [],
        errors,
        summary: {
          totalRows: 0,
          processedRows: 0,
          generatedEvents: 0,
          errorRows: 1,
          platform: platformType,
        },
      };
    }
  }

  /**
   * Apply custom column mapping to row
   */
  private applyColumnMapping(row: any, mapping: Record<string, string>): any {
    const mappedRow: any = {};

    // Apply column mappings
    for (const [originalColumn, mappedColumn] of Object.entries(mapping)) {
      if (row[originalColumn] !== undefined) {
        mappedRow[mappedColumn] = row[originalColumn];
      }
    }

    // Keep unmapped columns
    for (const [key, value] of Object.entries(row)) {
      if (!mapping[key]) {
        mappedRow[key] = value;
      }
    }

    return mappedRow;
  }

  /**
   * Validate and transform row data according to platform schema
   */
  private validateAndTransformRow(
    row: any,
    platform: PlatformMapping,
    plausibleTableType?: string,
  ): any {
    const transformedRow: any = {};

    // Get columns to validate based on platform type
    let columnsToValidate: Record<string, any>;

    if (platform.tableTypes && plausibleTableType && platform.tableTypes[plausibleTableType]) {
      // Use Plausible table-specific columns
      columnsToValidate = platform.tableTypes[plausibleTableType].columns;
    } else if (platform.columns) {
      // Use regular platform columns
      columnsToValidate = platform.columns;
    } else {
      throw new Error('No column validation rules found');
    }

    // Check required columns and apply transformations
    for (const [columnName, config] of Object.entries(columnsToValidate)) {
      const value = row[columnName];

      if (config.required && (value === undefined || value === null || value === '')) {
        throw new Error(`Required column '${columnName}' is missing or empty`);
      }

      if (value !== undefined && value !== null && value !== '') {
        // Apply transformation if defined
        transformedRow[columnName] = config.transform ? config.transform(value) : value;
      } else if (config.default !== undefined) {
        // Apply default value
        transformedRow[columnName] = config.default;
      }
    }

    // Include any extra columns not in the schema
    for (const [key, value] of Object.entries(row)) {
      if (!columnsToValidate[key]) {
        transformedRow[key] = value;
      }
    }

    return transformedRow;
  }

  /**
   * Get available platform configurations
   */
  getAvailablePlatforms(): Array<{ id: string; name: string; description: string }> {
    return Object.entries(PLATFORM_MAPPINGS).map(([id, platform]) => ({
      id,
      name: platform.name,
      description: platform.description,
    }));
  }

  /**
   * Get platform-specific schema information
   */
  getPlatformSchema(platformType: string): PlatformMapping | null {
    return PLATFORM_MAPPINGS[platformType] || null;
  }
}

export interface ImportSummary {
  totalRows: number;
  processedRows: number;
  generatedEvents: number;
  errorRows: number;
  platform: string;
}

export const csvImportService = new CsvImportService();
