/**
 * The funnel writer.
 *
 * Worth testing despite being small, because every failure mode here is silent:
 * a `value` in cents inflates reported revenue a hundredfold, a duplicate
 * `purchase` inflates the conversion count, and an event pushed on the server
 * throws during render.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { track, trackPurchaseOnce, toMajorUnits } from '@/lib/analytics';

interface FakeWindow {
  dataLayer?: unknown[];
  sessionStorage: { getItem(k: string): string | null; setItem(k: string, v: string): void };
}

// The writer pushes onto `window.dataLayer`, so the assertions have to read the
// same object the module sees — not globalThis, which is a different target.
let win: FakeWindow;

function layer(): unknown[] {
  return win.dataLayer ?? [];
}

function fakeWindow(storageThrows = false): FakeWindow {
  const store = new Map<string, string>();
  return {
    sessionStorage: {
      getItem: (k) => {
        if (storageThrows) throw new Error('blocked');
        return store.get(k) ?? null;
      },
      setItem: (k, v) => {
        if (storageThrows) throw new Error('blocked');
        store.set(k, v);
      },
    },
  };
}

beforeEach(() => {
  win = fakeWindow();
  vi.stubGlobal('window', win);
});

describe('track', () => {
  it('creates the dataLayer if the container has not loaded yet', () => {
    track('view_pricing', { plan: 'week' });
    expect(layer()).toHaveLength(1);
    expect(layer()[0]).toEqual({ event: 'view_pricing', plan: 'week' });
  });

  it('drops undefined params so the container sees a clean payload', () => {
    track('begin_checkout', { plan: 'day', coupon: undefined, value: 2 });
    expect(layer()[0]).toEqual({ event: 'begin_checkout', plan: 'day', value: 2 });
  });

  it('keeps false and zero, which are meaningful', () => {
    track('apply_coupon', { coupon_valid: false, value: 0 });
    expect(layer()[0]).toEqual({ event: 'apply_coupon', coupon_valid: false, value: 0 });
  });

  it('is a no-op on the server rather than a crash', () => {
    vi.stubGlobal('window', undefined);
    expect(() => track('page_view')).not.toThrow();
  });
});

describe('value units', () => {
  it('converts cents to major units', () => {
    // 3000 cents is $30.00, not $3000 — the difference between a real revenue
    // report and a fictional one.
    expect(toMajorUnits(3000)).toBe(30);
    expect(toMajorUnits(199)).toBe(1.99);
    expect(toMajorUnits(0)).toBe(0);
  });
});

describe('trackPurchaseOnce', () => {
  it('fires once for an order', () => {
    trackPurchaseOnce('ord_1', { value: 30, currency: 'usd' });
    expect(layer()).toHaveLength(1);
    expect(layer()[0]).toMatchObject({ event: 'purchase', transaction_id: 'ord_1' });
  });

  it('does not fire again on a refresh of the same order', () => {
    trackPurchaseOnce('ord_1', { value: 30 });
    trackPurchaseOnce('ord_1', { value: 30 });
    trackPurchaseOnce('ord_1', { value: 30 });
    expect(layer()).toHaveLength(1);
  });

  it('still fires for a genuinely different order', () => {
    trackPurchaseOnce('ord_1', { value: 30 });
    trackPurchaseOnce('ord_2', { value: 60 });
    expect(layer()).toHaveLength(2);
  });

  it('fires when storage is blocked rather than losing the conversion', () => {
    win = fakeWindow(true);
    vi.stubGlobal('window', win);
    trackPurchaseOnce('ord_3', { value: 30 });
    expect(layer()).toHaveLength(1);
  });
});
