import { z } from 'zod';
import * as send from '@/app/api/send/route';
import { parseRequest } from '@/lib/request';
import { json, serverError, badRequest } from '@/lib/response';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { anyObjectParam, urlOrPathParam } from '@/lib/schema';

// Enhanced security schema with strict validation
const dataSchema = z.object({
  type: z.enum(['event', 'identify']),
  payload: z.object({
    website: z.string().uuid(),
    hostname: z.string().max(100).optional(),
    url: urlOrPathParam.optional(),
    referrer: urlOrPathParam.optional(),
    title: z.string().max(200).optional(),
    name: z.string().max(50).optional(),
    data: anyObjectParam.optional(),
    timestamp: z.coerce.number().int().optional(),
  }),
});

const schema = z.array(dataSchema).max(100); // Limit batch size to 100 records

// Input sanitization function
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';

  // Remove potential XSS vectors
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data: protocols
    .trim()
    .substring(0, 1000); // Limit string length
}

// Validate object depth to prevent stack overflow
function validateObjectDepth(obj: any, maxDepth: number = 10, currentDepth: number = 0): boolean {
  if (currentDepth > maxDepth) return false;
  if (typeof obj !== 'object' || obj === null) return true;

  for (const key in obj) {
    if (!validateObjectDepth(obj[key], maxDepth, currentDepth + 1)) {
      return false;
    }
  }
  return true;
}

// Sanitize data object recursively
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeString(data);
  } else if (Array.isArray(data)) {
    return data.slice(0, 100).map(item => sanitizeData(item)); // Limit array size
  } else if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    let keyCount = 0;
    for (const key in data) {
      if (keyCount >= 50) break; // Limit object keys
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

export async function POST(request: Request) {
  try {
    const { auth, body, error } = await parseRequest(request, schema);

    if (error) {
      return error();
    }

    // Security: Check batch size limit (already enforced by schema, but double-check)
    if (body.length > 100) {
      return badRequest('Batch size cannot exceed 100 records');
    }

    // Check if user has data import feature access
    const hasDataImport = await simpleUsageManager.hasFeature(auth.user.id, 'dataImport');
    if (!hasDataImport) {
      return Response.json(
        {
          error:
            'Data import is not available in your current plan. Please upgrade to access this feature.',
          feature: 'dataImport',
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const errors = [];
    const sanitizedRecords = [];

    // Security: Sanitize and validate each record
    for (let index = 0; index < body.length; index++) {
      const record = body[index];

      try {
        // Validate object depth
        if (!validateObjectDepth(record, 10)) {
          errors.push({
            index,
            response: { error: 'Object nesting too deep (max 10 levels)' },
          });
          continue;
        }

        // Sanitize the record
        const sanitizedRecord = {
          type: record.type,
          payload: {
            website: record.payload.website,
            hostname: record.payload.hostname ? sanitizeString(record.payload.hostname) : undefined,
            url: record.payload.url ? sanitizeString(record.payload.url) : undefined,
            referrer: record.payload.referrer ? sanitizeString(record.payload.referrer) : undefined,
            title: record.payload.title ? sanitizeString(record.payload.title) : undefined,
            name: record.payload.name ? sanitizeString(record.payload.name) : undefined,
            data: record.payload.data ? sanitizeData(record.payload.data) : undefined,
            timestamp: record.payload.timestamp,
          },
        };

        // Remove undefined values
        Object.keys(sanitizedRecord.payload).forEach(key => {
          if (sanitizedRecord.payload[key] === undefined) {
            delete sanitizedRecord.payload[key];
          }
        });

        sanitizedRecords.push(sanitizedRecord);
      } catch {
        errors.push({
          index,
          response: { error: 'Invalid record format' },
        });
      }
    }

    // Process sanitized records
    for (let i = 0; i < sanitizedRecords.length; i++) {
      const sanitizedRecord = sanitizedRecords[i];
      const originalIndex = i; // Track original index for error reporting

      try {
        const newRequest = new Request(request, { body: JSON.stringify(sanitizedRecord) });
        const response = await send.POST(newRequest);

        if (!response.ok) {
          const errorResponse = await response.json();
          errors.push({ index: originalIndex, response: errorResponse });
        }
      } catch {
        errors.push({
          index: originalIndex,
          response: { error: 'Processing failed' },
        });
      }
    }

    return json({
      size: body.length,
      processed: body.length - errors.length,
      errors: errors.length,
      details: errors,
    });
  } catch (e) {
    return serverError(e);
  }
}
