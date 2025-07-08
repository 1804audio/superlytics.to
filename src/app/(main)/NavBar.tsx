'use client';
import { useEffect } from 'react';
import { Icon, Text } from 'react-basics';
import Link from 'next/link';
import classNames from 'classnames';
import {
  RiDashboardLine,
  RiGlobalLine,
  RiBarChartLine,
  RiSettings3Line,
  RiTeamLine,
  RiUserLine,
  RiGroupLine,
  RiLogoutCircleLine,
} from 'react-icons/ri';
import HamburgerButton from '@/components/common/HamburgerButton';
import ThemeButton from '@/components/input/ThemeButton';
import LanguageButton from '@/components/input/LanguageButton';
import ProfileButton from '@/components/input/ProfileButton';
import TeamsButton from '@/components/input/TeamsButton';
import Icons from '@/components/icons';
import { useMessages, useNavigation, useTeamUrl } from '@/components/hooks';
import { getItem, setItem } from '@/lib/storage';
import styles from './NavBar.module.css';

export function NavBar() {
  const { formatMessage, labels } = useMessages();
  const { pathname, router } = useNavigation();
  const { teamId, renderTeamUrl } = useTeamUrl();

  const cloudMode = !!process.env.cloudMode;

  const links = [
    {
      label: formatMessage(labels.dashboard),
      url: renderTeamUrl('/dashboard'),
      icon: <RiDashboardLine />,
    },
    {
      label: formatMessage(labels.websites),
      url: renderTeamUrl('/websites'),
      icon: <RiGlobalLine />,
    },
    {
      label: formatMessage(labels.reports),
      url: renderTeamUrl('/reports'),
      icon: <RiBarChartLine />,
    },
    {
      label: formatMessage(labels.settings),
      url: renderTeamUrl('/settings'),
      icon: <RiSettings3Line />,
    },
  ].filter(n => n);

  const menuItems = [
    {
      label: formatMessage(labels.dashboard),
      url: renderTeamUrl('/dashboard'),
      icon: <RiDashboardLine />,
    },
    !cloudMode && {
      label: formatMessage(labels.settings),
      url: renderTeamUrl('/settings'),
      icon: <RiSettings3Line />,
      children: [
        ...(teamId
          ? [
              {
                label: formatMessage(labels.team),
                url: renderTeamUrl('/settings/team'),
                icon: <RiTeamLine />,
              },
            ]
          : []),
        {
          label: formatMessage(labels.websites),
          url: renderTeamUrl('/settings/websites'),
          icon: <RiGlobalLine />,
        },
        ...(!teamId
          ? [
              {
                label: formatMessage(labels.teams),
                url: renderTeamUrl('/settings/teams'),
                icon: <RiTeamLine />,
              },
              {
                label: formatMessage(labels.users),
                url: '/settings/users',
                icon: <RiGroupLine />,
              },
            ]
          : [
              {
                label: formatMessage(labels.members),
                url: renderTeamUrl('/settings/members'),
                icon: <RiGroupLine />,
              },
            ]),
      ],
    },
    {
      label: formatMessage(labels.profile),
      url: '/profile',
      icon: <RiUserLine />,
    },
    !cloudMode && {
      label: formatMessage(labels.logout),
      url: '/logout',
      icon: <RiLogoutCircleLine />,
    },
  ].filter(n => n);

  const handleTeamChange = (teamId: string) => {
    const url = teamId ? `/teams/${teamId}` : '/';
    if (!cloudMode) {
      setItem('superlytics.team', { id: teamId });
    }
    router.push(cloudMode ? `${process.env.cloudUrl}${url}` : url);
  };

  useEffect(() => {
    if (!cloudMode) {
      const teamIdLocal = getItem('superlytics.team')?.id;

      if (teamIdLocal && teamIdLocal !== teamId) {
        router.push(
          pathname !== '/' && pathname !== '/dashboard' ? '/' : `/teams/${teamIdLocal}/dashboard`,
        );
      }
    }
  }, [cloudMode]);

  return (
    <div className={styles.navbar}>
      <div className={styles.logo}>
        <Icon size="lg">
          <Icons.Logo />
        </Icon>
        <Text>superlytics</Text>
      </div>
      <div className={styles.links}>
        {links.map(({ url, label, icon }) => {
          return (
            <Link
              key={url}
              href={url}
              className={classNames({ [styles.selected]: pathname.startsWith(url) })}
              prefetch={url !== '/settings'}
            >
              <Icon size="md">{icon}</Icon>
              <Text>{label}</Text>
            </Link>
          );
        })}
      </div>
      <div className={styles.actions}>
        <TeamsButton onChange={handleTeamChange} />
        <ThemeButton />
        <LanguageButton />
        <ProfileButton />
      </div>
      <div className={styles.mobile}>
        <TeamsButton onChange={handleTeamChange} showText={false} />
        <HamburgerButton menuItems={menuItems} />
      </div>
    </div>
  );
}

export default NavBar;
