/**
 * The only place in this project that writes to `window.dataLayer`.
 *
 * Why a single writer matters more than it looks: a funnel is only useful if
 * every step is named consistently, and the usual failure is five components
 * each pushing its own ad-hoc event shape until `select_plan` and `plan_select`
 * both exist and neither has the full picture. The event vocabulary below is
 * closed, so a typo is a type error rather than a silently missing step.
 *
 * `scripts/check-analytics.mjs` fails the build if `dataLayer.push` appears
 * anywhere else.
 *
 * Tag configuration itself lives in the GTM container, not here. This module
 * only emits facts about what happened; deciding which of them reach Google,
 * Meta or nothing at all is a container decision, which is what makes it
 * changeable without a deploy.
 */

/** Closed vocabulary. Ordered as the funnel runs. */
export type AnalyticsEvent =
  | 'page_view'
  | 'view_pricing'      // /pricing or /buy rendered
  | 'select_plan'       // a duration chosen in the picker
  | 'apply_coupon'      // code submitted, valid or not
  | 'begin_checkout'    // Pay pressed, before the Stripe redirect
  | 'sign_up'           // account created
  | 'verify_email'      // confirmation link followed
  | 'purchase'          // order settled — fired once per order
  | 'install_click';    // Chrome Web Store link followed

export interface EventParams {
  /** Plan code, e.g. `day`, `week`. */
  plan?: string;
  /** Always in major units for analytics tools, which expect currency amounts. */
  value?: number;
  currency?: string;
  days?: number;
  coupon?: string;
  /** Whether the coupon was accepted. Rejections are the interesting half. */
  coupon_valid?: boolean;
  /** Order id. Doubles as the deduplication key for `purchase`. */
  transaction_id?: string;
  page_path?: string;
  method?: string;
}

interface DataLayerWindow extends Window {
  dataLayer?: unknown[];
}

/**
 * Cents to major units. Analytics tools treat `value` as a currency amount, so
 * pushing cents overstates revenue by 100x — a mistake that is invisible until
 * someone reports on it.
 */
export const toMajorUnits = (cents: number): number => Math.round(cents) / 100;

export function track(event: AnalyticsEvent, params: EventParams = {}): void {
  if (typeof window === 'undefined') return;

  const w = window as DataLayerWindow;
  // Created here rather than assumed: events can fire before the container
  // script has loaded, and GTM replays whatever it finds in the array.
  w.dataLayer ??= [];

  // Undefined values are dropped so the container sees a clean payload.
  const clean: Record<string, unknown> = { event };
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) clean[k] = v;
  }

  w.dataLayer.push(clean);
}

/**
 * Fires `purchase` at most once per order, per browser.
 *
 * The success page is reachable by refresh, by back-button and by a shared
 * link, and the reference project's conversion numbers were inflated by exactly
 * that. sessionStorage is the right scope: it survives a refresh, and a genuine
 * second purchase has a different order id anyway.
 */
export function trackPurchaseOnce(orderId: string, params: EventParams): void {
  if (typeof window === 'undefined') return;

  const key = `sw:purchase:${orderId}`;
  try {
    if (window.sessionStorage.getItem(key)) return;
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Storage blocked (private mode, or a strict cookie policy). Fire anyway:
    // a possible duplicate is better than a missing conversion.
  }

  track('purchase', { ...params, transaction_id: orderId });
}
