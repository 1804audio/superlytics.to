import { NextRequest } from 'next/server';
import { r2StorageService } from '@/lib/services/r2-storage-service';
import { json, unauthorized, badRequest } from '@/lib/response';
import { getAuth } from '@/lib/auth';
import debug from 'debug';

const log = debug('superlytics:cleanup-test');

export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only for testing)
    const auth = await getAuth(request);
    if (!auth?.user) {
      return unauthorized('Authentication required');
    }

    const { action, exportId, maxAge } = await request.json();

    if (action === 'list_old_exports') {
      // List exports older than specified age (in minutes, default 30 for testing)
      const ageMinutes = maxAge || 30;
      const cutoffTime = Date.now() - ageMinutes * 60 * 1000;

      log(
        `Looking for exports older than ${ageMinutes} minutes (before ${new Date(cutoffTime).toISOString()})`,
      );

      try {
        // List all exports
        const allFiles = await r2StorageService.listFiles('exports/');
        const expiredExports = new Set();

        // Group files by export and check timestamps
        for (const file of allFiles) {
          const exportMatch = file.key.match(/^exports\/([^\/]+)\//);
          if (exportMatch) {
            const exportId = exportMatch[1];

            // Extract timestamp from export ID (format: export_userId_timestamp_random)
            const timestampMatch = exportId.match(/_(\d+)_/);
            if (timestampMatch) {
              const timestamp = parseInt(timestampMatch[1]);
              if (timestamp < cutoffTime) {
                expiredExports.add(exportId);
              }
            }
          }
        }

        const expiredList = Array.from(expiredExports);
        log(`Found ${expiredList.length} expired exports`);

        return json({
          success: true,
          expiredExports: expiredList,
          cutoffTime: new Date(cutoffTime).toISOString(),
          ageMinutes,
          totalFiles: allFiles.length,
        });
      } catch (error) {
        log('Error listing exports:', error);
        return json({ success: false, error: error.message }, 500);
      }
    }

    if (action === 'cleanup_export' && exportId) {
      // Manually cleanup a specific export
      log(`Manually cleaning up export: ${exportId}`);

      try {
        const success = await r2StorageService.cleanupExport(exportId);

        if (success) {
          log(`Successfully cleaned up export: ${exportId}`);
          return json({
            success: true,
            message: `Export ${exportId} cleaned up successfully`,
            exportId,
          });
        } else {
          return json(
            {
              success: false,
              message: `Failed to cleanup export ${exportId}`,
              exportId,
            },
            500,
          );
        }
      } catch (error) {
        log(`Error cleaning up export ${exportId}:`, error);
        return json(
          {
            success: false,
            error: error.message,
            exportId,
          },
          500,
        );
      }
    }

    if (action === 'cleanup_old_exports') {
      // Cleanup all exports older than specified age
      const ageMinutes = maxAge || 30;
      const cutoffTime = Date.now() - ageMinutes * 60 * 1000;

      log(`Cleaning up exports older than ${ageMinutes} minutes`);

      try {
        // First, list expired exports
        const allFiles = await r2StorageService.listFiles('exports/');
        const expiredExports = new Set();

        for (const file of allFiles) {
          const exportMatch = file.key.match(/^exports\/([^\/]+)\//);
          if (exportMatch) {
            const exportId = exportMatch[1];
            const timestampMatch = exportId.match(/_(\d+)_/);
            if (timestampMatch) {
              const timestamp = parseInt(timestampMatch[1]);
              if (timestamp < cutoffTime) {
                expiredExports.add(exportId);
              }
            }
          }
        }

        // Cleanup each expired export
        const cleanupResults = [];
        for (const exportId of expiredExports) {
          try {
            const success = await r2StorageService.cleanupExport(exportId);
            cleanupResults.push({ exportId, success });
            log(`Cleanup ${exportId}: ${success ? 'SUCCESS' : 'FAILED'}`);
          } catch (error) {
            cleanupResults.push({ exportId, success: false, error: error.message });
            log(`Cleanup ${exportId}: ERROR - ${error.message}`);
          }
        }

        const successCount = cleanupResults.filter(r => r.success).length;
        const failCount = cleanupResults.length - successCount;

        return json({
          success: true,
          message: `Cleanup completed: ${successCount} successful, ${failCount} failed`,
          results: cleanupResults,
          cutoffTime: new Date(cutoffTime).toISOString(),
          ageMinutes,
        });
      } catch (error) {
        log('Error during bulk cleanup:', error);
        return json({ success: false, error: error.message }, 500);
      }
    }

    return badRequest(
      'Invalid action. Supported actions: list_old_exports, cleanup_export, cleanup_old_exports',
    );
  } catch (error) {
    log('Cleanup test endpoint error:', error);
    return json({ success: false, error: 'Internal server error' }, 500);
  }
}

// GET endpoint to list all exports for debugging
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth?.user) {
      return unauthorized('Authentication required');
    }

    log('Listing all exports in R2');

    try {
      const allFiles = await r2StorageService.listFiles('exports/');
      const exports = {};

      // Group files by export ID
      for (const file of allFiles) {
        const exportMatch = file.key.match(/^exports\/([^\/]+)\/(.+)$/);
        if (exportMatch) {
          const [, exportId, filename] = exportMatch;

          if (!exports[exportId]) {
            // Extract timestamp from export ID
            const timestampMatch = exportId.match(/_(\d+)_/);
            const timestamp = timestampMatch ? parseInt(timestampMatch[1]) : null;

            exports[exportId] = {
              exportId,
              timestamp,
              createdAt: timestamp ? new Date(timestamp).toISOString() : null,
              files: [],
            };
          }

          exports[exportId].files.push({
            filename,
            size: file.size,
            lastModified: file.lastModified.toISOString(),
          });
        }
      }

      const exportList = Object.values(exports);
      log(`Found ${exportList.length} exports with ${allFiles.length} total files`);

      return json({
        success: true,
        exports: exportList,
        totalExports: exportList.length,
        totalFiles: allFiles.length,
      });
    } catch (error) {
      log('Error listing exports:', error);
      return json({ success: false, error: error.message }, 500);
    }
  } catch (error) {
    log('GET cleanup test endpoint error:', error);
    return json({ success: false, error: 'Internal server error' }, 500);
  }
}
