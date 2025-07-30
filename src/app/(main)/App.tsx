'use client';
import { Loading } from 'react-basics';
import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useLogin, useConfig } from '@/components/hooks';
import UpdateNotice from './UpdateNotice';

export function App({ children }) {
  const { user, isLoading, error } = useLogin();
  const config = useConfig();
  const pathname = usePathname();

  if (isLoading) {
    return <Loading />;
  }

  if (error) {
    window.location.href = `${process.env.basePath || ''}/login`;
  }

  if (!user || !config) {
    return null;
  }

  // Check if user's email is verified
  // Allow access to email-verification page even if not verified
  if (!user.emailVerified && pathname !== '/email-verification') {
    window.location.href = `${process.env.basePath || ''}/email-verification`;
    return null;
  }

  if (config.uiDisabled) {
    return null;
  }

  return (
    <>
      {children}
      <UpdateNotice user={user} config={config} />
      {process.env.NODE_ENV === 'production' && !pathname.includes('/share/') && (
        <Script src={`${process.env.basePath || ''}/telemetry.js`} />
      )}
    </>
  );
}

export default App;
