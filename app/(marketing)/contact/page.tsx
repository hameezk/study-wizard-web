import type { Metadata } from 'next';
import { publicEnv } from '@/lib/env';
import styles from '../page.module.css';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'How to reach Study Wizard support.',
};

export default function ContactPage() {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <p className={styles.eyebrow}>Contact</p>
          <h1 className={styles.title}>Get in touch</h1>
          <p className={styles.lede}>
            Support is fastest from inside your dashboard, because we can see
            your account without asking you to describe it.
          </p>
        </div>

        <div className={styles.grid}>
          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Support chat</h2>
            <p className={styles.cardBody}>
              In your dashboard. Answers come straight away, and you can hand the
              conversation to a person at any point.
            </p>
            <p className={styles.cardBody}>
              <a href={`${publicEnv.appUrl}/support`}>Open support</a>
            </p>
          </article>

          {publicEnv.discordInviteUrl && (
            <article className={styles.card}>
              <h2 className={styles.cardTitle}>Discord</h2>
              <p className={styles.cardBody}>
                Use <code>/support</code> in our server. It is the same
                conversation as the dashboard, so nothing gets lost between them.
              </p>
              <p className={styles.cardBody}>
                <a href={publicEnv.discordInviteUrl} rel="noopener">Join the server</a>
              </p>
            </article>
          )}

          <article className={styles.card}>
            <h2 className={styles.cardTitle}>Email</h2>
            <p className={styles.cardBody}>
              General and billing: <a href="mailto:support@studywizard.com">support@studywizard.com</a>
            </p>
            <p className={styles.cardBody}>
              Privacy and data requests: <a href="mailto:privacy@studywizard.com">privacy@studywizard.com</a>
            </p>
          </article>
        </div>

        <div className={styles.card} style={{ marginTop: 'var(--space-6)', maxWidth: '68ch' }}>
          <h2 className={styles.cardTitle}>Before you write in</h2>
          <p className={styles.cardBody}>
            If the bot is not running, check: the extension shows Connected, the
            toggle is on, your pass has not expired, and there is no maintenance
            banner. Those four cover most of what reaches us.
          </p>
        </div>
      </div>
    </section>
  );
}
