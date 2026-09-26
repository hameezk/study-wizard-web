/**
 * Pricing, read from the database.
 *
 * Nothing about price lives in this codebase. The reference project hardcodes a
 * 16-cell price matrix in the frontend, mirrors it in the backend, and needs a
 * build-time parity script plus a deploy to change a number. Here an admin edits
 * a row and the public page reflects it on the next revalidate.
 */
import { createSupabasePublicClient } from './supabase/server';
import type { PlanWithDiscount } from './pricing-types';

// Re-exported so server components can keep importing from one place.
export { formatPrice } from './pricing-types';
export type { Plan, PlanWithDiscount } from './pricing-types';

/**
 * Active plans with automatic discounts applied.
 *
 * Coupon codes are deliberately NOT handled here — they are validated
 * server-side by an RPC that returns only a verdict, because the coupons table
 * has no read policy and codes must not be enumerable.
 */
export async function getPlans(): Promise<PlanWithDiscount[]> {
  // Deliberately the cookie-free client: the price list is the same for every
  // visitor, and touching cookies here would make every page that shows a price
  // render per request.
  const supabase = createSupabasePublicClient();

  const [{ data: plans }, { data: discounts }] = await Promise.all([
    supabase
      .from('pricing_plans')
      .select('id, code, name, days, price_cents, compare_at_cents, currency, description, badge, is_default')
      .eq('is_active', true)
      .order('sort_order'),
    supabase.from('discounts').select('id, scope, plan_id, kind, value'),
  ]);

  if (!plans) return [];

  return plans.map((p) => {
    const row = p as Record<string, unknown>;
    const priceCents = row.price_cents as number;

    const applicable = (discounts ?? []).filter(
      (d) => d.scope === 'global' || d.plan_id === row.id,
    );
    // Plan-scoped beats global; an EXCLUDE constraint already guarantees only
    // one plan-scoped sale can be live at a time.
    const best = applicable.sort((a, b) => (a.scope === 'plan' ? -1 : 1))[0];

    const discountCents = best
      ? best.kind === 'percent'
        ? Math.floor((priceCents * (best.value as number)) / 100)
        : Math.min(best.value as number, priceCents)
      : 0;

    const finalCents = Math.max(priceCents - discountCents, 0);
    const days = row.days as number;

    return {
      id: row.id as string,
      code: row.code as string,
      name: row.name as string,
      days,
      priceCents,
      compareAtCents: (row.compare_at_cents as number | null) ?? null,
      currency: (row.currency as string) ?? 'usd',
      description: (row.description as string | null) ?? null,
      badge: (row.badge as string | null) ?? null,
      isDefault: Boolean(row.is_default),
      finalCents,
      discountCents,
      perDayCents: Math.round(finalCents / days),
    };
  });
}
