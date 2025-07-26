import { Button, ModalTrigger, Modal, Icon, Text } from 'react-basics';
import GearIcon from '@/assets/gear.svg';
import { EmailEditForm } from './EmailEditForm';

export function EmailEditButton({
  email,
  onSave,
}: {
  email: string;
  onSave: (newEmail: string) => void;
}) {
  const handleSave = (newEmail: string) => {
    onSave(newEmail);
  };

  return (
    <ModalTrigger>
      <Button variant="action" size="sm">
        <Icon>
          <GearIcon />
        </Icon>
        <Text>Edit</Text>
      </Button>
      <Modal title="Edit Email">
        {close => (
          <EmailEditForm
            currentEmail={email}
            onSave={(newEmail: string) => {
              handleSave(newEmail);
              close();
            }}
            onClose={close}
          />
        )}
      </Modal>
    </ModalTrigger>
  );
}
