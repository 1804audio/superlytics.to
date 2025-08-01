'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Banner, Button, Loading, useToasts } from 'react-basics';
import { useApi } from '@/components/hooks';
import { useLogin } from '@/components/hooks';
import icons from '@/components/icons';
import debug from 'debug';
import styles from './EmailVerification.module.css';

const log = debug('superlytics:email-verification');

export default function EmailVerificationPage() {
  const { post } = useApi();
  const { user, refetch } = useLogin();
  const { showToast } = useToasts();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Redirect verified users to dashboard
  useEffect(() => {
    if (user?.emailVerified) {
      router.replace('/dashboard');
    }
  }, [user?.emailVerified, router]);

  if (!user) {
    return <Loading />;
  }

  // Don't render the page if user is already verified
  if (user.emailVerified) {
    return <Loading />;
  }

  const handleResendEmail = async () => {
    try {
      setResendLoading(true);
      await post('/api/auth/verify-email/resend');
      showToast({
        message: 'Verification email sent! Please check your inbox and spam folder.',
        variant: 'success',
      });
    } catch (error) {
      log('Resend email failed:', error);
      showToast({
        message: 'Failed to send verification email. Please try again.',
        variant: 'error',
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setLoading(true);
      await refetch();
      if (user?.emailVerified) {
        showToast({
          message: 'Email verified successfully! Welcome to SuperLytics.',
          variant: 'success',
        });
        router.replace('/dashboard');
      } else {
        showToast({
          message: 'Email not verified yet. Please check your inbox.',
          variant: 'warning',
        });
      }
    } catch (error) {
      log('Check verification failed:', error);
      showToast({
        message: 'Failed to check verification status.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <icons.Profile className={styles.icon} />
          <h1>Verify Your Email</h1>
        </div>

        <Banner>
          <div className={styles.message}>
            <p>
              We&apos;ve sent a verification email to <strong>{user.email}</strong>.
            </p>
            <p>
              Click the verification link in the email to complete your account setup and access
              SuperLytics.
            </p>
          </div>
        </Banner>

        <div className={styles.instructions}>
          <h3>📥 Check Your Email</h3>
          <ul>
            <li>Look for an email from SuperLytics in your inbox</li>
            <li>Check your spam/junk folder if you don&apos;t see it</li>
            <li>Click the &quot;Verify Email&quot; button in the email</li>
            <li>Return here to access your dashboard</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <Button variant="primary" onClick={handleCheckVerification} disabled={loading}>
            {loading ? 'Checking...' : "I've Verified My Email"}
          </Button>

          <Button variant="quiet" onClick={handleResendEmail} disabled={resendLoading}>
            {resendLoading ? 'Sending...' : 'Resend Verification Email'}
          </Button>

          <Button variant="quiet" onClick={handleLogout}>
            Logout
          </Button>
        </div>

        <div className={styles.help}>
          <p>
            <strong>Still having trouble?</strong> Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}
