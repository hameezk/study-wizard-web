import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import styles from '../auth.module.css';

export const metadata: Metadata = {
  title: 'Confirm your email',
  robots: { index: false, follow: false },
};

export default async function VerifyPage(props: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await props.searchParams;

  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.card}>
          <h1 className={styles.title}>Confirm your email</h1>

          <p className={styles.lede}>
            We have sent a confirmation link{email ? ' to ' : ''}
            {email && <strong>{email}</strong>}. Open it to finish setting up your
            account and choose a pass.
          </p>

          <div className={styles.notice} style={{ marginTop: 'var(--space-6)' }}>
            Your account is not active until the address is confirmed. This is
            also why we cannot take payment yet.
          </div>

          <p className={styles.foot}>
            Nothing arrived? Check your spam folder. Links expire after an hour —
            if yours has, just sign up again with the same address.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-5)' }}>
            <ButtonLink href="/" variant="secondary">Back to home</ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
