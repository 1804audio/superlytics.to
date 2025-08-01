import { EmailTemplates } from '../types';
import * as authTemplates from './auth';
import * as teamTemplates from './team';
import * as dataTemplates from './data';

export const emailTemplates: EmailTemplates = {
  auth: {
    passwordReset: authTemplates.passwordResetTemplate,
    emailVerification: authTemplates.emailVerificationTemplate,
    welcome: authTemplates.welcomeTemplate,
  },
  team: {
    invitation: teamTemplates.teamInvitationTemplate,
    welcomeToTeam: teamTemplates.welcomeToTeamTemplate,
    memberJoined: teamTemplates.memberJoinedTemplate,
    memberLeft: teamTemplates.memberLeftTemplate,
    memberRoleChanged: teamTemplates.memberRoleChangedTemplate,
  },
  data: {
    exportReady: dataTemplates.dataExportReadyTemplate,
    exportFailed: dataTemplates.dataExportFailedTemplate,
  },
};
