import { z } from 'zod';
import { parseRequest } from '@/lib/request';
import { json, serverError } from '@/lib/response';
import { prisma } from '@/lib/prisma';
import { runQuery, CLICKHOUSE, PRISMA } from '@/lib/db';
import clickhouse from '@/lib/clickhouse';
import prismaHelpers from '@/lib/prisma';
import debug from 'debug';

const log = debug('superlytics:data-status');

export async function GET(request: Request) {
  const { auth, error } = await parseRequest(request, z.object({}));

  if (error) {
    return error();
  }

  const userId = auth.user.id;

  try {
    // Check if user has any websites
    const websitesCount = await prisma.website.count({
      where: { userId },
    });

    if (websitesCount === 0) {
      return json({
        hasExportableData: false,
        reason: 'no_websites',
        message: 'Create a website first to start collecting data',
      });
    }

    // Get user's websites
    const websites = await prisma.website.findMany({
      where: { userId },
      select: { id: true },
    });

    // Check if any website has events/sessions
    let hasEvents = false;
    let hasSessions = false;

    for (const website of websites) {
      // Check for events
      const eventCount = await runQuery({
        [PRISMA]: () => getEventCountFromPrisma(website.id),
        [CLICKHOUSE]: () => getEventCountFromClickhouse(website.id),
      });

      if (eventCount > 0) {
        hasEvents = true;
        break;
      }
    }

    for (const website of websites) {
      // Check for sessions
      const sessionCount = await runQuery({
        [PRISMA]: () => getSessionCountFromPrisma(website.id),
        [CLICKHOUSE]: () => getSessionCountFromClickhouse(website.id),
      });

      if (sessionCount > 0) {
        hasSessions = true;
        break;
      }
    }

    const hasExportableData = hasEvents || hasSessions;

    return json({
      hasExportableData,
      websitesCount,
      hasEvents,
      hasSessions,
      reason: hasExportableData ? null : 'no_data',
      message: hasExportableData
        ? null
        : 'Add the tracking script to your website to start collecting data',
    });
  } catch (err) {
    log('Failed to check data status:', err);
    return serverError('Failed to check data status');
  }
}

async function getEventCountFromPrisma(websiteId: string): Promise<number> {
  const { rawQuery, parseFilters } = prismaHelpers;
  const { params } = await parseFilters(websiteId, {});

  const result = await rawQuery(
    `
    select count(*) as count
    from website_event
    where website_id = {{websiteId::uuid}}
    limit 1
    `,
    params,
  );

  return parseInt(result[0]?.count || '0');
}

async function getEventCountFromClickhouse(websiteId: string): Promise<number> {
  const { rawQuery, parseFilters } = clickhouse;
  const { params } = await parseFilters(websiteId, {});

  const result = await rawQuery(
    `
    select count(*) as count
    from website_event
    where website_id = {websiteId:UUID}
    limit 1
    `,
    params,
  );

  return parseInt(result[0]?.count || '0');
}

async function getSessionCountFromPrisma(websiteId: string): Promise<number> {
  const { rawQuery, parseFilters } = prismaHelpers;
  const { params } = await parseFilters(websiteId, {});

  const result = await rawQuery(
    `
    select count(*) as count  
    from session
    where website_id = {{websiteId::uuid}}
    limit 1
    `,
    params,
  );

  return parseInt(result[0]?.count || '0');
}

async function getSessionCountFromClickhouse(websiteId: string): Promise<number> {
  const { rawQuery, parseFilters } = clickhouse;
  const { params } = await parseFilters(websiteId, {});

  const result = await rawQuery(
    `
    select count(*) as count
    from session  
    where website_id = {websiteId:UUID}
    limit 1
    `,
    params,
  );

  return parseInt(result[0]?.count || '0');
}
