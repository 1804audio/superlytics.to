import { z } from 'zod';
import { unauthorized, json, notFound } from '@/lib/response';
import { canCreateTeam } from '@/lib/auth';
import { parseRequest } from '@/lib/request';
import { ROLES } from '@/lib/constants';
import { createTeamUser, findTeam, getTeamUser, getTeam } from '@/queries';
import { emailService } from '@/lib/email';
import debug from 'debug';

const log = debug('superlytics:team-join');

export async function POST(request: Request) {
  const schema = z.object({
    accessCode: z.string().max(50),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    log('Parse request error:', error);
    return error();
  }

  log('Team join attempt - user:', auth?.user?.id, 'accessCode:', body?.accessCode);

  if (!(await canCreateTeam(auth))) {
    log('User cannot create team - auth:', !!auth, 'user:', !!auth?.user);
    return unauthorized();
  }

  const { accessCode } = body;

  const team = await findTeam({
    where: {
      accessCode,
    },
  });

  if (!team) {
    log('Team not found for access code:', accessCode);
    return notFound('Team not found.');
  }

  log('Found team:', team.name, 'id:', team.id);

  const teamUser = await getTeamUser(team.id, auth.user.id);

  if (teamUser) {
    log('User is already a team member:', auth.user.id, 'role:', teamUser.role);
    // Instead of returning an error, return success with team info
    const teamWithDetails = await getTeam(team.id, { includeMembers: true });
    const websiteCount = (teamWithDetails as any)?.website?.length || 0;
    const teamSize = (teamWithDetails as any)?.teamUser?.length || 1;

    return json({
      alreadyMember: true,
      teamName: team.name,
      teamSize,
      websiteCount,
      role: teamUser.role,
      message: `You're already a member of ${team.name}!`,
    });
  }

  log('User is not a member, proceeding with join');

  // Create team membership
  const newTeamUser = await createTeamUser(auth.user.id, team.id, ROLES.teamMember);

  // Get team details for emails
  const teamWithDetails = await getTeam(team.id, { includeMembers: true });
  const websiteCount = (teamWithDetails as any)?.website?.length || 0;
  const teamSize = (teamWithDetails as any)?.teamUser?.length || 1;

  try {
    // Send welcome email to new member
    await emailService.sendWelcomeToTeam(
      auth.user.email,
      auth.user.username,
      team.name,
      websiteCount,
    );

    // Send notification to team owners and managers
    const ownerEmails =
      (teamWithDetails as any)?.teamUser
        ?.filter(tu => tu.role === ROLES.teamOwner || tu.role === ROLES.teamManager)
        ?.map(tu => tu.user?.email)
        ?.filter(Boolean) || [];

    if (ownerEmails.length > 0) {
      await emailService.sendNewMemberJoined(
        ownerEmails,
        auth.user.username,
        auth.user.email,
        team.name,
        teamSize,
      );
    }

    log('Team join emails sent successfully for:', auth.user.email);
  } catch (error) {
    log('Error sending team join emails:', error);
    // Don't fail the join operation if emails fail
  }

  return json({
    ...newTeamUser,
    teamName: team.name,
    teamSize,
    websiteCount,
  });
}
