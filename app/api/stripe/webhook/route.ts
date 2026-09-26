/**
 * Stripe webhook — payment fulfilment.
 *
 * This is the most failure-sensitive route in the product: getting it wrong
 * either charges someone without granting access, or grants twice.
 *
 * Four properties it must have, and how each is achieved:
 *
 *  1. RAW BODY. Signature verification hashes the exact bytes Stripe sent, so
 *     the body must not be parsed first. In the App Router each route reads its
 *     own body, so there is no global JSON parser to sequence around — unlike
 *     Express, where this ordering is a classic source of "signature invalid".
 *
 *  2. IDEMPOTENT. The event id is recorded BEFORE any work. Shared hosting can
 *     idle or restart the process mid-fulfilment and Stripe will retry, so
 *     "have I already handled this?" must be answerable from the database
 *     rather than from memory.
 *
 *  3. ADDITIVE. grant_access() stacks onto whatever time remains. The reference
 *     project once overwrote instead, destroying 20 remaining days for a
 *     paying customer.
 *
 *  4. TRUSTS ONLY STRIPE. The order and user come from session metadata that we
 *     set when creating the session — never from anything the browser sends.
 */
import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe, stripeWebhookConfigured } from '@/lib/stripe';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { serverEnv } from '@/lib/env';

export async function POST(request: NextRequest) {
  // The WEBHOOK secret, not the API key.
  //
  // This route never calls the Stripe API: it verifies a signature and writes to
  // the database. Gating it on STRIPE_SECRET_KEY was both wrong in principle and
  // wrong in practice — it made local fulfilment impossible, because the API key
  // comes from the dashboard while the webhook secret comes from `stripe listen`,
  // and you routinely have one without the other.
  if (!stripeWebhookConfigured()) {
    return NextResponse.json(
      { error: 'webhook not configured', code: 'no_webhook_secret' },
      { status: 503 },
    );
  }

  const { stripeWebhookSecret } = serverEnv();
  const signature = request.headers.get('stripe-signature');
  if (!signature || !stripeWebhookSecret) {
    return NextResponse.json({ error: 'missing signature' }, { status: 400 });
  }

  // Raw text, before any parsing.
  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, stripeWebhookSecret);
  } catch {
    // Never echo the reason — it would help an attacker tune a forgery.
    return NextResponse.json({ error: 'invalid signature' }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();

  // Record first. A unique violation here means we have seen this event before,
  // so the work is already done (or in flight) and we must not repeat it.
  const { error: insertError } = await admin.from('stripe_events').insert({
    id: event.id,
    type: event.type,
    api_version: event.api_version ?? null,
    payload: event as unknown as Record<string, unknown>,
  });

  if (insertError) {
    if (insertError.code === '23505') {
      // Already recorded. Acknowledge so Stripe stops retrying.
      return NextResponse.json({ received: true, duplicate: true });
    }
    // Could not record it — return 500 so Stripe retries rather than
    // fulfilling something we cannot prove we only did once.
    return NextResponse.json({ error: 'storage failure' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await fulfil(admin, event.data.object);
        break;
      case 'charge.refunded':
        await handleRefund(admin, event.data.object);
        break;
      default:
        break; // Recorded, deliberately unhandled.
    }

    await admin.from('stripe_events')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', event.id);

    return NextResponse.json({ received: true });
  } catch (err) {
    await admin.from('stripe_events').update({
      last_error: err instanceof Error ? err.message : String(err),
      attempts: 1,
    }).eq('id', event.id);

    // 500 so Stripe retries. processed_at stays null, and the sweeper also
    // picks up unprocessed events as a second safety net.
    return NextResponse.json({ error: 'processing failed' }, { status: 500 });
  }
}

type Admin = ReturnType<typeof createSupabaseAdminClient>;

async function fulfil(admin: Admin, session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return;

  const orderId = session.metadata?.order_id;
  const userId = session.metadata?.user_id;
  if (!orderId || !userId) throw new Error('session metadata missing order_id/user_id');

  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, status, days_granted, total_cents, coupon_id')
    .eq('id', orderId)
    .single();

  if (!order) throw new Error(`order ${orderId} not found`);

  // Second idempotency layer: even if the event record were lost, an already
  // paid order is never granted twice.
  if (order.status === 'paid') return;

  await admin.rpc('grant_access', {
    p_user: order.user_id,
    p_days: order.days_granted,
    p_source: 'purchase',
    p_order: order.id,
    p_note: null,
  });

  await admin.from('orders').update({
    status: 'paid',
    paid_at: new Date().toISOString(),
    stripe_payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
  }).eq('id', order.id);

  if (order.coupon_id) {
    // The trigger on this table maintains coupons.redeemed_count, which the
    // max_redemptions CHECK depends on.
    await admin.from('coupon_redemptions').insert({
      coupon_id: order.coupon_id,
      user_id: order.user_id,
      order_id: order.id,
      discount_cents: 0,
    });
  }

  if (session.customer && typeof session.customer === 'string') {
    await admin.from('profiles')
      .update({ stripe_customer_id: session.customer })
      .eq('id', order.user_id);
  }

  // Grant the Discord subscriber role, if they have linked an account. Fire and
  // forget: Discord being slow or down must never make Stripe retry a
  // fulfilment that has already succeeded.
  void fetch(`${serverEnv().appInternalUrl}/internal/discord/sync-role`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-internal-key': serverEnv().internalApiSecret },
    body: JSON.stringify({ userId: order.user_id }),
    signal: AbortSignal.timeout(5000),
  }).catch(() => {});

  // Queued, not sent inline: a slow SMTP server must never delay the webhook
  // response and cause Stripe to retry a fulfilment that already succeeded.
  await admin.from('email_outbox').insert({
    to_email: session.customer_email ?? '',
    user_id: order.user_id,
    template: 'payment_receipt',
    payload: { order_id: order.id, days: order.days_granted, total_cents: order.total_cents },
    dedupe_key: `payment_receipt:${order.id}`,
  });
}

async function handleRefund(admin: Admin, charge: Stripe.Charge) {
  const intentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : null;
  if (!intentId) return;

  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, days_granted, total_cents, refunded_cents')
    .eq('stripe_payment_intent_id', intentId)
    .single();

  if (!order) return;

  const refundedNow = charge.amount_refunded;
  const already = (order.refunded_cents as number) ?? 0;
  if (refundedNow <= already) return;

  // Claw back proportionally to what was refunded. Expressed as a NEGATIVE
  // ledger entry, never by editing the expiry — that is what makes refunding
  // one of several stacked purchases correct.
  const ratio = (refundedNow - already) / (order.total_cents as number);
  const days = Math.round((order.days_granted as number) * ratio);

  if (days > 0) {
    await admin.rpc('revoke_access_days', {
      p_user: order.user_id,
      p_days: days,
      p_order: order.id,
      p_note: `Stripe refund ${charge.id}`,
    });
  }

  await admin.from('orders').update({
    refunded_cents: refundedNow,
    refunded_at: new Date().toISOString(),
    status: refundedNow >= (order.total_cents as number) ? 'refunded' : 'partially_refunded',
  }).eq('id', order.id);
}
