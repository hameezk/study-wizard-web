import Link from 'next/link';
import { Logo } from '@/components/logo';
import { ButtonLink } from '@/components/button';

/**
 * Root-level, so it renders WITHOUT the marketing layout and its analytics.
 * A 404 should not fire page-view events for a page that does not exist.
 */
export default function NotFound() {
  return (
    <main
      id="main"
      style={{
        minHeight: '100vh', display: 'grid', placeItems: 'center',
        padding: 'var(--space-6)', textAlign: 'center',
      }}
    >
      <div style={{ maxWidth: '44ch' }}>
        <Link href="/" aria-label="Study Wizard home" style={{ display: 'inline-block', marginBottom: 'var(--space-6)' }}>
          <Logo />
        </Link>

        <h1 style={{ fontSize: 'var(--text-3xl)', fontWeight: 660 }}>Page not found</h1>
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--ink-2)' }}>
          That link does not lead anywhere. It may have moved, or the address may
          have a typo in it.
        </p>

        <div style={{ marginTop: 'var(--space-6)', display: 'flex', gap: '.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <ButtonLink href="/">Back to home</ButtonLink>
          <ButtonLink href="/faq" variant="secondary">Read the FAQ</ButtonLink>
        </div>
      </div>
    </main>
  );
}
