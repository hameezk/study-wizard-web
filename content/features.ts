export interface Feature {
  title: string;
  body: string;
  icon: string;
}

/** Headline set for the home page bento. */
export const HEADLINE_FEATURES: Feature[] = [
  {
    icon: 'bolt',
    title: 'Assessments, handled',
    body: 'Multiple choice, multi-select, dropdowns, ordering and fill-in-the-blank — worked through automatically while you do something else.',
  },
  {
    icon: 'pen',
    title: 'Written responses',
    body: 'Short answers and free-response prompts are drafted and filled in for you, including inside the rich-text editor.',
  },
  {
    icon: 'book',
    title: 'eNotes handbook',
    body: 'Every question and answer is saved and grouped by activity, building a complete handbook you can revise from later.',
  },
  {
    icon: 'forward',
    title: 'Video and vocabulary',
    body: 'Instructional videos advance on their own, and vocabulary activities are typed out at a natural pace.',
  },
  {
    icon: 'gauge',
    title: 'Set your own target score',
    body: 'Choose how accurate you want to be. A perfect score on every assessment stands out, so the target is yours to set.',
  },
  {
    icon: 'clock',
    title: 'Human-paced',
    body: 'Randomised delays and real mouse-event sequences, so the pace looks like a person working rather than a script.',
  },
  {
    icon: 'shield',
    title: 'One device at a time',
    body: 'Your pass is bound to a single device, and you can release it yourself whenever you switch computers.',
  },
] as const;

export const COMPARISON_ROWS = [
  { label: 'Works with EdgeEX and classic Edgenuity', us: true, them: 'partial' },
  { label: 'Assessments, assignments and vocabulary', us: true, them: true },
  { label: 'Written and free-response questions', us: true, them: 'partial' },
  { label: 'Saved question-and-answer handbook', us: true, them: false },
  { label: 'Grouped by course activity', us: true, them: false },
  { label: 'Adjustable target score', us: true, them: false },
  { label: 'See unsupported questions and get told when fixed', us: true, them: false },
  { label: 'Solving logic kept off your machine', us: true, them: false },
  { label: 'Scheduled maintenance announced in advance', us: true, them: false },
  { label: 'Support in the dashboard and on Discord', us: true, them: 'partial' },
  { label: 'Pay only for the days you need', us: true, them: false },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    title: 'Create your account',
    body: 'Sign up with email, Google or GitHub. Email signups confirm their address first.',
  },
  {
    title: 'Choose how long you need',
    body: 'A day, a week, a month or a year. Time you buy is added to whatever you already have left.',
  },
  {
    title: 'Install the extension',
    body: 'Add Study Wizard to Chrome and sign in with the same email. It takes about a minute.',
  },
  {
    title: 'Open an activity',
    body: 'Open any Edgenuity activity and it starts working. Watch progress live in your dashboard.',
  },
] as const;
