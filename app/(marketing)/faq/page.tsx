import type { Metadata } from 'next';
import { GENERAL_FAQ, PRICING_FAQ } from '@/content/faq';
import { publicEnv } from '@/lib/env';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Common questions about Study Wizard, how it works and what it costs.',
};

export default function FaqPage() {
  const all = [...GENERAL_FAQ, ...PRICING_FAQ];

  // Answers stay in the DOM rather than behind a toggle, so the structured data
  // matches exactly what a visitor can read — the thing search engines check.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: all.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  };

  return (
    <section className={styles.wrap}>
      <script type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>FAQ</p>
          <h1 className={styles.title}>Common questions</h1>
          <p className={styles.lede}>
            If yours is not here, ask in the dashboard or on Discord.
          </p>
        </div>

        <div style={{ maxWidth: '68ch' }}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 'var(--space-2)' }}>General</h2>
          {GENERAL_FAQ.map((qa) => (
            <div key={qa.q} className={styles.faqItem}>
              <h3 className={styles.faqQ}>{qa.q}</h3>
              <p className={styles.faqA}>{qa.a}</p>
            </div>
          ))}

          <h2 className={styles.cardTitle} style={{ margin: 'var(--space-8) 0 var(--space-2)' }}>
            Pricing and billing
          </h2>
          {PRICING_FAQ.map((qa) => (
            <div key={qa.q} className={styles.faqItem}>
              <h3 className={styles.faqQ}>{qa.q}</h3>
              <p className={styles.faqA}>{qa.a}</p>
            </div>
          ))}
        </div>

        <p className={styles.lede} style={{ marginTop: 'var(--space-8)' }}>
          Still stuck? <a href={`${publicEnv.appUrl}/support`}>Ask support</a>.
        </p>
      </div>
    </section>
  );
}
