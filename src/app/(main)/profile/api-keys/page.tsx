import { Metadata } from 'next';
import ApiKeysPage from './ApiKeysPage';

export default function () {
  return <ApiKeysPage />;
}

export const metadata: Metadata = {
  title: 'API Keys',
};
