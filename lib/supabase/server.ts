/**
 * Supabase clients for server components, route handlers and the proxy.
 *
 * THE CRITICAL DETAIL is the cookie domain.
 *
 * Signup happens on studywizard.com and the dashboard lives on
 * dashboard.studywizard.com. For the session to survive that hop the auth
 * cookie must be scoped to `.studywizard.com` — the registrable domain with a
 * leading dot. Scope it to the host instead and the user is asked to log in a
 * second time immediately after paying, which is the worst possible moment.
 *
 * This is also why the session lives in cookies at all rather than
 * localStorage: localStorage is origin-bound and cannot cross a subdomain.
 */
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { serverEnv } from '../env';

/** Cookie options shared by every writer, so scope can never drift. */
export function cookieOptions() {
  const { cookieDomain } = serverEnv();
  return {
    // Omitted entirely on localhost: browsers reject a Domain attribute that
    // does not match the current host, which silently breaks local dev.
    ...(cookieDomain && !cookieDomain.includes('localhost') ? { domain: cookieDomain } : {}),
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
  };
}

/**
 * Request-scoped client. In Next 16 `cookies()` is async — synchronous access
 * was removed, not merely deprecated.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabasePublishableKey } = serverEnv();

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, { ...options, ...cookieOptions() });
          }
        } catch {
          // Server components cannot set cookies. Harmless when the proxy is
          // refreshing the session on the same request.
        }
      },
    },
  });
}

/**
 * Cookie-free public-read client.
 *
 * Exists for one reason: reading `cookies()` opts a route out of static
 * rendering entirely, `revalidate` or not. The price list is identical for every
 * visitor, so fetching it through the request-scoped client made the home page
 * and the pricing page render per request and put a Supabase round trip on the
 * critical path — measured at 608ms TTFB against a 600ms budget, on a machine
 * with a local network to the database. Shared hosting would be worse.
 *
 * Same publishable key, so RLS applies exactly as it does for an anonymous
 * visitor: this can read nothing the old path could not.
 */
export function createSupabasePublicClient() {
  const { supabaseUrl, supabasePublishableKey } = serverEnv();
  return createClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Secret-key client. BYPASSES RLS.
 *
 * Used only by the Stripe webhook, which must write an access grant for a user
 * who is not the caller. Never use it to serve a request on a user's behalf.
 */
export function createSupabaseAdminClient() {
  const { supabaseUrl, supabaseSecretKey } = serverEnv();
  if (!supabaseSecretKey) throw new Error('SUPABASE_SECRET_KEY is not configured');
  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
