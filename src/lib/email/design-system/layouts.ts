import { globalEmailStyles } from './styles';
import { emailComponents } from './components';

export interface EmailLayoutOptions {
  title: string;
  appName?: string;
  preheader?: string;
}

export const emailLayouts = {
  /**
   * Standard email layout with container, logo, and footer
   */
  standard: (content: string, options: EmailLayoutOptions) => {
    const { title, appName = 'SuperLytics', preheader } = options;

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
            ${emailComponents.footer(appName)}
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Simple layout without logo for system emails
   */
  simple: (content: string, options: EmailLayoutOptions) => {
    const { title, preheader } = options;

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
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Notification layout with emphasis styling
   */
  notification: (content: string, options: EmailLayoutOptions) => {
    const { title, appName = 'SuperLytics', preheader } = options;

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
              background: linear-gradient(135deg, #007bff, #0056b3);
              color: white;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              display: inline-block;
              margin-bottom: 20px;
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
            ${emailComponents.footer(appName)}
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Marketing layout with enhanced styling
   */
  marketing: (content: string, options: EmailLayoutOptions) => {
    const { title, appName = 'SuperLytics', preheader } = options;

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
              background: linear-gradient(135deg, #007bff, #0056b3);
              color: white;
              padding: 40px;
              text-align: center;
              margin: -40px -40px 40px -40px;
              border-radius: 8px 8px 0 0;
            }
            .marketing-header .logo {
              color: white;
              margin-bottom: 0;
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
            ${emailComponents.footer(appName)}
          </div>
        </body>
      </html>
    `;
  },
};
