import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  TextField,
  PasswordField,
  SubmitButton,
  Icon,
  Banner,
  Button,
} from 'react-basics';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useApi, useMessages } from '@/components/hooks';
import { setUser } from '@/store/app';
import { setClientAuthToken } from '@/lib/client';
import Logo from '@/assets/logo.svg';
import styles from './SignupForm.module.css';

export function SignupForm() {
  const { formatMessage, labels, getMessage } = useMessages();
  const router = useRouter();
  const { post, put, useMutation } = useApi();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/register', data),
  });

  const {
    mutate: resendEmail,
    error: resendError,
    isPending: isResendPending,
  } = useMutation({
    mutationFn: (data: any) => put('/auth/verify-email', data),
  });

  const handleSubmit = async (data: any) => {
    mutate(data, {
      onSuccess: async ({ token, user, requiresEmailVerification }) => {
        setClientAuthToken(token);
        setUser(user);
        setUserEmail(user.email);

        if (requiresEmailVerification) {
          // Show email verification required message
          setRegistrationComplete(true);
        } else {
          // User is already verified (shouldn't happen with new flow, but just in case)
          router.push('/dashboard?welcome=true');
        }
      },
    });
  };

  const handleResendEmail = () => {
    resendEmail({ email: userEmail });
  };

  // Show email verification screen after successful registration
  if (registrationComplete) {
    return (
      <div className={styles.signup}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>Check your email</div>

        <Banner variant="success" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '2px' }}>🎉</div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--font-color)' }}>
                Account created successfully!
              </div>
              <div style={{ color: 'var(--font-color)', lineHeight: '1.5' }}>
                We&apos;ve sent a verification email to{' '}
                <strong style={{ color: 'var(--font-color)' }}>{userEmail}</strong>. Please check
                your inbox and click the verification link to activate your account.
              </div>
            </div>
          </div>
        </Banner>

        <div
          style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: 'var(--base50)',
            borderRadius: '8px',
            border: '1px solid var(--base200)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              color: 'var(--font-color)',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            <span style={{ fontSize: '16px' }}>📧</span>
            Can&apos;t find the email?
          </div>
          <ul
            style={{
              margin: '0',
              paddingLeft: '24px',
              fontSize: '14px',
              color: 'var(--font-color300)',
              lineHeight: '1.6',
            }}
          >
            <li style={{ marginBottom: '4px' }}>Check your spam/junk folder</li>
            <li style={{ marginBottom: '4px' }}>Make sure you entered the correct email address</li>
            <li>The email might take a few minutes to arrive</li>
          </ul>
        </div>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <Button
            variant="primary"
            onClick={handleResendEmail}
            disabled={isResendPending}
            style={{ minWidth: '200px' }}
          >
            {isResendPending ? 'Sending...' : 'Resend verification email'}
          </Button>

          {resendError && !isResendPending && (
            <div
              style={{
                marginTop: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--success-color-light)',
                color: 'var(--success-color)',
                fontSize: '14px',
                borderRadius: '4px',
                border: '1px solid var(--success-color-border)',
              }}
            >
              ✅ Verification email sent! Please check your inbox.
            </div>
          )}
        </div>

        <div className={styles.links} style={{ marginTop: '30px', textAlign: 'center' }}>
          <span style={{ color: 'var(--font-color300)' }}>Need help?</span>{' '}
          <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.signup}>
      <Icon className={styles.icon} size="xl">
        <Logo />
      </Icon>
      <div className={styles.title}>Join Superlytics</div>
      <Form
        className={styles.form}
        onSubmit={handleSubmit}
        error={getMessage(error)}
        values={{ username: '', email: '', password: '', confirmPassword: '' }}
      >
        <FormRow label="Username">
          <FormInput
            name="username"
            rules={{
              required: formatMessage(labels.required),
              minLength: {
                value: 3,
                message: 'Username must be at least 3 characters',
              },
              maxLength: {
                value: 50,
                message: 'Username must be less than 50 characters',
              },
            }}
          >
            <TextField autoComplete="username" type="text" placeholder="your_username" />
          </FormInput>
        </FormRow>
        <FormRow label="Email">
          <FormInput
            name="email"
            rules={{
              required: formatMessage(labels.required),
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            }}
          >
            <TextField autoComplete="email" type="text" placeholder="you@example.com" />
          </FormInput>
        </FormRow>
        <FormRow label="Password">
          <FormInput
            name="password"
            rules={{
              required: formatMessage(labels.required),
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters',
              },
            }}
          >
            <PasswordField autoComplete="new-password" />
          </FormInput>
        </FormRow>
        <FormRow label="Confirm Password">
          <FormInput
            name="confirmPassword"
            rules={{
              required: formatMessage(labels.required),
              validate: (value: string, formValues: any) =>
                value === formValues.password || 'Passwords do not match',
            }}
          >
            <PasswordField autoComplete="new-password" />
          </FormInput>
        </FormRow>
        <FormButtons>
          <SubmitButton className={styles.button} variant="primary" disabled={isPending}>
            {isPending ? 'Creating Account...' : 'Create Account'}
          </SubmitButton>
        </FormButtons>
      </Form>
      <div className={styles.links}>
        Already have an account? <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

export default SignupForm;
