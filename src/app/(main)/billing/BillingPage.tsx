'use client';
import { useState, useEffect } from 'react';
import { Row, Column } from 'react-basics';
import PageHeader from '@/components/layout/PageHeader';
import { useLogin, useApi } from '@/components/hooks';
import { UsageSummary } from '@/lib/services/simple-usage-manager';
import { getPlan } from '@/lib/config/simplified-plans';
import CurrentPlanCard from './CurrentPlanCard';
import UsageCard from './UsageCard';
import PricingSlider from './PricingSlider';
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

  const currentPlan = user?.planId ? getPlan(user.planId) : getPlan('free');

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Billing & Plans" />

      <div className={styles.content}>
        {/* Current Plan & Usage Section */}
        <Row className={styles.cardRow}>
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
            <UsageCard usageData={usageData} loading={loading} />
          </Column>
        </Row>

        {/* Plan Recommendation Slider */}
        <div className={styles.section}>
          <PricingSlider
            currentEvents={usageData?.events.current || 0}
            currentPlanId={user.planId || 'free'}
            isLifetime={user.isLifetime || false}
          />
        </div>
      </div>
    </div>
  );
}
