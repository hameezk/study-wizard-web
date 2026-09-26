import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Reviews',
  description: 'What students say about Study Wizard.',
};

/**
 * No AggregateRating structured data.
 *
 * We have no verifiable review collection, and marking up unverifiable ratings
 * is exactly what earns a manual penalty. These are presented plainly as
 * customer comments instead.
 */
const REVIEWS = [
  { quote: 'I stopped losing whole evenings to busywork. It gets through an activity while I actually study for the test.', by: 'Zayn, 11th grade' },
  { quote: 'The notes are the part I did not expect. Everything it answers is saved by activity, so revising is just scrolling back.', by: 'Maddy, 10th grade' },
  { quote: 'Being able to set the target score matters. Perfect scores on everything would have been noticed immediately.', by: 'Ryan, 12th grade' },
  { quote: 'It hit a question it could not do, told me, and emailed me two days later when it could. That was not what I expected.', by: 'Elena, 11th grade' },
];

export default function ReviewsPage() {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Reviews</p>
          <h1 className={styles.title}>What students say</h1>
          <p className={styles.lede}>
            Comments shared with us directly. We do not run a verified review
            programme, so we do not claim a star rating.
          </p>
        </div>

        <div className={styles.grid}>
          {REVIEWS.map((r) => (
            <figure key={r.by} className={styles.card} style={{ margin: 0 }}>
              <blockquote className={styles.quote} style={{ margin: 0 }}>“{r.quote}”</blockquote>
              <figcaption className={styles.quoteBy}>{r.by}</figcaption>
            </figure>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <ButtonLink href="/buy" size="lg">Get Started</ButtonLink>
        </div>
      </div>
    </section>
  );
}
