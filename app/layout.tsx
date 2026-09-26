import type { Metadata, Viewport } from 'next';
import { Inter, Fraunces } from 'next/font/google';
import { SITE } from '@/content/site';
import { publicEnv } from '@/lib/env';
import '@/styles/globals.css';

// Self-hosted by next/font, so there is no render-blocking request to Google
// and no third-party cookie on a page that must stay privacy-clean.
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * The display face. A site set entirely in one grotesque is the house style of
 * every template; an editorial serif at the headline level is the cheapest way to
 * look considered, and it suits a product about coursework.
 *
 * Self-hosted by next/font like Inter, so there is no render-blocking request to
 * Google and no third-party cookie on a page that must stay privacy-clean.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  // A variable font: the weight range comes for free, and axes cannot be combined
  // with a fixed weight list. SOFT rounds the terminals slightly, which keeps it
  // from reading as a newspaper masthead.
  axes: ['SOFT'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  metadataBase: new URL(publicEnv.siteUrl),
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s — ${SITE.name}`,
  },
  description: SITE.description,
  openGraph: {
    type: 'website',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: publicEnv.siteUrl,
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#0F172A' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body>
        {/* First focusable element on every page, so keyboard users are not
            forced through the whole nav to reach content. */}
        <a href="#main" className="skip-link">Skip to content</a>
        {children}
      </body>
    </html>
  );
}
