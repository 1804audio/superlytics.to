import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  TextField,
  SubmitButton,
  Icon,
  Banner,
} from 'react-basics';
import { useState } from 'react';
import Link from 'next/link';
import { useApi, useMessages } from '@/components/hooks';
import Logo from '@/assets/logo.svg';
import styles from '../login/LoginForm.module.css';

export function ForgotPasswordForm() {
  const { getMessage } = useMessages();
  const { post, useMutation } = useApi();
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/forgot-password', data),
  });

  const handleSubmit = async (data: any) => {
    mutate(data, {
      onSuccess: () => {
        setIsSuccess(true);
      },
    });
  };

  if (isSuccess) {
    return (
      <div className={styles.login}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>superlytics</div>

        <Banner variant="success" style={{ textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <div style={{ fontSize: '20px', marginTop: '2px' }}>📧</div>
            <div>
              <div style={{ fontWeight: '600', marginBottom: '8px', color: 'var(--font-color)' }}>
                Check your email
              </div>
              <div style={{ color: 'var(--font-color)', lineHeight: '1.5' }}>
                If an account with that email exists, we&apos;ve sent you a password reset link.
                Please check your inbox and follow the instructions to reset your password.
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
            textAlign: 'center',
          }}
        >
          <div
            style={{
              color: 'var(--font-color300)',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <strong style={{ color: 'var(--font-color)' }}>Don&apos;t see the email?</strong>
            </div>
            <div>Check your spam folder or try again with a different email address.</div>
          </div>
        </div>

        <div className={styles.links} style={{ marginTop: '30px', textAlign: 'center' }}>
          <span style={{ color: 'var(--font-color300)' }}>Remember your password?</span>{' '}
          <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.login}>
      <Icon className={styles.icon} size="xl">
        <Logo />
      </Icon>
      <div className={styles.title}>superlytics</div>

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <h2>Forgot your password?</h2>
        <p style={{ color: 'var(--font-color300)', marginTop: '8px' }}>
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <Form
        className={styles.form}
        onSubmit={handleSubmit}
        error={getMessage(error)}
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
          <SubmitButton className={styles.button} variant="primary" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send reset link'}
          </SubmitButton>
        </FormButtons>
      </Form>

      <div className={styles.links}>
        Remember your password? <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

export default ForgotPasswordForm;
