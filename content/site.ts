/**
 * Site-wide constants.
 *
 * Copy in this project is written against the review-risk word list in
 * docs/design.md §9. The product is unchanged from the reference; the
 * *claims* are worded so they survive Chrome Web Store review and do not
 * assert defeating a security control on an indexable page.
 *
 * Avoid on any public page: undetected, undetectable, stealth, bypass, defeat,
 * evade, cheat, hack, guaranteed, 100% score, beat the system, anti-detection.
 */
export const SITE = {
  name: 'Study Wizard',
  tagline: 'Work through Edgenuity coursework automatically.',
  description:
    'Study Wizard works through Edgenuity assessments, assignments and vocabulary automatically, and records every question and answer into a handbook you can revise from.',
} as const;

export const NAV_LINKS = [
  { href: '/features', label: 'Features' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/reviews', label: 'Reviews' },
  { href: '/faq', label: 'FAQ' },
] as const;

export const FOOTER_SECTIONS = [
  {
    title: 'Product',
    links: [
      { href: '/features', label: 'Features' },
      { href: '/how-it-works', label: 'How it works' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/updates', label: 'Updates' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '/faq', label: 'FAQ' },
      { href: '/setup', label: 'Setup guide' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/reviews', label: 'Reviews' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
      { href: '/refund-policy', label: 'Refund policy' },
    ],
  },
] as const;

export const SUPPORTED_PLATFORMS = ['Edgenuity', 'EdgeEX', 'Imagine Edgenuity'] as const;

/** Required on every page. We are not affiliated with Edgenuity. */
export const INDEPENDENCE_NOTICE =
  'Study Wizard is an independent product and is not affiliated with, endorsed by, or connected to Edgenuity or Imagine Learning.';
