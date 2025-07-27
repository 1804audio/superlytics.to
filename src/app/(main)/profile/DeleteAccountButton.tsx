'use client';

import { Button, ModalTrigger, Modal, Icon, Text, useToasts } from 'react-basics';
import { useApi } from '@/components/hooks';
import Icons from '@/components/icons';
import DeleteAccountForm from './DeleteAccountForm';

export function DeleteAccountButton() {
  const { post } = useApi();
  const { showToast } = useToasts();

  const handleDelete = async (data: any) => {
    try {
      await post('/me/delete-account', {
        password: data.password,
        confirmDelete: true,
      });

      // Show success message
      showToast({ message: 'Account deleted successfully', variant: 'success' });

      // Redirect to logout or login page after a short delay
      setTimeout(() => {
        window.location.href = '/logout';
      }, 1000);
    } catch (err: any) {
      showToast({ message: err.message || 'Failed to delete account', variant: 'error' });
      throw err; // Re-throw to let form handle loading state
    }
  };

  return (
    <ModalTrigger>
      <Button variant="danger" size="sm">
        <Icon>
          <Icons.Trash />
        </Icon>
        <Text>Delete Account</Text>
      </Button>
      <Modal title="Delete Account">
        {close => <DeleteAccountForm onDelete={handleDelete} onClose={close} />}
      </Modal>
    </ModalTrigger>
  );
}

export default DeleteAccountButton;
