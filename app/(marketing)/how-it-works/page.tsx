import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import { HOW_IT_WORKS_STEPS } from '@/content/features';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'How it works',
  description: 'Four steps, about a minute of setup, then it runs itself.',
};

export default function HowItWorksPage() {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>How it works</p>
          <h1 className={styles.title}>Four steps, then it runs itself</h1>
          <p className={styles.lede}>Setup takes about a minute. After that you just open activities.</p>
        </div>

        <ol className={styles.steps} style={{ listStyle: 'none' }}>
          {HOW_IT_WORKS_STEPS.map((s) => (
            <li key={s.title} className={styles.step}>
              <h2 className={styles.stepTitle}>{s.title}</h2>
              <p className={styles.stepBody}>{s.body}</p>
            </li>
          ))}
        </ol>

        <div className={styles.card} style={{ marginTop: 'var(--space-8)' }}>
          <h2 className={styles.cardTitle}>What happens behind the scenes</h2>
          <p className={styles.cardBody}>
            The extension reads the question on the page and asks our service what
            to do. The service works out the answer and sends back which option to
            choose; the extension fills it in at a natural pace and submits.
            Everything it works through is saved to your eNotes as it goes.
          </p>
          <p className={styles.cardBody}>
            If it meets a question type it does not support yet, it reports it and
            moves on rather than guessing — and you get an email once it is supported.
          </p>
        </div>

        <div style={{ marginTop: 'var(--space-8)' }}>
          <ButtonLink href="/buy" size="lg">Get Started</ButtonLink>
        </div>
      </div>
    </section>
  );
}
