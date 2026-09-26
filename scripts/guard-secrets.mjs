/**
 * Build guard: no secret may be inlined into the browser bundle.
 *
 * Anything in a NEXT_PUBLIC_ variable is compiled into client JavaScript and is
 * therefore public forever. The Supabase secret key bypasses RLS, so leaking it
 * hands over the entire database. This runs before every build so the mistake
 * cannot reach production.
 */
import { readFileSync, existsSync } from 'node:fs';

const FORBIDDEN = [
  { pattern: /^NEXT_PUBLIC_.*(SECRET|SERVICE_ROLE|PRIVATE|_PASS|STRIPE_SECRET)/i,
    why: 'secret material in a browser-visible variable' },
];

const problems = [];

for (const [key, value] of Object.entries(process.env)) {
  if (!key.startsWith('NEXT_PUBLIC_')) continue;
  for (const { pattern, why } of FORBIDDEN) {
    if (pattern.test(key)) problems.push(`${key}: ${why}`);
  }
  // Catch a correctly-named variable holding the wrong value.
  if (typeof value === 'string' && /^sb_secret_/.test(value)) {
    problems.push(`${key}: holds a Supabase SECRET key, which bypasses RLS`);
  }
  if (typeof value === 'string' && /^sk_(test|live)_/.test(value)) {
    problems.push(`${key}: holds a Stripe SECRET key`);
  }
}

// Also scan .env files, since a build may not have them loaded.
for (const f of ['.env', '.env.local', '.env.production']) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = /^(NEXT_PUBLIC_[A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (!m) continue;
    const [, key, val] = m;
    if (/^sb_secret_/.test(val) || /^sk_(test|live)_/.test(val)) {
      problems.push(`${f} → ${key}: holds a secret key`);
    }
  }
}

if (problems.length) {
  process.stderr.write(
    `\n  Build blocked — secrets would be exposed to the browser:\n\n` +
      problems.map((p) => `    ${p}`).join('\n') +
      `\n\n  Move these to a server-only variable (no NEXT_PUBLIC_ prefix).\n\n`,
  );
  process.exit(1);
}
