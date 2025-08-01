import { globalEmailStyles } from './styles';
import { emailComponents } from './components';
import { emailTheme } from './theme';

export interface EmailLayoutOptions {
  title: string;
  appName?: string;
  preheader?: string;
  footerText?: string;
}

export const emailLayouts = {
  /**
   * Standard email layout - Clean & Minimal
   */
  standard: (content: string, options: EmailLayoutOptions) => {
    const { title, appName = 'SuperLytics', preheader, footerText } = options;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${preheader ? `<meta name="description" content="${preheader}">` : ''}
          <style>${globalEmailStyles}</style>
        </head>
        <body>
          ${
            preheader
              ? `
          <!--[if !gte mso 9]><!-->
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${preheader}
          </div>
          <!--<![endif]-->
          `
              : ''
          }
          <div class="container">
            ${emailComponents.logo(appName)}
            ${content}
            ${emailComponents.footer(appName, footerText)}
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Simple layout without logo for system emails
   */
  simple: (content: string, options: EmailLayoutOptions) => {
    const { title, preheader, appName = 'SuperLytics', footerText } = options;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${preheader ? `<meta name="description" content="${preheader}">` : ''}
          <style>${globalEmailStyles}</style>
        </head>
        <body>
          ${
            preheader
              ? `
          <!--[if !gte mso 9]><!-->
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${preheader}
          </div>
          <!--<![endif]-->
          `
              : ''
          }
          <div class="container">
            ${content}
            ${emailComponents.footer(appName, footerText)}
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Notification layout - Clean Design
   */
  notification: (content: string, options: EmailLayoutOptions) => {
    const { title, appName = 'SuperLytics', preheader, footerText } = options;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${preheader ? `<meta name="description" content="${preheader}">` : ''}
          <style>
            ${globalEmailStyles}
            .notification-badge {
              background: ${emailTheme.colors.primary};
              color: white;
              padding: 6px 16px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 500;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: inline-block;
              margin-bottom: 16px;
            }
          </style>
        </head>
        <body>
          ${
            preheader
              ? `
          <!--[if !gte mso 9]><!-->
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${preheader}
          </div>
          <!--<![endif]-->
          `
              : ''
          }
          <div class="container">
            ${emailComponents.logo(appName)}
            <div class="notification-badge">Notification</div>
            ${content}
            ${emailComponents.footer(appName, footerText)}
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Marketing layout - Professional & Clean
   */
  marketing: (content: string, options: EmailLayoutOptions) => {
    const { title, appName = 'SuperLytics', preheader, footerText } = options;

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
          ${preheader ? `<meta name="description" content="${preheader}">` : ''}
          <style>
            ${globalEmailStyles}
            .marketing-header {
              background: ${emailTheme.colors.primary};
              color: white;
              padding: 32px;
              text-align: center;
              margin: -32px -32px 32px -32px;
              border-radius: 4px 4px 0 0;
            }
            .marketing-header .logo {
              color: white;
              margin-bottom: 0;
              font-size: ${emailTheme.typography.sizes.h3};
            }
          </style>
        </head>
        <body>
          ${
            preheader
              ? `
          <!--[if !gte mso 9]><!-->
          <div style="display: none; max-height: 0; overflow: hidden;">
            ${preheader}
          </div>
          <!--<![endif]-->
          `
              : ''
          }
          <div class="container">
            <div class="marketing-header">
              ${emailComponents.logo(appName)}
            </div>
            ${content}
            ${emailComponents.footer(appName, footerText)}
          </div>
        </body>
      </html>
    `;
  },
};
