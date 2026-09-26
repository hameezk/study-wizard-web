/**
 * Password rules.
 *
 * ONE definition, used by signup, reset and change alike. The reference project
 * enforces 8 characters in the profile change route and *nothing at all* in the
 * reset route, so the weakest path silently sets the floor.
 */
export const MIN_PASSWORD_LENGTH = 10;

export interface PasswordCheck {
  ok: boolean;
  problems: string[];
}

export function checkPassword(pw: string, email?: string): PasswordCheck {
  const problems: string[] = [];

  if (pw.length < MIN_PASSWORD_LENGTH) {
    problems.push(`Use at least ${MIN_PASSWORD_LENGTH} characters.`);
  }
  if (!/[a-zA-Z]/.test(pw)) problems.push('Include at least one letter.');
  if (!/[0-9]/.test(pw)) problems.push('Include at least one number.');

  // Length and variety rules pass "password1234" happily, so reject the
  // handful of choices that are actually common in the wild.
  const lowered = pw.toLowerCase();
  const COMMON = ['password', 'qwerty', '123456', 'letmein', 'welcome', 'admin', 'studywizard'];
  if (COMMON.some((c) => lowered.includes(c))) {
    problems.push('That is too easy to guess. Try something less common.');
  }
  if (email) {
    const local = email.split('@')[0]?.toLowerCase();
    if (local && local.length > 3 && lowered.includes(local)) {
      problems.push('Do not use your email address in your password.');
    }
  }

  return { ok: problems.length === 0, problems };
}
