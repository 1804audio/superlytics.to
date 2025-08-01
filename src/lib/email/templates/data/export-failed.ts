import { EmailTemplate, DataExportFailedData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';

export const dataExportFailedTemplate: EmailTemplate<DataExportFailedData> = {
  subject: data => `❌ ${data.appName} data export failed`,

  preheader: data =>
    `Your ${data.appName} data export request failed due to a technical issue. You can try again or contact support for assistance.`,

  html: data => {
    const content = `
      ${emailComponents.greeting(data.username)}
      
      ${emailComponents.message(`
        We encountered an issue while processing your data export request. 
        We apologize for the inconvenience.
      `)}
      
      ${emailComponents.errorBox(`
        <div style="font-size: 16px; font-weight: 600; color: #721c24; margin-bottom: 15px;">
          ❌ Export Failed
        </div>
        <div style="font-size: 14px; color: #721c24;">
          Unfortunately, we couldn't complete your data export due to a technical issue.
          ${data.error ? ` Error details: ${data.error}` : ''}
        </div>
      `)}
      
      ${emailComponents.message(`
        Our team has been notified and will investigate this issue. 
        You can try requesting your export again, or contact our support team for assistance.
      `)}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Try Export Again', data.retryUrl, {
          variant: 'primary',
          size: 'large',
        }),
      ])}

      ${emailComponents.footer(data.appName, `Need help? Contact us at ${data.supportEmail}`)}
    `;

    return emailLayouts.standard(content, {
      title: `Data Export Failed - ${data.appName}`,
      appName: data.appName,
      preheader: dataExportFailedTemplate.preheader!(data),
    });
  },

  text: data => `
Data Export Failed

Hi ${data.username},

We encountered an issue while processing your data export request from ${data.appName}. We apologize for the inconvenience.

${data.error ? `Error details: ${data.error}` : ''}

Our team has been notified and will investigate this issue. You can try requesting your export again at: ${data.retryUrl}

Need help? Contact us at ${data.supportEmail}

© ${new Date().getFullYear()} ${data.appName}
  `,
};
