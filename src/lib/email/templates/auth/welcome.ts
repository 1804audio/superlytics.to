import { EmailTemplate, WelcomeEmailData } from '../../types';
import { emailComponents, emailLayouts } from '../../design-system';

export const welcomeTemplate: EmailTemplate<WelcomeEmailData> = {
  subject: data => `🎉 Welcome to ${data.appName} - You're all set!`,

  preheader: data =>
    `Your email has been verified! Start exploring your ${data.appName} analytics dashboard and set up your first website.`,

  html: data => {
    const content = `
      ${emailComponents.greeting(data.username)}
      
      ${emailComponents.message(`
        Your email has been verified successfully! Welcome to ${data.appName}.
      `)}
      
      ${emailComponents.buttonContainer([
        emailComponents.button('Go to Dashboard', data.dashboardUrl, {
          variant: 'success',
          size: 'large',
        }),
      ])}

      ${emailComponents.footer(data.appName, 'Happy analyzing! 📊')}
    `;

    return emailLayouts.marketing(content, {
      title: `Welcome to ${data.appName} - You're all set!`,
      appName: data.appName,
      preheader: welcomeTemplate.preheader!(data),
    });
  },

  text: data => `
Welcome to ${data.appName}!

Hi ${data.username},

Your email has been verified successfully! Welcome to the privacy-focused analytics platform.

Get Started:
1. Add your first website - Set up tracking for your site
2. Install the tracking script - Get detailed instructions in your dashboard
3. Explore your analytics - View visitor data, page views, and more
4. Configure privacy settings - Customize data collection preferences

Visit your dashboard: ${data.dashboardUrl}

Need help? Check out our documentation or reach out to our support team.

© ${new Date().getFullYear()} ${data.appName}
Happy analyzing! 📊
  `,
};
