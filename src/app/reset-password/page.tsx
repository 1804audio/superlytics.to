import { Metadata } from 'next';
import { Suspense } from 'react';
import ResetPasswordPage from './ResetPasswordPage';

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
      <ResetPasswordPage />
    </Suspense>
  );
}

export const metadata: Metadata = {
  title: 'Reset Password',
};
