import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import { HEADLINE_FEATURES } from '@/content/features';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Features',
  description: 'Everything Study Wizard handles, and how it keeps a record of your work.',
};

const MORE = [
  { title: 'Activity records', body: 'A complete record of every activity worked through, with each question and the answer given.' },
  { title: 'Unsupported questions', body: 'If a question type is not supported yet you can see it in your dashboard, and we email you when it is.' },
  { title: 'Live progress', body: 'Watch questions being answered from your dashboard while the tab works in the background.' },
  { title: 'One device at a time', body: 'Your pass is bound to a single computer, and you can release it yourself whenever you switch.' },
  { title: 'Scheduled maintenance', body: 'We announce maintenance in advance and show a countdown, rather than failing silently.' },
  { title: 'Support where you are', body: 'Ask in the dashboard or on Discord — it is the same conversation either way.' },
];

export default function FeaturesPage() {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Features</p>
          <h1 className={styles.title}>Everything runs while you are away</h1>
          <p className={styles.lede}>
            Open an Edgenuity activity, leave the tab open, and get on with
            something else.
          </p>
        </div>

        <div className={styles.grid}>
          {HEADLINE_FEATURES.map((f) => (
            <article key={f.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{f.title}</h2>
              <p className={styles.cardBody}>{f.body}</p>
            </article>
          ))}
          {MORE.map((f) => (
            <article key={f.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{f.title}</h2>
              <p className={styles.cardBody}>{f.body}</p>
            </article>
          ))}
        </div>

        <div style={{ marginTop: 'var(--space-8)', display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          <ButtonLink href="/buy" size="lg">Get Started</ButtonLink>
          <ButtonLink href="/how-it-works" variant="secondary" size="lg">See how it works</ButtonLink>
        </div>
      </div>
    </section>
  );
}
