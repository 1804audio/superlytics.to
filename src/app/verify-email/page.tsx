import { Metadata } from 'next';
import { Suspense } from 'react';
import VerifyEmailPage from './VerifyEmailPage';

function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px',
        color: '#666',
      }}
    >
      Loading...
    </div>
  );
}

export default async function () {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailPage />
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: 'Verify Email',
};
