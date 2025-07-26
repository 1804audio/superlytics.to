'use client';
import { Button, Text, Icon } from 'react-basics';
import Icons from '@/components/icons';
import { PlanConfiguration, isUnlimited } from '@/lib/config/simplified-plans';
import styles from './PlanCard.module.css';

interface PlanCardProps {
  plan: PlanConfiguration;
  currentPlanId: string;
  isLifetime: boolean;
}

export default function PlanCard({ plan, currentPlanId, isLifetime }: PlanCardProps) {
  const isCurrentPlan = plan.id === currentPlanId;
  const canUpgrade = !isLifetime && !isCurrentPlan;

  const formatLimit = (value: number) => {
    return isUnlimited(value) ? 'Unlimited' : value.toLocaleString();
  };

  const handleUpgrade = async () => {
    if (plan.type === 'custom') {
      // Contact sales for enterprise
      window.open('mailto:sales@superlytics.to?subject=Enterprise Plan Inquiry');
      return;
    }

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripeIds.monthly,
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

  const getPlanBadgeClass = () => {
    if (plan.type === 'lifetime') return styles.badgeLifetime;
    if (plan.id === 'enterprise') return styles.badgeEnterprise;
    if (plan.id === 'pro') return styles.badgePro;
    if (plan.id === 'hobby') return styles.badgeHobby;
    return styles.badgeFree;
  };

  return (
    <div className={`${styles.card} ${isCurrentPlan ? styles.current : ''}`}>
      <div className={styles.header}>
        <div className={styles.planInfo}>
          <Text className={styles.planName}>{plan.name}</Text>
          <span className={getPlanBadgeClass()}>
            {plan.type === 'lifetime' ? 'Lifetime' : plan.name}
          </span>
        </div>
        {isCurrentPlan && <div className={styles.currentBadge}>Current Plan</div>}
      </div>

      <div className={styles.pricing}>
        {plan.type === 'custom' ? (
          <Text className={styles.customPrice}>Custom Pricing</Text>
        ) : plan.type === 'lifetime' ? (
          <>
            <Text className={styles.price}>${plan.prices.lifetime}</Text>
            <Text className={styles.priceLabel}>one-time</Text>
          </>
        ) : (
          <>
            <Text className={styles.price}>${plan.prices.monthly}</Text>
            <Text className={styles.priceLabel}>/month</Text>
            {plan.prices.yearly && (
              <Text className={styles.yearlyPrice}>or ${plan.prices.yearly}/year</Text>
            )}
          </>
        )}
      </div>

      <div className={styles.limits}>
        <Text className={styles.limitsTitle}>Limits</Text>
        <div className={styles.limitsList}>
          <div className={styles.limitItem}>
            <Icon>
              <Icons.BarChart />
            </Icon>
            <Text>{formatLimit(plan.limits.eventsPerMonth)} events/month</Text>
          </div>
          <div className={styles.limitItem}>
            <Icon>
              <Icons.Globe />
            </Icon>
            <Text>{formatLimit(plan.limits.websites)} websites</Text>
          </div>
          <div className={styles.limitItem}>
            <Icon>
              <Icons.Users />
            </Icon>
            <Text>{formatLimit(plan.limits.teamMembers)} team members</Text>
          </div>
          <div className={styles.limitItem}>
            <Icon>
              <Icons.Clock />
            </Icon>
            <Text>
              {isUnlimited(plan.limits.dataRetentionMonths)
                ? 'Forever'
                : `${plan.limits.dataRetentionMonths} months`}{' '}
              retention
            </Text>
          </div>
        </div>
      </div>

      <div className={styles.features}>
        <Text className={styles.featuresTitle}>Features</Text>
        <div className={styles.featuresList}>
          {plan.features.dataImport && (
            <div className={styles.feature}>
              <Icon>
                <Icons.Check />
              </Icon>
              <Text>Data Import</Text>
            </div>
          )}
          {plan.features.emailReports && (
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
              {plan.features.apiAccess === 'full' ? 'Full API Access' : 'Limited API Access'}
            </Text>
          </div>
          {plan.features.whiteLabel && (
            <div className={styles.feature}>
              <Icon>
                <Icons.Check />
              </Icon>
              <Text>White Label</Text>
            </div>
          )}
          {plan.features.customDomain && (
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
            <Text>{plan.features.supportLevel} support</Text>
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        {isCurrentPlan ? (
          <Button disabled>Current Plan</Button>
        ) : canUpgrade ? (
          <Button onClick={handleUpgrade} variant="primary">
            {plan.type === 'custom' ? 'Contact Sales' : 'Upgrade'}
          </Button>
        ) : (
          <Button disabled>{isLifetime ? 'Lifetime Active' : 'Downgrade Not Available'}</Button>
        )}
      </div>
    </div>
  );
}
