'use client';

import { useActionState } from 'react';
import { MIN_PASSWORD_LENGTH } from '@/lib/password';
import { signupAction, oauthAction, type ActionState } from './actions';
import styles from '../auth.module.css';

export function SignupForm({ plan }: { plan?: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(signupAction, {});

  return (
    <div className={styles.card}>
      <h1 className={styles.title}>Create your account</h1>
      <p className={styles.lede}>
        You will confirm your email address before choosing a pass.
      </p>

      <div className={styles.oauth} style={{ marginTop: 'var(--space-6)' }}>
        <form action={oauthAction}>
          <input type="hidden" name="provider" value="google" />
          {plan && <input type="hidden" name="plan" value={plan} />}
          <button type="submit" className={styles.oauthBtn}>Continue with Google</button>
        </form>
        <form action={oauthAction}>
          <input type="hidden" name="provider" value="discord" />
          {plan && <input type="hidden" name="plan" value={plan} />}
          <button type="submit" className={styles.oauthBtn}>Continue with Discord</button>
        </form>
      </div>

      <p className={styles.divider}>or use your email</p>

      <form action={action} className={styles.form} noValidate>
        {plan && <input type="hidden" name="plan" value={plan} />}

        {state.error && (
          <div className={styles.error} role="alert">
            <div>
              <p>{state.error}</p>
              {state.problems && (
                <ul className={styles.errorList}>
                  {state.problems.map((p) => <li key={p}>{p}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="email">Email address</label>
          <input
            id="email" name="email" type="email" required
            autoComplete="email" defaultValue={state.email ?? ''}
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="password">Password</label>
          <input
            id="password" name="password" type="password" required
            autoComplete="new-password" minLength={MIN_PASSWORD_LENGTH}
            aria-describedby="password-hint"
            className={styles.input}
          />
          <p id="password-hint" className={styles.hint}>
            At least {MIN_PASSWORD_LENGTH} characters, including a letter and a number.
          </p>
        </div>

        <button type="submit" className={styles.oauthBtn} disabled={pending}
                style={{ background: 'var(--accent)', color: 'var(--accent-ink)', border: 'none', fontWeight: 560 }}>
          {pending ? 'Creating your account…' : 'Create account'}
        </button>
      </form>

      <p className={styles.foot}>
        Already have an account?{' '}
        {/* Login lives on the dashboard subdomain — all dashboards are in the
            backend project, so this is an external link, not a route. */}
        <a href={`${process.env.NEXT_PUBLIC_APP_URL ?? ''}/login`}>Log in</a>
      </p>
    </div>
  );
}
