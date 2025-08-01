export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

export interface EmailTemplate<T = any> {
  subject: (data: T) => string;
  html: (data: T) => string;
  text: (data: T) => string;
  preheader?: (data: T) => string;
}

export interface EmailConfig {
  apiKey: string;
  fromAddress: string;
  appName: string;
  appUrl: string;
  apiBaseUrl: string;
}

// Authentication email data interfaces
export interface PasswordResetData {
  username: string;
  resetToken: string;
  resetUrl: string;
  appName: string;
  appUrl: string;
}

export interface EmailVerificationData {
  username: string;
  verificationToken: string;
  verificationUrl: string;
  appName: string;
  appUrl: string;
}

export interface WelcomeEmailData {
  username: string;
  dashboardUrl: string;
  appName: string;
}

// Team email data interfaces
export interface TeamInvitationData {
  email: string;
  teamName: string;
  inviterName: string;
  accessCode: string;
  loginUrl: string;
  signupUrl: string;
  appName: string;
}

export interface WelcomeToTeamData {
  username: string;
  teamName: string;
  websiteCount: number;
  teamDashboardUrl: string;
  appName: string;
}

export interface MemberJoinedData {
  memberName: string;
  memberEmail: string;
  teamName: string;
  teamSize: number;
  teamManageUrl: string;
  appName: string;
}

export interface MemberLeftData {
  memberName: string;
  memberEmail: string;
  teamName: string;
  teamSize: number;
  teamManageUrl: string;
  appName: string;
}

export interface MemberRoleChangedData {
  memberName: string;
  memberEmail: string;
  teamName: string;
  oldRole: string;
  newRole: string;
  changedBy: string;
  appName: string;
}

// Data export email data interfaces
export interface DataExportFile {
  filename: string;
  url: string;
  size: string;
}

export interface DataExportReadyData {
  username: string;
  downloadLinks: DataExportFile[];
  expiryHours: number;
  appName: string;
}

export interface DataExportFailedData {
  username: string;
  error?: string;
  supportEmail: string;
  retryUrl: string;
  appName: string;
}

// Email template collections
export interface AuthEmailTemplates {
  passwordReset: EmailTemplate<PasswordResetData>;
  emailVerification: EmailTemplate<EmailVerificationData>;
  welcome: EmailTemplate<WelcomeEmailData>;
}

export interface TeamEmailTemplates {
  invitation: EmailTemplate<TeamInvitationData>;
  welcomeToTeam: EmailTemplate<WelcomeToTeamData>;
  memberJoined: EmailTemplate<MemberJoinedData>;
  memberLeft: EmailTemplate<MemberLeftData>;
  memberRoleChanged: EmailTemplate<MemberRoleChangedData>;
}

export interface DataEmailTemplates {
  exportReady: EmailTemplate<DataExportReadyData>;
  exportFailed: EmailTemplate<DataExportFailedData>;
}

export interface EmailTemplates {
  auth: AuthEmailTemplates;
  team: TeamEmailTemplates;
  data: DataEmailTemplates;
}

// Email service interface
export interface IEmailService {
  // Auth emails
  sendPasswordReset(email: string, resetToken: string, username: string): Promise<boolean>;
  sendEmailVerification(
    email: string,
    verificationToken: string,
    username: string,
  ): Promise<boolean>;
  sendWelcomeEmail(email: string, username: string): Promise<boolean>;

  // Team emails
  sendTeamInvitation(
    email: string,
    teamName: string,
    inviterName: string,
    accessCode: string,
  ): Promise<boolean>;
  sendWelcomeToTeam(
    email: string,
    username: string,
    teamName: string,
    websiteCount?: number,
  ): Promise<boolean>;
  sendNewMemberJoined(
    emails: string[],
    memberName: string,
    memberEmail: string,
    teamName: string,
    teamSize: number,
  ): Promise<boolean>;
  sendMemberLeftTeam(
    emails: string[],
    memberName: string,
    memberEmail: string,
    teamName: string,
    teamSize: number,
  ): Promise<boolean>;
  sendMemberRoleChanged(
    memberEmail: string,
    memberName: string,
    teamName: string,
    oldRole: string,
    newRole: string,
    changedBy: string,
  ): Promise<boolean>;

  // Data export emails
  sendDataExportReady(
    email: string,
    username: string,
    downloadLinks: DataExportFile[],
  ): Promise<boolean>;
  sendDataExportFailed(email: string, username: string, error?: string): Promise<boolean>;

  // Core email sending
  sendEmail(options: EmailOptions): Promise<boolean>;
}
