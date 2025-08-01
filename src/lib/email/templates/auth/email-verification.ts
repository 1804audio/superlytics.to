import { EmailTemplate, EmailVerificationData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';

export const emailVerificationTemplate: EmailTemplate<EmailVerificationData> = {
  subject: data => `Verify your ${data.appName} email address`,

  preheader: data =>
    `Welcome to ${data.appName}! Verify your email to start using your analytics dashboard.`,

  html: data => {
    const content = `
      ${emailComponents.greeting(data.username)}
      
      ${emailComponents.message(`
        Thank you for signing up! To get started with your analytics dashboard, please verify your email address by clicking the button below:
      `)}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Verify Email Address', data.verificationUrl, {
          variant: 'success',
          size: 'large',
        }),
      ])}
      
      ${emailComponents.message(
        `
        <div style="font-size: 14px; color: #666; margin: 30px 0 15px 0;">
          If the button doesn't work, you can copy and paste this link into your browser:
        </div>
        <div style="background: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 4px; 
                    word-break: break-all; font-size: 14px; color: #007bff; margin-bottom: 30px;">
          ${data.verificationUrl}
        </div>
      `,
        'small-text',
      )}
      
      ${emailComponents.infoBox(`
        <div style="font-size: 16px; font-weight: 600; color: #1565c0; margin-bottom: 15px;">
          🚀 What's next?
        </div>
        <div style="font-size: 14px; color: #1565c0; margin-bottom: 10px;">
          Once you verify your email, you'll be able to:
        </div>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">Set up your first website for tracking</li>
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">Access your analytics dashboard</li>
          <li style="color: #1565c0; margin-bottom: 8px; font-size: 14px;">Configure privacy-focused analytics</li>
        </ul>
      `)}
      
      ${emailComponents.warningBox(`
        <strong>Note:</strong> This verification link will expire in 24 hours.
      `)}

      ${emailComponents.footer(data.appName, 'If you have questions, reply to this email or contact our support team.')}
    `;

    return emailLayouts.standard(content, {
      title: `Verify Your Email - ${data.appName}`,
      appName: data.appName,
      preheader: emailVerificationTemplate.preheader!(data),
    });
  },

  text: data => `
Welcome to ${data.appName}!

Hi ${data.username},

Thank you for signing up! To get started with your analytics dashboard, please verify your email address by visiting this link:

${data.verificationUrl}

This verification link will expire in 24 hours.

Once you verify your email, you'll be able to:
- Set up your first website for tracking
- Access your analytics dashboard
- Configure privacy-focused analytics

© ${new Date().getFullYear()} ${data.appName}
  `,
};
