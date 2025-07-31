import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, serverError, forbidden } from '@/lib/response';
import { usageTracker } from '@/lib/services/usage-tracker';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { dataExportService } from '@/lib/services/data-export-service';
import debug from 'debug';

const log = debug('superlytics:data-export');

export async function POST(request: Request) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  const userId = auth.user.id;
  const userEmail = auth.user.email;
  const username = auth.user.username;

  try {
    // Check if user has data export feature access
    const hasDataExport = await simpleUsageManager.hasFeature(userId, 'dataExport');
    if (!hasDataExport) {
      return forbidden(
        'Data export is not available in your current plan. Please upgrade to access this feature.',
      );
    }

    // Track data export usage
    await usageTracker.trackDataExport(userId, 'full_export', 0);

    // Process export asynchronously
    setTimeout(async () => {
      try {
        log(`Starting background data export for user ${userId}`);
        await dataExportService.exportUserData(userId, userEmail, username);
      } catch (exportError) {
        log('Background data export failed:', exportError);
      }
    }, 1000); // Start processing after 1 second

    return json({
      success: true,
      message:
        'Data export initiated. You will receive an email when your files are ready to be downloaded.',
      estimatedTime: '2-5 minutes',
    });
  } catch (err) {
    log('Failed to initiate data export:', err);
    return serverError('Failed to initiate data export');
  }
}
