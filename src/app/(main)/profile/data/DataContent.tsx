'use client';
import { useState, useRef, useEffect } from 'react';
import { Button, LoadingButton, Icon, Text, useToasts, Form, FormRow, Banner } from 'react-basics';
import { useApi, useLogin } from '@/components/hooks';
import Icons from '@/components/icons';
import debug from 'debug';

const log = debug('superlytics:data-content');

export default function DataContent() {
  const [hasDataImport, setHasDataImport] = useState(false);
  const [hasDataExport, setHasDataExport] = useState(false);
  const [planCheckLoading, setPlanCheckLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { get, post } = useApi();
  const { showToast } = useToasts();
  const { user } = useLogin();

  useEffect(() => {
    checkPlanFeatures();
  }, [user]);

  const checkPlanFeatures = async () => {
    if (!user?.id) return;

    try {
      setPlanCheckLoading(true);

      // Check features via API endpoint (since simpleUsageManager is server-side)
      const [importCheck, exportCheck] = await Promise.all([
        get('/me/features/dataImport').catch(() => ({ hasFeature: false })),
        get('/me/features/dataExport').catch(() => ({ hasFeature: false })),
      ]);

      setHasDataImport(importCheck.hasFeature || false);
      setHasDataExport(exportCheck.hasFeature || false);
    } catch (error) {
      log('Failed to check plan features:', error);
      // Default to false for security
      setHasDataImport(false);
      setHasDataExport(false);
    } finally {
      setPlanCheckLoading(false);
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

    try {
      setExportLoading(true);
      await post('/me/data-export');
      showToast({
        message:
          'Export all your data. You will receive an email when your files are ready to be downloaded.',
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
      // Validate file type
      if (!file.name.toLowerCase().endsWith('.csv')) {
        showToast({ message: 'Please select a CSV file', variant: 'error' });
        return;
      }

      // Validate file size (limit to 50MB)
      if (file.size > 50 * 1024 * 1024) {
        showToast({ message: 'File size must be less than 50MB', variant: 'error' });
        return;
      }

      setSelectedFile(file);
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

    if (!selectedFile) {
      showToast({ message: 'Please select a CSV file first', variant: 'error' });
      return;
    }

    try {
      setImportLoading(true);

      // Read and parse CSV file
      const text = await selectedFile.text();
      const lines = text.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file must contain at least a header and one data row');
      }

      // Security: Limit number of records (100 + header = 101 lines max)
      if (lines.length > 101) {
        throw new Error('CSV file cannot contain more than 100 data rows');
      }

      // Proper CSV parsing function that handles quoted fields
      const parseCSVLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
          const char = line[i];
          const nextChar = line[i + 1];

          if (char === '"') {
            if (inQuotes && nextChar === '"') {
              // Handle escaped quotes ("")
              current += '"';
              i += 2;
            } else {
              // Toggle quote state
              inQuotes = !inQuotes;
              i++;
            }
          } else if (char === ',' && !inQuotes) {
            // Field separator outside quotes
            result.push(current.trim());
            current = '';
            i++;
          } else {
            current += char;
            i++;
          }
        }

        // Add the last field
        result.push(current.trim());
        return result;
      };

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const requiredColumns = ['type', 'payload', 'website'];

      // Validate CSV structure
      if (headers.length === 0) {
        throw new Error('Invalid CSV format: no headers found');
      }

      // Validate required columns
      for (const col of requiredColumns) {
        if (!headers.includes(col)) {
          throw new Error(`Missing required column: ${col}`);
        }
      }

      // Security: Basic content validation
      const suspiciousPatterns = [/<script/i, /javascript:/i, /on\w+\s*=/i, /data:\s*text\/html/i];

      for (let i = 1; i < Math.min(lines.length, 6); i++) {
        // Check first 5 data rows
        const line = lines[i];
        for (const pattern of suspiciousPatterns) {
          if (pattern.test(line)) {
            throw new Error(`Potentially malicious content detected in CSV file`);
          }
        }
      }

      // Parse data rows and transform to expected format
      const data = lines.slice(1).map((line, lineIndex) => {
        try {
          const values = parseCSVLine(line);
          const record: any = {};
          headers.forEach((header, index) => {
            let value = values[index]?.trim() || '';

            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1);
            }

            record[header] = value;
          });

          // Transform CSV data to match API expected format
          const transformedRecord = {
            type: record.type === 'pageview' ? 'event' : record.type, // Convert pageview to event
            payload: {
              website: record.website,
              hostname: record.hostname || undefined,
              url: record.url || undefined,
              referrer: record.referrer || undefined,
              title: record.title || undefined,
              name: record.name || undefined,
              data: record.payload ? JSON.parse(record.payload) : undefined,
              timestamp: record.timestamp
                ? Math.floor(new Date(record.timestamp).getTime() / 1000)
                : undefined,
            },
          };

          // Remove undefined values to keep payload clean
          Object.keys(transformedRecord.payload).forEach(key => {
            if (transformedRecord.payload[key] === undefined) {
              delete transformedRecord.payload[key];
            }
          });

          return transformedRecord;
        } catch (error) {
          throw new Error(`Error parsing line ${lineIndex + 2}: ${error.message}`);
        }
      });

      // Import the data using the batch API
      const result = await post('/batch', data);

      showToast({
        message: `Successfully imported ${result.processed} records`,
        variant: 'success',
      });

      if (result.errors > 0) {
        showToast({
          message: `${result.errors} records failed to import`,
          variant: 'warning',
        });
      }

      // Clear the selected file
      setSelectedFile(null);
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

  if (planCheckLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Form>
      <FormRow label="Data Import">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '14px', color: 'var(--font-color300)' }}>
            Import data from a CSV file into a website.
            {!hasDataImport && ' (Growth plan required)'}
          </Text>

          {!hasDataImport && (
            <Banner variant="warning">
              Data import is only available on Growth plans and above. Please upgrade your plan to
              access this feature.
            </Banner>
          )}

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

            {selectedFile && hasDataImport && (
              <>
                <Text style={{ fontSize: '12px', color: 'var(--font-color300)' }}>
                  Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </Text>
                <LoadingButton
                  onClick={handleImportData}
                  isLoading={importLoading}
                  disabled={!selectedFile || !hasDataImport}
                >
                  <Icon>
                    <Icons.BarChart />
                  </Icon>
                  <Text>Import Data</Text>
                </LoadingButton>
              </>
            )}
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
            <Text style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              CSV Format Requirements:
            </Text>
            <Text>
              • Required columns: type, payload (JSON), website (UUID)
              <br />
              • Optional columns: hostname, url, referrer, title, name, timestamp
              <br />• Maximum file size: 50MB
              <br />• Maximum rows: 100 data records per import
            </Text>
          </div>
        </div>
      </FormRow>

      <FormRow label="Data Export">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Text style={{ fontSize: '14px', color: 'var(--font-color300)' }}>
            Export all your data. You will receive an email when your files are ready to be
            downloaded.
            {!hasDataExport && ' (Feature not available)'}
          </Text>

          {!hasDataExport && (
            <Banner variant="warning">
              Data export is not available in your current plan. Please upgrade to access this
              feature.
            </Banner>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <LoadingButton
              onClick={handleExportData}
              isLoading={exportLoading}
              disabled={!hasDataExport}
            >
              <Icon>
                <Icons.BarChart />
              </Icon>
              <Text>Export</Text>
            </LoadingButton>
          </div>
        </div>
      </FormRow>
    </Form>
  );
}
