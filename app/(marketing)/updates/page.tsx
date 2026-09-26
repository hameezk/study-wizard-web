import type { Metadata } from 'next';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Updates',
  description: 'What has changed in Study Wizard recently.',
};

/**
 * Deliberately undated. A changelog with stale dates reads worse than one
 * without them, and we would rather describe what changed than imply a cadence
 * we have not committed to.
 */
const UPDATES = [
  { kind: 'Feature', title: 'eNotes grouped by activity',
    body: 'Every question and answer is now filed under the Edgenuity activity it came from, so your notes read as a handbook rather than a list.' },
  { kind: 'Feature', title: 'See your unsupported questions',
    body: 'When the bot meets a question type it cannot handle, it appears in your dashboard — and you get an email when it is supported.' },
  { kind: 'Reliability', title: 'Scheduled maintenance, announced',
    body: 'Maintenance windows show in your dashboard two days ahead with a countdown, and the bot stops cleanly rather than failing mid-question.' },
  { kind: 'Reliability', title: 'Answers verified against the platform',
    body: 'When Edgenuity marks an answer correct, we record that. Answers that were marked wrong are never tried again.' },
  { kind: 'Feature', title: 'Support in both places',
    body: 'The dashboard chat and the Discord bot are now one conversation, so switching between them keeps the history.' },
];

export default function UpdatesPage() {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Updates</p>
          <h1 className={styles.title}>What has changed</h1>
          <p className={styles.lede}>Recent work, newest first.</p>
        </div>

        <div style={{ maxWidth: '68ch' }}>
          {UPDATES.map((u) => (
            <article key={u.title} className={styles.faqItem}>
              <p className={styles.eyebrow}>{u.kind}</p>
              <h2 className={styles.faqQ} style={{ marginTop: '.25rem' }}>{u.title}</h2>
              <p className={styles.faqA}>{u.body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
