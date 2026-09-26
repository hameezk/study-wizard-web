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
 *
 * The narrow-width menu is a `<details>` element, not a scripted toggle. That
 * keeps this a server component with no hydration cost, and gets keyboard
 * operation, focus handling and the expanded/collapsed announcement from the
 * platform rather than from ARIA we would have to maintain. It also still works
 * with JavaScript disabled or still loading.
 */
export function SiteHeader() {
  const loginHref = `${publicEnv.appUrl}/login`;

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
          <ButtonLink href={loginHref} variant="ghost" className={styles.loginLink}>
            Log in
          </ButtonLink>
          <ButtonLink href="/buy" variant="primary">
            Get Started
          </ButtonLink>

          {/* Below 900px the desktop nav and the Log in link are hidden, so
              without this there would be no navigation and no way to sign in on
              a phone at all. */}
          <details className={styles.disclosure}>
            <summary className={styles.menuButton}>
              <span className={styles.menuBars} aria-hidden="true" />
              <span className={styles.menuLabel}>Menu</span>
            </summary>
            <div className={styles.panel}>
              <nav aria-label="Site">
                <ul className={styles.panelList}>
                  {NAV_LINKS.map((l) => (
                    <li key={l.href}>
                      <Link href={l.href} className={styles.panelLink}>{l.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <a href={loginHref} className={styles.panelLogin}>Log in</a>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
