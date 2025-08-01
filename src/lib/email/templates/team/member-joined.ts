import { EmailTemplate, MemberJoinedData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';
import { pluralize } from '../../utils';

export const memberJoinedTemplate: EmailTemplate<MemberJoinedData> = {
  subject: data => `🎉 ${data.memberName} joined your ${data.teamName} team`,

  preheader: data =>
    `${data.memberName} (${data.memberEmail}) has joined your ${data.teamName} team. Your team now has ${data.teamSize} members.`,

  html: data => {
    const teamSizeText = `${data.teamSize} ${pluralize(data.teamSize, 'member')}`;

    const content = `
      ${emailComponents.message(
        `
        <div style="font-size: 18px; color: #28a745; font-weight: 600; margin-bottom: 20px;">
          Good news! 🎉
        </div>
      `,
        'greeting',
      )}
      
      ${emailComponents.message(`
        A new member has joined your <strong>${data.teamName}</strong> team.
      `)}
      
      ${emailComponents.memberHighlight(
        data.memberName,
        data.memberEmail,
        emailComponents.stats({
          label: 'Team size',
          value: teamSizeText,
          inline: true,
        }),
      )}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Manage Team', data.teamManageUrl, {
          variant: 'info',
        }),
      ])}`;

    return emailLayouts.notification(content, {
      title: `New member joined ${data.teamName} - ${data.appName}`,
      appName: data.appName,
      preheader: memberJoinedTemplate.preheader!(data),
      footerText: 'Your team is growing! 🚀',
    });
  },

  text: data => `
Good news! New member joined ${data.teamName}

A new member has joined your ${data.teamName} team on ${data.appName}.

New Member: ${data.memberName} (${data.memberEmail})
Team size: ${data.teamSize} ${pluralize(data.teamSize, 'member')}

Manage your team: ${data.teamManageUrl}

Your team is growing! 🚀

© ${new Date().getFullYear()} ${data.appName}
  `,
};
