'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Form, FormRow, FormInput, Banner } from 'react-basics';
import { useApi, useLogin } from '@/components/hooks';
import PageHeader from '@/components/layout/PageHeader';
import styles from './TeamJoinForm.module.css';

export default function TeamJoinForm() {
  const { user } = useLogin();
  const { post } = useApi();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const accessCode = searchParams.get('code') || '';
  const inviteEmail = searchParams.get('email') || '';

  const handleSubmit = async (data: { accessCode: string }) => {
    setLoading(true);
    setError('');

    try {
      const result = await post('/teams/join', data);

      if (result.teamName) {
        if (result.alreadyMember) {
          setSuccess(`You're already a member of ${result.teamName}! Redirecting to dashboard...`);
        } else {
          setSuccess(`Successfully joined ${result.teamName}! Redirecting to dashboard...`);
        }

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to join team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className={styles.container}>
        <PageHeader title="Join Team" />

        {inviteEmail && (
          <Banner variant="info" className={styles.banner}>
            You&apos;ve been invited to join a team! Please log in or create an account to continue.
          </Banner>
        )}

        <div className={styles.authPrompt}>
          <p>To join a team, you need to be logged in.</p>
          <div className={styles.authButtons}>
            <Button
              href={`/login${inviteEmail ? `?email=${encodeURIComponent(inviteEmail)}` : ''}`}
              variant="primary"
            >
              Log In
            </Button>
            <Button
              href={`/signup${inviteEmail ? `?email=${encodeURIComponent(inviteEmail)}` : ''}`}
              variant="secondary"
            >
              Create Account
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Auto-joining in progress
  if (accessCode && loading && !error) {
    return (
      <div className={styles.container}>
        <PageHeader title="Joining Team..." />
        <div className={styles.loadingState}>
          <p>Processing your team invitation...</p>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className={styles.container}>
        <PageHeader title="Welcome to the Team! 🎉" />
        <Banner variant="success" className={styles.banner}>
          {success}
        </Banner>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <PageHeader title="Join Team" />

      {error && (
        <Banner variant="error" className={styles.banner}>
          {error}
        </Banner>
      )}

      {inviteEmail && (
        <Banner variant="info" className={styles.banner}>
          You&apos;ve been invited to join a team! Enter the access code below to continue.
        </Banner>
      )}

      <Form onSubmit={handleSubmit} values={{ accessCode }}>
        <FormRow label="Access Code">
          <FormInput name="accessCode" rules={{ required: 'Access code is required' }}>
            <input
              type="text"
              placeholder="Enter team access code"
              style={{ fontFamily: 'monospace' }}
            />
          </FormInput>
        </FormRow>

        <FormRow>
          <Button type="submit" variant="primary" loading={loading}>
            {loading ? 'Joining...' : 'Join Team'}
          </Button>
        </FormRow>
      </Form>
    </div>
  );
}
