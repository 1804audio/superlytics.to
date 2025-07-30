'use client';
import VerifyEmailForm from './VerifyEmailForm';
import styles from '../login/LoginPage.module.css';

export function VerifyEmailPage() {
  return (
    <div className={styles.page}>
      <VerifyEmailForm />
    </div>
  );
}

export default VerifyEmailPage;
