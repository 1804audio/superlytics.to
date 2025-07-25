import { z } from 'zod';
import { getRandomChars } from '@/lib/crypto';
import { unauthorized, json } from '@/lib/response';
import { canCreateTeam } from '@/lib/auth';
import { uuid } from '@/lib/crypto';
import { parseRequest } from '@/lib/request';
import { createTeam } from '@/queries';
import { simpleUsageManager } from '@/lib/services/simple-usage-manager';

export async function POST(request: Request) {
  const schema = z.object({
    name: z.string().max(50),
  });

  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!(await canCreateTeam(auth))) {
    return unauthorized();
  }

  const { name } = body;

  // Check if user's plan supports team creation
  // This is more complex as we need to consider existing teams the user owns
  const usage = await simpleUsageManager.getUsageSummary(auth.user.id);

  // If user already has teams and their plan doesn't support unlimited team members
  if (!usage.teamMembers.unlimited && usage.teamMembers.current >= usage.teamMembers.limit) {
    return Response.json(
      {
        error: 'Team member limit exceeded. Please upgrade your plan to create more teams.',
        code: 'TEAM_LIMIT_EXCEEDED',
        currentUsage: usage.teamMembers.current,
        limit: usage.teamMembers.limit,
        planName: usage.planName,
        upgradeRequired: true,
      },
      { status: 429 },
    );
  }

  const team = await createTeam(
    {
      id: uuid(),
      name,
      accessCode: `team_${getRandomChars(16)}`,
    },
    auth.user.id,
  );

  return json(team);
}
