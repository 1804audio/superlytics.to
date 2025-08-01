import { EmailTemplate, TeamInvitationData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';
import { createEmailUrl } from '../../utils';

export const teamInvitationTemplate: EmailTemplate<TeamInvitationData> = {
  subject: data => `🎉 You're invited to join ${data.teamName} on ${data.appName}`,

  preheader: data =>
    `${data.inviterName} invited you to join the ${data.teamName} team. Get your access code and start collaborating!`,

  html: data => {
    const loginUrl = createEmailUrl(`${data.loginUrl}`, data.email);
    const signupUrl = createEmailUrl(`${data.signupUrl}`, data.email);

    const content = `
      ${emailComponents.genericGreeting()}
      
      ${emailComponents.message(`
        <strong>${data.inviterName}</strong> has invited you to join the <strong>${data.teamName}</strong> team on ${data.appName}.
      `)}

      ${emailComponents.accessCode(data.accessCode, {
        description: 'Your Team Access Code:',
        helpText: "Copy this code - you'll need it to join the team",
      })}

      ${emailComponents.instructions('📋 How to Join:', [
        "<strong>Choose an option below:</strong> Login if you have an account, or Create Account if you're new",
        '<strong>After logging in:</strong> Click Profile dropdown → Teams → Join Team',
        '<strong>Paste the access code</strong> shown above when prompted',
        `<strong>That's it!</strong> You'll be part of the ${data.teamName} team`,
      ])}

      ${emailComponents.buttonContainer([
        emailComponents.button('🔑 Login to SuperLytics', loginUrl, { variant: 'success' }),
        emailComponents.button('✨ Create Account', signupUrl, { variant: 'primary' }),
      ])}

      ${emailComponents.warningBox(`
        <strong>💡 Quick Tip:</strong> After logging in or creating your account, 
        go to <strong>Profile dropdown → Teams → Join Team</strong> and paste the access code above.
      `)}

      ${emailComponents.message(
        `
        <p style="text-align: center; margin-top: 40px; color: #6c757d; font-size: 14px;">
          This invitation was sent by ${data.inviterName}<br>
          If you weren't expecting this invitation, you can safely ignore this email.
        </p>
      `,
        'small-text',
      )}
    `;

    return emailLayouts.standard(content, {
      title: `You're invited to join ${data.teamName} - ${data.appName}`,
      appName: data.appName,
      preheader: teamInvitationTemplate.preheader!(data),
    });
  },

  text: data => `
You're invited to join ${data.teamName} on ${data.appName}!

Hi there,

${data.inviterName} has invited you to join the "${data.teamName}" team on ${data.appName}.

Your Team Access Code: ${data.accessCode}

How to Join:
1. Choose an option: Login if you have an account, or Create Account if you're new
2. After logging in: Click Profile dropdown → Teams → Join Team
3. Paste the access code shown above when prompted
4. That's it! You'll be part of the ${data.teamName} team

Login: ${createEmailUrl(data.loginUrl, data.email)}
Create Account: ${createEmailUrl(data.signupUrl, data.email)}

Quick Tip: After logging in or creating your account, go to Profile dropdown → Teams → Join Team and paste the access code above.

This invitation was sent by ${data.inviterName}
If you weren't expecting this invitation, you can safely ignore this email.

© ${new Date().getFullYear()} ${data.appName}. All rights reserved.
  `,
};
