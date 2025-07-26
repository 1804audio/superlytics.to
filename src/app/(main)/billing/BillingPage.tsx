'use client';
import { useState, useEffect } from 'react';
import { Row, Column, Text } from 'react-basics';
import PageHeader from '@/components/layout/PageHeader';
import { useLogin, useApi } from '@/components/hooks';
import { UsageSummary } from '@/lib/services/simple-usage-manager';
import { SIMPLIFIED_PLANS, getPlan } from '@/lib/config/simplified-plans';
import PlanCard from './PlanCard';
import CurrentPlanCard from './CurrentPlanCard';
import UsageCard from './UsageCard';
import styles from './BillingPage.module.css';

export default function BillingPage() {
  const { user } = useLogin();
  const { get } = useApi();
  const [usageData, setUsageData] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const data = await get(`/usage/${user.id}`);
        setUsageData(data);
      } catch {
        // Failed to fetch usage data
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchUsageData();
    }
  }, [user?.id, get]);

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: window.location.href,
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Failed to open billing portal
    }
  };

  const currentPlan = user?.planId ? getPlan(user.planId) : null;
  const subscriptionPlans = Object.values(SIMPLIFIED_PLANS).filter(
    plan => plan.type === 'subscription',
  );
  const lifetimePlans = Object.values(SIMPLIFIED_PLANS).filter(plan => plan.type === 'lifetime');

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Billing & Plans" />

      <div className={styles.content}>
        {/* Current Plan & Usage Section */}
        <Row>
          <Column xs={12} md={8}>
            <CurrentPlanCard
              user={user}
              plan={currentPlan}
              usageData={usageData}
              loading={loading}
              onManageBilling={handleBillingPortal}
            />
          </Column>
          <Column xs={12} md={4}>
            <UsageCard usageData={usageData} loading={loading} plan={currentPlan} />
          </Column>
        </Row>

        {/* Available Plans Section */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Subscription Plans</Text>
          <Text className={styles.sectionDescription}>
            Choose the plan that fits your needs. Upgrade or downgrade anytime.
          </Text>

          <Row>
            {subscriptionPlans.map(plan => (
              <Column key={plan.id} xs={12} sm={6} md={4}>
                <PlanCard plan={plan} currentPlanId={user.planId} isLifetime={user.isLifetime} />
              </Column>
            ))}
          </Row>
        </div>

        {/* Lifetime Plans Section */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>Lifetime Plans</Text>
          <Text className={styles.sectionDescription}>
            One-time payment for lifetime access. No recurring fees.
          </Text>

          <Row>
            {lifetimePlans.map(plan => (
              <Column key={plan.id} xs={12} sm={6} md={4}>
                <PlanCard plan={plan} currentPlanId={user.planId} isLifetime={user.isLifetime} />
              </Column>
            ))}
          </Row>
        </div>
      </div>
    </div>
  );
}
