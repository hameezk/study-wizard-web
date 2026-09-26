'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { track } from '@/lib/analytics';
import { publicEnv } from '@/lib/env';

/**
 * Loads the GTM container and reports page views on client navigation.
 *
 * Three decisions worth recording:
 *
 *  1. NOTHING LOADS WITHOUT A CONTAINER ID. No id configured means no third-
 *     party script, no cookie and no consent question — which is the correct
 *     state for local development and for a first deploy.
 *
 *  2. CONSENT MODE DEFAULTS TO DENIED for advertising storage, set BEFORE the
 *     container loads. Ordering is the whole point: a default set after the
 *     container has initialised is ignored, which is the common way sites end
 *     up believing they have consent handling when they do not. Analytics
 *     storage defaults to granted, which is the usual posture for first-party
 *     measurement; if advertising features are ever switched on in the
 *     container, a consent banner has to grant `ad_storage` explicitly.
 *
 *  3. PAGE VIEWS ARE PUSHED MANUALLY. App Router navigation does not reload the
 *     document, so GTM's automatic page-view trigger fires once per session and
 *     then never again.
 */
export function Analytics() {
  const containerId = publicEnv.gtmId;
  const pathname = usePathname();
  // The container script pushes its own initial page view, so skip the first
  // effect run to avoid counting the landing page twice.
  const seenFirst = useRef(false);

  useEffect(() => {
    if (!containerId) return;
    if (!seenFirst.current) {
      seenFirst.current = true;
      return;
    }
    track('page_view', { page_path: pathname });
  }, [containerId, pathname]);

  if (!containerId) return null;

  return (
    <>
      {/* beforeInteractive so the consent defaults are in the dataLayer before
          the container reads them. */}
      <Script id="consent-defaults" strategy="beforeInteractive">
        {`window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{
  ad_storage:'denied',
  ad_user_data:'denied',
  ad_personalization:'denied',
  analytics_storage:'granted',
  wait_for_update:500
});`}
      </Script>

      <Script id="gtm" strategy="afterInteractive">
        {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`}
      </Script>
    </>
  );
}
