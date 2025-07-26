'use client';
import { Text, Icon } from 'react-basics';
import Icons from '@/components/icons';
import { PlanConfiguration } from '@/lib/config/simplified-plans';
import { UsageSummary } from '@/lib/services/simple-usage-manager';
import styles from './UsageCard.module.css';

interface UsageCardProps {
  usageData: UsageSummary | null;
  loading: boolean;
  plan: PlanConfiguration | null;
}

export default function UsageCard({ usageData, loading, plan }: UsageCardProps) {
  if (loading || !usageData) {
    return (
      <div className={styles.card}>
        <Text className={styles.title}>Usage Overview</Text>
        <div className={styles.loading}>Loading usage data...</div>
      </div>
    );
  }

  const getUsagePercentage = (current: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 0;
    return Math.min((current / limit) * 100, 100);
  };

  const getUsageStatus = (current: number, limit: number, unlimited: boolean) => {
    if (unlimited) return 'unlimited';
    const percentage = getUsagePercentage(current, limit, unlimited);
    if (percentage >= 100) return 'over';
    if (percentage >= 80) return 'high';
    if (percentage >= 60) return 'medium';
    return 'low';
  };

  const formatLimit = (current: number, limit: number, unlimited: boolean) => {
    if (unlimited) return `${current.toLocaleString()} / Unlimited`;
    return `${current.toLocaleString()} / ${limit.toLocaleString()}`;
  };

  return (
    <div className={styles.card}>
      <Text className={styles.title}>Usage Overview</Text>

      <div className={styles.usageItems}>
        {/* Events Usage */}
        <div className={styles.usageItem}>
          <div className={styles.usageHeader}>
            <Icon>
              <Icons.BarChart />
            </Icon>
            <Text className={styles.usageLabel}>Events</Text>
          </div>
          <Text className={styles.usageValue}>
            {formatLimit(
              usageData.events.current,
              usageData.events.limit,
              usageData.events.unlimited,
            )}
          </Text>
          {!usageData.events.unlimited && (
            <div className={styles.progressBar}>
              <div
                className={`${styles.progress} ${styles[getUsageStatus(usageData.events.current, usageData.events.limit, usageData.events.unlimited)]}`}
                style={{
                  width: `${getUsagePercentage(usageData.events.current, usageData.events.limit, usageData.events.unlimited)}%`,
                }}
              />
            </div>
          )}
          {usageData.events.overLimit && <Text className={styles.warningText}>Over limit</Text>}
          {usageData.events.nearLimit && !usageData.events.overLimit && (
            <Text className={styles.warningText}>Near limit</Text>
          )}
        </div>

        {/* Websites Usage */}
        <div className={styles.usageItem}>
          <div className={styles.usageHeader}>
            <Icon>
              <Icons.Globe />
            </Icon>
            <Text className={styles.usageLabel}>Websites</Text>
          </div>
          <Text className={styles.usageValue}>
            {formatLimit(
              usageData.websites.current,
              usageData.websites.limit,
              usageData.websites.unlimited,
            )}
          </Text>
          {!usageData.websites.unlimited && (
            <div className={styles.progressBar}>
              <div
                className={`${styles.progress} ${styles[getUsageStatus(usageData.websites.current, usageData.websites.limit, usageData.websites.unlimited)]}`}
                style={{
                  width: `${getUsagePercentage(usageData.websites.current, usageData.websites.limit, usageData.websites.unlimited)}%`,
                }}
              />
            </div>
          )}
        </div>

        {/* Team Members Usage */}
        <div className={styles.usageItem}>
          <div className={styles.usageHeader}>
            <Icon>
              <Icons.Users />
            </Icon>
            <Text className={styles.usageLabel}>Team Members</Text>
          </div>
          <Text className={styles.usageValue}>
            {formatLimit(
              usageData.teamMembers.current,
              usageData.teamMembers.limit,
              usageData.teamMembers.unlimited,
            )}
          </Text>
          {!usageData.teamMembers.unlimited && (
            <div className={styles.progressBar}>
              <div
                className={`${styles.progress} ${styles[getUsageStatus(usageData.teamMembers.current, usageData.teamMembers.limit, usageData.teamMembers.unlimited)]}`}
                style={{
                  width: `${getUsagePercentage(usageData.teamMembers.current, usageData.teamMembers.limit, usageData.teamMembers.unlimited)}%`,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {plan && (
        <div className={styles.planInfo}>
          <Text className={styles.planName}>Current Plan: {plan.name}</Text>
          <Text className={styles.planType}>
            {plan.type === 'lifetime'
              ? 'Lifetime Access'
              : plan.type === 'custom'
                ? 'Custom Plan'
                : 'Subscription'}
          </Text>
        </div>
      )}
    </div>
  );
}
