import { PrismaClient } from '@prisma/client';
import { getPlan, isUnlimited, SimplifiedPlanFeatures } from '@/lib/config/simplified-plans';
import redis from '@/lib/redis';
import { format } from 'date-fns';

export interface UsageSummary {
  planId: string;
  planName: string;
  planType: 'subscription' | 'lifetime' | 'custom';
  isLifetime: boolean;
  currentPeriod: {
    start: Date;
    end: Date;
  };
  events: {
    current: number;
    limit: number;
    unlimited: boolean;
    percentage: number;
    nearLimit: boolean;
    overLimit: boolean;
  };
  websites: {
    current: number;
    limit: number;
    unlimited: boolean;
    percentage: number;
  };
  teamMembers: {
    current: number;
    limit: number;
    unlimited: boolean;
  };
  features: SimplifiedPlanFeatures;
}

export interface UserPlanData {
  id: string;
  planId: string;
  isLifetime: boolean;
  hasAccess: boolean;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}

const prisma = new PrismaClient();

export class SimpleUsageManager {
  // Track an event (super simple)
  async trackEvent(userId: string): Promise<boolean> {
    const canTrack = await this.checkEventLimit(userId);

    if (canTrack) {
      await this.incrementEvents(userId);
      return true;
    }

    return false;
  }

  // Check if user can track more events
  async checkEventLimit(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const plan = getPlan(user.planId);
    if (!plan) return false;

    const eventLimit = plan.limits.eventsPerMonth;
    if (isUnlimited(eventLimit)) return true;

    const currentUsage = await this.getCurrentEventCount(userId);
    return currentUsage < eventLimit;
  }

  // Get current month's event count
  async getCurrentEventCount(userId: string): Promise<number> {
    const month = format(new Date(), 'yyyy-MM');

    // Check Redis cache first (if enabled)
    if (redis.enabled) {
      const cacheKey = `events:${userId}:${month}`;
      const cached = await redis.client.get(cacheKey);
      if (cached) return parseInt(cached);
    }

    // Get from database
    const usage = await prisma.usageRecord.findUnique({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
    });

    const count = usage?.eventsThisMonth || 0;

    // Cache for 5 minutes (if Redis enabled)
    if (redis.enabled) {
      const cacheKey = `events:${userId}:${month}`;
      await redis.client.setex(cacheKey, 300, count.toString());
    }

    return count;
  }

  // Increment event count
  async incrementEvents(userId: string, increment: number = 1): Promise<void> {
    const month = format(new Date(), 'yyyy-MM');
    const year = new Date().getFullYear();

    await prisma.usageRecord.upsert({
      where: {
        userId_month: {
          userId,
          month,
        },
      },
      update: {
        eventsThisMonth: { increment },
        updatedAt: new Date(),
      },
      create: {
        id: crypto.randomUUID(),
        user: { connect: { id: userId } },
        month,
        year,
        eventsThisMonth: increment,
      },
    });

    // Invalidate cache (if Redis enabled)
    if (redis.enabled) {
      const cacheKey = `events:${userId}:${month}`;
      await redis.client.del(cacheKey);
    }
  }

  // Check website limit
  async checkWebsiteLimit(userId: string): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const plan = getPlan(user.planId);
    if (!plan) return false;

    const websiteLimit = plan.limits.websites;
    if (isUnlimited(websiteLimit)) return true;

    const websiteCount = await prisma.website.count({
      where: { userId },
    });

    return websiteCount < websiteLimit;
  }

  // Check team member limit
  async checkTeamMemberLimit(teamId: string): Promise<boolean> {
    // Get team owner to check their plan
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        teamUser: {
          where: { role: 'team-owner' },
          include: { user: true },
          take: 1,
        },
      },
    });

    if (!team || team.teamUser.length === 0) return false;

    const owner = team.teamUser[0].user;
    const plan = getPlan(owner.planId);
    if (!plan) return false;

    const memberLimit = plan.limits.teamMembers;
    if (isUnlimited(memberLimit)) return true;

    const memberCount = await prisma.teamUser.count({
      where: { teamId },
    });

    return memberCount < memberLimit;
  }

  // Get simple usage summary
  async getUsageSummary(userId: string): Promise<UsageSummary> {
    const user = await this.getUser(userId);
    if (!user) throw new Error('User not found');

    const plan = getPlan(user.planId);
    if (!plan) throw new Error('Plan not found');

    const currentEvents = await this.getCurrentEventCount(userId);
    const websiteCount = await prisma.website.count({
      where: { userId },
    });

    // Get team member count (if user is a team owner)
    const teamMemberCount = await prisma.teamUser.count({
      where: {
        team: {
          teamUser: {
            some: {
              userId,
              role: 'team-owner',
            },
          },
        },
      },
    });

    return {
      planId: user.planId,
      planName: plan.name,
      planType: plan.type,
      isLifetime: user.isLifetime,
      currentPeriod: {
        start: user.currentPeriodStart || new Date(),
        end: user.currentPeriodEnd || new Date(),
      },
      events: {
        current: currentEvents,
        limit: plan.limits.eventsPerMonth,
        unlimited: isUnlimited(plan.limits.eventsPerMonth),
        percentage: isUnlimited(plan.limits.eventsPerMonth)
          ? 0
          : (currentEvents / plan.limits.eventsPerMonth) * 100,
        nearLimit: isUnlimited(plan.limits.eventsPerMonth)
          ? false
          : currentEvents / plan.limits.eventsPerMonth > 0.8,
        overLimit: isUnlimited(plan.limits.eventsPerMonth)
          ? false
          : currentEvents >= plan.limits.eventsPerMonth,
      },
      websites: {
        current: websiteCount,
        limit: plan.limits.websites,
        unlimited: isUnlimited(plan.limits.websites),
        percentage: isUnlimited(plan.limits.websites)
          ? 0
          : (websiteCount / plan.limits.websites) * 100,
      },
      teamMembers: {
        current: teamMemberCount,
        limit: plan.limits.teamMembers,
        unlimited: isUnlimited(plan.limits.teamMembers),
      },
      features: plan.features,
    };
  }

  // Check if user has access to a feature
  async hasFeature(userId: string, feature: keyof SimplifiedPlanFeatures): Promise<boolean> {
    const user = await this.getUser(userId);
    if (!user) return false;

    const plan = getPlan(user.planId);
    if (!plan) return false;

    return plan.features[feature] === true;
  }

  // Get feature value (for features like apiAccess that have different levels)
  async getFeatureValue(userId: string, feature: keyof SimplifiedPlanFeatures): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return null;

    const plan = getPlan(user.planId);
    if (!plan) return null;

    return plan.features[feature];
  }

  private async getUser(userId: string): Promise<UserPlanData | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        planId: true,
        isLifetime: true,
        hasAccess: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
      },
    });
  }
}

export const simpleUsageManager = new SimpleUsageManager();
