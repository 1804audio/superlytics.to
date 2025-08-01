import { EmailTemplate, MemberLeftData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';
import { pluralize } from '../../utils';

export const memberLeftTemplate: EmailTemplate<MemberLeftData> = {
  subject: data => `📤 ${data.memberName} left your ${data.teamName} team`,

  preheader: data =>
    `${data.memberName} (${data.memberEmail}) has left your ${data.teamName} team. Your team now has ${data.teamSize} members.`,

  html: data => {
    const teamSizeText = `${data.teamSize} ${pluralize(data.teamSize, 'member')}`;

    const content = `
      ${emailComponents.greeting('Hi there')}
      
      ${emailComponents.message(`
        A member has left your <strong>${data.teamName}</strong> team on ${data.appName}.
      `)}
      
      ${emailComponents.warningBox(`
        <div style="font-size: 20px; font-weight: 600; color: #856404; margin-bottom: 5px;">
          ${data.memberName}
        </div>
        <div style="font-size: 14px; color: #6c5700;">
          ${data.memberEmail}
        </div>
      `)}
      
      ${emailComponents.stats({
        label: 'Current Team Size',
        value: teamSizeText,
      })}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Manage Team', data.teamManageUrl, {
          variant: 'info',
          size: 'large',
        }),
      ])}

      ${emailComponents.footer(data.appName, 'Need to invite new members? You can do that from your team settings.')}
    `;

    return emailLayouts.notification(content, {
      title: `Member left ${data.teamName} - ${data.appName}`,
      appName: data.appName,
      preheader: memberLeftTemplate.preheader!(data),
    });
  },

  text: data => `
Member left ${data.teamName}

A member has left your ${data.teamName} team on ${data.appName}.

Member who left: ${data.memberName} (${data.memberEmail})
Current team size: ${data.teamSize} ${pluralize(data.teamSize, 'member')}

Manage your team: ${data.teamManageUrl}

Need to invite new members? You can do that from your team settings.

© ${new Date().getFullYear()} ${data.appName}
  `,
};
