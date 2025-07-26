import { Form, FormRow } from 'react-basics';
import { useState, useEffect } from 'react';
import TimezoneSetting from '@/app/(main)/profile/TimezoneSetting';
import DateRangeSetting from '@/app/(main)/profile/DateRangeSetting';
import LanguageSetting from '@/app/(main)/profile/LanguageSetting';
import ThemeSetting from '@/app/(main)/profile/ThemeSetting';
import PasswordChangeButton from './PasswordChangeButton';
import { UsernameEditButton } from './UsernameEditButton';
import { EmailEditButton } from './EmailEditButton';
import { useLogin, useMessages } from '@/components/hooks';
import { ROLES } from '@/lib/constants';

export function ProfileSettings() {
  const { user, setUser } = useLogin();
  const { formatMessage, labels } = useMessages();
  const cloudMode = !!process.env.cloudMode;

  // Local state for optimistic updates
  const [currentUsername, setCurrentUsername] = useState(user?.username || '');
  const [currentEmail, setCurrentEmail] = useState(user?.email || '');

  // Sync local state with user data
  useEffect(() => {
    if (user) {
      setCurrentUsername(user.username || '');
      setCurrentEmail(user.email || '');
    }
  }, [user]);

  if (!user) {
    return null;
  }

  const { role } = user;

  const handleUsernameUpdate = (newUsername: string) => {
    setCurrentUsername(newUsername);
    // Update user in global state
    setUser({ ...user, username: newUsername });
  };

  const handleEmailUpdate = (newEmail: string) => {
    setCurrentEmail(newEmail);
    // Update user in global state
    setUser({ ...user, email: newEmail });
  };

  const renderRole = (value: string) => {
    if (value === ROLES.user) {
      return formatMessage(labels.user);
    }
    if (value === ROLES.admin) {
      return formatMessage(labels.admin);
    }
    if (value === ROLES.viewOnly) {
      return formatMessage(labels.viewOnly);
    }

    return formatMessage(labels.unknown);
  };

  return (
    <Form>
      <FormRow label={formatMessage(labels.username)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{currentUsername}</span>
          <UsernameEditButton username={currentUsername} onSave={handleUsernameUpdate} />
        </div>
      </FormRow>
      <FormRow label="Email">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>{currentEmail}</span>
          <EmailEditButton email={currentEmail} onSave={handleEmailUpdate} />
        </div>
      </FormRow>
      <FormRow label={formatMessage(labels.role)}>{renderRole(role)}</FormRow>
      {!cloudMode && (
        <FormRow label={formatMessage(labels.password)}>
          <PasswordChangeButton />
        </FormRow>
      )}
      <FormRow label={formatMessage(labels.defaultDateRange)}>
        <DateRangeSetting />
      </FormRow>
      <FormRow label={formatMessage(labels.language)}>
        <LanguageSetting />
      </FormRow>
      <FormRow label={formatMessage(labels.timezone)}>
        <TimezoneSetting />
      </FormRow>
      <FormRow label={formatMessage(labels.theme)}>
        <ThemeSetting />
      </FormRow>
    </Form>
  );
}

export default ProfileSettings;
