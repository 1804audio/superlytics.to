import { canDeleteTeamUser, canUpdateTeam } from '@/lib/auth';
import { parseRequest } from '@/lib/request';
import { badRequest, json, ok, unauthorized } from '@/lib/response';
import { deleteTeamUser, getTeamUser, updateTeamUser, getTeam } from '@/queries';
import { emailService } from '@/lib/email';
import { ROLES } from '@/lib/constants';
import debug from 'debug';
import { z } from 'zod';

const log = debug('superlytics:team-member-remove');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ teamId: string; userId: string }> },
) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const { teamId, userId } = await params;

  if (!(await canUpdateTeam(auth, teamId))) {
    return unauthorized('You must be the owner of this team.');
  }

  const teamUser = await getTeamUser(teamId, userId);

  return json(teamUser);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ teamId: string; userId: string }> },
) {
  const schema = z.object({
    role: z.string().regex(/team-member|team-view-only|team-manager/),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { teamId, userId } = await params;

  if (!(await canUpdateTeam(auth, teamId))) {
    return unauthorized('You must be the owner of this team.');
  }

  const teamUser = await getTeamUser(teamId, userId);

  if (!teamUser) {
    return badRequest('The User does not exists on this team.');
  }

  const user = await updateTeamUser(teamUser.id, body);

  return json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string; userId: string }> },
) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  const { teamId, userId } = await params;

  if (!(await canDeleteTeamUser(auth, teamId, userId))) {
    return unauthorized('You must be the owner of this team.');
  }

  const teamUser = await getTeamUser(teamId, userId);

  if (!teamUser) {
    return badRequest('The User does not exists on this team.');
  }

  // Get team details for email notification (includes user details)
  const teamWithDetails = await getTeam(teamId, { includeMembers: true });

  if (!teamWithDetails) {
    return badRequest('Team not found.');
  }

  // Find the member details from the team members list
  const memberDetails = teamWithDetails.teamUser?.find(tu => tu.userId === userId);
  const memberName = memberDetails?.user?.username || 'Unknown User';
  const memberEmail = memberDetails?.user?.email || 'No email';

  // Delete the team member
  await deleteTeamUser(teamId, userId);

  // Send notification email to team owners and managers
  try {
    const ownerEmails =
      teamWithDetails.teamUser
        ?.filter(
          tu =>
            tu.userId !== userId && (tu.role === ROLES.teamOwner || tu.role === ROLES.teamManager),
        )
        ?.map(tu => tu.user?.email)
        ?.filter(Boolean) || [];

    if (ownerEmails.length > 0) {
      const newTeamSize = Math.max(0, (teamWithDetails.teamUser?.length || 1) - 1); // Subtract the removed member

      await emailService.sendMemberLeftTeam(
        ownerEmails,
        memberName,
        memberEmail,
        teamWithDetails.name,
        newTeamSize,
      );

      log('Team leave notification emails sent for:', memberEmail);
    }
  } catch (error) {
    log('Error sending team leave emails:', error);
    // Don't fail the removal operation if emails fail
  }

  return ok();
}
