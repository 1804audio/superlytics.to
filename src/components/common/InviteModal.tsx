import { Button, Icon, Icons, Modal, ModalTrigger, Text } from 'react-basics';
import { InviteForm } from './InviteForm';

export interface InviteModalProps {
  teamId: string;
  onInvite?: () => void;
  buttonVariant?: 'primary' | 'secondary' | 'quiet';
  buttonSize?: 'sm' | 'md' | 'lg';
  buttonText?: string;
}

export function InviteModal({
  teamId,
  onInvite,
  buttonVariant = 'primary',
  buttonSize = 'sm',
  buttonText,
}: InviteModalProps) {
  const handleInvite = () => {
    onInvite?.();
  };

  return (
    <ModalTrigger>
      <Button data-test="button-invite-member" variant={buttonVariant} size={buttonSize}>
        <Icon>
          <Icons.Plus />
        </Icon>
        <Text>{buttonText || 'Invite Member'}</Text>
      </Button>
      <Modal title="Invite Team Member">
        {(close: () => void) => (
          <InviteForm teamId={teamId} onSave={handleInvite} onClose={close} />
        )}
      </Modal>
    </ModalTrigger>
  );
}

export default InviteModal;
