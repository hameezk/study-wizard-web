import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';

/**
 * Auth and checkout routes are disallowed.
 *
 * Not for secrecy — they are protected server-side — but because indexing a
 * signup or checkout page produces search results that drop people into the
 * middle of a flow with no context.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/signup', '/verify', '/auth/', '/checkout', '/checkout/'],
    },
    sitemap: `${publicEnv.siteUrl}/sitemap.xml`,
  };
}
