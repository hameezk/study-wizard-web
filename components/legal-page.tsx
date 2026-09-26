import type { LegalDoc } from '@/content/legal';
import styles from '@/app/(marketing)/legal.module.css';

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.inner}>
          <h1 className={styles.title}>{doc.title}</h1>
          <p className={styles.updated}>Last updated {doc.updated}</p>
          <p className={styles.intro}>{doc.intro}</p>

          {doc.sections.map((s) => (
            <section key={s.heading} className={styles.section}>
              <h2 className={styles.heading}>{s.heading}</h2>
              <div className={styles.body}>
                {s.body.map((p) => <p key={p}>{p}</p>)}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
