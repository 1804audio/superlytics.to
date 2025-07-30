'use client';
import ResetPasswordForm from './ResetPasswordForm';
import styles from '../login/LoginPage.module.css';

export function ResetPasswordPage() {
  return (
    <div className={styles.page}>
      <ResetPasswordForm />
    </div>
  );
}

export default ResetPasswordPage;
