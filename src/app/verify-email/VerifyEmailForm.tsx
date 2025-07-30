import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  TextField,
  SubmitButton,
  Icon,
  Banner,
  Button,
} from 'react-basics';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApi, useMessages } from '@/components/hooks';
import Logo from '@/assets/logo.svg';
import styles from '../login/LoginForm.module.css';

export function VerifyEmailForm() {
  const { getMessage } = useMessages();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { post, put, useMutation } = useApi();
  const [token, setToken] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showResendForm, setShowResendForm] = useState(false);

  const { mutate: verifyEmail, error: verifyError } = useMutation({
    mutationFn: (data: any) => post('/auth/verify-email', data),
  });

  const {
    mutate: resendEmail,
    error: resendError,
    isPending: isResendPending,
  } = useMutation({
    mutationFn: (data: any) => put('/auth/verify-email', data),
  });

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      setIsVerifying(true);
      // Automatically verify when token is present
      verifyEmail(
        { token: tokenParam },
        {
          onSuccess: () => {
            setIsSuccess(true);
            setIsVerifying(false);
            // Redirect to dashboard after 3 seconds
            setTimeout(() => {
              router.push('/dashboard');
            }, 3000);
          },
          onError: () => {
            setIsVerifying(false);
          },
        },
      );
    }
  }, [searchParams, verifyEmail, router]);

  const handleResendSubmit = async (data: any) => {
    resendEmail(data, {
      onSuccess: () => {
        setShowResendForm(false);
      },
    });
  };

  // Auto-verification in progress
  if (isVerifying) {
    return (
      <div className={styles.login}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>superlytics</div>

        <div style={{ textAlign: 'center', padding: '20px' }}>
          <h2>Verifying your email...</h2>
          <p style={{ color: 'var(--font-color300)', marginTop: '8px' }}>
            Please wait while we verify your email address.
          </p>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className={styles.login}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>superlytics</div>

        <Banner variant="success" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '2px' }}>🎉</div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--font-color)' }}>
                Email verified successfully!
              </div>
              <div style={{ color: 'var(--font-color)', lineHeight: '1.5', marginBottom: '12px' }}>
                Welcome to SuperLytics! Your email has been verified and your account is now active.
                You can start setting up your analytics dashboard.
              </div>
              <div style={{ color: 'var(--font-color)', fontSize: '14px', opacity: 0.8 }}>
                Redirecting you to your dashboard...
              </div>
            </div>
          </div>
        </Banner>

        <div className={styles.links}>
          <Link href="/dashboard">Continue to dashboard</Link>
        </div>
      </div>
    );
  }

  // Invalid token or error state
  if (token && verifyError) {
    return (
      <div className={styles.login}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>superlytics</div>

        <Banner variant="error">
          <h3>Verification failed</h3>
          <p>{getMessage(verifyError)}</p>
        </Banner>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button variant="primary" onClick={() => setShowResendForm(true)}>
            Request new verification email
          </Button>
        </div>

        <div className={styles.links}>
          <Link href="/login">Back to login</Link>
        </div>
      </div>
    );
  }

  // Resend form
  if (showResendForm) {
    return (
      <div className={styles.login}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>superlytics</div>

        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <h2>Resend verification email</h2>
          <p style={{ color: 'var(--font-color300)', marginTop: '8px' }}>
            Enter your email address to receive a new verification link.
          </p>
        </div>

        {resendError && !isResendPending && (
          <Banner variant="success">
            A new verification email has been sent. Please check your inbox.
          </Banner>
        )}

        <Form
          className={styles.form}
          onSubmit={handleResendSubmit}
          error={getMessage(resendError)}
          values={{ email: '' }}
        >
          <FormRow label="Email address">
            <FormInput
              name="email"
              rules={{
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address',
                },
              }}
            >
              <TextField autoComplete="email" placeholder="Enter your email address" />
            </FormInput>
          </FormRow>

          <FormButtons>
            <SubmitButton className={styles.button} variant="primary" disabled={isResendPending}>
              {isResendPending ? 'Sending...' : 'Send verification email'}
            </SubmitButton>
          </FormButtons>
        </Form>

        <div className={styles.links}>
          <Button variant="quiet" onClick={() => setShowResendForm(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // Default state (no token)
  return (
    <div className={styles.login}>
      <Icon className={styles.icon} size="xl">
        <Logo />
      </Icon>
      <div className={styles.title}>superlytics</div>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2>Verify your email</h2>
        <p style={{ color: 'var(--font-color300)', marginTop: '8px' }}>
          Check your email for a verification link, or request a new one below.
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <Button variant="primary" onClick={() => setShowResendForm(true)}>
          Send verification email
        </Button>
      </div>

      <div className={styles.links}>
        <Link href="/login">Back to login</Link>
      </div>
    </div>
  );
}

export default VerifyEmailForm;
