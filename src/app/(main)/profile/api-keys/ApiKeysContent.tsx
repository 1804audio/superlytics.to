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
  key?: string; // Only available on creation
  maskedKey: string;
  createdAt: string;
  lastUsedAt?: string;
  permissions: string[];
}

export default function ApiKeysContent() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [planCheckLoading, setPlanCheckLoading] = useState(true);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [newlyCreatedKeys, setNewlyCreatedKeys] = useState<Set<string>>(new Set());
  const [revealedKeys, setRevealedKeys] = useState<Map<string, string>>(new Map());
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
    // Mark this key as newly created and visible
    if (newKey.key) {
      setNewlyCreatedKeys(prev => new Set(prev.add(newKey.id)));
      setVisibleKeys(prev => new Set(prev.add(newKey.id)));
    }
  };

  const copyToClipboard = async (text: string, keyName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast({ message: `${keyName} copied to clipboard!`, variant: 'success' });
    } catch (error) {
      log('Failed to copy to clipboard:', error);
      showToast({ message: 'Failed to copy to clipboard', variant: 'error' });
    }
  };

  const revealFullKey = async (keyId: string) => {
    try {
      const response = await get(`/me/api-keys/${keyId}/reveal`);
      setRevealedKeys(prev => new Map(prev.set(keyId, response.key)));
      return response.key;
    } catch (error) {
      log('Failed to reveal API key:', error);
      showToast({ message: 'Failed to reveal API key', variant: 'error' });
      return null;
    }
  };

  const toggleKeyVisibility = async (keyId: string) => {
    const isVisible = visibleKeys.has(keyId);

    if (isVisible) {
      // Hide the key
      setVisibleKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(keyId);
        return newSet;
      });
    } else {
      // Show the key - reveal it if not already revealed
      if (!revealedKeys.has(keyId)) {
        const fullKey = await revealFullKey(keyId);
        if (!fullKey) return; // Failed to reveal
      }

      setVisibleKeys(prev => new Set(prev.add(keyId)));
    }
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
        apiKeys.map(apiKey => {
          const isVisible = visibleKeys.has(apiKey.id);
          const isNewlyCreated = newlyCreatedKeys.has(apiKey.id);
          const revealedKey = revealedKeys.get(apiKey.id);

          // Determine what key to show: newly created full key, revealed key, or masked key
          let keyToShow = apiKey.maskedKey;
          let keyToCopy = apiKey.maskedKey;

          if (isVisible) {
            if (isNewlyCreated && apiKey.key) {
              keyToShow = apiKey.key;
              keyToCopy = apiKey.key;
            } else if (revealedKey) {
              keyToShow = revealedKey;
              keyToCopy = revealedKey;
            }
          }

          return (
            <FormRow key={apiKey.id} label={apiKey.name}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Text
                    style={{
                      fontFamily: 'var(--font-family-mono)',
                      fontSize: '12px',
                      color: 'var(--font-color300)',
                      flex: 1,
                      wordBreak: 'break-all',
                    }}
                  >
                    {keyToShow}
                  </Text>

                  {/* Copy button */}
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => copyToClipboard(keyToCopy, apiKey.name)}
                  >
                    <Icon>
                      <Icons.Copy />
                    </Icon>
                  </Button>

                  {/* Show/Hide button */}
                  <Button variant="quiet" size="sm" onClick={() => toggleKeyVisibility(apiKey.id)}>
                    <Icon>
                      <Icons.Eye />
                    </Icon>
                  </Button>

                  {/* Delete button */}
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
                    flexDirection: 'column',
                    gap: '4px',
                    fontSize: '12px',
                    color: 'var(--font-color400)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <Text>Created: {new Date(apiKey.createdAt).toLocaleDateString()}</Text>
                    <Text>
                      Last used:{' '}
                      {apiKey.lastUsedAt
                        ? new Date(apiKey.lastUsedAt).toLocaleDateString()
                        : 'Never'}
                    </Text>
                  </div>
                </div>
              </div>
            </FormRow>
          );
        })
      )}
    </Form>
  );
}
