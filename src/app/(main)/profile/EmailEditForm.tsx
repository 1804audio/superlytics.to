import { useState } from 'react';
import { Button, LoadingButton } from 'react-basics';
import { useApi, useMessages } from '@/components/hooks';

interface EmailEditFormProps {
  currentEmail: string;
  onSave: (newEmail: string) => void;
  onClose: () => void;
}

export function EmailEditForm({ currentEmail, onSave, onClose }: EmailEditFormProps) {
  const { formatMessage, labels } = useMessages();
  const { post, useMutation } = useApi();

  // Ensure initial value is always a string (never undefined)
  const initialValue = typeof currentEmail === 'string' ? currentEmail : '';
  const [email, setEmail] = useState(initialValue);

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: { email: string }) => post('/me/profile', data),
  });

  const isValidEmail = (email: string) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  };

  const handleSubmit = async () => {
    if (!email || email === currentEmail || !isValidEmail(email)) {
      return;
    }

    mutate(
      { email },
      {
        onSuccess: () => {
          onSave(email);
        },
      },
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="email-input"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: 'var(--font-color100)',
          }}
        >
          Email
        </label>
        <input
          id="email-input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid var(--base400)',
            borderRadius: 'var(--border-radius)',
            fontSize: '14px',
            background: 'var(--base50)',
            color: 'var(--font-color100)',
            fontFamily: 'inherit',
          }}
        />
        {error?.message && (
          <div style={{ color: 'var(--red-500)', fontSize: '12px', marginTop: '4px' }}>
            {error.message}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
        <Button onClick={onClose}>{formatMessage(labels.cancel)}</Button>
        <LoadingButton
          variant="primary"
          isLoading={isPending}
          disabled={!email || email === currentEmail || !isValidEmail(email)}
          onClick={handleSubmit}
        >
          {formatMessage(labels.save)}
        </LoadingButton>
      </div>
    </div>
  );
}
