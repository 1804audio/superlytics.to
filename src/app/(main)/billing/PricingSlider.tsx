'use client';
import { useState, useEffect, useRef } from 'react';
import { Button, Text, Icon, useToasts } from 'react-basics';
import Icons from '@/components/icons';
import { useApi } from '@/components/hooks';
import {
  getRecommendedPlan,
  getPlanMode,
  isUnlimited,
  getPlan,
} from '@/lib/config/simplified-plans';
import styles from './PricingSlider.module.css';

interface PricingSliderProps {
  currentEvents: number;
  currentPlanId: string;
  isLifetime: boolean;
  user: {
    id: string;
    planId?: string;
    subscriptionId?: string;
    isLifetime?: boolean;
    subscriptionStatus?: string;
  };
}

interface UserSubscription {
  planId: string;
  billingInterval: 'monthly' | 'yearly' | 'lifetime';
  status: string;
  isLifetime: boolean;
}

interface PlanPriceIds {
  [planId: string]: {
    monthly?: string;
    yearly?: string;
    lifetime?: string;
  };
}

export default function PricingSlider({
  currentEvents,
  currentPlanId,
  isLifetime,
  user,
}: PricingSliderProps) {
  const [selectedEvents, setSelectedEvents] = useState(Math.max(currentEvents, 10000));
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [planPriceIds, setPlanPriceIds] = useState<PlanPriceIds | null>(null);
  const [priceIdsLoading, setPriceIdsLoading] = useState(true);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const hasFetchedRef = useRef(false);
  const hasSubscriptionFetchedRef = useRef(false);
  const { post, get } = useApi();
  const { showToast } = useToasts();
  useEffect(() => {
    // Set slider based on user's current plan event limit, fallback to usage or minimum 10k
    if (userSubscription?.planId) {
      const currentPlan = getPlan(userSubscription.planId);
      if (currentPlan) {
        const planEventLimit = currentPlan.limits.eventsPerMonth;
        if (planEventLimit === -1) {
          // Unlimited plan - set to highest tier
          setSelectedEvents(10000000);
        } else {
          // Set to plan's event limit
          setSelectedEvents(Math.max(planEventLimit, 10000));
        }
        return;
      }
    }
    // Fallback to current usage or minimum 10k
    setSelectedEvents(Math.max(currentEvents, 10000));
  }, [currentEvents, userSubscription?.planId]);

  // Fetch user subscription details
  useEffect(() => {
    if (hasSubscriptionFetchedRef.current) return;

    const fetchUserSubscription = async () => {
      try {
        hasSubscriptionFetchedRef.current = true;
        setSubscriptionLoading(true);
        const data = await get('/me/subscription');
        if (data.success && data.subscription) {
          setUserSubscription(data.subscription);
          // Set the billing period toggle to match user's current subscription
          if (data.subscription.billingInterval === 'yearly') {
            setBillingPeriod('yearly');
          } else {
            setBillingPeriod('monthly');
          }
        }
      } catch {
        // Use default values if fetch fails
        setUserSubscription({
          planId: currentPlanId,
          billingInterval: 'monthly',
          status: 'active',
          isLifetime: isLifetime,
        });
      } finally {
        setSubscriptionLoading(false);
      }
    };

    if (user?.id) {
      fetchUserSubscription();
    }
  }, [user?.id, get, currentPlanId, isLifetime]);

  useEffect(() => {
    // Only fetch once to prevent infinite loops
    if (hasFetchedRef.current) return;

    const fetchPlanPriceIds = async () => {
      try {
        hasFetchedRef.current = true;
        setPriceIdsLoading(true);
        const data = await get('/plans');
        if (data.success && data.plans) {
          setPlanPriceIds(data.plans);
        } else {
          throw new Error('Failed to load pricing configuration');
        }
      } catch {
        showToast({
          message: 'Failed to load pricing information. Please refresh the page.',
          variant: 'error',
        });
      } finally {
        setPriceIdsLoading(false);
      }
    };

    fetchPlanPriceIds();
  }, [get, showToast]);

  const recommendedPlan = getRecommendedPlan(selectedEvents);

  // Use subscription data if available, fall back to props
  const userCurrentPlanId = userSubscription?.planId || currentPlanId;
  const userBillingInterval = userSubscription?.billingInterval || 'monthly';
  const userIsLifetime = userSubscription?.isLifetime || isLifetime;

  // Check if this is the user's current plan (not the recommended plan)
  const isUserCurrentPlan = recommendedPlan.id === userCurrentPlanId;

  // Plan hierarchy for upgrade/downgrade logic
  const getPlanHierarchy = (planId: string): number => {
    const hierarchyMap: Record<string, number> = {
      free: 0,
      starter: 1,
      growth: 2,
      enterprise: 3,
      // Lifetime plans are separate
      lifetime_starter: 101,
      lifetime_growth: 102,
      lifetime_max: 103,
    };
    return hierarchyMap[planId] || 0;
  };

  const isUpgrade = getPlanHierarchy(recommendedPlan.id) > getPlanHierarchy(userCurrentPlanId);
  const isDowngrade = getPlanHierarchy(recommendedPlan.id) < getPlanHierarchy(userCurrentPlanId);

  // Allow plan changes if:
  // 1. User is not on lifetime plan
  // 2. It's a different plan OR same plan with different billing period
  const canUpgrade =
    !userIsLifetime && (!isUserCurrentPlan || billingPeriod !== userBillingInterval);

  const handleUpgrade = async () => {
    // Prevent double clicks
    if (upgradeLoading || priceIdsLoading) return;

    if (recommendedPlan.type === 'custom') {
      // Contact sales for enterprise
      window.open('mailto:sales@superlytics.to?subject=Enterprise Plan Inquiry');
      return;
    }

    if (!planPriceIds) {
      showToast({
        message: 'Pricing information not loaded. Please refresh the page.',
        variant: 'error',
      });
      return;
    }

    try {
      setUpgradeLoading(true);
      const planPrices = planPriceIds[recommendedPlan.id];
      if (!planPrices) {
        throw new Error(`Price configuration not found for plan: ${recommendedPlan.id}`);
      }

      const priceId = billingPeriod === 'yearly' ? planPrices.yearly : planPrices.monthly;

      if (!priceId) {
        throw new Error(`Price ID not found for ${recommendedPlan.id} ${billingPeriod}`);
      }

      const data = await post('/stripe/create-checkout', {
        priceId,
        mode: getPlanMode(recommendedPlan),
        successUrl: window.location.origin + '/billing?success=true',
        cancelUrl: window.location.href,
      });

      if (data.success && data.url) {
        // Add a small delay for consistency
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = data.url;
      }
    } catch (error: any) {
      setUpgradeLoading(false);
      // Show user-friendly error message
      const errorMessage =
        error?.message || 'Failed to create checkout session. Please try again later.';
      showToast({ message: errorMessage, variant: 'error' });
    }
  };

  const formatEventCount = (events: number) => {
    if (events >= 1000000) {
      return `${(events / 1000000).toFixed(1)}M`;
    }
    if (events >= 1000) {
      return `${(events / 1000).toFixed(0)}K`;
    }
    return events.toString();
  };

  // Define discrete event tiers that match plan boundaries
  const eventTiers = [10000, 100000, 1000000, 10000000];
  const tierLabels = ['10K', '100K', '1M', '10M+'];

  const getSliderValue = (events: number) => {
    // Find the appropriate tier index
    for (let i = 0; i < eventTiers.length; i++) {
      if (events <= eventTiers[i]) {
        return i;
      }
    }
    return eventTiers.length - 1;
  };

  const getEventsFromSlider = (value: number) => {
    const index = Math.round(value);
    return eventTiers[index] || eventTiers[eventTiers.length - 1];
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sliderValue = parseInt(e.target.value);
    const events = Math.round(getEventsFromSlider(sliderValue));
    setSelectedEvents(events);
  };

  const getPrice = () => {
    if (recommendedPlan.type === 'custom') return 'Custom';

    const price =
      billingPeriod === 'yearly' ? recommendedPlan.prices.yearly : recommendedPlan.prices.monthly;

    return price === 0 ? 'Free' : `$${price}`;
  };

  const getPriceLabel = () => {
    if (recommendedPlan.type === 'custom') return 'pricing';
    if (recommendedPlan.prices.monthly === 0) return '';
    return billingPeriod === 'yearly' ? '/year' : '/month';
  };

  const getYearlySavings = () => {
    if (!recommendedPlan.prices.yearly || !recommendedPlan.prices.monthly) return null;
    const monthlyCost = recommendedPlan.prices.monthly * 12;
    const yearlyCost = recommendedPlan.prices.yearly;
    const savings = monthlyCost - yearlyCost;
    return savings > 0 ? savings : null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Text className={styles.title}>Choose your plan based on monthly events</Text>
      </div>

      <div className={styles.sliderSection}>
        <div className={styles.sliderContainer}>
          <div className={styles.sliderLabels}>
            {tierLabels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>

          <div className={styles.sliderWrapper}>
            <input
              type="range"
              min="0"
              max={eventTiers.length - 1}
              step="1"
              value={getSliderValue(selectedEvents)}
              onChange={handleSliderChange}
              className={styles.slider}
            />
          </div>

          <div className={styles.selectedValue}>
            Up to {formatEventCount(selectedEvents)} monthly events
          </div>
        </div>
      </div>

      <div className={styles.planCard}>
        <div className={styles.planHeader}>
          <div className={styles.planInfo}>
            <Text className={styles.planName}>{recommendedPlan.name}</Text>
            {isUserCurrentPlan && <span className={styles.currentBadge}>Current Plan</span>}
          </div>
        </div>

        {recommendedPlan.type !== 'custom' && recommendedPlan.prices.monthly !== 0 && (
          <div className={styles.billingToggle}>
            <button
              className={`${styles.toggleButton} ${billingPeriod === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
              {isUserCurrentPlan && userBillingInterval === 'monthly' && !subscriptionLoading && (
                <span> (Current)</span>
              )}
            </button>
            <button
              className={`${styles.toggleButton} ${billingPeriod === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
              {isUserCurrentPlan && userBillingInterval === 'yearly' && !subscriptionLoading && (
                <span> (Current)</span>
              )}
              {getYearlySavings() && (
                <span className={styles.savings}>Save ${getYearlySavings()}</span>
              )}
            </button>
          </div>
        )}

        <div className={styles.pricing}>
          <Text className={styles.price}>{getPrice()}</Text>
          <Text className={styles.priceLabel}>{getPriceLabel()}</Text>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <Icon>
              <Icons.BarChart />
            </Icon>
            <Text>
              {isUnlimited(recommendedPlan.limits.eventsPerMonth)
                ? 'Unlimited events/month'
                : `${recommendedPlan.limits.eventsPerMonth.toLocaleString()} events/month`}
            </Text>
          </div>
          <div className={styles.feature}>
            <Icon>
              <Icons.Globe />
            </Icon>
            <Text>
              {isUnlimited(recommendedPlan.limits.websites)
                ? 'Unlimited websites'
                : `${recommendedPlan.limits.websites} websites`}
            </Text>
          </div>
          <div className={styles.feature}>
            <Icon>
              <Icons.Users />
            </Icon>
            <Text>
              {isUnlimited(recommendedPlan.limits.teamMembers)
                ? 'Unlimited team members'
                : `${recommendedPlan.limits.teamMembers} team members`}
            </Text>
          </div>
          <div className={styles.feature}>
            <Icon>
              <Icons.Clock />
            </Icon>
            <Text>
              {isUnlimited(recommendedPlan.limits.dataRetentionMonths)
                ? 'Forever retention'
                : `${recommendedPlan.limits.dataRetentionMonths} months retention`}
            </Text>
          </div>

          {recommendedPlan.features.dataImport && (
            <div className={styles.feature}>
              <Icon>
                <Icons.Check />
              </Icon>
              <Text>Data Import</Text>
            </div>
          )}

          {recommendedPlan.features.emailReports && (
            <div className={styles.feature}>
              <Icon>
                <Icons.Check />
              </Icon>
              <Text>Email Reports</Text>
            </div>
          )}

          <div className={styles.feature}>
            <Icon>
              <Icons.Check />
            </Icon>
            <Text>
              {recommendedPlan.features.apiAccess === 'full'
                ? 'Full API Access'
                : 'Limited API Access'}
            </Text>
          </div>

          {recommendedPlan.features.whiteLabel && (
            <div className={styles.feature}>
              <Icon>
                <Icons.Check />
              </Icon>
              <Text>White Label</Text>
            </div>
          )}

          {recommendedPlan.features.customDomain && (
            <div className={styles.feature}>
              <Icon>
                <Icons.Check />
              </Icon>
              <Text>Custom Domain</Text>
            </div>
          )}

          <div className={styles.feature}>
            <Icon>
              <Icons.Check />
            </Icon>
            <Text>{recommendedPlan.features.supportLevel} support</Text>
          </div>
        </div>

        <div className={styles.actions}>
          {isUserCurrentPlan && billingPeriod === userBillingInterval ? (
            <Button disabled>Current Plan</Button>
          ) : canUpgrade ? (
            <Button
              onClick={handleUpgrade}
              variant="primary"
              disabled={upgradeLoading || priceIdsLoading || subscriptionLoading}
            >
              {priceIdsLoading || subscriptionLoading
                ? 'Loading...'
                : upgradeLoading
                  ? 'Creating Checkout...'
                  : recommendedPlan.type === 'custom'
                    ? 'Contact Sales'
                    : isUserCurrentPlan && billingPeriod !== userBillingInterval
                      ? `Switch to ${billingPeriod === 'yearly' ? 'Yearly' : 'Monthly'}`
                      : isUpgrade
                        ? 'Upgrade Plan'
                        : isDowngrade
                          ? 'Downgrade Plan'
                          : 'Change Plan'}
            </Button>
          ) : (
            <Button disabled>{userIsLifetime ? 'Lifetime Active' : 'Plan Not Available'}</Button>
          )}

          {recommendedPlan.prices.monthly === 0 && !isUserCurrentPlan && (
            <Text className={styles.freeNote}>$0.00 due today. No credit card required.</Text>
          )}
        </div>
      </div>
    </div>
  );
}
