'use client';
import ForgotPasswordForm from './ForgotPasswordForm';
import styles from '../login/LoginPage.module.css';

export function ForgotPasswordPage() {
  return (
    <div className={styles.page}>
      <ForgotPasswordForm />
    </div>
  );
}

export default ForgotPasswordPage;
