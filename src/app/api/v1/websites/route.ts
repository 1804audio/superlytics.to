import { NextRequest } from 'next/server';
import { z } from 'zod';
import { json, unauthorized, forbidden, badRequest } from '@/lib/response';
import { authenticateApiKey, hasPermission } from '@/lib/middleware/api-key-auth';
import { prisma } from '@/lib/prisma';
import { v4 as uuid } from 'uuid';
import debug from 'debug';

const log = debug('superlytics:api-v1-websites');

/**
 * GET /api/v1/websites
 * Get user's websites via API key authentication
 */
export async function GET(request: NextRequest) {
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

    // Get user's websites
    const websites = await prisma.website.findMany({
      where: {
        userId: auth.userId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        shareId: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    log('Retrieved websites for user:', auth.userId, 'count:', websites.length);

    return json({
      success: true,
      data: websites,
      total: websites.length,
    });
  } catch (error) {
    log('Failed to get websites:', error);
    return badRequest('Failed to retrieve websites');
  }
}

/**
 * POST /api/v1/websites
 * Create a new website via API key authentication
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate API key
    const auth = await authenticateApiKey(request);

    if (!auth.success) {
      log('API key authentication failed:', auth.error);
      return unauthorized(auth.error || 'Authentication required');
    }

    // Check write permission
    if (!hasPermission(auth.permissions!, 'write')) {
      log('User lacks write permission:', auth.userId);
      return forbidden('Write permission required');
    }

    // Parse request body
    const schema = z.object({
      name: z.string().min(1).max(100),
      domain: z.string().min(1).max(500),
    });

    const body = await request.json().catch(() => null);

    if (!body) {
      return badRequest('Invalid JSON body');
    }

    const validation = schema.safeParse(body);

    if (!validation.success) {
      return badRequest('Invalid input: ' + validation.error.issues.map(e => e.message).join(', '));
    }

    const { name, domain } = validation.data;

    // Check if domain already exists for this user
    const existingWebsite = await prisma.website.findFirst({
      where: {
        userId: auth.userId,
        domain,
        deletedAt: null,
      },
    });

    if (existingWebsite) {
      return badRequest('A website with this domain already exists');
    }

    // Create website
    const website = await prisma.website.create({
      data: {
        id: uuid(),
        name,
        domain,
        userId: auth.userId,
        createdBy: auth.userId,
      },
      select: {
        id: true,
        name: true,
        domain: true,
        shareId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log('Created website for user:', auth.userId, 'name:', name, 'domain:', domain);

    return json({
      success: true,
      data: website,
      message: 'Website created successfully',
    });
  } catch (error) {
    log('Failed to create website:', error);
    return badRequest('Failed to create website');
  }
}
