/**
 * Environment access, split by where the value is allowed to travel.
 *
 * `publicEnv` is inlined into the browser bundle, so every value in it is
 * public forever. `serverEnv()` throws if called from a client component,
 * which turns a dangerous mistake into an immediate, obvious error.
 *
 * NEXT_PUBLIC_ variables must be referenced as complete literal property
 * accesses — Next replaces them at build time by textual match, so
 * `process.env[key]` does not work.
 */
export const publicEnv = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3001',
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  chromeStoreUrl: process.env.NEXT_PUBLIC_CHROME_WEB_STORE_URL ?? '',
  discordInviteUrl: process.env.NEXT_PUBLIC_DISCORD_INVITE_URL ?? '',
  /** GTM container. Empty means no analytics script loads at all. */
  gtmId: process.env.NEXT_PUBLIC_GTM_ID ?? '',
} as const;

export function serverEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() called in the browser — this would leak secrets.');
  }
  return {
    supabaseUrl: process.env.SUPABASE_URL ?? publicEnv.supabaseUrl,
    supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ?? publicEnv.supabaseKey,
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? '',
    cookieDomain: process.env.SESSION_COOKIE_DOMAIN ?? '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
    internalApiSecret: process.env.INTERNAL_API_SECRET ?? '',
    appInternalUrl: process.env.APP_INTERNAL_URL ?? '',
  };
}

export const isProd = process.env.NODE_ENV === 'production';
