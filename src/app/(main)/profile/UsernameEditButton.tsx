import { Button, ModalTrigger, Modal, Icon, Text } from 'react-basics';
import GearIcon from '@/assets/gear.svg';
import { UsernameEditForm } from './UsernameEditForm';

export function UsernameEditButton({
  username,
  onSave,
}: {
  username: string;
  onSave: (newUsername: string) => void;
}) {
  const handleSave = (newUsername: string) => {
    onSave(newUsername);
  };

  return (
    <ModalTrigger>
      <Button variant="action" size="sm">
        <Icon>
          <GearIcon />
        </Icon>
        <Text>Edit</Text>
      </Button>
      <Modal title="Edit Username">
        {close => (
          <UsernameEditForm
            currentUsername={username}
            onSave={(newUsername: string) => {
              handleSave(newUsername);
              close();
            }}
            onClose={close}
          />
        )}
      </Modal>
    </ModalTrigger>
  );
}
