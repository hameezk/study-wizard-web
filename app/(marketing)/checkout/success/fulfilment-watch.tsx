'use client';

import { useEffect, useState } from 'react';
import { trackPurchaseOnce, toMajorUnits } from '@/lib/analytics';

interface Props {
  orderId: string;
  settled: boolean;
  totalCents: number;
  currency: string;
  days: number;
  plan: string;
}

/**
 * Waits for the webhook to land, then reports the conversion.
 *
 * The payment and the grant are deliberately separate: Stripe redirects the
 * browser back the instant the charge succeeds, while fulfilment happens in the
 * webhook, which can arrive a second or two later — or, if Stripe retries,
 * considerably later. Without this the page renders "we are finishing your
 * order" and simply stays there until the user thinks to refresh.
 *
 * `router.refresh()` re-runs the server component, so the order row is re-read
 * rather than trusted from the first render.
 *
 * Polling stops after a bounded number of attempts. It does not surface a
 * failure when it gives up: the payment succeeded, the sweeper reprocesses
 * unprocessed Stripe events, and telling someone who has just been charged that
 * something went wrong would be both alarming and wrong.
 */
export function FulfilmentWatch({ orderId, settled, totalCents, currency, days, plan }: Props) {
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (settled) {
      trackPurchaseOnce(orderId, {
        value: toMajorUnits(totalCents),
        currency,
        days,
        plan,
      });
      return;
    }
    // ~30 seconds total, backing off so a slow webhook does not mean fifteen
    // requests a second.
    if (attempts >= 10) return;

    const delay = Math.min(1500 + attempts * 500, 5000);
    const timer = setTimeout(() => {
      setAttempts((n) => n + 1);
      // A plain reload rather than router.refresh(): this page reads the order
      // with the server Supabase client, and a full reload is the one thing
      // guaranteed to pick up the new row in every deployment topology,
      // including behind a proxy that caches RSC payloads.
      window.location.reload();
    }, delay);

    return () => clearTimeout(timer);
  }, [settled, attempts, orderId, totalCents, currency, days, plan]);

  if (settled) return null;

  return (
    // Announced politely, so a screen-reader user is told when it settles
    // instead of being left on a stale sentence.
    <p aria-live="polite" style={{ marginTop: 'var(--space-3)', color: 'var(--ink-3)', fontSize: 'var(--text-sm)' }}>
      {attempts >= 10
        ? 'This is taking a little longer than usual. Your payment went through — access will appear shortly, and the receipt is on its way.'
        : 'Checking…'}
    </p>
  );
}
