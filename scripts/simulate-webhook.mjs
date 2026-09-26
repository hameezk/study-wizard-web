/**
 * Delivers a Stripe webhook to the local server, signed the way Stripe signs it.
 *
 * WHY THIS EXISTS. A checkout redirects the browser to Stripe, and fulfilment
 * happens in the webhook — a request Stripe makes to a public URL. Locally there is
 * no public URL, so the webhook never arrives: the payment succeeds, the order
 * stays `pending`, no access is granted, and /checkout/success polls until it gives
 * up. That looks like a broken product and is really just a missing tunnel.
 *
 * The usual answer is `stripe listen --forward-to`, and that is still the better
 * one because it exercises the real event stream. This exists for when the Stripe
 * CLI is not installed, which is most first runs.
 *
 * It is NOT a parallel fulfilment path. It builds the same event Stripe would send,
 * signs it with the same scheme, and posts it to the same route — so the
 * idempotency, the ordering and the grant all run exactly as in production. A
 * script that wrote the grant itself would prove nothing about the code that
 * matters.
 *
 *   node scripts/simulate-webhook.mjs paid <orderId>
 *   node scripts/simulate-webhook.mjs refund <orderId> [cents]
 *   node scripts/simulate-webhook.mjs paid --latest
 */
import { createHmac, randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const BASE = process.env.LOCAL_BASE_URL ?? 'http://127.0.0.1:3001';
const SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
const SUPABASE_URL = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY ?? '';

const [action, target, amountArg] = process.argv.slice(2);

if (!['paid', 'refund'].includes(action ?? '')) {
  console.error('Usage: simulate-webhook.mjs paid|refund <orderId>|--latest [cents]');
  process.exit(1);
}

if (!SECRET || SECRET.trim() === 'whsec_' || SECRET.length < 20) {
  console.error(
    'STRIPE_WEBHOOK_SECRET is missing or still the placeholder.\n' +
    '\n' +
    'The route verifies the signature before it does anything, so this script needs\n' +
    'the same secret the server has. Any non-empty value works locally as long as\n' +
    'both sides agree — for example:\n' +
    '\n' +
    '  STRIPE_WEBHOOK_SECRET=whsec_local_development_only_secret\n',
  );
  process.exit(1);
}

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error('SUPABASE_URL and SUPABASE_SECRET_KEY must be set. Run with: node --env-file=.env');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ── Find the order ──────────────────────────────────────────────────────────

async function resolveOrder() {
  if (target && target !== '--latest') {
    const { data } = await admin.from('orders')
      .select('id, user_id, status, total_cents, days_granted, plan_name, stripe_payment_intent_id')
      .eq('id', target).single();
    if (!data) throw new Error(`No order ${target}`);
    return data;
  }

  // The most recent order in the state this action applies to.
  const wanted = action === 'paid' ? 'pending' : 'paid';
  const { data } = await admin.from('orders')
    .select('id, user_id, status, total_cents, days_granted, plan_name, stripe_payment_intent_id')
    .eq('status', wanted)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) throw new Error(`No order with status "${wanted}" to act on.`);
  return data;
}

const order = await resolveOrder();

// ── Build the event ─────────────────────────────────────────────────────────
//
// Only the fields the route actually reads, because inventing the rest would be
// fiction that could drift from Stripe's real shape without anyone noticing.

const intentId = order.stripe_payment_intent_id ?? `pi_local_${order.id.slice(0, 8)}`;

const event = action === 'paid'
  ? {
      id: `evt_local_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
      object: 'event',
      type: 'checkout.session.completed',
      api_version: '2025-08-27.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `cs_local_${order.id.slice(0, 8)}`,
          object: 'checkout.session',
          payment_status: 'paid',
          payment_intent: intentId,
          customer: `cus_local_${order.user_id.slice(0, 8)}`,
          customer_email: null,
          // The route trusts ONLY this, never anything from a browser.
          metadata: { order_id: order.id, user_id: order.user_id },
        },
      },
    }
  : {
      id: `evt_local_${randomUUID().replace(/-/g, '').slice(0, 20)}`,
      object: 'event',
      type: 'charge.refunded',
      api_version: '2025-08-27.basil',
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `ch_local_${order.id.slice(0, 8)}`,
          object: 'charge',
          payment_intent: intentId,
          // Stripe sends the CUMULATIVE amount refunded, not the delta. The route
          // depends on that, so this has to match it.
          amount_refunded: Number(amountArg ?? order.total_cents),
        },
      },
    };

// ── Sign it exactly as Stripe does ──────────────────────────────────────────
//
// t=<unix>,v1=<hex hmac of "<t>.<payload>">. Written out rather than taken from the
// SDK so this script has no dependency on a configured Stripe client — the whole
// point is that it works before Stripe is set up.

const payload = JSON.stringify(event);
const timestamp = Math.floor(Date.now() / 1000);
const signature = createHmac('sha256', SECRET).update(`${timestamp}.${payload}`).digest('hex');

const res = await fetch(`${BASE}/api/stripe/webhook`, {
  method: 'POST',
  headers: {
    'content-type': 'application/json',
    'stripe-signature': `t=${timestamp},v1=${signature}`,
  },
  body: payload,
});

const body = await res.text();

console.log(`${action} → ${order.plan_name} (${order.id})`);
console.log(`  webhook  HTTP ${res.status}  ${body}`);

// ── Show what it did ────────────────────────────────────────────────────────

const { data: after } = await admin.from('orders')
  .select('status, refunded_cents, paid_at').eq('id', order.id).single();
const { data: profile } = await admin.from('profiles')
  .select('access_expires_at').eq('id', order.user_id).single();

const daysLeft = profile?.access_expires_at
  ? Math.round((new Date(profile.access_expires_at).getTime() - Date.now()) / 86_400_000)
  : null;

console.log(`  order    ${order.status} → ${after?.status}`);
console.log(`  access   ${daysLeft === null ? 'none' : `${daysLeft} day(s) remaining`}`);

if (res.status !== 200) {
  console.error('\n  The route refused it. A 400 means the signature did not verify —');
  console.error('  the server and this script must share STRIPE_WEBHOOK_SECRET.');
  process.exit(1);
}
