import { Metadata } from 'next';
import ForgotPasswordPage from './ForgotPasswordPage';

export default async function () {
  return <ForgotPasswordPage />;
}

export const metadata: Metadata = {
  title: 'Forgot Password',
};
