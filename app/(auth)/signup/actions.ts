'use server';

/**
 * Signup server actions.
 *
 * Server actions rather than route handlers so the password never travels
 * through client-side JavaScript we control, and so the anti-enumeration
 * behaviour cannot be bypassed by calling an endpoint directly.
 */
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { checkPassword } from '@/lib/password';
import { publicEnv } from '@/lib/env';

const signupSchema = z.object({
  email: z.email('Enter a valid email address.'),
  password: z.string().min(1, 'Enter a password.'),
  plan: z.string().regex(/^[a-z_]{2,20}$/).optional(),
});

export interface ActionState {
  error?: string;
  problems?: string[];
  email?: string;
}

export async function signupAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signupSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    plan: formData.get('plan') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Check your details.' };
  }

  const { email, password, plan } = parsed.data;

  const pw = checkPassword(password, email);
  if (!pw.ok) return { error: 'Choose a stronger password.', problems: pw.problems, email };

  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get('origin') ?? publicEnv.siteUrl;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
        plan ? `/checkout?plan=${plan}` : '/checkout',
      )}`,
    },
  });

  if (error) {
    // Supabase returns a distinct error for an existing address. Surfacing it
    // would confirm which emails have accounts, so every failure reads the same
    // and the user is sent to the same "check your inbox" screen either way.
    // A genuine duplicate gets an email telling them they already have an
    // account, which is the safe way to tell the right person.
    if (/already registered|already exists/i.test(error.message)) {
      redirect(`/verify?email=${encodeURIComponent(email)}`);
    }
    return { error: 'We could not create that account. Try again in a moment.', email };
  }

  redirect(`/verify?email=${encodeURIComponent(email)}`);
}

/**
 * OAuth. Google and Discord arrive with a verified address, so they skip the
 * verification gate entirely — which is exactly the exception the brief asks
 * for. Discord additionally carries the Discord user id, so signing up this way
 * links the account for the bot with no separate step.
 */
export async function oauthAction(formData: FormData): Promise<void> {
  const provider = formData.get('provider');
  if (provider !== 'google' && provider !== 'discord') {
    throw new Error('Unsupported provider');
  }

  const plan = formData.get('plan');
  const supabase = await createSupabaseServerClient();
  const origin = (await headers()).get('origin') ?? publicEnv.siteUrl;
  const next = plan ? `/checkout?plan=${String(plan)}` : '/checkout';

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      // identify gives us the Discord user id for account linking.
      ...(provider === 'discord' ? { scopes: 'identify email' } : {}),
    },
  });

  if (error || !data.url) throw new Error('Could not start sign-in.');
  redirect(data.url);
}
