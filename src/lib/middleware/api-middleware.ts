import { NextResponse } from 'next/server';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';
import { SimplifiedPlanFeatures } from '@/lib/config/simplified-plans';
import { Auth } from '@/lib/types';

/**
 * Middleware to check if user has required feature access
 */
export async function requireFeature(auth: Auth, feature: keyof SimplifiedPlanFeatures) {
  const hasFeature = await simpleUsageManager.hasFeature(auth.user.id, feature);

  if (!hasFeature) {
    return NextResponse.json(
      {
        error: `${feature} is not available in your current plan. Please upgrade to access this feature.`,
        feature,
        upgradeRequired: true,
      },
      { status: 403 },
    );
  }

  return null; // Continue with request
}

/**
 * Middleware to check API access level for specific endpoints
 */
export async function requireApiAccess(auth: Auth, requiredLevel: 'limited' | 'full' = 'limited') {
  const userApiAccess = await simpleUsageManager.getFeatureValue(auth.user.id, 'apiAccess');

  if (requiredLevel === 'full' && userApiAccess !== 'full') {
    return NextResponse.json(
      {
        error:
          'Full API access is required for this endpoint. Please upgrade to Growth plan or higher.',
        feature: 'apiAccess',
        required: 'full',
        current: userApiAccess,
        upgradeRequired: true,
      },
      { status: 403 },
    );
  }

  return null; // Continue with request
}

/**
 * Middleware to check if user has access to their account
 */
export async function requireActiveAccount(auth: Auth) {
  // Get fresh user data to check access status
  const user = await simpleUsageManager['getUser'](auth.user.id);

  if (!user || !user.hasAccess) {
    return NextResponse.json(
      {
        error: 'Account access suspended. Please check your subscription status.',
        code: 'ACCOUNT_SUSPENDED',
        upgradeRequired: true,
      },
      { status: 403 },
    );
  }

  return null; // Continue with request
}

/**
 * Combined middleware helper for common patterns
 */
export interface MiddlewareOptions {
  requireFeatures?: (keyof SimplifiedPlanFeatures)[];
  requireApiLevel?: 'limited' | 'full';
  requireActiveAccount?: boolean;
}

export async function applyMiddleware(auth: Auth, options: MiddlewareOptions) {
  // Check account access first
  if (options.requireActiveAccount) {
    const accountCheck = await requireActiveAccount(auth);
    if (accountCheck) return accountCheck;
  }

  // Check required features
  if (options.requireFeatures) {
    for (const feature of options.requireFeatures) {
      const featureCheck = await requireFeature(auth, feature);
      if (featureCheck) return featureCheck;
    }
  }

  // Check API access level
  if (options.requireApiLevel) {
    const apiCheck = await requireApiAccess(auth, options.requireApiLevel);
    if (apiCheck) return apiCheck;
  }

  return null; // All checks passed
}
