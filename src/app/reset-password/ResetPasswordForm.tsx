import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  PasswordField,
  SubmitButton,
  Icon,
  Banner,
} from 'react-basics';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useApi, useMessages } from '@/components/hooks';
import Logo from '@/assets/logo.svg';
import styles from '../login/LoginForm.module.css';

export function ResetPasswordForm() {
  const { getMessage } = useMessages();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { post, useMutation } = useApi();
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/reset-password', data),
  });

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (data: any) => {
    mutate(
      { ...data, token },
      {
        onSuccess: () => {
          setIsSuccess(true);
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        },
      },
    );
  };

  if (!token) {
    return (
      <div className={styles.login}>
        <Icon className={styles.icon} size="xl">
          <Logo />
        </Icon>
        <div className={styles.title}>superlytics</div>

        <Banner variant="error">
          <h3>Invalid Reset Link</h3>
          <p>
            This password reset link is invalid or has expired. Please request a new password reset
            link.
          </p>
        </Banner>

        <div className={styles.links}>
          <Link href="/forgot-password">Request new reset link</Link> |{' '}
          <Link href="/login">Back to login</Link>
        </div>
      </div>
    );
  }

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
                Password reset successful!
              </div>
              <div style={{ color: 'var(--font-color)', lineHeight: '1.5', marginBottom: '12px' }}>
                Your password has been reset successfully. You can now log in with your new
                password.
              </div>
              <div style={{ color: 'var(--font-color)', fontSize: '14px', opacity: 0.8 }}>
                Redirecting you to the login page...
              </div>
            </div>
          </div>
        </Banner>

        <div className={styles.links}>
          <Link href="/login">Continue to login</Link>
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
        <h2>Set new password</h2>
        <p style={{ color: 'var(--font-color300)', marginTop: '8px' }}>
          Please enter your new password below.
        </p>
      </div>

      <Form
        className={styles.form}
        onSubmit={handleSubmit}
        error={getMessage(error)}
        values={{ password: '', confirmPassword: '' }}
      >
        <FormRow label="New password">
          <FormInput
            name="password"
            rules={{
              required: 'Password is required',
              minLength: {
                value: 8,
                message: 'Password must be at least 8 characters long',
              },
              pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                message:
                  'Password must contain at least one uppercase letter, one lowercase letter, and one number',
              },
            }}
          >
            <PasswordField placeholder="Enter new password" />
          </FormInput>
        </FormRow>

        <FormRow label="Confirm password">
          <FormInput
            name="confirmPassword"
            rules={{
              required: 'Password confirmation is required',
              validate: (value: string, formValues: any) => {
                return value === formValues.password || 'Passwords do not match';
              },
            }}
          >
            <PasswordField placeholder="Confirm new password" />
          </FormInput>
        </FormRow>

        <FormButtons>
          <SubmitButton className={styles.button} variant="primary" disabled={isPending}>
            {isPending ? 'Updating...' : 'Update password'}
          </SubmitButton>
        </FormButtons>
      </Form>

      <div className={styles.links}>
        Remember your password? <Link href="/login">Sign in</Link>
      </div>
    </div>
  );
}

export default ResetPasswordForm;
