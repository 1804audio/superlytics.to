import { z } from 'zod';
import { unauthorized, json, badRequest, notFound } from '@/lib/response';
import { canUpdateTeam } from '@/lib/auth';
import { parseRequest } from '@/lib/request';
import { getTeam, getUserByUsernameOrEmail } from '@/queries';
import { emailService } from '@/lib/email';
import debug from 'debug';

const log = debug('superlytics:team-invite');

export async function POST(request: Request, { params }: { params: Promise<{ teamId: string }> }) {
  const schema = z.object({
    email: z.string().email(),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  const { teamId } = await params;

  if (!(await canUpdateTeam(auth, teamId))) {
    return unauthorized('You must be a team owner or manager to invite members.');
  }

  const { email } = body;

  // Get team details
  const team = await getTeam(teamId, { includeMembers: true });
  if (!team) {
    return notFound('Team not found.');
  }

  // Check if user is already invited (already has account and is member)
  const existingUser = await getUserByUsernameOrEmail(email);
  if (existingUser) {
    const isAlreadyMember = team.teamUser?.some(tu => tu.userId === existingUser.id);
    if (isAlreadyMember) {
      return badRequest('User is already a member of this team.');
    }
  }

  try {
    // Send invitation email
    const success = await emailService.sendTeamInvitation(
      email,
      team.name,
      auth.user.username,
      team.accessCode,
    );

    if (!success) {
      log('Failed to send team invitation email to:', email);
      return json(
        {
          success: false,
          message: 'Failed to send invitation email. Please try again.',
        },
        { status: 500 },
      );
    }

    log('Team invitation sent successfully to:', email);

    return json({
      success: true,
      message: 'Invitation sent successfully',
      teamName: team.name,
      invitedEmail: email,
    });
  } catch (error) {
    log('Error sending team invitation:', error);
    return json(
      {
        success: false,
        message: 'Failed to send invitation. Please try again.',
      },
      { status: 500 },
    );
  }
}
