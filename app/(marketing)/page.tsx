import type { Metadata } from 'next';
import Link from 'next/link';
import { ButtonLink } from '@/components/button';
import { HEADLINE_FEATURES, HOW_IT_WORKS_STEPS } from '@/content/features';
import { COMPETITORS } from '@/content/competitors';
import { ComparisonTable } from '@/components/comparison-table';
import { SITE, SUPPORTED_PLATFORMS } from '@/content/site';
import { getPlans, formatPrice } from '@/lib/pricing';
import styles from './home.module.css';

export const metadata: Metadata = { description: SITE.description };

// Pricing is admin-editable, so the page must not be baked at build time.
// A minute is short enough that a price change appears promptly and long enough
// that the homepage is not querying the database on every hit.
export const revalidate = 60;

export default async function HomePage() {
  const plans = await getPlans();
  const cheapestPerDay = plans.length
    ? plans.reduce((a, b) => (a.perDayCents <= b.perDayCents ? a : b))
    : null;

  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroGrid}`}>
          <div>
            <span className={styles.eyebrow}>
              <span className={styles.dot} aria-hidden="true" />
              Works with {SUPPORTED_PLATFORMS.join(', ')}
            </span>

            <h1 className={styles.title}>
              Get through Edgenuity <span className={styles.accent}>while you do something else.</span>
            </h1>

            <p className={styles.lede}>
              Study Wizard works through assessments, assignments and vocabulary automatically —
              and saves every question and answer into a handbook you can revise from.
            </p>

            <div className={styles.ctas}>
              <ButtonLink href="/buy" size="lg">Get Started</ButtonLink>
              <ButtonLink href="/how-it-works" variant="secondary" size="lg">
                See how it works
              </ButtonLink>
            </div>

            <p className={styles.micro}>
              {cheapestPerDay
                ? `From ${formatPrice(cheapestPerDay.perDayCents)} a day · Pay once · Nothing renews`
                : 'Pay once · Instant access · Nothing renews'}
            </p>
          </div>

          <div>
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>What it handles</h2>
              <ul className={styles.cardBody} style={{ display: 'grid', gap: '.5rem', listStyle: 'none' }}>
                {['Multiple choice and multi-select', 'Dropdowns and ordering',
                  'Fill-in-the-blank', 'Written and free responses',
                  'Vocabulary activities', 'Instructional videos'].map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="container">
          <dl className={styles.stats}>
            <div>
              <dd className={`${styles.statValue} tabular`}>9</dd>
              <dt className={styles.statLabel}>Question types handled</dt>
            </div>
            <div>
              <dd className={`${styles.statValue} tabular`}>4</dd>
              <dt className={styles.statLabel}>Pass lengths</dt>
            </div>
            <div>
              <dd className={styles.statValue}>Yours</dd>
              <dt className={styles.statLabel}>Target score, your choice</dt>
            </div>
          </dl>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className={styles.section} id="features">
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Features</p>
            <h2 className={styles.sectionTitle}>Everything runs while you are away</h2>
            <p className={styles.sectionLede}>
              Open an activity and leave it. Progress appears live in your dashboard.
            </p>
          </div>

          <div className={styles.bento}>
            {HEADLINE_FEATURES.map((f) => (
              <article key={f.title} className={styles.card}>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardBody}>{f.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>How it works</p>
            <h2 className={styles.sectionTitle}>Four steps, then it runs itself</h2>
          </div>
          <ol className={styles.steps}>
            {HOW_IT_WORKS_STEPS.map((s) => (
              <li key={s.title} className={styles.step}>
                <p className={styles.stepTitle}>{s.title}</p>
                <p className={styles.stepBody}>{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────── */}
      <section className={styles.section} id="pricing">
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Pricing</p>
            <h2 className={styles.sectionTitle}>Pay for the days you need</h2>
            <p className={styles.sectionLede}>
              No subscription. Buy more before your time runs out and it is added to what is left.
            </p>
          </div>

          <div className={styles.bento}>
            {plans.map((p) => (
              <article key={p.id} className={styles.card}>
                {p.badge && <p className={styles.sectionEyebrow}>{p.badge}</p>}
                <h3 className={styles.cardTitle}>{p.name}</h3>
                <p className={`${styles.statValue} tabular`} style={{ marginTop: '.75rem' }}>
                  {formatPrice(p.finalCents, p.currency)}
                </p>
                <p className={styles.cardBody}>
                  {formatPrice(p.perDayCents, p.currency)} a day · {p.days}{' '}
                  {p.days === 1 ? 'day' : 'days'}
                </p>
                {p.description && <p className={styles.cardBody}>{p.description}</p>}
                <div style={{ marginTop: '1.25rem' }}>
                  <ButtonLink href={`/buy?plan=${p.code}`} variant={p.isDefault ? 'primary' : 'secondary'}>
                    Choose {p.name}
                  </ButtonLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────── */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHead}>
            <p className={styles.sectionEyebrow}>Comparison</p>
            <h2 className={styles.sectionTitle}>How we differ</h2>
          </div>
          <ComparisonTable />
          <nav className={styles.compareLinks} aria-label="Detailed comparisons">
            {COMPETITORS.map((c) => (
              <Link key={c.slug} href={`/compare/${c.slug}`} className={styles.compareLink}>
                Study Wizard vs {c.name}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <div className="container">
        <section className={styles.ctaBand}>
          <h2 className={styles.ctaTitle}>Stop doing the busywork</h2>
          <p className={styles.ctaLede}>Pay once · Instant access · Nothing renews</p>
          <div style={{ marginTop: '1.75rem', display: 'flex', justifyContent: 'center' }}>
            <ButtonLink href="/buy" size="lg">Get Started</ButtonLink>
          </div>
        </section>
      </div>
    </>
  );
}
