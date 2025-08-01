import { emailTheme } from './theme';

export interface ButtonOptions {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'normal' | 'large';
  fullWidth?: boolean;
}

export interface AccessCodeOptions {
  description?: string;
  helpText?: string;
}

export interface StatsOptions {
  label: string;
  value: string | number;
  inline?: boolean;
}

export const emailComponents = {
  /**
   * Company logo component
   */
  logo: (appName = 'SuperLytics') => `
    <div class="logo">${appName}</div>
  `,

  /**
   * Greeting component
   */
  greeting: (name: string, emoji?: string) => `
    <div class="greeting">Hi ${name}${emoji ? ` ${emoji}` : ''}!</div>
  `,

  /**
   * Generic greeting for unknown recipients
   */
  genericGreeting: (emoji = '👋') => `
    <div class="greeting">Hi there! ${emoji}</div>
  `,

  /**
   * Message content component
   */
  message: (content: string, className = 'message') => `
    <div class="${className}">${content}</div>
  `,

  /**
   * Button component with various styles
   */
  button: (text: string, url: string, options: ButtonOptions = {}) => {
    const { variant = 'primary', size = 'normal', fullWidth = false } = options;
    const sizeClass = size === 'large' ? 'btn-large' : '';
    const widthStyle = fullWidth ? 'style="width: 100%; display: block;"' : '';

    return `
      <a href="${url}" class="btn btn-${variant} ${sizeClass}" ${widthStyle}>
        ${text}
      </a>
    `;
  },

  /**
   * Button container for multiple buttons
   */
  buttonContainer: (buttons: string[]) => `
    <div class="button-container">
      ${buttons.join('\n      ')}
    </div>
  `,

  /**
   * Access code display component
   */
  accessCode: (code: string, options: AccessCodeOptions = {}) => {
    const { description = 'Your Access Code:', helpText = "Copy this code - you'll need it" } =
      options;

    return `
      <div class="access-code">
        <div>${description}</div>
        <div class="code">${code}</div>
        ${helpText ? `<div class="small-text" style="margin-top: ${emailTheme.spacing.sm};">${helpText}</div>` : ''}
      </div>
    `;
  },

  /**
   * Instructions component with numbered list
   */
  instructions: (title: string, steps: string[]) => `
    <div class="instructions">
      <h3>${title}</h3>
      <ol>
        ${steps.map(step => `<li>${step}</li>`).join('\n        ')}
      </ol>
    </div>
  `,

  /**
   * Highlight box for important information
   */
  highlightBox: (content: string, title?: string) => `
    <div class="highlight-box">
      ${title ? `<div class="section-title" style="color: ${emailTheme.colors.teamSuccessText}; margin-bottom: ${emailTheme.spacing.lg};">${title}</div>` : ''}
      ${content}
    </div>
  `,

  /**
   * Info box component
   */
  infoBox: (content: string, title?: string) => `
    <div class="info-box">
      ${title ? `<div class="section-title" style="color: ${emailTheme.colors.teamInfoText}; margin-bottom: ${emailTheme.spacing.lg};">${title}</div>` : ''}
      <div style="color: ${emailTheme.colors.teamInfoText};">${content}</div>
    </div>
  `,

  /**
   * Warning box component
   */
  warningBox: (content: string, title?: string) => `
    <div class="warning-box">
      ${title ? `<div class="section-title" style="color: ${emailTheme.colors.warningText}; margin-bottom: ${emailTheme.spacing.lg};"><strong>${title}</strong></div>` : ''}
      <div style="color: ${emailTheme.colors.warningText};">${content}</div>
    </div>
  `,

  /**
   * Error box component
   */
  errorBox: (content: string, title?: string) => `
    <div class="error-box">
      ${title ? `<div class="section-title" style="color: ${emailTheme.colors.errorText}; margin-bottom: ${emailTheme.spacing.lg};"><strong>${title}</strong></div>` : ''}
      <div style="color: ${emailTheme.colors.errorText};">${content}</div>
    </div>
  `,

  /**
   * Stats display component
   */
  stats: (options: StatsOptions) => {
    const { label, value, inline = false } = options;

    if (inline) {
      return `
        <div class="stats-container">
          <div class="stats-label">${label}:</div>
          <div class="stats-value">${value}</div>
        </div>
      `;
    }

    return `
      <div style="text-align: center; margin: ${emailTheme.spacing['3xl']} 0;">
        <div class="stats-container">
          <div class="stats-label">${label}</div>
          <div class="stats-value">${value}</div>
        </div>
      </div>
    `;
  },

  /**
   * Member highlight component for team emails
   */
  memberHighlight: (name: string, email: string, additionalInfo?: string) => `
    <div class="highlight-box">
      <div class="member-name">${name}</div>
      <div class="member-email">${email}</div>
      ${additionalInfo || ''}
    </div>
  `,

  /**
   * Simple table component
   */
  table: (headers: string[], rows: string[][]) => `
    <table class="table">
      <thead>
        <tr>
          ${headers.map(header => `<th>${header}</th>`).join('\n          ')}
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            row => `
        <tr>
          ${row.map(cell => `<td>${cell}</td>`).join('\n          ')}
        </tr>`,
          )
          .join('\n        ')}
      </tbody>
    </table>
  `,

  /**
   * Download table for data exports
   */
  downloadTable: (files: Array<{ filename: string; size: string; url: string }>) => {
    const rows = files.map(file => [
      `<strong>${file.filename}</strong>`,
      file.size,
      emailComponents.button('Download', file.url, { variant: 'info' }),
    ]);

    return emailComponents.table(['File', 'Size', 'Download'], rows);
  },

  /**
   * Feature list component
   */
  featureList: (features: string[], title?: string) => `
    <div class="info-box">
      ${title ? `<div class="section-title" style="color: ${emailTheme.colors.teamInfoText}; margin-bottom: ${emailTheme.spacing.lg};">${title}</div>` : ''}
      <ul style="margin: 0; padding-left: ${emailTheme.spacing.xl};">
        ${features.map(feature => `<li style="color: ${emailTheme.colors.teamInfoText}; margin-bottom: ${emailTheme.spacing.sm}; font-size: ${emailTheme.typography.sizes.small};">${feature}</li>`).join('\n        ')}
      </ul>
    </div>
  `,

  /**
   * Footer component
   */
  footer: (appName = 'SuperLytics', additionalText?: string) => `
    <div class="footer">
      ${additionalText ? `${additionalText}<br><br>` : ''}
      © ${new Date().getFullYear()} ${appName}. All rights reserved.
    </div>
  `,

  /**
   * Spacer component for vertical spacing
   */
  spacer: (size: 'sm' | 'md' | 'lg' | 'xl' = 'md') => {
    const spacingMap = {
      sm: emailTheme.spacing.lg,
      md: emailTheme.spacing.xl,
      lg: emailTheme.spacing['2xl'],
      xl: emailTheme.spacing['3xl'],
    };

    return `<div style="height: ${spacingMap[size]};"></div>`;
  },
};
