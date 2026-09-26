/**
 * Brand mark: inline SVG only, no raster assets, so it stays crisp and picks up
 * the current theme. Stacked layers with one amber layer — organised knowledge.
 */
export function Logo({ withWordmark = true }: { withWordmark?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem' }}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
        <path d="M14 3.5 25 9l-11 5.5L3 9l11-5.5Z" fill="var(--accent)" />
        <path d="M3 14l11 5.5L25 14" stroke="var(--ink)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 19l11 5.5L25 19" stroke="var(--ink)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" opacity=".45" />
      </svg>
      {withWordmark && (
        <span style={{ fontWeight: 660, fontSize: '1.0625rem', letterSpacing: '-.02em' }}>
          Study Wizard
        </span>
      )}
    </span>
  );
}
