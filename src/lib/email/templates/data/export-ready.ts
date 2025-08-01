import { EmailTemplate, DataExportReadyData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';

export const dataExportReadyTemplate: EmailTemplate<DataExportReadyData> = {
  subject: data => `📊 Your ${data.appName} data export is ready`,

  preheader: data =>
    `Your analytics data export has been processed and is ready for download. Files expire in ${data.expiryHours} hours.`,

  html: data => {
    const content = `
      ${emailComponents.greeting(data.username)}
      
      ${emailComponents.message(`
        Great news! Your data export has been processed and is ready for download. 
        Your analytics data has been compiled into the following files:
      `)}
      
      ${emailComponents.downloadTable(data.downloadLinks)}
      
      ${emailComponents.infoBox(`
        <div style="font-size: 16px; font-weight: 600; color: #1565c0; margin-bottom: 15px;">
          📊 What's included:
        </div>
        <div style="font-size: 14px; color: #1565c0; margin-bottom: 10px;">
          Your export contains all your analytics data in CSV format:
        </div>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">
            <strong>Website Events:</strong> Page views, clicks, and custom events
          </li>
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">
            <strong>Session Data:</strong> Visitor sessions with device and location info
          </li>
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">
            <strong>Website Settings:</strong> Your tracked websites and configurations
          </li>
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">
            <strong>Reports:</strong> Any saved reports and their configurations
          </li>
        </ul>
      `)}
      
      ${emailComponents.warningBox(`
        <strong>⏰ Important:</strong> These download links will expire in ${data.expiryHours} hours for security reasons.<br><br>
        <strong>🔒 Privacy:</strong> Your data files are securely stored and will be automatically deleted after ${data.expiryHours} hours.
      `)}

      ${emailComponents.footer(data.appName, "Need help with your export? Reply to this email and we'll assist you.")}
    `;

    return emailLayouts.standard(content, {
      title: `Your Data Export is Ready - ${data.appName}`,
      appName: data.appName,
      preheader: dataExportReadyTemplate.preheader!(data),
    });
  },

  text: data => {
    const textLinks = data.downloadLinks
      .map(link => `${link.filename} (${link.size}): ${link.url}`)
      .join('\n');

    return `
Your Data Export is Ready

Hi ${data.username},

Great news! Your data export from ${data.appName} has been processed and is ready for download.

Download Links:
${textLinks}

What's included:
- Website Events: Page views, clicks, and custom events
- Session Data: Visitor sessions with device and location info  
- Website Settings: Your tracked websites and configurations
- Reports: Any saved reports and their configurations

IMPORTANT: These download links will expire in ${data.expiryHours} hours for security reasons.

© ${new Date().getFullYear()} ${data.appName}
    `;
  },
};
