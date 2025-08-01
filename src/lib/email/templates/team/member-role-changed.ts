import { EmailTemplate } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';

export interface MemberRoleChangedData {
  memberName: string;
  memberEmail: string;
  teamName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  appName: string;
}

export const memberRoleChangedTemplate: EmailTemplate<MemberRoleChangedData> = {
  subject: data => `🔄 Your role in ${data.teamName} has been updated`,

  preheader: data =>
    `${data.changedBy} has updated your role from ${data.oldRole} to ${data.newRole} in the ${data.teamName} team.`,

  html: data => {
    // Format role names for display
    const formatRole = (role: string) => {
      const roleMap: { [key: string]: string } = {
        'team-owner': 'Team Owner',
        'team-manager': 'Team Manager',
        'team-member': 'Team Member',
        'team-view-only': 'View Only',
      };
      return roleMap[role] || role;
    };

    const formattedOldRole = formatRole(data.oldRole);
    const formattedNewRole = formatRole(data.newRole);

    // Determine if this is a promotion or demotion
    const roleHierarchy = ['team-view-only', 'team-member', 'team-manager', 'team-owner'];
    const oldIndex = roleHierarchy.indexOf(data.oldRole);
    const newIndex = roleHierarchy.indexOf(data.newRole);
    const isPromotion = newIndex > oldIndex;

    const changeIcon = isPromotion ? '⬆️' : '🔄';
    const changeText = isPromotion ? 'promoted' : 'updated';

    const content = `
      ${emailComponents.greeting(data.memberName)}
      
      ${emailComponents.message(`
        <strong>${data.changedBy}</strong> has ${changeText} your role in the <strong>${data.teamName}</strong> team.
      `)}
      
      ${emailComponents.infoBox(`
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 18px; font-weight: 600; color: #1565c0; margin-bottom: 20px;">
            ${changeIcon} Role Update
          </div>
          <div style="display: flex; align-items: center; justify-content: center; gap: 20px;">
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #666; margin-bottom: 5px;">Previous Role</div>
              <div style="font-size: 16px; font-weight: 600; color: #666; padding: 8px 16px; background: #f8f9fa; border-radius: 4px;">
                ${formattedOldRole}
              </div>
            </div>
            <div style="font-size: 24px; color: #1565c0;">→</div>
            <div style="text-align: center;">
              <div style="font-size: 14px; color: #1565c0; margin-bottom: 5px;">New Role</div>
              <div style="font-size: 16px; font-weight: 600; color: #1565c0; padding: 8px 16px; background: #e3f2fd; border: 1px solid #bbdefb; border-radius: 4px;">
                ${formattedNewRole}
              </div>
            </div>
          </div>
        </div>
      `)}
      
      ${emailComponents.message(`
        ${
          data.newRole === 'team-manager' || data.newRole === 'team-owner'
            ? `
          <strong>🎉 Congratulations!</strong> With your new ${formattedNewRole} role, you now have additional permissions to help manage the team.
        `
            : data.newRole === 'team-member'
              ? `
          As a ${formattedNewRole}, you can access team analytics and collaborate with your teammates.
        `
              : `
          As a ${formattedNewRole} member, you can view team analytics and reports.
        `
        }
      `)}
      
      ${emailComponents.buttonContainer([
        emailComponents.button(
          'Go to Team Dashboard',
          `${process.env.NEXT_PUBLIC_APP_URL}/settings/teams`,
          {
            variant: 'primary',
            size: 'large',
          },
        ),
      ])}

      ${emailComponents.footer(data.appName, 'Questions about your new role? Contact your team owner or our support team.')}
    `;

    return emailLayouts.standard(content, {
      title: `Role Updated in ${data.teamName} - ${data.appName}`,
      appName: data.appName,
      preheader: memberRoleChangedTemplate.preheader!(data),
    });
  },

  text: data => {
    const formatRole = (role: string) => {
      const roleMap: { [key: string]: string } = {
        'team-owner': 'Team Owner',
        'team-manager': 'Team Manager',
        'team-member': 'Team Member',
        'team-view-only': 'View Only',
      };
      return roleMap[role] || role;
    };

    return `
Your Role Has Been Updated

Hi ${data.memberName},

${data.changedBy} has updated your role in the ${data.teamName} team.

Role Change:
Previous Role: ${formatRole(data.oldRole)}
New Role: ${formatRole(data.newRole)}

${
  data.newRole === 'team-manager' || data.newRole === 'team-owner'
    ? `
Congratulations! With your new ${formatRole(data.newRole)} role, you now have additional permissions to help manage the team.
`
    : data.newRole === 'team-member'
      ? `
As a ${formatRole(data.newRole)}, you can access team analytics and collaborate with your teammates.
`
      : `
As a ${formatRole(data.newRole)} member, you can view team analytics and reports.
`
}

Go to your team dashboard: ${process.env.NEXT_PUBLIC_APP_URL}/settings/teams

Questions about your new role? Contact your team owner or our support team.

© ${new Date().getFullYear()} ${data.appName}
    `;
  },
};
