'use client';
import { useState, useEffect } from 'react';
import { Row, Column, useToasts } from 'react-basics';
import PageHeader from '@/components/layout/PageHeader';
import { useLogin, useApi } from '@/components/hooks';
import { UsageSummary } from '@/lib/services/simple-usage-manager';
import { getPlan } from '@/lib/config/simplified-plans';
import CurrentPlanCard from './CurrentPlanCard';
import UsageCard from './UsageCard';
import PricingSlider from './PricingSlider';
import styles from './BillingPage.module.css';

interface UserSubscription {
  planId: string;
  billingInterval: 'monthly' | 'yearly' | 'lifetime';
  status: string;
  isLifetime: boolean;
}

export default function BillingPage() {
  const { user } = useLogin();
  const { get, post } = useApi();
  const [usageData, setUsageData] = useState<UsageSummary | null>(null);
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingLoading, setBillingLoading] = useState(false);
  const { showToast } = useToasts();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both usage data and subscription data in parallel
        const [usageResponse, subscriptionResponse] = await Promise.all([
          get(`/usage/${user.id}`),
          get('/me/subscription'),
        ]);

        setUsageData(usageResponse);

        if (subscriptionResponse.success && subscriptionResponse.subscription) {
          setUserSubscription(subscriptionResponse.subscription);
        }
      } catch {
        // Failed to fetch data
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchData();
    }
  }, [user?.id, get]);

  const handleBillingPortal = async () => {
    // Prevent double clicks
    if (billingLoading) return;

    try {
      setBillingLoading(true);
      const data = await post('/stripe/create-portal', {
        returnUrl: window.location.href,
      });

      if (data.success && data.url) {
        // Add a small delay for consistency
        await new Promise(resolve => setTimeout(resolve, 100));
        window.location.href = data.url;
      }
    } catch (error: any) {
      setBillingLoading(false);
      // Show user-friendly error message
      const errorMessage =
        error?.message || 'Failed to open billing portal. Please try again later.';
      showToast({ message: errorMessage, variant: 'error' });
    }
  };

  const currentPlan = user?.planId ? getPlan(user.planId) : getPlan('free');

  if (!user) {
    return null;
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Billing & Plans">
        {/* Show Manage Billing text for all users */}
        <span
          onClick={billingLoading ? undefined : handleBillingPortal}
          className={styles.manageBillingLink}
          style={{
            cursor: billingLoading ? 'default' : 'pointer',
            opacity: billingLoading ? 0.6 : 1,
          }}
        >
          {billingLoading ? 'Opening Portal...' : 'Manage Billing'}
        </span>
      </PageHeader>

      <div className={styles.content}>
        {/* Current Plan & Usage Section */}
        <Row className={styles.cardRow}>
          <Column xs={12} md={8}>
            <CurrentPlanCard
              user={user}
              plan={currentPlan}
              userSubscription={userSubscription}
              usageData={usageData}
              loading={loading}
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
            user={user}
          />
        </div>
      </div>
    </div>
  );
}
