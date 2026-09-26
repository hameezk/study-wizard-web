/**
 * Build guard: exactly one module may write to the dataLayer.
 *
 * A funnel is only readable if every step is named the same way everywhere, and
 * the usual decay is each component growing its own ad-hoc push until
 * `select_plan` and `plan_select` both exist and neither tells the whole story.
 * Keeping the push in one typed place makes a misnamed event a type error.
 *
 * Also checks the inverse: that no analytics call has leaked into the auth
 * group, which deliberately loads no tag container because a signup form has an
 * email address in the DOM.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not `.pathname`: this project's parent directory contains a
// space, which a file URL percent-encodes. Reading `.pathname` yielded
// "study%20wizard", every directory read threw ENOENT, and the guard reported
// success while scanning nothing at all.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const WRITER = 'lib/analytics.ts';
/** The loader owns the container snippets, which necessarily touch dataLayer. */
const LOADER = 'components/analytics.tsx';

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|mjs|js)$/.test(entry)) out.push(full);
  }
  return out;
}

const problems = [];

for (const base of ['app', 'components', 'lib']) {
  for (const file of walk(join(ROOT, base))) {
    const rel = relative(ROOT, file);
    const src = readFileSync(file, 'utf8');

    if (/dataLayer\s*(\.|\[)/.test(src) && rel !== WRITER && rel !== LOADER) {
      problems.push(`${rel}: writes to dataLayer directly — import track() from @/lib/analytics instead`);
    }

    // The auth route group must stay free of tag-container code.
    if (rel.includes('(auth)') && /@\/lib\/analytics|@\/components\/analytics/.test(src)) {
      problems.push(`${rel}: analytics in the auth group — the funnel step must be reported from the page the user lands on`);
    }
  }
}

if (problems.length > 0) {
  console.error('\nAnalytics layering violated:\n');
  for (const p of problems) console.error(`  ${p}`);
  console.error('');
  process.exit(1);
}

console.log('check-analytics: one writer, auth group clean');
