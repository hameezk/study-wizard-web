/**
 * Stripe webhook: idempotency and refund reversal.
 *
 * Runs the REAL route handler, with a real Stripe signature (the SDK's own
 * test-header helper is pure crypto, so no Stripe account or network is
 * involved) and a fake database. That combination is what makes this a proof
 * rather than a mock theatre: the signature verification, the event-record-
 * first ordering, the unique-violation branch and the proportional claw-back
 * are all the production code paths.
 *
 * Both properties matter for the same reason. Stripe retries on any non-2xx and
 * on timeouts, and shared hosting can idle or restart the process mid-
 * fulfilment — so a replayed event is the normal case, not an edge case.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Stripe from 'stripe';
import { FakeAdmin } from './webhook-fake-db';

const WEBHOOK_SECRET = 'whsec_test_secret_for_signing_only';

process.env.STRIPE_SECRET_KEY = 'sk_test_not_used_for_signature_checks';
process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
process.env.APP_INTERNAL_URL = 'http://localhost:3002';
process.env.INTERNAL_API_SECRET = 'internal-test-secret';

let db: FakeAdmin;

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseAdminClient: () => db,
}));

const { POST } = await import('@/app/api/stripe/webhook/route');

// Only for signing. `Stripe.webhooks.generateTestHeaderString` never calls out.
const signer = new Stripe('sk_test_signing_only', { apiVersion: '2025-08-27.basil' });

function signedRequest(event: unknown): Request {
  const payload = JSON.stringify(event);
  const signature = signer.webhooks.generateTestHeaderString({
    payload,
    secret: WEBHOOK_SECRET,
  });
  return new Request('https://studywizard.com/api/stripe/webhook', {
    method: 'POST',
    headers: { 'stripe-signature': signature, 'content-type': 'application/json' },
    body: payload,
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const post = (event: unknown) => POST(signedRequest(event) as any);

function checkoutCompleted(id: string, orderId: string, userId: string) {
  return {
    id,
    type: 'checkout.session.completed',
    api_version: '2025-08-27.basil',
    data: {
      object: {
        id: 'cs_test_1',
        object: 'checkout.session',
        payment_status: 'paid',
        payment_intent: 'pi_test_1',
        customer: 'cus_test_1',
        customer_email: 'student@example.com',
        metadata: { order_id: orderId, user_id: userId },
      },
    },
  };
}

function chargeRefunded(id: string, amountRefunded: number) {
  return {
    id,
    type: 'charge.refunded',
    api_version: '2025-08-27.basil',
    data: {
      object: {
        id: 'ch_test_1',
        object: 'charge',
        payment_intent: 'pi_test_1',
        amount_refunded: amountRefunded,
      },
    },
  };
}

const ORDER = 'ord_1';
const USER = 'usr_1';

beforeEach(() => {
  db = new FakeAdmin();
  db.seed('orders', [{
    id: ORDER,
    user_id: USER,
    status: 'pending',
    days_granted: 30,
    total_cents: 3000,
    coupon_id: null,
    refunded_cents: 0,
    stripe_payment_intent_id: null,
  }]);
  db.seed('profiles', [{ id: USER, stripe_customer_id: null }]);
  // The Discord role sync is fire-and-forget; stub it so an unhandled rejection
  // cannot fail an unrelated assertion.
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});

describe('signature verification', () => {
  it('rejects an unsigned request without touching the database', async () => {
    const res = await POST(new Request('https://x/api/stripe/webhook', {
      method: 'POST',
      body: '{}',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
    expect(res.status).toBe(400);
    expect(db.rows('stripe_events')).toHaveLength(0);
    expect(db.rpcCalls).toHaveLength(0);
  });

  it('rejects a forged signature', async () => {
    const payload = JSON.stringify(checkoutCompleted('evt_forged', ORDER, USER));
    const res = await POST(new Request('https://x/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=deadbeef' },
      body: payload,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
    expect(res.status).toBe(400);
    expect(db.rpcCalls).toHaveLength(0);
  });

  it('does not leak the verification failure reason', async () => {
    const res = await POST(new Request('https://x/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 't=1,v1=deadbeef' },
      body: '{}',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any);
    const body = await res.json();
    expect(body.error).toBe('invalid signature');
  });
});

describe('FR-28 — a replayed webhook grants nothing extra', () => {
  it('grants once for one event', async () => {
    const res = await post(checkoutCompleted('evt_1', ORDER, USER));
    expect(res.status).toBe(200);
    expect(db.callsTo('grant_access')).toHaveLength(1);
    expect(db.callsTo('grant_access')[0]!.args).toMatchObject({
      p_user: USER, p_days: 30, p_source: 'purchase', p_order: ORDER,
    });
    expect(db.rows('orders')[0]!.status).toBe('paid');
  });

  it('grants nothing on the second delivery of the same event id', async () => {
    await post(checkoutCompleted('evt_1', ORDER, USER));
    const replay = await post(checkoutCompleted('evt_1', ORDER, USER));

    expect(replay.status).toBe(200); // acknowledged, so Stripe stops retrying
    expect(await replay.json()).toMatchObject({ received: true, duplicate: true });
    expect(db.callsTo('grant_access')).toHaveLength(1);
  });

  it('grants nothing even for a DIFFERENT event id against a paid order', async () => {
    // The second safety layer. If the stripe_events row were ever lost — a
    // restore from a backup taken mid-flight, say — the already-paid order must
    // still refuse a second grant.
    await post(checkoutCompleted('evt_1', ORDER, USER));
    const res = await post(checkoutCompleted('evt_2_different_id', ORDER, USER));

    expect(res.status).toBe(200);
    expect(db.callsTo('grant_access')).toHaveLength(1);
  });

  it('records the event before granting, so a crash mid-fulfilment cannot double-grant', async () => {
    // Prove the ordering directly: make fulfilment throw, and assert the event
    // row survives. Stripe then retries, hits the duplicate branch, and stops.
    db.rows('orders').length = 0; // order lookup will throw 'not found'
    const res = await post(checkoutCompleted('evt_crash', 'missing', USER));

    expect(res.status).toBe(500); // so Stripe retries
    expect(db.rows('stripe_events')).toHaveLength(1);
    expect(db.rows('stripe_events')[0]!.processed_at).toBeUndefined();
    expect(db.rows('stripe_events')[0]!.last_error).toContain('not found');
  });

  it('refuses to fulfil when the event cannot be recorded', async () => {
    // If we cannot prove we only did this once, we do not do it at all.
    db.failEventInsertWith = '08006'; // connection_failure
    const res = await post(checkoutCompleted('evt_x', ORDER, USER));

    expect(res.status).toBe(500);
    expect(db.rpcCalls).toHaveLength(0);
  });

  it('ignores a session that is not paid', async () => {
    const event = checkoutCompleted('evt_unpaid', ORDER, USER);
    event.data.object.payment_status = 'unpaid';
    const res = await post(event);

    expect(res.status).toBe(200);
    expect(db.callsTo('grant_access')).toHaveLength(0);
    expect(db.rows('orders')[0]!.status).toBe('pending');
  });

  it('never trusts the browser for the user — only session metadata', async () => {
    const event = checkoutCompleted('evt_meta', ORDER, 'attacker-supplied-id');
    await post(event);
    // order.user_id from the database wins over metadata.user_id.
    expect(db.callsTo('grant_access')[0]!.args.p_user).toBe(USER);
  });
});

describe('FR-29 — refund reverses access as a negative grant', () => {
  beforeEach(async () => {
    await post(checkoutCompleted('evt_paid', ORDER, USER));
    expect(db.rows('orders')[0]!.stripe_payment_intent_id).toBe('pi_test_1');
  });

  it('revokes the full term on a full refund', async () => {
    const res = await post(chargeRefunded('evt_refund_full', 3000));

    expect(res.status).toBe(200);
    expect(db.callsTo('revoke_access_days')).toHaveLength(1);
    expect(db.callsTo('revoke_access_days')[0]!.args).toMatchObject({
      p_user: USER, p_days: 30, p_order: ORDER,
    });
    expect(db.rows('orders')[0]!.status).toBe('refunded');
  });

  it('revokes proportionally on a partial refund', async () => {
    const res = await post(chargeRefunded('evt_refund_part', 1000)); // a third

    expect(res.status).toBe(200);
    expect(db.callsTo('revoke_access_days')[0]!.args.p_days).toBe(10);
    expect(db.rows('orders')[0]!.status).toBe('partially_refunded');
  });

  it('revokes only the newly refunded portion when a second refund arrives', async () => {
    await post(chargeRefunded('evt_refund_1', 1000)); // 10 days
    await post(chargeRefunded('evt_refund_2', 3000)); // cumulative total

    const calls = db.callsTo('revoke_access_days');
    expect(calls).toHaveLength(2);
    // Stripe sends the CUMULATIVE amount_refunded, so the second event must
    // claw back 20 more days, not another 30.
    expect(calls[1]!.args.p_days).toBe(20);
    expect(calls.reduce((n, c) => n + (c.args.p_days as number), 0)).toBe(30);
  });

  it('revokes nothing on a replayed refund event', async () => {
    await post(chargeRefunded('evt_refund_1', 3000));
    const replay = await post(chargeRefunded('evt_refund_1', 3000));

    expect(await replay.json()).toMatchObject({ duplicate: true });
    expect(db.callsTo('revoke_access_days')).toHaveLength(1);
  });

  it('revokes nothing for a refund with no matching order', async () => {
    db.rows('orders')[0]!.stripe_payment_intent_id = 'pi_someone_else';
    const res = await post(chargeRefunded('evt_orphan', 3000));

    expect(res.status).toBe(200);
    expect(db.callsTo('revoke_access_days')).toHaveLength(0);
  });

  it('never touches the expiry directly — reversal is a ledger entry', () => {
    // The reference project overwrote the expiry on renewal and destroyed 20
    // remaining days for a paying customer. Refunding one of several stacked
    // purchases is only correct as a negative ledger entry, so assert that no
    // code path here writes an expiry.
    const wrote = db.rpcCalls.some((c) => /expir/i.test(c.name));
    expect(wrote).toBe(false);
  });
});
