'use client';
import { useState, useEffect } from 'react';
import {
  Button,
  Icon,
  Text,
  Modal,
  ModalTrigger,
  useToasts,
  Form,
  FormRow,
  Banner,
} from 'react-basics';
import { useApi } from '@/components/hooks';
import Icons from '@/components/icons';
import CreateApiKeyForm from './CreateApiKeyForm';
import debug from 'debug';

const log = debug('superlytics:api-keys');

interface ApiKey {
  id: string;
  name: string;
  key: string;
  maskedKey: string;
  createdAt: string;
  lastUsed?: string;
  permissions: string[];
}

export default function ApiKeysContent() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [planCheckLoading, setPlanCheckLoading] = useState(true);
  const { get, del } = useApi();
  const { showToast } = useToasts();

  const loadApiKeys = async () => {
    try {
      setLoading(true);
      const data = await get('/me/api-keys');
      setApiKeys(data || []);
    } catch (error) {
      log('Failed to load API keys:', error);
      showToast({ message: 'Failed to load API keys', variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const checkPlanFeatures = async () => {
    try {
      setPlanCheckLoading(true);
      const result = await get('/me/features/apiKeys').catch(() => ({ hasFeature: false }));
      setHasApiKeys(result.hasFeature || false);
    } catch (error) {
      log('Failed to check plan features:', error);
      setHasApiKeys(false);
    } finally {
      setPlanCheckLoading(false);
    }
  };

  const handleDelete = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      await del(`/me/api-keys/${keyId}`);
      setApiKeys(keys => keys.filter(key => key.id !== keyId));
      showToast({ message: 'API key deleted successfully', variant: 'success' });
    } catch (error) {
      log('Failed to delete API key:', error);
      showToast({ message: 'Failed to delete API key', variant: 'error' });
    }
  };

  const handleKeyCreated = (newKey: ApiKey) => {
    setApiKeys(keys => [newKey, ...keys]);
  };

  useEffect(() => {
    loadApiKeys();
    checkPlanFeatures();
  }, []);

  if (loading || planCheckLoading) {
    return <div>Loading API keys...</div>;
  }

  return (
    <Form>
      <FormRow label="API Keys">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Description */}
          <Text style={{ fontSize: '14px', color: 'var(--font-color300)' }}>
            Manage your API keys for programmatic access to your analytics data
          </Text>

          {/* Plan restriction banner */}
          {!hasApiKeys && (
            <Banner variant="warning">
              API keys are not available in your current plan. Please upgrade your plan to access
              this feature.
            </Banner>
          )}

          {/* Create button - only wrap in ModalTrigger if user has access */}
          <div>
            {hasApiKeys ? (
              <ModalTrigger>
                <Button variant="primary">
                  <Icon>
                    <Icons.Lock />
                  </Icon>
                  <Text>Create key</Text>
                </Button>
                <Modal title="Create API Key">
                  {close => (
                    <CreateApiKeyForm
                      onSuccess={newKey => {
                        handleKeyCreated(newKey);
                        close();
                      }}
                      onClose={close}
                    />
                  )}
                </Modal>
              </ModalTrigger>
            ) : (
              <Button variant="primary" disabled>
                <Icon>
                  <Icons.Lock />
                </Icon>
                <Text>Create key</Text>
              </Button>
            )}
          </div>
        </div>
      </FormRow>

      {apiKeys.length === 0 ? (
        <FormRow>
          <div
            style={{
              textAlign: 'center',
              padding: '40px',
              border: '1px solid var(--base300)',
              borderRadius: '8px',
              backgroundColor: 'var(--base75)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '8px',
              }}
            >
              <Icon size="lg" style={{ opacity: 0.5 }}>
                <Icons.Lock />
              </Icon>
              <Text style={{ fontSize: '18px', fontWeight: 'bold' }}>
                You do not have any API keys.
              </Text>
            </div>
            <Text style={{ color: 'var(--font-color300)' }}>
              Create your first API key to start accessing your analytics data programmatically.
            </Text>
          </div>
        </FormRow>
      ) : (
        apiKeys.map(apiKey => (
          <FormRow key={apiKey.id} label={apiKey.name}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Text
                  style={{
                    fontFamily: 'var(--font-family-mono)',
                    fontSize: '12px',
                    color: 'var(--font-color300)',
                  }}
                >
                  {apiKey.maskedKey}
                </Text>
                <Button variant="danger" size="sm" onClick={() => handleDelete(apiKey.id)}>
                  <Icon>
                    <Icons.Close />
                  </Icon>
                  <Text>Delete</Text>
                </Button>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: '16px',
                  fontSize: '12px',
                  color: 'var(--font-color400)',
                }}
              >
                <Text>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</Text>
                <Text>
                  Last used:{' '}
                  {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                </Text>
              </div>
            </div>
          </FormRow>
        ))
      )}
    </Form>
  );
}
