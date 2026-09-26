/**
 * Legal copy.
 *
 * Written to match what the product ACTUALLY does. The reference project's
 * terms claim auto-renewing subscriptions while its backend only ever takes
 * one-off payments — a contradiction its own header comment flags and nobody
 * ever resolved. Pricing here says "nothing renews", so the terms say the same.
 */
export interface LegalSection { heading: string; body: string[] }
export interface LegalDoc { title: string; updated: string; intro: string; sections: LegalSection[] }

const UPDATED = '26 September 2026';

export const TERMS: LegalDoc = {
  title: 'Terms of Service',
  updated: UPDATED,
  intro:
    'These terms cover your use of Study Wizard. Please read them — they explain what you are buying and what we do and do not promise.',
  sections: [
    { heading: '1. What Study Wizard is', body: [
      'Study Wizard is a browser extension and web service that works through Edgenuity coursework automatically and records the questions and answers it encounters into your account.',
      'We are an independent product. We are not affiliated with, endorsed by, or connected to Edgenuity or Imagine Learning.',
    ]},
    { heading: '2. Your responsibility', body: [
      'You are responsible for how you use Study Wizard, including whether that use is permitted by your school, district or course provider.',
      'We do not promise any particular grade, score or academic outcome, and nothing in the product should be read as such a promise.',
    ]},
    { heading: '3. Accounts', body: [
      'You must confirm your email address before your account becomes active.',
      'Your access is bound to one device at a time. You can release the linked device from your dashboard whenever you need to move to another computer.',
      'Keep your password to yourself. You are responsible for activity on your account.',
    ]},
    { heading: '4. Payment and access', body: [
      'Study Wizard is not a subscription. You buy a block of access — a day, a week, a month or a year — and it runs out at the end of that period.',
      'Nothing renews automatically. We do not store your card to charge you later, and there is nothing to cancel.',
      'If you buy more time before your current access ends, the new time is added to whatever is left. Renewing early never costs you days.',
      'Prices are shown before payment and are charged in US dollars.',
    ]},
    { heading: '5. Refunds', body: [
      'If the product does not work as described, contact us and we will put it right or refund you.',
      'Where a refund is given, the corresponding access is removed from your account. If you have bought several blocks of time, only the refunded block is removed.',
      'We may decline a refund where the service has been used substantially, or in cases of abuse.',
    ]},
    { heading: '6. Availability and maintenance', body: [
      'We schedule maintenance from time to time and will show it in your dashboard in advance. The bot does not run during a maintenance window; your dashboard, notes and history stay available.',
      'We may suspend the service immediately where continuing would risk damage to your coursework — for example if the platform changes in a way we have not yet handled.',
      'We do not guarantee uninterrupted service.',
    ]},
    { heading: '7. Acceptable use', body: [
      'Do not resell or share your access, attempt to circumvent the device limit, or use the service to attack, overload or interfere with any third-party system.',
      'We may suspend an account that breaches these terms. Where we do, we will tell you why.',
    ]},
    { heading: '8. Your content and data', body: [
      'The questions and answers the bot works through are saved to your account as eNotes and remain available to you even after your access ends.',
      'When the bot meets a question it cannot handle, it sends us the page markup so we can add support. Input values and free-text bodies are removed before that is stored. See our privacy policy.',
    ]},
    { heading: '9. Changes', body: [
      'We may update these terms. Where a change is material we will tell you through your dashboard before it takes effect.',
    ]},
    { heading: '10. Liability', body: [
      'To the extent the law allows, our total liability to you is limited to the amount you have paid us in the twelve months before the claim.',
      'Nothing here limits liability that cannot lawfully be limited.',
    ]},
    { heading: '11. Contact', body: ['Questions about these terms: support@studywizard.com'] },
  ],
};

export const PRIVACY: LegalDoc = {
  title: 'Privacy Policy',
  updated: UPDATED,
  intro:
    'This explains what we collect, why, and what we do not collect. It describes what the product actually does rather than the widest thing the law would allow.',
  sections: [
    { heading: 'What we collect', body: [
      'Account details: your email address, and a display name and avatar if you sign in with Google or Discord.',
      'Payment records: what you bought, when, and how much. Card details go directly to Stripe and never touch our servers.',
      'Coursework activity: the questions the bot works through and the answers it gives, saved as your eNotes, along with which activity they belonged to.',
      'Technical detail: a coarse device fingerprint used only to enforce the one-device limit, and error reports from the extension.',
    ]},
    { heading: 'Question captures', body: [
      'When the bot meets a question type it cannot handle, it sends us the markup of that question so we can add support for it.',
      'Before that is stored we remove every input value, every free-text body, your email address and name where they appear, identity regions of the page, tokens, phone numbers and long digit sequences. We keep the question text, the answer choices and image descriptions, because those are what we need.',
      'We never capture from login, password, account or profile pages. Captures are deleted thirty days after the question is supported.',
    ]},
    { heading: 'What we do not collect', body: [
      'We do not read your browsing outside Edgenuity. The extension only runs on Edgenuity pages.',
      'We do not sell your data or share it with advertisers.',
      'We do not store your card details.',
    ]},
    { heading: 'Why we are allowed to hold it', body: [
      'To provide the service you bought, to support you when you ask, to keep the product working, and to meet our legal and accounting obligations.',
    ]},
    { heading: 'How long we keep it', body: [
      'Your account and eNotes for as long as your account exists.',
      'Payment records for as long as tax and accounting rules require.',
      'Bot activity logs for fourteen days.',
      'Question captures until thirty days after the question is supported.',
    ]},
    { heading: 'Who we share it with', body: [
      'Supabase (database, authentication and file storage), Stripe (payments), our email provider, and the AI provider that generates answers and support replies. Each receives only what it needs to do its part.',
    ]},
    { heading: 'Your rights', body: [
      'You can ask for a copy of your data, ask us to correct it, or ask us to delete your account and everything in it. Email support@studywizard.com and we will action it.',
    ]},
    { heading: 'Contact', body: ['privacy@studywizard.com'] },
  ],
};

export const REFUND: LegalDoc = {
  title: 'Refund Policy',
  updated: UPDATED,
  intro: 'The short version: if it does not work as described, tell us and we will put it right or refund you.',
  sections: [
    { heading: 'When we refund', body: [
      'The extension does not work on your account and we cannot fix it.',
      'You were charged twice, or charged after your access had already been extended.',
      'The service was unavailable for a significant part of the time you paid for.',
    ]},
    { heading: 'When we may decline', body: [
      'The access has been used substantially and worked as described.',
      'The request relates to a grade or outcome rather than the product functioning.',
      'The account breached our terms.',
    ]},
    { heading: 'How it works', body: [
      'Email support@studywizard.com, or open a ticket from your dashboard, with the email address you bought with.',
      'Refunds go back to the card you paid with, usually within five to ten working days.',
      'When a refund is issued, the matching access is removed from your account. If you bought several blocks of time, only the refunded block is taken back — the rest is untouched.',
    ]},
    { heading: 'Contact', body: ['support@studywizard.com'] },
  ],
};
