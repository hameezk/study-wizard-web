import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal-page';
import { TERMS } from '@/content/legal';

export const metadata: Metadata = { title: 'Terms of Service' };

export default function Page() {
  return <LegalPage doc={TERMS} />;
}
