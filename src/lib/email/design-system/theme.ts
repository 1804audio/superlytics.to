export const emailTheme = {
  colors: {
    // Brand colors
    primary: '#007bff',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',

    // Neutral colors
    background: '#f8f9fa',
    surface: '#ffffff',
    border: '#dee2e6',
    borderLight: '#eee',
    borderDashed: '#dee2e6',

    // Text colors
    textPrimary: '#333',
    textSecondary: '#666',
    textMuted: '#6c757d',
    textLight: '#999',

    // State colors
    errorBg: '#f8d7da',
    errorBorder: '#f5c6cb',
    errorText: '#721c24',

    warningBg: '#fff3cd',
    warningBorder: '#ffeaa7',
    warningText: '#856404',

    successBg: '#d4edda',
    successBorder: '#c3e6cb',
    successText: '#155724',

    infoBg: '#d1ecf1',
    infoBorder: '#bee5eb',
    infoText: '#0c5460',

    // Team colors
    teamSuccess: '#e8f5e8',
    teamSuccessBorder: '#c3e6c3',
    teamSuccessText: '#155724',

    teamInfo: '#e3f2fd',
    teamInfoBorder: '#bbdefb',
    teamInfoText: '#1565c0',
  },

  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    fontFamilyMono: '"Monaco", "Menlo", "Ubuntu Mono", monospace',

    sizes: {
      logo: '32px',
      h1: '28px',
      h2: '24px',
      h3: '20px',
      h4: '18px',
      body: '16px',
      small: '14px',
      xs: '12px',
      code: '24px',
    },

    weights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },

    lineHeight: {
      tight: '1.2',
      normal: '1.5',
      relaxed: '1.6',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
    '4xl': '40px',
    '5xl': '48px',
  },

  borderRadius: {
    sm: '4px',
    md: '6px',
    lg: '8px',
  },

  shadows: {
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 2px 4px rgba(0,0,0,0.1)',
    lg: '0 4px 8px rgba(0,0,0,0.15)',
  },

  breakpoints: {
    mobile: '480px',
    tablet: '768px',
    desktop: '1024px',
  },
};

export type EmailTheme = typeof emailTheme;
