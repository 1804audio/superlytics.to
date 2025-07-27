import { Metadata } from 'next';
import DataPage from './DataPage';

export default function () {
  return <DataPage />;
}

export const metadata: Metadata = {
  title: 'Data Management',
};
