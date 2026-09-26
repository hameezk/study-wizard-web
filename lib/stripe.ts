import Stripe from 'stripe';
import { serverEnv } from './env';

let cached: Stripe | null = null;

/**
 * Stripe client. Lazily constructed so the app still boots without keys —
 * checkout is simply unavailable until they are configured, rather than the
 * whole site failing to start.
 */
export function stripe(): Stripe {
  const { stripeSecretKey } = serverEnv();
  if (!stripeSecretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured — checkout is unavailable.');
  }
  cached ??= new Stripe(stripeSecretKey, { apiVersion: '2025-08-27.basil' });
  return cached;
}

/**
 * Whether Stripe is REALLY configured, not merely non-empty.
 *
 * `.env.example` ships `STRIPE_SECRET_KEY=sk_test_` as a prefix to fill in, and a
 * bare prefix is a truthy string. So a plain emptiness check reported "configured",
 * the route went on to call Stripe, Stripe returned 401, and the handler threw — a
 * blank HTTP 500 where the intended answer was a clear "payments are not set up
 * yet". Getting that wrong is the difference between a demo that explains itself
 * and one that looks broken.
 *
 * A real key is a prefix plus a long random token, so the length check is what
 * distinguishes the two.
 */
const MIN_KEY_LENGTH = 20;

function looksReal(key: string): boolean {
  if (!key) return false;
  // A left-over placeholder from .env.example.
  if (/^(sk|rk)_(test|live)_?$/.test(key.trim())) return false;
  return key.trim().length >= MIN_KEY_LENGTH;
}

export const stripeConfigured = (): boolean => looksReal(serverEnv().stripeSecretKey);

/**
 * Whether the WEBHOOK secret is real. Separate from the API key because they are
 * obtained separately and it is normal to have one without the other — in local
 * development the webhook secret comes from `stripe listen`, minutes after the API
 * key comes from the dashboard.
 */
export const stripeWebhookConfigured = (): boolean => {
  const secret = serverEnv().stripeWebhookSecret;
  return Boolean(secret) && secret.trim() !== 'whsec_' && secret.trim().length >= MIN_KEY_LENGTH;
};
