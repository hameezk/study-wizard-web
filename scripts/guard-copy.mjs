/**
 * Build guard: review-risk words may not appear in indexable copy.
 *
 * The extension goes through Chrome Web Store review, and the marketing site is
 * the first thing a reviewer reads. Asserting that the product defeats a
 * security control — on a page Google can crawl — is grounds for rejection
 * regardless of code quality. The reference project's competitor pages used
 * four of these words.
 *
 * The word list is docs/design.md §9. This is a lint, not a filter: it fails
 * the build rather than rewriting anything, because the replacement is a
 * judgement call about what the sentence is trying to say.
 *
 * Scope is deliberately public copy only. The dashboard and setup guide live
 * behind login in the other project, are not crawled, and are allowed to be
 * blunt — that split is the whole strategy, so widening this check would break
 * it.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not `.pathname`: this project's parent directory contains a
// space, which a file URL percent-encodes. Reading `.pathname` yielded
// "study%20wizard", every directory read threw ENOENT, and the guard reported
// success while scanning nothing at all.
const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SCAN = ['app', 'components', 'content'];

/**
 * Word-boundary matched, so "bypassing" is caught but "Screenshot" is not
 * flagged for containing "hot". `\b` around a multi-word phrase still works
 * because the boundary applies to the outer characters.
 */
const FORBIDDEN = [
  'undetected', 'undetectable', 'undetectability',
  'stealth', 'stealthy',
  'bypass', 'bypasses', 'bypassing',
  'evade', 'evades', 'evading', 'evasion',
  'cheat', 'cheating',
  'guaranteed grades', 'guarantee your grade',
  '100% score', '100% target score',
  'beat the system',
  'anti-detection', 'detection evasion',
  'defeat proctoring', 'proctorio bypass',
];

/**
 * Words that are fine in a technical comment but not in rendered text. We check
 * the whole file rather than parsing JSX, because a false positive in a comment
 * is cheap to fix and a missed string is not — but these two are common enough
 * in prose about the guard itself that checking them everywhere would make the
 * guard unable to describe its own purpose.
 */
const ALLOWLIST_FILES = new Set([
  'content/site.ts',            // documents the word list in its header comment
  'content/competitors.ts',     // ditto
  'scripts/guard-copy.mjs',
]);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(tsx?|mdx?)$/.test(entry)) out.push(full);
  }
  return out;
}

const problems = [];

for (const base of SCAN) {
  // Deliberately not wrapped in try/catch. An unreadable scan target means the
  // guard is not protecting anything, and a guard that reports success without
  // reading a single file is worse than no guard.
  const files = walk(join(ROOT, base));

  for (const file of files) {
    const rel = relative(ROOT, file);
    if (ALLOWLIST_FILES.has(rel)) continue;

    const lines = readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const word of FORBIDDEN) {
        const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (re.test(line)) {
          problems.push({ file: rel, line: i + 1, word, text: line.trim().slice(0, 100) });
        }
      }
    });
  }
}

if (problems.length > 0) {
  console.error('\nReview-risk copy found. See docs/design.md §9 for replacements.\n');
  for (const p of problems) {
    console.error(`  ${p.file}:${p.line}  "${p.word}"`);
    console.error(`    ${p.text}`);
  }
  console.error(`\n${problems.length} problem(s). Build stopped.\n`);
  process.exit(1);
}

console.log(`guard-copy: clean (${SCAN.join(', ')})`);
