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
        }),
      ])}
      
      ${emailComponents.message(`
        <p style="font-size: 12px; color: #666;">If the button doesn't work, copy this link:</p>
        <p style="font-size: 12px; word-break: break-all;"><a href="${data.verificationUrl}">${data.verificationUrl}</a></p>
      `)}
      
      ${emailComponents.infoBox(`
        <strong>🚀 What's next?</strong><br>
        Once verified, you can set up tracking, access your dashboard, and configure analytics.
      `)}
      
      ${emailComponents.warningBox(`
        <strong>Note:</strong> This verification link will expire in 24 hours.
      `)}`;

    return emailLayouts.standard(content, {
      title: `Verify Your Email - ${data.appName}`,
      appName: data.appName,
      preheader: emailVerificationTemplate.preheader!(data),
      footerText: 'If you have questions, reply to this email or contact our support team.',
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
