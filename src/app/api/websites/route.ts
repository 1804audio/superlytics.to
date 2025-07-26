import { z } from 'zod';
import { canCreateTeamWebsite, canCreateWebsite } from '@/lib/auth';
import { json, unauthorized } from '@/lib/response';
import { uuid } from '@/lib/crypto';
import { parseRequest } from '@/lib/request';
import { createWebsite, getUserWebsites } from '@/queries';
import { pagingParams } from '@/lib/schema';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';

export async function GET(request: Request) {
  const schema = z.object({ ...pagingParams });

  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const websites = await getUserWebsites(auth.user.id, query);

  return json(websites);
}

export async function POST(request: Request) {
  const schema = z.object({
    name: z.string().max(100),
    domain: z.string().max(500),
    shareId: z.string().max(50).nullable().optional(),
    teamId: z.string().nullable().optional(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { name, domain, shareId, teamId } = body;

  // Check permissions first
  if ((teamId && !(await canCreateTeamWebsite(auth, teamId))) || !(await canCreateWebsite(auth))) {
    return unauthorized();
  }

  if (teamId) {
    // For team websites, check the team owner's website limits
    const teamOwnerUserId = await simpleUsageManager.getTeamOwnerId(teamId);
    if (!teamOwnerUserId) {
      return Response.json(
        {
          error: 'Team not found or has no owner.',
          code: 'TEAM_NOT_FOUND',
        },
        { status: 404 },
      );
    }

    const canCreateWebsite = await simpleUsageManager.checkWebsiteLimit(teamOwnerUserId);
    if (!canCreateWebsite) {
      const usage = await simpleUsageManager.getUsageSummary(teamOwnerUserId);
      return Response.json(
        {
          error:
            'Website limit exceeded for team owner. Please upgrade your plan to add more websites.',
          code: 'WEBSITE_LIMIT_EXCEEDED',
          currentUsage: usage.websites.current,
          limit: usage.websites.limit,
          planName: usage.planName,
          upgradeRequired: true,
        },
        { status: 429 },
      );
    }
  } else {
    // For individual websites, check user's website limit
    const canCreateWebsite = await simpleUsageManager.checkWebsiteLimit(auth.user.id);
    if (!canCreateWebsite) {
      const usage = await simpleUsageManager.getUsageSummary(auth.user.id);
      return Response.json(
        {
          error: 'Website limit exceeded. Please upgrade your plan to add more websites.',
          code: 'WEBSITE_LIMIT_EXCEEDED',
          currentUsage: usage.websites.current,
          limit: usage.websites.limit,
          planName: usage.planName,
          upgradeRequired: true,
        },
        { status: 429 },
      );
    }
  }

  const data: any = {
    id: uuid(),
    createdBy: auth.user.id,
    name,
    domain,
    shareId,
    teamId,
  };

  if (!teamId) {
    data.userId = auth.user.id;
  }

  const website = await createWebsite(data);

  return json(website);
}
