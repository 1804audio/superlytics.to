import { useState } from 'react';
import { Button, LoadingButton } from 'react-basics';
import { useApi, useMessages } from '@/components/hooks';

interface UsernameEditFormProps {
  currentUsername: string;
  onSave: (newUsername: string) => void;
  onClose: () => void;
}

export function UsernameEditForm({ currentUsername, onSave, onClose }: UsernameEditFormProps) {
  const { formatMessage, labels } = useMessages();
  const { post, useMutation } = useApi();

  // Ensure initial value is always a string (never undefined)
  const initialValue = typeof currentUsername === 'string' ? currentUsername : '';
  const [username, setUsername] = useState(initialValue);

  const { mutate, error, isPending } = useMutation({
    mutationFn: (data: { username: string }) => post('/me/profile', data),
  });

  const handleSubmit = async () => {
    if (!username || username.length < 3 || username === currentUsername) {
      return;
    }

    mutate(
      { username },
      {
        onSuccess: () => {
          onSave(username);
        },
      },
    );
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <label
          htmlFor="username-input"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 'bold',
            color: 'var(--font-color100)',
          }}
        >
          Username
        </label>
        <input
          id="username-input"
          type="text"
          autoComplete="username"
          value={username}
          onChange={e => setUsername(e.target.value)}
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
          disabled={!username || username === currentUsername || username.length < 3}
          onClick={handleSubmit}
        >
          {formatMessage(labels.save)}
        </LoadingButton>
      </div>
    </div>
  );
}
