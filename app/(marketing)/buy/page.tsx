import type { Metadata } from 'next';
import { getPlans } from '@/lib/pricing';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { PlanPicker } from './plan-picker';
import styles from './buy.module.css';

export const metadata: Metadata = {
  title: 'Get started',
  description: 'Choose how long you need. Pay once — nothing renews.',
};

export const revalidate = 60;

export default async function BuyPage(props: {
  searchParams: Promise<{ plan?: string; cancelled?: string }>;
}) {
  const [{ plan, cancelled }, plans, supabase] = await Promise.all([
    props.searchParams,
    getPlans(),
    createSupabaseServerClient(),
  ]);

  const { data: auth } = await supabase.auth.getUser();

  return (
    <section className={styles.wrap}>
      <div className="container">
        <div className={styles.head}>
          <h1 className={styles.title}>Choose how long you need</h1>
          <p className={styles.lede}>
            No subscription. Buy a block of time and it runs out — or top it up
            before it does and the days are added on.
          </p>
          {cancelled && (
            <p className={styles.msg} role="status" style={{ marginTop: 'var(--space-4)' }}>
              Payment cancelled. Nothing was charged.
            </p>
          )}
        </div>

        <PlanPicker
          plans={plans}
          initialPlan={plan}
          signedIn={Boolean(auth.user)}
          emailConfirmed={Boolean(auth.user?.email_confirmed_at)}
        />
      </div>
    </section>
  );
}
