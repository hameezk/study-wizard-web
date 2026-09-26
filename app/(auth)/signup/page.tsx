import type { Metadata } from 'next';
import { SignupForm } from './signup-form';
import styles from '../auth.module.css';

export const metadata: Metadata = {
  title: 'Create your account',
  // Auth pages must never be indexed.
  robots: { index: false, follow: true },
};

// Next 16: searchParams is async. Synchronous access was removed, not deprecated.
export default async function SignupPage(props: {
  searchParams: Promise<{ plan?: string }>;
}) {
  const { plan } = await props.searchParams;

  return (
    <section className={styles.wrap}>
      <div className="container">
        <SignupForm plan={plan} />
      </div>
    </section>
  );
}
