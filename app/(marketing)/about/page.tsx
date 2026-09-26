import type { Metadata } from 'next';
import { INDEPENDENCE_NOTICE } from '@/content/site';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'About',
  description: 'Who builds Study Wizard and how we think about it.',
};

const PRINCIPLES = [
  { title: 'Say what it does', body: 'We describe the product accurately. We do not promise grades, and we do not claim to defeat anything.' },
  { title: 'Your work stays yours', body: 'Everything the bot works through is saved to your account and stays there after your access ends.' },
  { title: 'Tell you when it breaks', body: 'If a question type is not supported, you see it. If we are doing maintenance, you know in advance.' },
  { title: 'Pay for what you use', body: 'No subscription, no stored card, no cancellation flow. Buy time, use it, buy more if you want.' },
];

export default function AboutPage() {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>About</p>
          <h1 className={styles.title}>A small team building one thing properly</h1>
          <p className={styles.lede}>
            Study Wizard works through Edgenuity coursework and keeps a record of
            everything it does, so the time you save does not cost you the notes.
          </p>
        </div>

        <div className={styles.grid}>
          {PRINCIPLES.map((p) => (
            <article key={p.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{p.title}</h2>
              <p className={styles.cardBody}>{p.body}</p>
            </article>
          ))}
        </div>

        <p className={styles.cardBody} style={{ marginTop: 'var(--space-8)', maxWidth: '68ch' }}>
          {INDEPENDENCE_NOTICE}
        </p>
      </div>
    </section>
  );
}
