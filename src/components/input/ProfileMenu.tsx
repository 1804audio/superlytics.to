'use client';
import { Key } from 'react';
import { Menu, Item, Text, Icon } from 'react-basics';
import Icons from '@/components/icons';
import { useMessages } from '@/components/hooks';
import styles from './ProfileMenu.module.css';

interface User {
  id: string;
  username: string;
  displayName: string | null;
  role: string;
  planId: string;
  hasAccess: boolean;
  isLifetime: boolean;
}

interface ProfileMenuProps {
  user: User;
  onSelect: (key: Key) => void;
  version: string;
}

export function ProfileMenu({ user, onSelect, version }: ProfileMenuProps) {
  const { formatMessage, labels } = useMessages();
  const cloudMode = !!process.env.cloudMode;

  return (
    <Menu onSelect={onSelect} className={styles.menu}>
      <Text className={styles.name}>{user.displayName || user.username}</Text>
      <Item key="profile" className={styles.item} divider={true}>
        <Icon>
          <Icons.User />
        </Icon>
        <Text>{formatMessage(labels.profile)}</Text>
      </Item>
      <Item key="websites" className={styles.item}>
        <Icon>
          <Icons.Globe />
        </Icon>
        <Text>Websites</Text>
      </Item>
      <Item key="teams" className={styles.item}>
        <Icon>
          <Icons.Users />
        </Icon>
        <Text>Teams</Text>
      </Item>
      <Item key="reports" className={styles.item}>
        <Icon>
          <Icons.Reports />
        </Icon>
        <Text>Custom Reports</Text>
      </Item>
      <Item key="billing" className={styles.item}>
        <Icon>
          <Icons.Gear />
        </Icon>
        <Text>Billing</Text>
      </Item>
      {!cloudMode && (
        <Item data-test="item-logout" key="logout" className={styles.item}>
          <Icon>
            <Icons.Logout />
          </Icon>
          <Text>{formatMessage(labels.logout)}</Text>
        </Item>
      )}
      <div className={styles.version}>{`v${version}`}</div>
    </Menu>
  );
}

export default ProfileMenu;
