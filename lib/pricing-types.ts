/**
 * Pure pricing types and formatting.
 *
 * Deliberately free of any server-only import. `lib/pricing.ts` uses
 * `next/headers` via the Supabase server client, so a client component that
 * imported a formatter from there would drag the whole server module into the
 * browser bundle and fail the build. Keeping the shared, pure pieces here keeps
 * that boundary obvious rather than accidental.
 */
export interface Plan {
  id: string;
  code: string;
  name: string;
  days: number;
  priceCents: number;
  compareAtCents: number | null;
  currency: string;
  description: string | null;
  badge: string | null;
  isDefault: boolean;
}

export interface PlanWithDiscount extends Plan {
  /** After any automatic (codeless) discount currently running. */
  finalCents: number;
  discountCents: number;
  perDayCents: number;
}

export const formatPrice = (cents: number, currency = 'usd'): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    // Whole dollars read cleaner on a pricing page; cents only when they exist.
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
