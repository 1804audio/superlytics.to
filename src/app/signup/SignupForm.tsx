import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  TextField,
  PasswordField,
  SubmitButton,
  Icon,
} from 'react-basics';
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
  const { post, useMutation } = useApi();
  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post('/auth/register', data),
  });

  const handleSubmit = async (data: any) => {
    mutate(data, {
      onSuccess: async ({ token, user }) => {
        setClientAuthToken(token);
        setUser(user);

        // Show success message briefly, then redirect
        router.push('/dashboard?welcome=true');
      },
    });
  };

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
