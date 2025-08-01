import { EmailTemplate, PasswordResetData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';

export const passwordResetTemplate: EmailTemplate<PasswordResetData> = {
  subject: data => `Reset your ${data.appName} password`,

  preheader: data =>
    `Reset your password for ${data.appName}. This link expires in 1 hour for security.`,

  html: data => {
    const content = `
      ${emailComponents.greeting(data.username)}
      
      ${emailComponents.message(`
        We received a request to reset your password. Click the button below to reset it:
      `)}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Reset Password', data.resetUrl, {
          variant: 'danger',
          size: 'large',
        }),
      ])}
      
      ${emailComponents.warningBox(`
        <strong>Important:</strong> This link will expire in 1 hour for security reasons.<br><br>
        If you didn't request this password reset, please ignore this email.
      `)}
    `;

    return emailLayouts.standard(content, {
      title: `Reset Your Password - ${data.appName}`,
      appName: data.appName,
      preheader: passwordResetTemplate.preheader!(data),
    });
  },

  text: data => `
Reset Your Password

Hi ${data.username},

We received a request to reset your password for your ${data.appName} account.

Reset your password by visiting this link:
${data.resetUrl}

This link will expire in 1 hour for security reasons.

If you didn't request a password reset, please ignore this email.

© ${new Date().getFullYear()} ${data.appName}
  `,
};
