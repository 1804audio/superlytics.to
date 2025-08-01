import { z } from 'zod';
import * as send from '@/app/api/send/route';
import { parseRequest } from '@/lib/request';
import { json, serverError, badRequest } from '@/lib/response';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { csvImportService, type ImportEvent } from '@/lib/services/csv-import-service';
import { checkRateLimit } from '@/lib/rate-limit';

// Enhanced schema for CSV import
const csvImportSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
  websiteId: z.string().uuid('Invalid website ID format'),
  platform: z.enum(['google_analytics', 'plausible', 'custom']),
  columnMapping: z.record(z.string(), z.string()).optional(), // For custom mapping
  preview: z.boolean().optional().default(false), // For preview mode
  filename: z.string().optional(), // For Plausible table type detection
});

// Input sanitization function (reused from main batch endpoint)
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:/gi, '')
    .trim()
    .substring(0, 1000);
}

// Sanitize data object recursively (reused from main batch endpoint)
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  } else if (Array.isArray(data)) {
    return data.slice(0, 100).map(item => sanitizeData(item));
  } else if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    let keyCount = 0;
    for (const key in data) {
      if (keyCount >= 50) break;
      const sanitizedKey = sanitizeString(key).substring(0, 50);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeData(data[key]);
      }
      keyCount++;
    }
    return sanitized;
  }
  return data;
}

// Sanitize import event
function sanitizeImportEvent(event: ImportEvent): ImportEvent {
  return {
    type: event.type,
    payload: {
      website: event.payload.website,
      hostname: event.payload.hostname ? sanitizeString(event.payload.hostname) : undefined,
      url: event.payload.url ? sanitizeString(event.payload.url) : undefined,
      title: event.payload.title ? sanitizeString(event.payload.title) : undefined,
      name: event.payload.name ? sanitizeString(event.payload.name) : undefined,
      data: event.payload.data ? sanitizeData(event.payload.data) : undefined,
      timestamp: event.payload.timestamp,
    },
  };
}

export async function POST(request: Request) {
  try {
    const { auth, body, error } = await parseRequest(request, csvImportSchema);

    if (error) {
      return error();
    }

    const { csvData, websiteId, platform, columnMapping, preview, filename } = body;

    // Check rate limiting for CSV imports
    const rateLimitResponse = await checkRateLimit(auth.user.id);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // Check if user has data import feature access
    const hasDataImport = await simpleUsageManager.hasFeature(auth.user.id, 'dataImport');
    if (!hasDataImport) {
      return Response.json(
        {
          error:
            'CSV data import is not available in your current plan. Please upgrade to access this feature.',
          feature: 'dataImport',
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    // Parse CSV and convert to events
    const {
      events,
      errors: csvErrors,
      summary,
    } = await csvImportService.parseCsvToEvents(
      csvData,
      websiteId,
      platform,
      columnMapping,
      filename,
    );

    // Preview mode: return sample data without processing
    if (preview) {
      return json({
        preview: true,
        summary,
        sampleEvents: events.slice(0, 5), // Show first 5 events
        errors: csvErrors.slice(0, 10), // Show first 10 errors
        availablePlatforms: csvImportService.getAvailablePlatforms(),
      });
    }

    // Limit total events to prevent abuse
    if (events.length > 10000) {
      return badRequest(
        'CSV import cannot exceed 10,000 events. Please split your data into smaller files.',
      );
    }

    // Security: Sanitize all events
    const sanitizedEvents = events.map(sanitizeImportEvent);

    const processErrors = [];
    let processedCount = 0;

    // Process events in batches to avoid overwhelming the system
    const batchSize = 100;
    for (let i = 0; i < sanitizedEvents.length; i += batchSize) {
      const batch = sanitizedEvents.slice(i, i + batchSize);

      for (let j = 0; j < batch.length; j++) {
        const event = batch[j];
        const globalIndex = i + j;

        try {
          // Remove undefined values from payload
          Object.keys(event.payload).forEach(key => {
            if (event.payload[key] === undefined) {
              delete event.payload[key];
            }
          });

          const newRequest = new Request(request, {
            body: JSON.stringify(event),
            headers: request.headers,
          });
          const response = await send.POST(newRequest);

          if (!response.ok) {
            const errorResponse = await response.json();
            processErrors.push({
              index: globalIndex,
              event: event.payload.name || 'pageview',
              response: errorResponse,
            });
          } else {
            processedCount++;
          }
        } catch {
          processErrors.push({
            index: globalIndex,
            event: event.payload.name || 'pageview',
            response: { error: 'Processing failed' },
          });
        }
      }

      // Add small delay between batches to prevent overwhelming
      if (i + batchSize < sanitizedEvents.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return json({
      csvImport: true,
      summary: {
        ...summary,
        actualProcessed: processedCount,
        actualErrors: processErrors.length + csvErrors.length,
      },
      csvParsingErrors: csvErrors,
      processingErrors: processErrors.slice(0, 20), // Limit error details
      platform: platform,
      success: processedCount > 0,
    });
  } catch (e) {
    return serverError(e);
  }
}

// GET endpoint to retrieve platform information
// Helper function to get platform logos
function getPlatformLogo(platformId: string): string | null {
  switch (platformId) {
    case 'google_analytics':
      return '/platform-logo/Google_Symbol_1.png';
    case 'plausible':
      return '/platform-logo/Plausible_logo.png';
    default:
      return null;
  }
}

export async function GET() {
  try {
    const platforms = csvImportService.getAvailablePlatforms();

    // Add detailed schema information and logos for each platform
    const platformDetails = platforms.map(platform => ({
      ...platform,
      logo: getPlatformLogo(platform.id),
      schema: csvImportService.getPlatformSchema(platform.id),
    }));

    return json({
      platforms: platformDetails,
      limits: {
        maxEvents: 10000,
        maxFileSize: '10MB',
        supportedFormats: ['csv'],
        rateLimiting: '5 requests per minute per user',
      },
      usage: {
        featureRequired: 'dataImport',
        availableInPlans: [
          'growth',
          'enterprise',
          'lifetime_starter',
          'lifetime_growth',
          'lifetime_max',
        ],
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
