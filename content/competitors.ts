/**
 * Competitor comparison copy.
 *
 * Two deliberate constraints, both learned from the reference project:
 *
 *  1. Every claim is about what Study Wizard DOES, framed against general
 *     category behaviour — never a factual assertion about a named
 *     competitor's current feature set. Those assertions go stale the moment
 *     the other product ships an update, and a stale comparison is both a
 *     credibility problem and a legal one.
 *
 *  2. This is the highest-risk copy surface in the product, because comparison
 *     writing reaches naturally for exactly the words that get an extension
 *     pulled on review. Nothing here may use: undetected, undetectable,
 *     stealth, bypass, defeat, evade, cheat, hack, guaranteed, 100% score,
 *     beat the system, anti-detection. See docs/design.md §9. The reference
 *     site's own competitor pages used four of them.
 *
 * `scripts/guard-copy.mjs` enforces the second constraint at build time.
 */

export interface Competitor {
  /** URL segment. Also the generateStaticParams value. */
  slug: string;
  name: string;
  lede: string;
  metaTitle: string;
  metaDescription: string;
  /** Three or four points, specific to why someone comparing these two cares. */
  angles: Array<{ title: string; body: string }>;
}

export const COMPETITORS: Competitor[] = [
  {
    slug: 'edgy-pro',
    name: 'Edgy Pro',
    lede:
      'Most Edgenuity tools answer a question and stop there. This is what Study Wizard does on top: a verified answer database, a saved handbook grouped by activity, and a target score you set yourself.',
    metaTitle: 'Study Wizard vs Edgy Pro',
    metaDescription:
      'Study Wizard compared with Edgy Pro: verified answer database, saved question-and-answer handbook, adjustable target score, and support in both the dashboard and Discord.',
    angles: [
      {
        title: 'A verified answer database, not only a model',
        body: 'Questions that have been seen before are answered from a database of answers Edgenuity itself has already marked correct. A model only fills the gap for something genuinely new, and that answer is then verified the same way for everyone after you.',
      },
      {
        title: 'Your work is saved, not thrown away',
        body: 'Every question and answer is written into a handbook grouped by course activity, so revising later means reading your own coursework back rather than starting from nothing.',
      },
      {
        title: 'You choose the target score',
        body: 'A perfect score on every assessment in a course stands out. The target is a setting, anywhere from 40 to 100 percent, and missed questions are chosen to look like ordinary mistakes.',
      },
      {
        title: 'The solving logic is not on your machine',
        body: 'Answer derivation runs on our servers, so the installed extension holds no answer bank and nothing to extract from it. It is also why a fix reaches you without an extension update.',
      },
    ],
  },
  {
    slug: 'nexus-bot',
    name: 'Nexus Bot',
    lede:
      'A feature-by-feature look at where Study Wizard goes further: unsupported questions you can actually see and track, maintenance announced days in advance, and paying only for the days you need.',
    metaTitle: 'Study Wizard vs Nexus Bot',
    metaDescription:
      'Study Wizard compared with Nexus Bot: per-question visibility when something is unsupported, maintenance announced in advance, human-paced timing, and day-based pricing.',
    angles: [
      {
        title: 'You can see what went wrong',
        body: 'When a question type is not supported yet, it appears in your own dashboard queue — not in an anonymous pile — and you are emailed when it starts working. Most tools fail silently and leave you guessing.',
      },
      {
        title: 'Maintenance is announced, not discovered',
        body: 'Planned work appears as a banner with a countdown two days ahead, in the dashboard and in the extension. The extension finishes the question it is on and then stops cleanly rather than failing mid-activity.',
      },
      {
        title: 'Human-paced by design',
        body: 'Randomised delays sampled per activity and real mouse-event sequences, rather than a fixed interval. The pace reads like a person working through the course.',
      },
      {
        title: 'Pay for the days you need',
        body: 'Two dollars a day, or a week, a month or a year at a discount. Days you buy are added to the days you have left, so topping up early never costs you time.',
      },
    ],
  },
];

export const COMPETITOR_SLUGS = COMPETITORS.map((c) => c.slug);

export function findCompetitor(slug: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.slug === slug);
}
