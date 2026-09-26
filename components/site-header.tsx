import Link from 'next/link';
import { Logo } from './logo';
import { ButtonLink } from './button';
import { NAV_LINKS } from '@/content/site';
import { publicEnv } from '@/lib/env';
import styles from './site-header.module.css';

/**
 * Exactly two actions, as specified: Get Started is the primary CTA, Log in is
 * secondary and points at the dashboard subdomain rather than an on-site form —
 * all dashboards live in the backend project.
 */
export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} aria-label="Study Wizard home">
          <Logo />
        </Link>

        <nav className={styles.nav} aria-label="Main">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={styles.link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <ButtonLink
            href={`${publicEnv.appUrl}/login`}
            variant="ghost"
            className={styles.loginLink}
          >
            Log in
          </ButtonLink>
          <ButtonLink href="/buy" variant="primary">
            Get Started
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
