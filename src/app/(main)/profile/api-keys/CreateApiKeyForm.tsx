'use client';
import { useState } from 'react';
import {
  Form,
  FormRow,
  FormInput,
  FormButtons,
  SubmitButton,
  Button,
  Text,
  Icon,
  useToasts,
  TextField,
} from 'react-basics';
import { useApi } from '@/components/hooks';
import Icons from '@/components/icons';
import debug from 'debug';

const log = debug('superlytics:api-key-form');

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

interface CreateApiKeyFormProps {
  onSuccess: (apiKey: ApiKey) => void;
  onClose: () => void;
}

export default function CreateApiKeyForm({ onSuccess, onClose }: CreateApiKeyFormProps) {
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const { post } = useApi();
  const { showToast } = useToasts();

  const handleSubmit = async (data: { name: string }) => {
    if (!data.name?.trim()) {
      showToast({ message: 'Please enter a name for the API key', variant: 'error' });
      return;
    }

    try {
      setLoading(true);
      const result = await post('/me/api-keys', { name: data.name.trim() });

      setNewKey(result.key);
      onSuccess(result);
      showToast({ message: 'API key created successfully', variant: 'success' });
    } catch (error: any) {
      log('Failed to create API key:', error);
      showToast({
        message: error.message || 'Failed to create API key',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ message: 'API key copied to clipboard', variant: 'success' });
    } catch {
      showToast({ message: 'Failed to copy to clipboard', variant: 'error' });
    }
  };

  if (newKey) {
    return (
      <div style={{ padding: '20px' }}>
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--base75)',
            border: '1px solid var(--base300)',
            borderRadius: '8px',
            marginBottom: '20px',
          }}
        >
          <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>
            Your new API key has been created
          </Text>
          <Text style={{ fontSize: '12px', color: 'var(--font-color300)', marginBottom: '16px' }}>
            Make sure to copy your API key now. You won&apos;t be able to see it again!
          </Text>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px',
              backgroundColor: 'var(--base50)',
              border: '1px solid var(--base300)',
              borderRadius: '4px',
              fontFamily: 'var(--font-family-mono)',
              fontSize: '14px',
            }}
          >
            <Text style={{ flex: 1, wordBreak: 'break-all' }}>{newKey}</Text>
            <Button variant="quiet" size="sm" onClick={() => copyToClipboard(newKey)}>
              <Icon>
                <Icons.Change />
              </Icon>
            </Button>
          </div>
        </div>

        <FormButtons>
          <Button onClick={onClose}>
            <Text>Done</Text>
          </Button>
        </FormButtons>
      </div>
    );
  }

  return (
    <Form onSubmit={handleSubmit} values={{ name: '' }}>
      <FormRow label="Name">
        <FormInput name="name" rules={{ required: 'Name is required' }}>
          <TextField placeholder="e.g., My Analytics API Key" autoComplete="off" />
        </FormInput>
      </FormRow>

      <div
        style={{
          padding: '12px',
          backgroundColor: 'var(--base75)',
          border: '1px solid var(--base300)',
          borderRadius: '4px',
          fontSize: '12px',
          color: 'var(--font-color300)',
          marginBottom: '20px',
        }}
      >
        This API key will have access to all your analytics data. Keep it secure and don&apos;t
        share it publicly.
      </div>

      <FormButtons>
        <Button type="button" onClick={onClose}>
          <Text>Cancel</Text>
        </Button>
        <SubmitButton variant="primary" isLoading={loading}>
          <Text>Create API Key</Text>
        </SubmitButton>
      </FormButtons>
    </Form>
  );
}
