import { useRef, useState } from 'react';
import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  PasswordField,
  SubmitButton,
  Button,
} from 'react-basics';
import { useMessages } from '@/components/hooks';

export function DeleteAccountForm({ onDelete, onClose }: { onDelete: any; onClose: any }) {
  const { formatMessage, labels } = useMessages();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState('');
  const ref = useRef(null);

  const handleSubmit = async (data: any) => {
    if (!confirmDelete) {
      setError('You must confirm account deletion');
      return;
    }

    try {
      await onDelete(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete account');
    }
  };

  return (
    <div style={{ padding: '20px', minWidth: '400px' }}>
      <div style={{ marginBottom: '20px', color: '#d73a49' }}>
        <strong>⚠️ Warning: This action cannot be undone!</strong>
      </div>

      <div style={{ marginBottom: '20px', lineHeight: '1.5' }}>
        <p>Deleting your account will permanently remove:</p>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>All your websites and analytics data</li>
          <li>All teams you own (other members will lose access)</li>
          <li>All custom reports and configurations</li>
          <li>Your subscription (if active)</li>
          <li>All usage records and billing history</li>
        </ul>
        <p>
          This action is <strong>irreversible</strong>.
        </p>
      </div>

      <Form
        ref={ref}
        onSubmit={handleSubmit}
        error={error}
        values={{ password: '', confirmation: false }}
      >
        <FormRow label="Enter your password to confirm">
          <FormInput name="password" rules={{ required: 'Password is required' }}>
            <PasswordField placeholder="Your current password" autoComplete="current-password" />
          </FormInput>
        </FormRow>

        <FormRow>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={confirmDelete}
              onChange={e => setConfirmDelete(e.target.checked)}
            />
            I understand this action cannot be undone and want to delete my account
          </label>
        </FormRow>

        <FormButtons flex>
          <SubmitButton variant="danger" disabled={!confirmDelete}>
            Delete My Account Forever
          </SubmitButton>
          <Button onClick={onClose}>{formatMessage(labels.cancel)}</Button>
        </FormButtons>
      </Form>
    </div>
  );
}

export default DeleteAccountForm;
