'use client';
import PageHeader from '@/components/layout/PageHeader';
import Breadcrumb from '@/components/common/Breadcrumb';
import { useMessages } from '@/components/hooks';
import Icons from '@/components/icons';
import DataContent from './DataContent';
import styles from '../ProfilePage.module.css';

export default function DataPage() {
  const { formatMessage, labels } = useMessages();

  const breadcrumb = (
    <Breadcrumb
      data={[
        { label: formatMessage(labels.profile), url: '/profile' },
        { label: 'Data Management' },
      ]}
    />
  );

  return (
    <div className={styles.container}>
      <PageHeader title="Data Management" icon={<Icons.BarChart />} breadcrumb={breadcrumb} />
      <DataContent />
    </div>
  );
}
