import { InviteModal } from '@/components/common/InviteModal';

export function TeamInviteButton({ teamId }: { teamId: string }) {
  return <InviteModal teamId={teamId} />;
}

export default TeamInviteButton;
