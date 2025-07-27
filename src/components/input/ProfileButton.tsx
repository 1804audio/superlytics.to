import { Key } from 'react';
import { Icon, Button, PopupTrigger, Popup } from 'react-basics';
import { useRouter } from 'next/navigation';
import Icons from '@/components/icons';
import { useLogin, useLocale } from '@/components/hooks';
import { CURRENT_VERSION } from '@/lib/constants';
import { ProfileMenu } from './ProfileMenu';
import styles from './ProfileButton.module.css';

export function ProfileButton() {
  const { user } = useLogin();
  const router = useRouter();
  const { dir } = useLocale();

  const handleSelect = (key: Key, close: () => void) => {
    if (key === 'profile') {
      router.push('/profile');
    }
    if (key === 'api-keys') {
      router.push('/profile/api-keys');
    }
    if (key === 'data') {
      router.push('/profile/data');
    }
    if (key === 'logout') {
      router.push('/logout');
    }
    if (key === 'usage') {
      // Usage data is shown in the menu, clicking goes to billing for plan management
      router.push('/billing');
    }
    if (key === 'billing') {
      router.push('/billing');
    }
    if (key === 'teams') {
      router.push('/settings/teams');
    }
    if (key === 'websites') {
      router.push('/websites');
    }
    if (key === 'reports') {
      router.push('/reports');
    }
    close(); // Close popup after navigation
  };

  return (
    <PopupTrigger>
      <Button data-test="button-profile" variant="quiet">
        <Icon>
          <Icons.Profile />
        </Icon>
      </Button>
      <Popup position="bottom" alignment={dir === 'rtl' ? 'start' : 'end'} className={styles.popup}>
        {(close: () => void) => (
          <ProfileMenu
            user={user}
            onSelect={key => handleSelect(key, close)}
            version={CURRENT_VERSION}
          />
        )}
      </Popup>
    </PopupTrigger>
  );
}

export default ProfileButton;
