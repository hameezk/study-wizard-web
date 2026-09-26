import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { Analytics } from '@/components/analytics';

/**
 * Marketing shell, and the only layout that loads analytics.
 *
 * The auth group deliberately does not: a signup form carries an email address
 * in the DOM, and a tag manager container is arbitrary third-party JavaScript
 * with full access to the page. The `purchase` conversion is the one exception
 * that has to live inside this group, on /checkout/success, because a funnel
 * without its last step is not a funnel.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
      <Analytics />
    </>
  );
}
