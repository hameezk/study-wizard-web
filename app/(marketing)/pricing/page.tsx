import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import { getPlans, formatPrice } from '@/lib/pricing';
import { PRICING_FAQ } from '@/content/faq';
import { publicEnv } from '@/lib/env';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Pay for the days you need. No subscription, nothing renews.',
};

export const revalidate = 60;

export default async function PricingPage() {
  const plans = await getPlans();

  // Structured data built from the LIVE prices, so it can never drift from what
  // the page shows — a mismatch is a rich-result penalty waiting to happen.
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: 'Study Wizard',
    description: 'Automated Edgenuity coursework assistance with a saved question-and-answer handbook.',
    offers: plans.map((p) => ({
      '@type': 'Offer',
      name: p.name,
      price: (p.finalCents / 100).toFixed(2),
      priceCurrency: p.currency.toUpperCase(),
      availability: 'https://schema.org/InStock',
      url: `${publicEnv.siteUrl}/buy?plan=${p.code}`,
    })),
  };

  return (
    <section className={styles.wrap}>
      <script type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Pricing</p>
          <h1 className={styles.title}>Pay for the days you need</h1>
          <p className={styles.lede}>
            Not a subscription. Buy a block of time and it runs out — or top it up
            before it does and the days are added on.
          </p>
        </div>

        <div className={styles.priceGrid}>
          {plans.map((p) => (
            <article key={p.id} className={`${styles.priceCard} ${p.isDefault ? styles.priceCardFeatured : ''}`}>
              {p.badge && <span className={styles.badge}>{p.badge}</span>}
              <h2 className={styles.priceName}>{p.name}</h2>
              <p className={`${styles.priceValue} tabular`}>
                {formatPrice(p.finalCents, p.currency)}
                {p.compareAtCents && p.compareAtCents > p.finalCents && (
                  <span className={`${styles.was} tabular`}>{formatPrice(p.compareAtCents, p.currency)}</span>
                )}
              </p>
              <p className={`${styles.priceMeta} tabular`}>
                {formatPrice(p.perDayCents, p.currency)} a day · {p.days}{' '}
                {p.days === 1 ? 'day' : 'days'}
              </p>
              {p.description && <p className={styles.cardBody}>{p.description}</p>}
              <div style={{ marginTop: 'var(--space-5)' }}>
                <ButtonLink href={`/buy?plan=${p.code}`} variant={p.isDefault ? 'primary' : 'secondary'}>
                  Choose
                </ButtonLink>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.card} style={{ marginTop: 'var(--space-8)' }}>
          <h2 className={styles.cardTitle}>Included with every pass</h2>
          <ul className={styles.cardBody} style={{ display: 'grid', gap: '.4rem', listStyle: 'none' }}>
            {['Every question type we support', 'Your eNotes handbook, kept after your pass ends',
              'Adjustable target score', 'Activity records', 'Support in the dashboard and on Discord'].map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <h2 className={styles.title} style={{ fontSize: 'var(--text-2xl)' }}>Questions about pricing</h2>
          {PRICING_FAQ.map((qa) => (
            <div key={qa.q} className={styles.faqItem}>
              <h3 className={styles.faqQ}>{qa.q}</h3>
              <p className={styles.faqA}>{qa.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
