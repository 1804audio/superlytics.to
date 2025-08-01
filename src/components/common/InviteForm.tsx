import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  TextField,
  Button,
  SubmitButton,
  Banner,
} from 'react-basics';
import { useApi, useMessages } from '@/components/hooks';
import { useState } from 'react';
import styles from './InviteForm.module.css';

export interface InviteFormProps {
  teamId: string;
  onSave?: () => void;
  onClose?: () => void;
}

export function InviteForm({ teamId, onSave, onClose }: InviteFormProps) {
  const { formatMessage, labels } = useMessages();
  const { post, useMutation } = useApi();
  const [success, setSuccess] = useState('');

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: any) => post(`/teams/${teamId}/invite`, data),
  });

  const handleSubmit = async (data: { email: string }) => {
    mutate(data, {
      onSuccess: async (result: any) => {
        if (result.success) {
          setSuccess(`Invitation sent successfully to ${data.email}!`);
          setTimeout(() => {
            onSave?.();
            onClose?.();
          }, 2000);
        }
      },
    });
  };

  return (
    <div className={styles.container}>
      <Form onSubmit={handleSubmit} error={error} values={{ email: '' }}>
        <FormRow label="Email Address">
          <FormInput
            data-test="input-email"
            name="email"
            rules={{
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address',
              },
            }}
          >
            <TextField
              type="email"
              placeholder="Enter email address"
              autoComplete="email"
              disabled={isPending || !!success}
            />
          </FormInput>
        </FormRow>

        {success && (
          <Banner variant="success" style={{ marginBottom: '16px' }}>
            {success}
          </Banner>
        )}

        <FormButtons flex>
          <SubmitButton data-test="button-send-invite" variant="primary" disabled={!!success}>
            Send Invitation
          </SubmitButton>
          {onClose && (
            <Button disabled={isPending} onClick={onClose}>
              {formatMessage(labels.cancel)}
            </Button>
          )}
        </FormButtons>
      </Form>

      <div className={styles.info}>
        <div className={styles.infoTitle}>What happens next:</div>
        <ul className={styles.infoList}>
          <li>Invitee receives an email with join link</li>
          <li>They can join directly if they have an account</li>
          <li>New users will create an account and auto-join</li>
          <li>You&apos;ll be notified when they join</li>
        </ul>
      </div>
    </div>
  );
}

export default InviteForm;
