import Link from 'next/link';
import { Logo } from './logo';
import { FOOTER_SECTIONS, SITE, SUPPORTED_PLATFORMS, INDEPENDENCE_NOTICE } from '@/content/site';
import styles from './site-footer.module.css';

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.grid}>
          <div className={styles.brandCol}>
            <Logo />
            <p className={styles.tagline}>{SITE.tagline}</p>
          </div>

          {FOOTER_SECTIONS.map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h2 className={styles.colTitle}>{section.title}</h2>
              <ul className={styles.list}>
                {section.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className={styles.link}>{l.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className={styles.bottom}>
          <p>Works with {SUPPORTED_PLATFORMS.join(' · ')}</p>
          {/* Required on every page: we are not affiliated with Edgenuity. */}
          <p>{INDEPENDENCE_NOTICE}</p>
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
