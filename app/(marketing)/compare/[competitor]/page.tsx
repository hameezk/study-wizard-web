import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/button';
import { ComparisonTable } from '@/components/comparison-table';
import { COMPETITORS, findCompetitor } from '@/content/competitors';
import { INDEPENDENCE_NOTICE } from '@/content/site';
import styles from '../../page.module.css';

/**
 * Statically generated, one page per competitor, with `dynamicParams` off so an
 * unknown slug is a build-time-known 404 rather than an on-demand render. That
 * matters here for a reason beyond performance: these pages are the highest
 * review-risk copy in the product, and an open dynamic segment would let an
 * arbitrary slug appear in a page title.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return COMPETITORS.map((c) => ({ competitor: c.slug }));
}

type Params = Promise<{ competitor: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { competitor } = await params;
  const c = findCompetitor(competitor);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/compare/${c.slug}` },
  };
}

export default async function ComparePage({ params }: { params: Params }) {
  const { competitor } = await params;
  const c = findCompetitor(competitor);
  if (!c) notFound();

  const others = COMPETITORS.filter((o) => o.slug !== c.slug);

  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Comparison</p>
          <h1 className={styles.title}>Study Wizard vs {c.name}</h1>
          <p className={styles.lede}>{c.lede}</p>
        </div>

        <div className={styles.grid}>
          {c.angles.map((a) => (
            <article key={a.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{a.title}</h2>
              <p className={styles.cardBody}>{a.body}</p>
            </article>
          ))}
        </div>

        <h2 className={styles.cardTitle} style={{ marginTop: 'var(--space-8)' }}>
          Capability by capability
        </h2>
        <ComparisonTable
          themLabel="Typical alternative"
          caption={`What Study Wizard does, set against what tools in this category typically offer. These are claims about our own product — ${c.name} may have changed since this page was written, so check theirs directly.`}
        />

        {/* Stated plainly rather than buried: an out-of-date comparison is a
            credibility problem, and pretending otherwise is worse than the
            comparison being imperfect. */}
        <p className={styles.quoteBy} style={{ marginTop: 'var(--space-4)' }}>
          {INDEPENDENCE_NOTICE} {c.name} is a trademark of its respective owner and
          is named here only for comparison.
        </p>

        <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <ButtonLink href="/buy" variant="primary">Get started — $2/day</ButtonLink>
          <ButtonLink href="/how-it-works" variant="ghost">See how it works</ButtonLink>
        </div>

        {others.length > 0 && (
          <nav aria-label="Other comparisons" style={{ marginTop: 'var(--space-7)' }}>
            <h2 className={styles.cardTitle}>Other comparisons</h2>
            {/* Standalone navigation links, so each needs a real target size —
                the inline-in-a-sentence exception to WCAG 2.5.8 does not apply. */}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {others.map((o) => (
                <li key={o.slug}>
                  <Link
                    href={`/compare/${o.slug}`}
                    style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44 }}
                  >
                    Study Wizard vs {o.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
