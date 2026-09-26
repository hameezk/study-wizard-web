/**
 * Create a Stripe Checkout session.
 *
 * Three rules this route exists to enforce:
 *
 *  1. AUTHENTICATED. The reference project's equivalent takes `userId` from the
 *     request body with no auth at all, so anyone could create a session for
 *     anyone. Here the user comes from the session cookie and nowhere else.
 *
 *  2. VERIFIED. No checkout before the email is confirmed — that is how "must
 *     verify before the account exists" is actually enforced, since Supabase
 *     creates the auth row immediately.
 *
 *  3. PRICE IS RECOMPUTED SERVER-SIDE. Nothing about money is read from the
 *     request. The client names a plan and optionally a coupon code; the
 *     amount is derived here, from the database.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase/server';
import { stripe, stripeConfigured } from '@/lib/stripe';
import { publicEnv } from '@/lib/env';

const bodySchema = z.object({
  plan: z.string().regex(/^[a-z_]{2,20}$/),
  coupon: z.string().trim().max(64).optional(),
});

export async function POST(request: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json(
      { error: 'Payments are not configured yet.' },
      { status: 503 },
    );
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const { plan: planCode, coupon } = parsed.data;

  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) {
    return NextResponse.json({ error: 'Sign in to continue.' }, { status: 401 });
  }
  if (!user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'Confirm your email address first.', code: 'email_unconfirmed' },
      { status: 403 },
    );
  }

  // ── Price, derived server-side ────────────────────────────────────────────
  const { data: plan } = await supabase
    .from('pricing_plans')
    .select('id, code, name, days, price_cents, currency')
    .eq('code', planCode)
    .eq('is_active', true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: 'That plan is not available.' }, { status: 404 });
  }

  const listPrice = plan.price_cents as number;
  let discountCents = 0;
  let couponId: string | null = null;

  // Automatic (codeless) discounts.
  const { data: discounts } = await supabase
    .from('discounts')
    .select('id, scope, plan_id, kind, value')
    .or(`scope.eq.global,plan_id.eq.${plan.id}`);

  let discountId: string | null = null;
  const auto = (discounts ?? []).sort((a, b) => (a.scope === 'plan' ? -1 : 1))[0];
  if (auto) {
    discountCents =
      auto.kind === 'percent'
        ? Math.floor((listPrice * (auto.value as number)) / 100)
        : Math.min(auto.value as number, listPrice);
    discountId = auto.id as string;
  }

  // Coupon codes are validated by an RPC that returns only a verdict — the
  // coupons table has no read policy, so codes cannot be enumerated.
  if (coupon) {
    const { data: verdict } = await supabase.rpc('validate_coupon', {
      p_code: coupon,
      p_plan_code: planCode,
    });
    const v = verdict as { valid?: boolean; discount_cents?: number; reason?: string } | null;

    if (!v?.valid) {
      return NextResponse.json(
        { error: 'That code is not valid.', reason: v?.reason ?? 'invalid' },
        { status: 400 },
      );
    }
    // A coupon replaces the automatic discount rather than stacking, unless the
    // discount explicitly allows stacking. Simpler to reason about, and it
    // prevents an accidental 100%-off combination.
    discountCents = Math.max(discountCents, v.discount_cents ?? 0);
    discountId = null;

    const { data: c } = await createSupabaseAdminClient()
      .from('coupons').select('id').eq('code', coupon).single();
    couponId = (c?.id as string) ?? null;
  }

  const totalCents = Math.max(listPrice - discountCents, 0);

  // ── Order, snapshotted ────────────────────────────────────────────────────
  // Pricing is admin-editable, so the order records what was actually charged.
  // Without this, editing a price would retroactively rewrite paid orders.
  const admin = createSupabaseAdminClient();
  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert({
      user_id: user.id,
      plan_id: plan.id,
      plan_code: plan.code,
      plan_name: plan.name,
      days_granted: plan.days,
      list_price_cents: listPrice,
      discount_cents: discountCents,
      total_cents: totalCents,
      currency: plan.currency,
      coupon_id: couponId,
      coupon_code_snapshot: coupon ?? null,
      discount_id: discountId,
      status: 'pending',
      client_ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Could not start checkout.' }, { status: 500 });
  }

  // A fully discounted order needs no payment at all; fulfil it directly rather
  // than sending the user to Stripe for a zero-amount session, which Stripe rejects.
  if (totalCents === 0) {
    await admin.rpc('grant_access', {
      p_user: user.id, p_days: plan.days, p_source: 'promo',
      p_order: order.id, p_note: 'Fully discounted order',
    });
    await admin.from('orders').update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', order.id);
    return NextResponse.json({ url: `${publicEnv.siteUrl}/checkout/success?order=${order.id}` });
  }

  // Inline price_data, so an admin price edit takes effect immediately with no
  // Stripe-side Price objects to create or keep in sync.
  const session = await stripe().checkout.sessions.create({
    mode: 'payment',
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: plan.currency,
          unit_amount: totalCents,
          product_data: {
            name: `${plan.name} — Study Wizard`,
            description: `${plan.days} ${plan.days === 1 ? 'day' : 'days'} of access`,
          },
        },
      },
    ],
    // The webhook trusts ONLY these, never anything from the browser.
    metadata: { order_id: order.id, user_id: user.id, plan_code: plan.code },
    success_url: `${publicEnv.siteUrl}/checkout/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${publicEnv.siteUrl}/buy?cancelled=1`,
  });

  await admin.from('orders')
    .update({ stripe_checkout_session_id: session.id })
    .eq('id', order.id);

  return NextResponse.json({ url: session.url });
}
