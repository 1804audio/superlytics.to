import debug from 'debug';
import {
  EmailOptions,
  EmailConfig,
  IEmailService,
  DataExportFile,
  TeamInvitationData,
  WelcomeToTeamData,
  MemberJoinedData,
  MemberLeftData,
  PasswordResetData,
  EmailVerificationData,
  WelcomeEmailData,
  DataExportReadyData,
  DataExportFailedData,
} from './types';
import { emailTemplates } from './templates';
import { createEmailConfig, logEmailOperation, isValidEmail } from './utils';

const log = debug('superlytics:email');

export class EmailService implements IEmailService {
  private config: EmailConfig;

  constructor() {
    this.config = createEmailConfig();

    if (!this.config.apiKey) {
      log('Warning: EMAILIT_API_KEY not configured. Email functionality will be disabled.');
    }
  }

  /**
   * Core email sending method
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.config.apiKey) {
      log('Email service not configured. Skipping email send.');
      return false;
    }

    // Validate email addresses
    const recipients = Array.isArray(options.to) ? options.to : [options.to];
    const invalidEmails = recipients.filter(email => !isValidEmail(email));

    if (invalidEmails.length > 0) {
      log('Invalid email addresses:', invalidEmails);
      return false;
    }

    try {
      const emailPayload = {
        from: options.from || `${this.config.appName} <${this.config.fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        ...(options.text && { text: options.text }),
      };

      const response = await fetch(`${this.config.apiBaseUrl}/v1/emails`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailPayload),
      });

      if (!response.ok) {
        const error = await response.text();
        log('Email send failed:', response.status, error);
        logEmailOperation('Email send failed', options.to, false, error);
        return false;
      }

      const result = await response.json();
      log('Email sent successfully via EmailIt:', result);
      logEmailOperation('Email sent', options.to, true);
      return true;
    } catch (error) {
      log('Email send error:', error);
      logEmailOperation('Email send error', options.to, false, error);
      return false;
    }
  }

  // Authentication emails
  async sendPasswordReset(email: string, resetToken: string, username: string): Promise<boolean> {
    const resetUrl = `${this.config.appUrl}/reset-password?token=${resetToken}`;

    const data: PasswordResetData = {
      username,
      resetToken,
      resetUrl,
      appName: this.config.appName,
      appUrl: this.config.appUrl,
    };

    const template = emailTemplates.auth.passwordReset;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  async sendEmailVerification(
    email: string,
    verificationToken: string,
    username: string,
  ): Promise<boolean> {
    const verificationUrl = `${this.config.appUrl}/verify-email?token=${verificationToken}`;

    const data: EmailVerificationData = {
      username,
      verificationToken,
      verificationUrl,
      appName: this.config.appName,
      appUrl: this.config.appUrl,
    };

    const template = emailTemplates.auth.emailVerification;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    const dashboardUrl = `${this.config.appUrl}/dashboard`;

    const data: WelcomeEmailData = {
      username,
      dashboardUrl,
      appName: this.config.appName,
    };

    const template = emailTemplates.auth.welcome;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  // Team emails
  async sendTeamInvitation(
    email: string,
    teamName: string,
    inviterName: string,
    accessCode: string,
  ): Promise<boolean> {
    const loginUrl = `${this.config.appUrl}/login`;
    const signupUrl = `${this.config.appUrl}/signup`;

    const data: TeamInvitationData = {
      email,
      teamName,
      inviterName,
      accessCode,
      loginUrl,
      signupUrl,
      appName: this.config.appName,
    };

    const template = emailTemplates.team.invitation;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  async sendWelcomeToTeam(
    email: string,
    username: string,
    teamName: string,
    websiteCount: number = 0,
  ): Promise<boolean> {
    const teamDashboardUrl = `${this.config.appUrl}/dashboard`;

    const data: WelcomeToTeamData = {
      username,
      teamName,
      websiteCount,
      teamDashboardUrl,
      appName: this.config.appName,
    };

    const template = emailTemplates.team.welcomeToTeam;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  async sendNewMemberJoined(
    emails: string[],
    memberName: string,
    memberEmail: string,
    teamName: string,
    teamSize: number,
  ): Promise<boolean> {
    if (emails.length === 0) return true;

    const teamManageUrl = `${this.config.appUrl}/settings/teams`;

    const data: MemberJoinedData = {
      memberName,
      memberEmail,
      teamName,
      teamSize,
      teamManageUrl,
      appName: this.config.appName,
    };

    const template = emailTemplates.team.memberJoined;

    // Send email to all provided email addresses
    const results = await Promise.all(
      emails.map(email =>
        this.sendEmail({
          to: email,
          subject: template.subject(data),
          html: template.html(data),
          text: template.text(data),
        }),
      ),
    );

    // Return true if at least one email was sent successfully
    return results.some(result => result === true);
  }

  async sendMemberLeftTeam(
    emails: string[],
    memberName: string,
    memberEmail: string,
    teamName: string,
    teamSize: number,
  ): Promise<boolean> {
    if (emails.length === 0) return true;

    const teamManageUrl = `${this.config.appUrl}/dashboard`;

    const data: MemberLeftData = {
      memberName,
      memberEmail,
      teamName,
      teamSize,
      teamManageUrl,
      appName: this.config.appName,
    };

    const template = emailTemplates.team.memberLeft;

    // Send email to all provided email addresses
    const results = await Promise.all(
      emails.map(email =>
        this.sendEmail({
          to: email,
          subject: template.subject(data),
          html: template.html(data),
          text: template.text(data),
        }),
      ),
    );

    // Return true if at least one email was sent successfully
    return results.some(result => result === true);
  }

  // Data export emails
  async sendDataExportReady(
    email: string,
    username: string,
    downloadLinks: DataExportFile[],
  ): Promise<boolean> {
    const expiryHours = 24;

    const data: DataExportReadyData = {
      username,
      downloadLinks,
      expiryHours,
      appName: this.config.appName,
    };

    const template = emailTemplates.data.exportReady;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }

  async sendDataExportFailed(email: string, username: string, error?: string): Promise<boolean> {
    const supportEmail = this.config.fromAddress.replace('noreply@', 'support@');
    const retryUrl = `${this.config.appUrl}/profile/data`;

    const data: DataExportFailedData = {
      username,
      error,
      supportEmail,
      retryUrl,
      appName: this.config.appName,
    };

    const template = emailTemplates.data.exportFailed;

    return this.sendEmail({
      to: email,
      subject: template.subject(data),
      html: template.html(data),
      text: template.text(data),
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();
