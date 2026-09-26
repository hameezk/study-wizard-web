import type { Metadata } from 'next';
import { ButtonLink } from '@/components/button';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { publicEnv } from '@/lib/env';
import { formatPrice } from '@/lib/pricing';
import styles from '../../buy/buy.module.css';

export const metadata: Metadata = {
  title: 'Payment received',
  robots: { index: false, follow: false },
};

export default async function SuccessPage(props: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await props.searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: order } = orderId
    ? await supabase
        .from('orders')
        .select('id, plan_name, days_granted, total_cents, currency, status')
        .eq('id', orderId)
        .single()
    : { data: null };

  // Fulfilment happens in the webhook, which can land a second or two after the
  // browser returns. Never show failure here — the payment succeeded, and the
  // grant is moments away. Showing an error would panic someone who has just
  // been charged.
  const settled = order?.status === 'paid';

  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.panel} style={{ position: 'static', maxWidth: 520, margin: '0 auto' }}>
          <h1 className={styles.title} style={{ fontSize: 'var(--text-2xl)' }}>
            Payment received
          </h1>

          <p style={{ marginTop: 'var(--space-4)', color: 'var(--ink-2)' }}>
            {settled
              ? 'Your access is active. Head to your dashboard to install the extension and get going.'
              : 'Thanks — we are finishing your order. Your access will be active in a moment.'}
          </p>

          {order && (
            <div style={{ marginTop: 'var(--space-5)' }}>
              <div className={styles.summaryRow}>
                <span>{order.plan_name as string}</span>
                <span className="tabular">
                  {formatPrice(order.total_cents as number, (order.currency as string) ?? 'usd')}
                </span>
              </div>
              <div className={styles.summaryRow}>
                <span>Access</span>
                <span className="tabular">
                  {order.days_granted as number}{' '}
                  {(order.days_granted as number) === 1 ? 'day' : 'days'}
                </span>
              </div>
            </div>
          )}

          <div style={{ marginTop: 'var(--space-6)' }}>
            {/* External: the dashboard is a separate app on its own subdomain.
                The session cookie is scoped to the registrable domain, so the
                user arrives already signed in. */}
            <ButtonLink href={`${publicEnv.appUrl}/`} size="lg">
              Go to your dashboard
            </ButtonLink>
          </div>

          <p className={styles.note}>
            A receipt is on its way to your email address.
          </p>
        </div>
      </div>
    </section>
  );
}
