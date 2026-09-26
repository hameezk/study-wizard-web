import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { REFUND } from '@/content/legal';

export const metadata: Metadata = { title: 'Refund Policy' };

export default function Page() {
  return <LegalPage doc={REFUND} />;
}
