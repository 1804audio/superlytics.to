'use client';
import { useState, useEffect } from 'react';
import { Button, Text, Icon } from 'react-basics';
import Icons from '@/components/icons';
import { getRecommendedPlan, getPlanMode, isUnlimited } from '@/lib/config/simplified-plans';
import styles from './PricingSlider.module.css';

interface PricingSliderProps {
  currentEvents: number;
  currentPlanId: string;
  isLifetime: boolean;
}

export default function PricingSlider({
  currentEvents,
  currentPlanId,
  isLifetime,
}: PricingSliderProps) {
  const [selectedEvents, setSelectedEvents] = useState(Math.max(currentEvents, 10000));
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  useEffect(() => {
    // Set slider to current usage or minimum 10k
    setSelectedEvents(Math.max(currentEvents, 10000));
  }, [currentEvents]);

  const recommendedPlan = getRecommendedPlan(selectedEvents);
  const isCurrentPlan = recommendedPlan.id === currentPlanId;
  const canUpgrade = !isLifetime && !isCurrentPlan;

  const handleUpgrade = async () => {
    if (recommendedPlan.type === 'custom') {
      // Contact sales for enterprise
      window.open('mailto:sales@superlytics.to?subject=Enterprise Plan Inquiry');
      return;
    }

    try {
      const priceId =
        billingPeriod === 'yearly'
          ? recommendedPlan.stripeIds.yearly
          : recommendedPlan.stripeIds.monthly;

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          mode: getPlanMode(recommendedPlan),
          successUrl: window.location.origin + '/billing?success=true',
          cancelUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Failed to create checkout session
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
            {isCurrentPlan && <span className={styles.currentBadge}>Current Plan</span>}
          </div>
        </div>

        {recommendedPlan.type !== 'custom' && recommendedPlan.prices.monthly !== 0 && (
          <div className={styles.billingToggle}>
            <button
              className={`${styles.toggleButton} ${billingPeriod === 'monthly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              Monthly
            </button>
            <button
              className={`${styles.toggleButton} ${billingPeriod === 'yearly' ? styles.active : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              Yearly
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
          {isCurrentPlan ? (
            <Button disabled>Current Plan</Button>
          ) : canUpgrade ? (
            <Button onClick={handleUpgrade} variant="primary">
              {recommendedPlan.type === 'custom' ? 'Contact Sales' : 'Upgrade Plan'}
            </Button>
          ) : (
            <Button disabled>{isLifetime ? 'Lifetime Active' : 'Plan Not Available'}</Button>
          )}

          {recommendedPlan.prices.monthly === 0 && !isCurrentPlan && (
            <Text className={styles.freeNote}>$0.00 due today. No credit card required.</Text>
          )}
        </div>
      </div>
    </div>
  );
}
