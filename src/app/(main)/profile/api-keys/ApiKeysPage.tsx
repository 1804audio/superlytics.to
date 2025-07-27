'use client';
import PageHeader from '@/components/layout/PageHeader';
import Breadcrumb from '@/components/common/Breadcrumb';
import { useMessages } from '@/components/hooks';
import Icons from '@/components/icons';
import ApiKeysContent from './ApiKeysContent';
import styles from '../ProfilePage.module.css';

export default function ApiKeysPage() {
  const { formatMessage, labels } = useMessages();

  const breadcrumb = (
    <Breadcrumb
      data={[{ label: formatMessage(labels.profile), url: '/profile' }, { label: 'API Keys' }]}
    />
  );

  return (
    <div className={styles.container}>
      <PageHeader title="API Keys" icon={<Icons.Lock />} breadcrumb={breadcrumb} />
      <ApiKeysContent />
    </div>
  );
}
