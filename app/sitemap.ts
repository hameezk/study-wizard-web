import type { MetadataRoute } from 'next';
import { publicEnv } from '@/lib/env';
import { COMPETITORS } from '@/content/competitors';

/** Indexable pages only — the same set robots.ts allows. */
const PAGES: Array<{ path: string; priority: number; changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly' }> = [
  { path: '/',              priority: 1.0, changeFrequency: 'weekly' },
  { path: '/features',      priority: 0.8, changeFrequency: 'monthly' },
  { path: '/how-it-works',  priority: 0.8, changeFrequency: 'monthly' },
  { path: '/pricing',       priority: 0.9, changeFrequency: 'weekly' },
  { path: '/buy',           priority: 0.9, changeFrequency: 'weekly' },
  { path: '/faq',           priority: 0.7, changeFrequency: 'monthly' },
  { path: '/reviews',       priority: 0.5, changeFrequency: 'monthly' },
  { path: '/updates',       priority: 0.5, changeFrequency: 'weekly' },
  { path: '/about',         priority: 0.4, changeFrequency: 'yearly' },
  { path: '/contact',       priority: 0.4, changeFrequency: 'yearly' },
  { path: '/terms',         priority: 0.2, changeFrequency: 'yearly' },
  { path: '/privacy',       priority: 0.2, changeFrequency: 'yearly' },
  { path: '/refund-policy', priority: 0.2, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  // Derived from the content module rather than listed again here, so adding a
  // competitor page cannot leave it out of the sitemap.
  const pages = [
    ...PAGES,
    ...COMPETITORS.map((c) => ({
      path: `/compare/${c.slug}`,
      priority: 0.6,
      changeFrequency: 'monthly' as const,
    })),
  ];
  return pages.map((p) => ({
    url: `${publicEnv.siteUrl}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
