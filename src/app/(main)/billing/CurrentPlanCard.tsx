'use client';
import { Button, Text, Icon } from 'react-basics';
import Icons from '@/components/icons';
import { PlanConfiguration } from '@/lib/config/simplified-plans';
import { UsageSummary } from '@/lib/services/simple-usage-manager';
import styles from './CurrentPlanCard.module.css';

interface User {
  id: string;
  username: string;
  planId: string;
  hasAccess: boolean;
  isLifetime: boolean;
}

interface UserSubscription {
  planId: string;
  billingInterval: 'monthly' | 'yearly' | 'lifetime';
  status: string;
  isLifetime: boolean;
}

interface CurrentPlanCardProps {
  user: User;
  plan: PlanConfiguration | null;
  userSubscription: UserSubscription | null;
  usageData: UsageSummary | null;
  loading: boolean;
}

export default function CurrentPlanCard({
  user,
  plan,
  userSubscription,
  usageData,
  loading,
}: CurrentPlanCardProps) {
  const getPlanBadgeClass = () => {
    if (user.isLifetime) return styles.badgeLifetime;
    if (plan?.id === 'enterprise') return styles.badgeEnterprise;
    if (plan?.id === 'growth') return styles.badgeGrowth;
    if (plan?.id === 'starter') return styles.badgeStarter;
    return styles.badgeFree;
  };

  const getPlanPrice = () => {
    if (!plan || plan.type === 'custom') return null;
    if (user.isLifetime) return null;

    const billingInterval = userSubscription?.billingInterval || 'monthly';

    if (plan.prices.monthly === 0) {
      return { amount: 0, period: 'month' };
    }

    if (billingInterval === 'yearly' && plan.prices.yearly) {
      return { amount: plan.prices.yearly, period: 'year' };
    }

    return { amount: plan.prices.monthly || 0, period: 'month' };
  };

  const planPrice = getPlanPrice();

  const formatLimit = (current: number, limit: number, unlimited: boolean) => {
    if (unlimited) return `${current.toLocaleString()} / Unlimited`;
    return `${current.toLocaleString()} / ${limit.toLocaleString()}`;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.planInfo}>
          <Text className={styles.planName}>{plan?.name || 'Free'}</Text>
          <div className={styles.badges}>
            <span className={getPlanBadgeClass()}>
              {user.isLifetime ? 'Lifetime' : plan?.name}
              {userSubscription?.billingInterval === 'yearly' && !user.isLifetime && (
                <span className={styles.yearlyIndicator}>Annual</span>
              )}
            </span>
          </div>
        </div>
        {user.isLifetime && (
          <Icon className={styles.planIcon}>
            <Icons.Bolt />
          </Icon>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.priceInfo}>
          {plan?.type === 'custom' ? (
            <Text className={styles.customPrice}>Custom Pricing</Text>
          ) : user.isLifetime ? (
            <Text className={styles.lifetimePrice}>Lifetime Access - No recurring charges</Text>
          ) : planPrice?.amount === 0 ? (
            <Text className={styles.price}>$0/month</Text>
          ) : planPrice ? (
            <div className={styles.priceDetails}>
              <Text className={styles.price}>
                ${planPrice.amount}/{planPrice.period}
              </Text>
              {planPrice.period === 'month' && plan?.prices.yearly && (
                <Text className={styles.yearlyPrice}>
                  or ${plan.prices.yearly}/year (save $
                  {(plan.prices.monthly * 12 - plan.prices.yearly).toFixed(0)})
                </Text>
              )}
            </div>
          ) : null}
        </div>

        {!loading && usageData && (
          <div className={styles.usageOverview}>
            <Text className={styles.usageTitle}>Current Usage</Text>
            <div className={styles.usageItems}>
              <div className={styles.usageItem}>
                <Icon>
                  <Icons.BarChart />
                </Icon>
                <Text>
                  Events:{' '}
                  {formatLimit(
                    usageData.events.current,
                    usageData.events.limit,
                    usageData.events.unlimited,
                  )}
                </Text>
              </div>
              <div className={styles.usageItem}>
                <Icon>
                  <Icons.Globe />
                </Icon>
                <Text>
                  Websites:{' '}
                  {formatLimit(
                    usageData.websites.current,
                    usageData.websites.limit,
                    usageData.websites.unlimited,
                  )}
                </Text>
              </div>
              <div className={styles.usageItem}>
                <Icon>
                  <Icons.Users />
                </Icon>
                <Text>
                  Team Members:{' '}
                  {formatLimit(
                    usageData.teamMembers.current,
                    usageData.teamMembers.limit,
                    usageData.teamMembers.unlimited,
                  )}
                </Text>
              </div>
            </div>
          </div>
        )}

        <div className={styles.actions}>
          {plan?.type === 'custom' && (
            <Button variant="quiet">
              <Icon>
                <Icons.User />
              </Icon>
              Contact Sales
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
