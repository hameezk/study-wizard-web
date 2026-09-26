import styles from './comparison-table.module.css';
import { COMPARISON_ROWS, type Support } from '@/content/features';

function label(v: Support): string {
  return v === true ? 'Yes' : v === 'partial' ? 'Partial' : 'No';
}

function markClass(v: Support): string {
  // CSS-module lookups are typed optional, so coalesce rather than assert.
  const cls = v === true ? styles.yes : v === 'partial' ? styles.partial : styles.no;
  return cls ?? '';
}

interface Props {
  /** Column heading for the other side. Defaults to the generic form. */
  themLabel?: string;
  /**
   * Shown as the table caption. Every comparison needs one, because a
   * comparison without a stated basis is the kind of claim that ages badly.
   */
  caption?: string;
}

/**
 * Shared by the home page and every `/compare/[competitor]` page, so the claim
 * set cannot drift between them — which is exactly how the reference project
 * ended up with marketing copy that contradicted its own comparison page.
 */
export function ComparisonTable({
  themLabel = 'Typical alternative',
  caption = 'Capabilities of Study Wizard, compared with what tools in this category typically offer. Describes our own product; other products change, so check theirs directly.',
}: Props) {
  return (
    <div
      className={styles.scroller}
      // Focusable and labelled: a scroll container that can only be reached by
      // dragging is unreachable by keyboard without this.
      tabIndex={0}
      role="region"
      aria-label="Capability comparison"
    >
      <table className={styles.table}>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className={styles.colLabel}>Capability</th>
            <th scope="col" className={styles.colUs}>Study Wizard</th>
            <th scope="col" className={styles.colThem}>{themLabel}</th>
          </tr>
        </thead>
        <tbody className={styles.body}>
          {COMPARISON_ROWS.map((r) => (
            <tr key={r.label}>
              <th scope="row" className={styles.rowLabel}>{r.label}</th>
              <td className={styles.us}>
                <span className={`${styles.mark} ${markClass(r.us)}`} />
                {label(r.us)}
              </td>
              <td className={styles.them}>
                <span className={`${styles.mark} ${markClass(r.them)}`} />
                {label(r.them)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
