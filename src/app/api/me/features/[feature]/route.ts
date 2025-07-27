import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, badRequest } from '@/lib/response';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import debug from 'debug';

const log = debug('superlytics:features');

export async function GET(request: Request, { params }: { params: Promise<{ feature: string }> }) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  const { feature } = await params;
  const userId = auth.user.id;

  // Validate feature name
  const validFeatures = [
    'dataImport',
    'dataExport',
    'apiKeys',
    'emailReports',
    'whiteLabel',
    'customDomain',
    'basicAnalytics',
    'reports',
    'privacy',
  ];

  if (!validFeatures.includes(feature)) {
    return badRequest(`Invalid feature: ${feature}`);
  }

  try {
    const hasFeature = await simpleUsageManager.hasFeature(userId, feature as any);

    return json({
      feature,
      hasFeature,
      userId,
    });
  } catch (err) {
    log(`Failed to check feature ${feature} for user ${userId}:`, err);
    return json({
      feature,
      hasFeature: false,
      userId,
      error: 'Failed to check feature access',
    });
  }
}
