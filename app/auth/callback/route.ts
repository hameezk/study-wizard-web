/**
 * OAuth and email-confirmation callback.
 *
 * Exchanges the code for a session, then makes sure the profile reflects what
 * the provider told us. For Discord that includes the Discord user id, which is
 * why signing in with Discord links the account for the bot with no separate
 * step — the identity we need is already in the token response.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';

/**
 * Only same-origin relative paths, so `next` cannot become an open redirect.
 *
 * The fallback is /buy — the plan picker — not /checkout. There is no /checkout
 * page; that prefix exists only to protect /checkout/success, and sending a
 * freshly confirmed user there landed them on a 404 at the exact moment they
 * were most likely to give up.
 */
const DEFAULT_NEXT = '/buy?new=1';

function safeNext(raw: string | null): string {
  if (!raw) return DEFAULT_NEXT;
  if (!raw.startsWith('/') || raw.startsWith('//')) return DEFAULT_NEXT;
  return raw;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const next = safeNext(searchParams.get('next'));
  const oauthError = searchParams.get('error_description') ?? searchParams.get('error');

  if (oauthError) {
    return NextResponse.redirect(`${origin}/signup?error=${encodeURIComponent('Sign-in was cancelled.')}`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/signup`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      `${origin}/signup?error=${encodeURIComponent('That link has expired. Please try again.')}`,
    );
  }

  const user = data.user;
  const identity = user.identities?.find((i) => i.provider === 'discord');

  // Mirror provider details onto the profile. Uses the secret key because the
  // profile column guard blocks a user from writing privileged columns, and
  // because handle_new_user() may only just have created the row.
  try {
    const admin = createSupabaseAdminClient();
    const patch: Record<string, unknown> = {};

    const meta = user.user_metadata ?? {};
    if (meta.full_name || meta.name) patch.display_name = meta.full_name ?? meta.name;
    if (meta.avatar_url) patch.avatar_url = meta.avatar_url;

    if (identity) {
      // provider_id is the Discord snowflake the bot matches on.
      patch.discord_user_id = identity.id;
      patch.discord_username =
        (identity.identity_data?.custom_claims as { global_name?: string } | undefined)?.global_name ??
        (identity.identity_data?.full_name as string | undefined) ??
        (identity.identity_data?.name as string | undefined) ??
        null;
      patch.discord_linked_at = new Date().toISOString();
    }

    if (Object.keys(patch).length > 0) {
      await admin.from('profiles').update(patch).eq('id', user.id);
    }
  } catch {
    // A failed profile enrichment must never block sign-in. The user can link
    // Discord manually later; losing the session here would be far worse.
  }

  return NextResponse.redirect(`${origin}${next}`);
}
