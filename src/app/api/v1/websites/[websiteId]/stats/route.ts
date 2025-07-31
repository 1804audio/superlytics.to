import { NextRequest } from 'next/server';
import { json, unauthorized, forbidden, badRequest, notFound } from '@/lib/response';
import { authenticateApiKey, hasPermission } from '@/lib/middleware/api-key-auth';
import { prisma } from '@/lib/prisma';
import debug from 'debug';

const log = debug('superlytics:api-v1-website-stats');

/**
 * GET /api/v1/websites/[websiteId]/stats
 * Get basic statistics for a website via API key authentication
 */
export async function GET(request: NextRequest, { params }: { params: { websiteId: string } }) {
  try {
    // Authenticate API key
    const auth = await authenticateApiKey(request);

    if (!auth.success) {
      log('API key authentication failed:', auth.error);
      return unauthorized(auth.error || 'Authentication required');
    }

    // Check read permission
    if (!hasPermission(auth.permissions!, 'read')) {
      log('User lacks read permission:', auth.userId);
      return forbidden('Read permission required');
    }

    const { websiteId } = params;

    if (!websiteId) {
      return badRequest('Website ID is required');
    }

    // Verify website belongs to user
    const website = await prisma.website.findFirst({
      where: {
        id: websiteId,
        userId: auth.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        createdAt: true,
      },
    });

    if (!website) {
      log('Website not found or access denied:', websiteId, 'user:', auth.userId);
      return notFound('Website not found or access denied');
    }

    // Get basic statistics
    const [totalSessions, totalEvents] = await Promise.all([
      prisma.session.count({
        where: {
          websiteId: websiteId,
        },
      }),
      prisma.websiteEvent.count({
        where: {
          websiteId: websiteId,
        },
      }),
    ]);

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentSessions, recentEvents] = await Promise.all([
      prisma.session.count({
        where: {
          websiteId: websiteId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
      prisma.websiteEvent.count({
        where: {
          websiteId: websiteId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
      }),
    ]);

    log('Retrieved stats for website:', websiteId, 'user:', auth.userId);

    return json({
      success: true,
      data: {
        website: {
          id: website.id,
          name: website.name,
          domain: website.domain,
          createdAt: website.createdAt,
        },
        stats: {
          total: {
            sessions: totalSessions,
            events: totalEvents,
          },
          last30Days: {
            sessions: recentSessions,
            events: recentEvents,
          },
        },
      },
    });
  } catch (error) {
    log('Failed to get website stats:', error);
    return badRequest('Failed to retrieve website statistics');
  }
}
