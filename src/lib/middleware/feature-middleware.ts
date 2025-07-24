import { NextRequest, NextResponse } from 'next/server';
import { checkAuth } from '@/lib/auth';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { SimplifiedPlanFeatures } from '@/lib/config/simplified-plans';

// Feature-based middleware (simple version)
export async function withFeature(featureName: keyof SimplifiedPlanFeatures) {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);

    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const hasFeature = await simpleUsageManager.hasFeature(auth.user.id, featureName);

    if (!hasFeature) {
      return NextResponse.json(
        {
          error: `${featureName} is not available in your current plan`,
          feature: featureName,
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    return null; // Continue with request
  };
}

// Event tracking middleware (simplified)
export async function withEventTracking() {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);

    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canTrack = await simpleUsageManager.checkEventLimit(auth.user.id);

    if (!canTrack) {
      const usageSummary = await simpleUsageManager.getUsageSummary(auth.user.id);

      return NextResponse.json(
        {
          error: 'Event limit exceeded',
          currentUsage: usageSummary.events.current,
          limit: usageSummary.events.limit,
          planName: usageSummary.planName,
          upgradeRequired: true,
        },
        { status: 429 },
      );
    }

    return null; // Continue with request
  };
}

// Website limit middleware
export async function withWebsiteLimit() {
  return async (request: NextRequest) => {
    const auth = await checkAuth(request);

    if (!auth?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const canCreate = await simpleUsageManager.checkWebsiteLimit(auth.user.id);

    if (!canCreate) {
      const usageSummary = await simpleUsageManager.getUsageSummary(auth.user.id);

      return NextResponse.json(
        {
          error: 'Website limit exceeded',
          currentUsage: usageSummary.websites.current,
          limit: usageSummary.websites.limit,
          planName: usageSummary.planName,
          upgradeRequired: true,
        },
        { status: 429 },
      );
    }

    return null; // Continue with request
  };
}

// Combined middleware for common patterns
export function createFeatureMiddleware(features: (keyof SimplifiedPlanFeatures)[]) {
  return async (request: NextRequest) => {
    for (const feature of features) {
      const featureMiddleware = await withFeature(feature);
      const featureCheck = await featureMiddleware(request);
      if (featureCheck) return featureCheck;
    }
    return null;
  };
}
