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

export const stripeConfigured = (): boolean => Boolean(serverEnv().stripeSecretKey);
