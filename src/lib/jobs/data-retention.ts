import { PrismaClient } from '@prisma/client';
import { getPlan, isUnlimited } from '@/lib/config/simplified-plans';
import { subMonths, format } from 'date-fns';
import debug from 'debug';

const log = debug('superlytics:data-retention');
const prisma = new PrismaClient();

export interface DataRetentionJob {
  userId: string;
  planId: string;
  retentionMonths: number;
  cutoffDate: Date;
  websites: string[];
}

export interface DataRetentionResult {
  userId: string;
  eventsDeleted: number;
  sessionsDeleted: number;
  reportsDeleted: number;
  error?: string;
}

/**
 * Get all users who need data retention enforcement
 */
export async function getUsersForDataRetention(): Promise<DataRetentionJob[]> {
  const users = await prisma.user.findMany({
    where: {
      deletedAt: null,
      planId: { not: null },
    },
    select: {
      id: true,
      planId: true,
      websiteUser: {
        select: {
          id: true,
        },
        where: {
          deletedAt: null,
        },
      },
    },
  });

  const jobs: DataRetentionJob[] = [];

  for (const user of users) {
    const plan = getPlan(user.planId);
    if (!plan) continue;

    const retentionMonths = plan.limits.dataRetentionMonths;
    // Skip users with unlimited retention
    if (isUnlimited(retentionMonths)) continue;

    // Calculate cutoff date
    const cutoffDate = subMonths(new Date(), retentionMonths);
    jobs.push({
      userId: user.id,
      planId: user.planId,
      retentionMonths,
      cutoffDate,
      websites: user.websiteUser.map(w => w.id),
    });
  }

  return jobs;
}

/**
 * Delete old events for a specific website
 */
async function deleteOldEvents(websiteId: string, cutoffDate: Date): Promise<number> {
  try {
    const result = await prisma.websiteEvent.deleteMany({
      where: {
        websiteId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    log('Error deleting events for website %s: %s', websiteId, error);
    return 0;
  }
}

/**
 * Delete old sessions for a specific website
 */
async function deleteOldSessions(websiteId: string, cutoffDate: Date): Promise<number> {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        websiteId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    log('Error deleting sessions for website %s: %s', websiteId, error);
    return 0;
  }
}

/**
 * Delete old reports for a specific user
 */
async function deleteOldReports(userId: string, cutoffDate: Date): Promise<number> {
  try {
    const result = await prisma.report.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    return result.count;
  } catch (error) {
    log('Error deleting reports for user %s: %s', userId, error);
    return 0;
  }
}

/**
 * Execute data retention for a single user
 */
export async function executeDataRetention(job: DataRetentionJob): Promise<DataRetentionResult> {
  const { userId, cutoffDate, websites } = job;

  log(
    'Executing data retention for user %s, cutoff date: %s',
    userId,
    format(cutoffDate, 'yyyy-MM-dd'),
  );

  let totalEventsDeleted = 0;
  let totalSessionsDeleted = 0;
  let reportsDeleted = 0;

  try {
    // Delete old events and sessions for each website
    for (const websiteId of websites) {
      const eventsDeleted = await deleteOldEvents(websiteId, cutoffDate);
      const sessionsDeleted = await deleteOldSessions(websiteId, cutoffDate);
      totalEventsDeleted += eventsDeleted;
      totalSessionsDeleted += sessionsDeleted;

      log(
        'Deleted %d events, %d sessions for website %s',
        eventsDeleted,
        sessionsDeleted,
        websiteId,
      );
    }

    // Delete old reports
    reportsDeleted = await deleteOldReports(userId, cutoffDate);
    log('Deleted %d reports for user %s', reportsDeleted, userId);

    return {
      userId,
      eventsDeleted: totalEventsDeleted,
      sessionsDeleted: totalSessionsDeleted,
      reportsDeleted,
    };
  } catch (error) {
    log('Error executing data retention for user %s: %s', userId, error);
    return {
      userId,
      eventsDeleted: totalEventsDeleted,
      sessionsDeleted: totalSessionsDeleted,
      reportsDeleted,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute data retention for all users who need it
 */
export async function executeDataRetentionForAllUsers(): Promise<DataRetentionResult[]> {
  const jobs = await getUsersForDataRetention();

  log('Found %d users requiring data retention', jobs.length);

  const results: DataRetentionResult[] = [];
  for (const job of jobs) {
    const result = await executeDataRetention(job);
    results.push(result);

    // Add small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Log summary
  const totalEventsDeleted = results.reduce((sum, r) => sum + r.eventsDeleted, 0);
  const totalSessionsDeleted = results.reduce((sum, r) => sum + r.sessionsDeleted, 0);
  const totalReportsDeleted = results.reduce((sum, r) => sum + r.reportsDeleted, 0);
  const errors = results.filter(r => r.error).length;
  log(
    'Data retention completed: %d events, %d sessions, %d reports deleted across %d users (%d errors)',
    totalEventsDeleted,
    totalSessionsDeleted,
    totalReportsDeleted,
    results.length,
    errors,
  );

  return results;
}

/**
 * Manual data retention check for a specific user (useful for testing)
 */
export async function checkUserDataRetention(userId: string): Promise<{
  shouldRetain: boolean;
  retentionMonths: number;
  cutoffDate?: Date;
  oldestData?: Date;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planId: true },
  });

  if (!user?.planId) {
    return { shouldRetain: false, retentionMonths: 0 };
  }

  const plan = getPlan(user.planId);
  if (!plan) {
    return { shouldRetain: false, retentionMonths: 0 };
  }

  const retentionMonths = plan.limits.dataRetentionMonths;
  if (isUnlimited(retentionMonths)) {
    return { shouldRetain: false, retentionMonths: -1 };
  }

  const cutoffDate = subMonths(new Date(), retentionMonths);
  // Find oldest data from user's websites
  const userWebsites = await prisma.website.findMany({
    where: { userId },
    select: { id: true },
  });

  const websiteIds = userWebsites.map(w => w.id);

  const oldestEvent = await prisma.websiteEvent.findFirst({
    where: {
      websiteId: { in: websiteIds },
    },
    orderBy: { createdAt: 'asc' },
    select: { createdAt: true },
  });

  return {
    shouldRetain: true,
    retentionMonths,
    cutoffDate,
    oldestData: oldestEvent?.createdAt,
  };
}
