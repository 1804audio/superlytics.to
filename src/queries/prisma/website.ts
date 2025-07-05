import { Prisma, Website } from '@prisma/client';
import redis from '@/lib/redis';
import prisma from '@/lib/prisma';
import { PageResult, PageParams } from '@/lib/types';
import WebsiteFindManyArgs = Prisma.WebsiteFindManyArgs;
import { ROLES } from '@/lib/constants';

async function findWebsite(criteria: Prisma.WebsiteFindUniqueArgs): Promise<Website> {
  return prisma.client.website.findUnique(criteria);
}

export async function getWebsite(websiteId: string) {
  return findWebsite({
    where: {
      id: websiteId,
    },
  });
}

export async function getSharedWebsite(shareId: string) {
  return findWebsite({
    where: {
      shareId,
      deletedAt: null,
    },
  });
}

export async function getWebsites(
  criteria: WebsiteFindManyArgs,
  pageParams: PageParams,
): Promise<PageResult<Website[]>> {
  const { search } = pageParams;

  const where: Prisma.WebsiteWhereInput = {
    ...criteria.where,
    ...prisma.getSearchParameters(search, [
      {
        name: 'contains',
      },
      { domain: 'contains' },
    ]),
    deletedAt: null,
  };

  return prisma.pagedQuery('website', { ...criteria, where }, pageParams);
}

export async function getAllWebsites(userId: string) {
  return prisma.client.website.findMany({
    where: {
      OR: [
        { userId },
        {
          team: {
            deletedAt: null,
            teamUser: {
              some: {
                userId,
              },
            },
          },
        },
      ],
      deletedAt: null,
    },
  });
}

export async function getAllUserWebsitesIncludingTeamOwner(userId: string) {
  return prisma.client.website.findMany({
    where: {
      OR: [
        { userId },
        {
          team: {
            deletedAt: null,
            teamUser: {
              some: {
                role: ROLES.teamOwner,
                userId,
              },
            },
          },
        },
      ],
    },
  });
}

export async function getUserWebsites(
  userId: string,
  filters?: PageParams,
): Promise<PageResult<Website[]>> {
  return getWebsites(
    {
      where: {
        userId,
      },
      include: {
        user: {
          select: {
            username: true,
            id: true,
          },
        },
      },
    },
    {
      orderBy: 'name',
      ...filters,
    },
  );
}

export async function getTeamWebsites(
  teamId: string,
  filters?: PageParams,
): Promise<PageResult<Website[]>> {
  return getWebsites(
    {
      where: {
        teamId,
      },
      include: {
        createUser: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    },
    filters,
  );
}

export async function createWebsite(
  data: Prisma.WebsiteCreateInput | Prisma.WebsiteUncheckedCreateInput,
): Promise<Website> {
  return prisma.client.website.create({
    data,
  });
}

export async function updateWebsite(
  websiteId: string,
  data: Prisma.WebsiteUpdateInput | Prisma.WebsiteUncheckedUpdateInput,
): Promise<Website> {
  return prisma.client.website.update({
    where: {
      id: websiteId,
    },
    data,
  });
}

export async function resetWebsite(
  websiteId: string,
): Promise<[Prisma.BatchPayload, Prisma.BatchPayload, Website]> {
  const { client, transaction } = prisma;
  const cloudMode = !!process.env.cloudMode;

  return transaction([
    client.eventData.deleteMany({
      where: { websiteId },
    }),
    client.sessionData.deleteMany({
      where: { websiteId },
    }),
    client.websiteEvent.deleteMany({
      where: { websiteId },
    }),
    client.session.deleteMany({
      where: { websiteId },
    }),
    client.website.update({
      where: { id: websiteId },
      data: {
        resetAt: new Date(),
      },
    }),
  ]).then(async data => {
    if (cloudMode) {
      await redis.client.set(`website:${websiteId}`, data[3]);
    }

    return data;
  });
}

export async function deleteWebsite(
  websiteId: string,
): Promise<[Prisma.BatchPayload, Prisma.BatchPayload, Website]> {
  const { client, transaction } = prisma;
  const cloudMode = !!process.env.CLOUD_MODE;

  return transaction([
    client.eventData.deleteMany({
      where: { websiteId },
    }),
    client.sessionData.deleteMany({
      where: { websiteId },
    }),
    client.websiteEvent.deleteMany({
      where: { websiteId },
    }),
    client.session.deleteMany({
      where: { websiteId },
    }),
    client.report.deleteMany({
      where: {
        websiteId,
      },
    }),
    cloudMode
      ? client.website.update({
          data: {
            deletedAt: new Date(),
          },
          where: { id: websiteId },
        })
      : client.website.delete({
          where: { id: websiteId },
        }),
  ]).then(async data => {
    if (cloudMode) {
      await redis.client.del(`website:${websiteId}`);
    }

    return data;
  });
}

export interface CleanupOptions {
  urlPath: string;
  deleteType: 'exact' | 'prefix' | 'pattern';
  startDate?: Date;
  endDate?: Date;
}

export async function deleteWebsiteDataByUrl(websiteId: string, options: CleanupOptions) {
  const { client, transaction } = prisma;
  const { urlPath, deleteType, startDate, endDate } = options;

  // Build URL filter condition based on delete type
  let urlCondition: Prisma.StringFilter;

  switch (deleteType) {
    case 'exact':
      urlCondition = { equals: urlPath };
      break;
    case 'prefix':
      urlCondition = { startsWith: urlPath };
      break;
    case 'pattern':
      urlCondition = { contains: urlPath };
      break;
    default:
      urlCondition = { equals: urlPath };
  }

  // Build date filter if provided
  const dateFilter: Prisma.DateTimeFilter = {};
  if (startDate) {
    dateFilter.gte = startDate;
  }
  if (endDate) {
    dateFilter.lte = endDate;
  }

  const eventWhereCondition = {
    websiteId,
    urlPath: urlCondition,
    ...(startDate || endDate ? { createdAt: dateFilter } : {}),
  };

  // Get event IDs that match the criteria for cascade deletion
  const eventsToDelete = await client.websiteEvent.findMany({
    where: eventWhereCondition,
    select: { id: true, sessionId: true },
  });

  const eventIds = eventsToDelete.map(event => event.id);
  const sessionIds = [...new Set(eventsToDelete.map(event => event.sessionId))];

  if (eventIds.length === 0) {
    return {
      deletedEvents: 0,
      deletedEventData: 0,
      deletedSessions: 0,
      deletedSessionData: 0,
    };
  }

  const result = await transaction([
    // Delete event data for matching events
    client.eventData.deleteMany({
      where: {
        websiteEventId: { in: eventIds },
      },
    }),
    // Delete website events
    client.websiteEvent.deleteMany({
      where: eventWhereCondition,
    }),
  ]);

  // Clean up orphaned sessions (sessions with no remaining events)
  const orphanedSessions = await client.session.findMany({
    where: {
      id: { in: sessionIds },
      websiteId,
    },
    select: {
      id: true,
      _count: {
        select: {
          websiteEvent: true,
        },
      },
    },
  });

  const orphanedSessionIds = orphanedSessions
    .filter(session => session._count.websiteEvent === 0)
    .map(session => session.id);

  let sessionDeletions: Prisma.BatchPayload[] = [];
  if (orphanedSessionIds.length > 0) {
    sessionDeletions = await transaction([
      // Delete session data for orphaned sessions
      client.sessionData.deleteMany({
        where: {
          sessionId: { in: orphanedSessionIds },
        },
      }),
      // Delete orphaned sessions
      client.session.deleteMany({
        where: {
          id: { in: orphanedSessionIds },
        },
      }),
    ]);
  }

  return {
    deletedEvents: result[1].count,
    deletedEventData: result[0].count,
    deletedSessions: sessionDeletions[1]?.count || 0,
    deletedSessionData: sessionDeletions[0]?.count || 0,
  };
}
