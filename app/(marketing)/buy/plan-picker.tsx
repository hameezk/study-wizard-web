'use client';

import { useState, useTransition } from 'react';
import type { PlanWithDiscount } from '@/lib/pricing-types';
import { formatPrice } from '@/lib/pricing-types';
import styles from './buy.module.css';

interface Props {
  plans: PlanWithDiscount[];
  initialPlan?: string;
  signedIn: boolean;
  emailConfirmed: boolean;
}

export function PlanPicker({ plans, initialPlan, signedIn, emailConfirmed }: Props) {
  const initial =
    plans.find((p) => p.code === initialPlan) ?? plans.find((p) => p.isDefault) ?? plans[0];

  const [selected, setSelected] = useState(initial);
  const [code, setCode] = useState('');
  const [couponCents, setCouponCents] = useState(0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const [checkingOut, setCheckingOut] = useState(false);

  if (!selected) return <p>No plans are available right now.</p>;

  // Display only. The server recomputes every figure at session creation —
  // nothing about money is ever trusted from the browser.
  const discount = Math.max(selected.discountCents, couponCents);
  const total = Math.max(selected.priceCents - discount, 0);

  async function applyCoupon() {
    if (!code.trim()) return;
    startTransition(async () => {
      const res = await fetch('/api/coupon', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), plan: selected!.code }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponCents(data.discount_cents ?? 0);
        setMsg({ ok: true, text: `Code applied — ${formatPrice(data.discount_cents ?? 0)} off.` });
      } else {
        setCouponCents(0);
        setMsg({ ok: false, text: 'That code is not valid for this plan.' });
      }
    });
  }

  async function checkout() {
    setCheckingOut(true);
    setMsg(null);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ plan: selected!.code, coupon: code.trim() || undefined }),
      });
      const data = await res.json();

      if (res.status === 401) {
        window.location.href = `/signup?plan=${selected!.code}`;
        return;
      }
      if (data.code === 'email_unconfirmed') {
        window.location.href = '/verify';
        return;
      }
      if (!res.ok || !data.url) {
        setMsg({ ok: false, text: data.error ?? 'Could not start checkout.' });
        setCheckingOut(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setMsg({ ok: false, text: 'Could not reach the payment service.' });
      setCheckingOut(false);
    }
  }

  return (
    <div className={styles.grid}>
      <fieldset className={styles.plans} style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="sr-only">Choose how long you need</legend>

        {plans.map((p) => {
          const isSel = p.code === selected.code;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => { setSelected(p); setCouponCents(0); setMsg(null); }}
              aria-pressed={isSel}
              className={`${styles.plan} ${isSel ? styles.planSelected : ''}`}
            >
              <div className={styles.planRow}>
                <span className={styles.planName}>
                  {p.name}
                  {isSel && <span className="sr-only"> (selected)</span>}
                </span>
                <span className={`${styles.planPrice} tabular`}>
                  {formatPrice(p.finalCents, p.currency)}
                  {p.compareAtCents && p.compareAtCents > p.finalCents && (
                    <span className={`${styles.was} tabular`}>
                      {formatPrice(p.compareAtCents, p.currency)}
                    </span>
                  )}
                </span>
              </div>
              <div className={styles.planRow}>
                <span className={styles.planMeta}>
                  {p.days} {p.days === 1 ? 'day' : 'days'} ·{' '}
                  <span className="tabular">{formatPrice(p.perDayCents, p.currency)}</span> a day
                </span>
                {p.badge && <span className={styles.badge}>{p.badge}</span>}
              </div>
            </button>
          );
        })}
      </fieldset>

      <aside className={styles.panel} aria-label="Order summary">
        <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 620 }}>Your order</h2>

        <div style={{ marginTop: 'var(--space-4)' }}>
          <div className={styles.summaryRow}>
            <span>{selected.name}</span>
            <span className="tabular">{formatPrice(selected.priceCents, selected.currency)}</span>
          </div>
          {discount > 0 && (
            <div className={styles.summaryRow} style={{ color: 'var(--success)' }}>
              <span>Discount</span>
              <span className="tabular">−{formatPrice(discount, selected.currency)}</span>
            </div>
          )}
          <div className={styles.total}>
            <span>Total</span>
            <span className="tabular">{formatPrice(total, selected.currency)}</span>
          </div>
        </div>

        <div className={styles.coupon}>
          <label htmlFor="coupon" className="sr-only">Discount code</label>
          <input
            id="coupon" className={styles.couponInput} value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Discount code" autoComplete="off"
          />
          <button type="button" onClick={applyCoupon} disabled={pending}
            style={{ minHeight: 44, padding: '0 1rem', borderRadius: 'var(--r-md)',
                     border: '1px solid var(--border-strong)', background: 'var(--surface)',
                     cursor: 'pointer' }}>
            {pending ? '…' : 'Apply'}
          </button>
        </div>

        {msg && (
          <p className={`${styles.msg} ${msg.ok ? styles.msgOk : styles.msgBad}`} role="status">
            {msg.text}
          </p>
        )}

        <button type="button" onClick={checkout} disabled={checkingOut}
          style={{ width: '100%', minHeight: 52, marginTop: 'var(--space-5)',
                   borderRadius: 'var(--r-full)', border: 'none', cursor: 'pointer',
                   background: 'var(--accent)', color: 'var(--accent-ink)',
                   fontWeight: 600, fontSize: 'var(--text-base)' }}>
          {checkingOut ? 'Taking you to payment…'
            : !signedIn ? 'Create account and continue'
            : !emailConfirmed ? 'Confirm your email to continue'
            : `Pay ${formatPrice(total, selected.currency)}`}
        </button>

        <p className={styles.note}>
          Pay once. Nothing renews. Time you buy is added to any you have left.
        </p>
      </aside>
    </div>
  );
}
