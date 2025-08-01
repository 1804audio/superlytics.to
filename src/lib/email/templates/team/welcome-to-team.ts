import { EmailTemplate, WelcomeToTeamData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';
import { pluralize } from '../../utils';

export const welcomeToTeamTemplate: EmailTemplate<WelcomeToTeamData> = {
  subject: data => `🎉 Welcome to ${data.teamName} on ${data.appName}`,

  preheader: data =>
    `You've successfully joined ${data.teamName}! Start exploring your team's analytics dashboard.`,

  html: data => {
    const websiteText = `${data.websiteCount} ${pluralize(data.websiteCount, 'website')}`;

    const content = `
      ${emailComponents.greeting(data.username)}
      
      ${emailComponents.message(`
        Congratulations! You've successfully joined the team and now have access to collaborative analytics.
      `)}
      
      ${emailComponents.highlightBox(`
        <div style="font-size: 24px; font-weight: 600; color: #155724;">
          Welcome to ${data.teamName}! 🎉
        </div>
      `)}
      
      ${emailComponents.featureList(
        [
          `<strong>${websiteText}</strong> with analytics data`,
          'Team analytics dashboard',
          'Shared reports and insights',
          'Collaborative workspace',
        ],
        'You now have access to:',
      )}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Go to Team Dashboard', data.teamDashboardUrl, {
          variant: 'success',
        }),
      ])}`;

    return emailLayouts.standard(content, {
      title: `Welcome to ${data.teamName} - ${data.appName}`,
      appName: data.appName,
      preheader: welcomeToTeamTemplate.preheader!(data),
      footerText: "Ready to explore your team's analytics! 📊",
    });
  },

  text: data => `
Welcome to ${data.teamName}!

Hi ${data.username},

Congratulations! You've successfully joined the ${data.teamName} team on ${data.appName}.

You now have access to:
• ${data.websiteCount} ${pluralize(data.websiteCount, 'website')} with analytics data
• Team analytics dashboard
• Shared reports and insights
• Collaborative workspace

Visit your team dashboard: ${data.teamDashboardUrl}

Ready to explore your team's analytics! 📊

© ${new Date().getFullYear()} ${data.appName}
  `,
};
