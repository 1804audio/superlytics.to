import { EmailConfig } from './types';

/**
 * Utility functions for email processing
 */

/**
 * Validate email address format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize email content to prevent XSS
 */
export const sanitizeEmailContent = (content: string): string => {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

/**
 * Format email list for display
 */
export const formatEmailList = (emails: string[]): string => {
  if (emails.length === 0) return '';
  if (emails.length === 1) return emails[0];
  if (emails.length === 2) return `${emails[0]} and ${emails[1]}`;

  const lastEmail = emails[emails.length - 1];
  const otherEmails = emails.slice(0, -1).join(', ');
  return `${otherEmails}, and ${lastEmail}`;
};

/**
 * Generate email configuration from environment variables
 */
export const createEmailConfig = (): EmailConfig => {
  const apiKey = process.env.EMAILIT_API_KEY || '';
  const fromAddress = process.env.FROM_EMAIL || 'noreply@superlytics.co';
  const appName = process.env.APP_NAME || 'SuperLytics';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://superlytics.co';
  const apiBaseUrl = 'https://api.emailit.com';

  return {
    apiKey,
    fromAddress,
    appName,
    appUrl,
    apiBaseUrl,
  };
};

/**
 * Create URL with email pre-filled
 */
export const createEmailUrl = (baseUrl: string, email: string): string => {
  const url = new URL(baseUrl);
  url.searchParams.set('email', email);
  return url.toString();
};

/**
 * Convert HTML to plain text for email text version
 */
export const htmlToText = (html: string): string => {
  return (
    html
      // Remove HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&apos;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
};

/**
 * Pluralize text based on count
 */
export const pluralize = (count: number, singular: string, plural?: string): string => {
  if (count === 1) return singular;
  return plural || `${singular}s`;
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * Create safe HTML content by escaping user input
 */
export const createSafeHtml = (template: string, data: Record<string, any>): string => {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    const safeValue = typeof value === 'string' ? sanitizeEmailContent(value) : String(value);
    result = result.replace(new RegExp(placeholder, 'g'), safeValue);
  }

  return result;
};

/**
 * Validate email template data
 */
export const validateTemplateData = <T>(data: T, requiredFields: (keyof T)[]): boolean => {
  return requiredFields.every(field => {
    const value = data[field];
    return value !== null && value !== undefined && value !== '';
  });
};

/**
 * Log email operation for debugging
 */
export const logEmailOperation = (
  operation: string,
  recipient: string | string[],
  success: boolean,
  error?: any,
): void => {
  const recipients = Array.isArray(recipient) ? recipient.join(', ') : recipient;

  if (process.env.NODE_ENV === 'development') {
    log(`[Email] ${operation}:`, {
      recipients,
      success,
      timestamp: new Date().toISOString(),
      ...(error && { error: error.message || error }),
    });
  }
};
