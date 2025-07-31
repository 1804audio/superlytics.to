'use client';
import { useState, useRef, useEffect } from 'react';
import {
  Button,
  LoadingButton,
  Icon,
  Text,
  useToasts,
  Form,
  FormRow,
  Banner,
  Dropdown,
  Item,
} from 'react-basics';
import { useApi, useLogin } from '@/components/hooks';
import Icons from '@/components/icons';
import debug from 'debug';
import Image from 'next/image';

const log = debug('superlytics:data-content');

const getPlatformLogo = (platformId: string): string | null => {
  switch (platformId) {
    case 'google_analytics':
      return '/platform-logo/Google_Symbol_1.png';
    case 'plausible':
      return '/platform-logo/Plausible_logo.png';
    default:
      return null;
  }
};

interface PlatformInfo {
  id: string;
  name: string;
  description: string;
  logo?: string;
}

interface ImportPreview {
  summary: {
    totalRows: number;
    generatedEvents: number;
    platform: string;
  };
  sampleEvents: any[];
  errors: string[];
}

export default function DataContent() {
  const [hasDataImport, setHasDataImport] = useState(false);
  const [hasDataExport, setHasDataExport] = useState(false);
  const [hasExportableData, setHasExportableData] = useState(false);
  const [dataStatusMessage, setDataStatusMessage] = useState('');
  const [planCheckLoading, setPlanCheckLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState('google_analytics');
  const [platforms, setPlatforms] = useState<PlatformInfo[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [websites, setWebsites] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { get, post } = useApi();
  const { showToast } = useToasts();
  const { user } = useLogin();

  useEffect(() => {
    checkPlanFeatures();
    loadPlatforms();
    loadWebsites();
    checkDataStatus();
  }, [user]);

  const checkPlanFeatures = async () => {
    if (!user?.id) return;

    try {
      setPlanCheckLoading(true);

      const [importCheck, exportCheck] = await Promise.all([
        get('/me/features/dataImport').catch(() => ({ hasFeature: false })),
        get('/me/features/dataExport').catch(() => ({ hasFeature: false })),
      ]);

      setHasDataImport(importCheck.hasFeature || false);
      setHasDataExport(exportCheck.hasFeature || false);
    } catch (error) {
      log('Failed to check plan features:', error);
      setHasDataImport(false);
      setHasDataExport(false);
    } finally {
      setPlanCheckLoading(false);
    }
  };

  const checkDataStatus = async () => {
    if (!user?.id) return;

    try {
      const dataStatus = await get('/me/data-status');
      setHasExportableData(dataStatus.hasExportableData || false);
      setDataStatusMessage(dataStatus.message || '');
    } catch (error) {
      log('Failed to check data status:', error);
      setHasExportableData(false);
      setDataStatusMessage('Unable to check data status');
    }
  };

  const loadPlatforms = async () => {
    try {
      const response = await get('/batch/csv');
      setPlatforms(response.platforms || []);
    } catch (error) {
      log('Failed to load platforms:', error);
      // Fallback to default platforms
      setPlatforms([
        {
          id: 'google_analytics',
          name: 'Google Analytics',
          description: 'Google Analytics export data',
          logo: getPlatformLogo('google_analytics') || undefined,
        },
        {
          id: 'plausible',
          name: 'Plausible Analytics',
          description: 'Plausible Analytics export data',
          logo: getPlatformLogo('plausible') || undefined,
        },
        {
          id: 'custom',
          name: 'Custom CSV',
          description: 'Custom CSV format with flexible mapping',
        },
      ]);
    }
  };

  const loadWebsites = async () => {
    try {
      const response = await get('/me/websites');
      setWebsites(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedWebsiteId(response.data[0].id);
      }
    } catch (error) {
      log('Failed to load websites:', error);
    }
  };

  const handleExportData = async () => {
    if (!hasDataExport) {
      showToast({
        message:
          'Data export is not available in your current plan. Please upgrade to access this feature.',
        variant: 'error',
      });
      return;
    }

    if (!hasExportableData) {
      showToast({
        message:
          dataStatusMessage ||
          'No data available for export. Create a website and start collecting data first.',
        variant: 'error',
      });
      return;
    }

    try {
      setExportLoading(true);
      await post('/me/data-export');
      showToast({
        message:
          'Export initiated! You will receive an email with a ZIP file when your data is ready.',
        variant: 'success',
      });
    } catch (error: any) {
      log('Failed to initiate data export:', error);
      showToast({
        message: error.message || 'Failed to initiate data export',
        variant: 'error',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast({ message: 'Please select a CSV file', variant: 'error' });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        showToast({ message: 'File size must be less than 10MB', variant: 'error' });
        return;
      }

      setSelectedFile(file);
      setPreview(null); // Clear previous preview
    }
  };

  const handlePreviewData = async () => {
    if (!selectedFile || !selectedWebsiteId) {
      showToast({ message: 'Please select both a CSV file and website', variant: 'error' });
      return;
    }

    try {
      setPreviewLoading(true);
      const csvContent = await selectedFile.text();

      const response = await post('/batch/csv', {
        csvData: csvContent,
        websiteId: selectedWebsiteId,
        platform: selectedPlatform,
        preview: true,
        filename: selectedFile.name,
      });

      setPreview(response);

      if (response.errors && response.errors.length > 0) {
        showToast({
          message: `Preview ready with ${response.errors.length} parsing warnings`,
          variant: 'warning',
        });
      } else {
        showToast({
          message: `Preview ready: ${response.summary.generatedEvents} events from ${response.summary.totalRows} rows`,
          variant: 'success',
        });
      }
    } catch (error: any) {
      log('Failed to preview data:', error);
      showToast({
        message: error.message || 'Failed to preview data',
        variant: 'error',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleImportData = async () => {
    if (!hasDataImport) {
      showToast({
        message:
          'Data import is not available in your current plan. Please upgrade to access this feature.',
        variant: 'error',
      });
      return;
    }

    if (!selectedFile || !selectedWebsiteId) {
      showToast({ message: 'Please select both a CSV file and website', variant: 'error' });
      return;
    }

    if (!preview) {
      showToast({ message: 'Please preview the data first', variant: 'error' });
      return;
    }

    try {
      setImportLoading(true);
      const csvContent = await selectedFile.text();

      const result = await post('/batch/csv', {
        csvData: csvContent,
        websiteId: selectedWebsiteId,
        platform: selectedPlatform,
        preview: false,
        filename: selectedFile.name,
      });

      showToast({
        message: `Successfully imported ${result.summary.actualProcessed} events from ${result.summary.totalRows} CSV rows`,
        variant: 'success',
      });

      if (result.summary.actualErrors > 0) {
        showToast({
          message: `${result.summary.actualErrors} events failed to import`,
          variant: 'warning',
        });
      }

      // Clear the selected file and preview
      setSelectedFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      log('Failed to import data:', error);
      showToast({
        message: error.message || 'Failed to import data',
        variant: 'error',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const getPlatformInfo = (platformId: string) => {
    return platforms.find(p => p.id === platformId);
  };

  const getPlatformFormatInfo = (platformId: string) => {
    switch (platformId) {
      case 'google_analytics':
        return {
          columns:
            'date, page_path, page_title, sessions, users, pageviews, bounce_rate, avg_session_duration',
          description: 'Export from Google Analytics (aggregated daily data)',
          example: '2024-01-01,/home,Home Page,150,120,200,65.5,180.2',
        };
      case 'plausible':
        return {
          columns:
            'Auto-detected from 10 table types (imported_visitors, imported_pages, imported_sources, etc.)',
          description:
            'Plausible Analytics CSV import (supports all 10 official table types with auto-detection)',
          example: 'imported_visitors_20240101_20240131.csv or detect from columns',
          tableTypes: [
            'imported_visitors (date, visitors)',
            'imported_pages (date, page, visitors, pageviews)',
            'imported_entry_pages (date, entry_page, visitors, entrances)',
            'imported_exit_pages (date, exit_page, visitors, exits)',
            'imported_sources (date, source, visitors)',
            'imported_locations (date, country, visitors)',
            'imported_devices (date, device, visitors)',
            'imported_browsers (date, browser, visitors)',
            'imported_operating_systems (date, operating_system, visitors)',
            'imported_custom_events (date, name, visitors)',
          ],
        };
      case 'custom':
        return {
          columns: 'timestamp, url, title, event_name, [custom_fields]',
          description: 'Custom CSV format with flexible column mapping',
          example: '2024-01-01T10:30:00Z,/home,Home Page,pageview,custom_value',
        };
      default:
        return null;
    }
  };

  if (planCheckLoading) {
    return <div>Loading...</div>;
  }

  const platformInfo = getPlatformInfo(selectedPlatform);
  const formatInfo = getPlatformFormatInfo(selectedPlatform);

  return (
    <Form>
      <FormRow label="Data Import">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Text style={{ fontSize: '14px', color: 'var(--font-color300)' }}>
            Import data from Google Analytics, Plausible, or custom CSV files.
            {!hasDataImport && ' (Growth+ plan required)'}
          </Text>

          {!hasDataImport && (
            <Banner variant="warning">
              Data import is only available on Growth plans and above. Please upgrade your plan to
              access this feature.
            </Banner>
          )}

          {/* Platform Selection */}
          <FormRow label="Analytics Platform">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {platforms.map(platform => {
                const isSelected = selectedPlatform === platform.id;
                const platformLogo = platform.logo || getPlatformLogo(platform.id);

                return (
                  <div
                    key={platform.id}
                    onClick={() => {
                      if (hasDataImport) {
                        setSelectedPlatform(platform.id);
                        setPreview(null); // Clear preview when platform changes
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      border: `2px solid ${isSelected ? 'var(--green-500)' : 'transparent'}`,
                      borderRadius: '8px',
                      backgroundColor: isSelected ? 'var(--primary50)' : 'var(--base50)',
                      cursor: hasDataImport ? 'pointer' : 'not-allowed',
                      opacity: hasDataImport ? 1 : 0.5,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {/* Platform Logo */}
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'var(--base100)',
                        borderRadius: '6px',
                        padding: '4px',
                      }}
                    >
                      {platformLogo ? (
                        <Image
                          src={platformLogo}
                          alt={`${platform.name} logo`}
                          width={24}
                          height={24}
                          style={{ objectFit: 'contain' }}
                        />
                      ) : (
                        <Icon>
                          <Icons.BarChart />
                        </Icon>
                      )}
                    </div>

                    {/* Platform Info */}
                    <div style={{ flex: 1 }}>
                      <div style={{ marginBottom: '10px' }}>
                        <Text
                          style={{
                            fontWeight: isSelected ? 'bold' : 'normal',
                            color: 'var(--font-color)',
                          }}
                        >
                          {platform.name}
                        </Text>
                      </div>
                      <Text
                        style={{
                          fontSize: '12px',
                          color: 'var(--font-color300)',
                          lineHeight: '1.3',
                        }}
                      >
                        {platform.description}
                      </Text>
                    </div>

                    {/* Selection Indicator */}
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? 'var(--green-500)' : 'var(--base300)'}`,
                        backgroundColor: isSelected ? 'var(--green-500)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isSelected && (
                        <Icon>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        </Icon>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </FormRow>

          {/* Website Selection */}
          <FormRow label="Destination Website">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Text
                style={{ fontSize: '12px', color: 'var(--font-color300)', marginBottom: '4px' }}
              >
                Choose which website the imported data will be added to
              </Text>
              <Dropdown
                items={
                  websites.length === 0 ? [{ id: '', name: 'No websites available' }] : websites
                }
                value={selectedWebsiteId}
                renderValue={value => {
                  const website = websites.find(w => w.id === value);
                  return website ? website.name : 'Select website';
                }}
                onChange={(value: string) => {
                  log('Dropdown onChange triggered with value:', value);
                  setSelectedWebsiteId(value);
                }}
                disabled={!hasDataImport || websites.length === 0}
              >
                {({ id, name }) => (
                  <Item key={id} value={id}>
                    {name}
                  </Item>
                )}
              </Dropdown>
            </div>
          </FormRow>

          {/* File Selection */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={!hasDataImport}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              disabled={!hasDataImport}
            >
              <Icon>
                <Icons.Change />
              </Icon>
              <Text>Choose CSV File</Text>
            </Button>

            {selectedFile && (
              <Text style={{ fontSize: '12px', color: 'var(--font-color300)' }}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Text>
            )}
          </div>

          {/* Preview and Import Buttons */}
          {selectedFile && hasDataImport && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <LoadingButton
                onClick={handlePreviewData}
                isLoading={previewLoading}
                variant="secondary"
                disabled={!selectedFile || !selectedWebsiteId}
              >
                <Icon>
                  <Icons.Search />
                </Icon>
                <Text>Preview Data</Text>
              </LoadingButton>

              {preview && (
                <LoadingButton
                  onClick={handleImportData}
                  isLoading={importLoading}
                  disabled={!preview}
                >
                  <Icon>
                    <Icons.BarChart />
                  </Icon>
                  <Text>Import {preview.summary.generatedEvents} Events</Text>
                </LoadingButton>
              )}
            </div>
          )}

          {/* Preview Results */}
          {preview && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--base75)',
                border: '1px solid var(--base300)',
                borderRadius: '4px',
                fontSize: '14px',
              }}
            >
              <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                Import Preview - {preview.summary.platform}
              </Text>
              <Text style={{ marginBottom: '8px' }}>
                • CSV Rows: {preview.summary.totalRows}
                <br />• Generated Events: {preview.summary.generatedEvents}
                <br />• Parsing Errors: {preview.errors.length}
              </Text>

              {preview.errors.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ fontWeight: 'bold', color: 'var(--error)' }}>Parsing Errors:</Text>
                  {preview.errors.slice(0, 3).map((error, index) => (
                    <Text key={index} style={{ fontSize: '12px', color: 'var(--error)' }}>
                      • {error}
                    </Text>
                  ))}
                  {preview.errors.length > 3 && (
                    <Text style={{ fontSize: '12px', color: 'var(--error)' }}>
                      ... and {preview.errors.length - 3} more errors
                    </Text>
                  )}
                </div>
              )}

              {preview.sampleEvents.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ fontWeight: 'bold' }}>Sample Event:</Text>
                  <pre
                    style={{
                      fontSize: '10px',
                      backgroundColor: 'var(--base100)',
                      padding: '8px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      maxHeight: '200px',
                    }}
                  >
                    {JSON.stringify(preview.sampleEvents[0], null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Platform Format Information */}
          {platformInfo && formatInfo && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--base75)',
                border: '1px solid var(--base300)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              <Text style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                {platformInfo.name} Format Requirements:
              </Text>
              <Text style={{ marginBottom: '8px' }}>{formatInfo.description}</Text>
              <Text style={{ marginBottom: '4px', fontWeight: 'bold' }}>Required columns:</Text>
              <Text style={{ fontFamily: 'monospace', marginBottom: '8px' }}>
                {formatInfo.columns}
              </Text>
              <Text style={{ marginBottom: '4px', fontWeight: 'bold' }}>Example row:</Text>
              <Text style={{ fontFamily: 'monospace', marginBottom: '8px' }}>
                {formatInfo.example}
              </Text>

              {/* Show Plausible table types */}
              {selectedPlatform === 'plausible' && formatInfo.tableTypes && (
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ marginBottom: '4px', fontWeight: 'bold' }}>
                    Supported table types:
                  </Text>
                  {formatInfo.tableTypes.map((tableType, index) => (
                    <Text
                      key={index}
                      style={{ fontSize: '11px', fontFamily: 'monospace', marginBottom: '2px' }}
                    >
                      • {tableType}
                    </Text>
                  ))}
                </div>
              )}

              <Text>
                • Maximum file size: 10MB
                <br />
                • Maximum events: 10,000 per import
                <br />
                • Rate limit: 5 imports per minute
                <br />
                {selectedPlatform === 'plausible' && (
                  <>• Auto-detects table type from filename or column headers</>
                )}
              </Text>
            </div>
          )}
        </div>
      </FormRow>

      <FormRow label="Data Export">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '14px', color: 'var(--font-color300)' }}>
            Export all your data as a ZIP file. You will receive an email when your files are ready.
            {!hasDataExport && ' (Feature not available)'}
            {hasDataExport && !hasExportableData && ' (No data to export)'}
          </Text>

          {!hasDataExport && (
            <Banner variant="warning">
              Data export is not available in your current plan. Please upgrade to access this
              feature.
            </Banner>
          )}

          {hasDataExport && !hasExportableData && (
            <Banner variant="info">
              {dataStatusMessage ||
                'No data available for export. Create a website and start collecting analytics data to enable export.'}
            </Banner>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <LoadingButton
              onClick={handleExportData}
              isLoading={exportLoading}
              disabled={!hasDataExport || !hasExportableData}
            >
              <Icon>
                <Icons.BarChart />
              </Icon>
              <Text>Export</Text>
            </LoadingButton>
          </div>

          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--base75)',
              border: '1px solid var(--base300)',
              borderRadius: '4px',
              fontSize: '12px',
            }}
          >
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>Export Features:</Text>
            <Text>
              • Single ZIP file with all data
              <br />
              • CSV format: websites, events, sessions, reports
              <br />
              • 24-hour secure download link
              <br />• Automatic cleanup after download period
            </Text>
          </div>
        </div>
      </FormRow>
    </Form>
  );
}
