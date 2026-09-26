import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { PRIVACY } from '@/content/legal';

export const metadata: Metadata = { title: 'Privacy Policy' };

export default function Page() {
  return <LegalPage doc={PRIVACY} />;
}
