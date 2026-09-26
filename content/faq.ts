export interface QA { q: string; a: string }

export const GENERAL_FAQ: QA[] = [
  { q: 'Which platforms does it work with?',
    a: 'Edgenuity, including EdgeEX and Imagine Edgenuity. Other learning platforms are not supported.' },
  { q: 'Do I need to keep the tab open?',
    a: 'Yes. The extension works inside the Edgenuity tab, so it needs to stay open — but you can leave it in the background and do something else.' },
  { q: 'Can I use it on more than one computer?',
    a: 'Your pass is bound to one device at a time. You can release the current device from your dashboard and sign in on another whenever you need to.' },
  { q: 'What happens when my pass runs out?',
    a: 'The extension stops working, but your eNotes and activity history stay in your dashboard permanently. Buying more time picks up where you left off.' },
  { q: 'What if it meets a question it cannot answer?',
    a: 'It reports the question to our team automatically and moves on. You can see those questions in your dashboard, and we email you once they are supported.' },
  { q: 'Why did it get a question wrong?',
    a: 'That is usually your target score setting. It controls how often answers are correct, so results do not look inhumanly perfect. You can raise it any time.' },
] as const;

export const PRICING_FAQ: QA[] = [
  { q: 'Is this a subscription?',
    a: 'No. You buy a block of time and it runs out. Nothing renews automatically and there is nothing to cancel.' },
  { q: 'What if I buy more time before my pass ends?',
    a: 'The new time is added to what is left rather than replacing it. Eight days remaining plus a month gives you thirty-eight days.' },
  { q: 'Do you offer refunds?',
    a: 'Refunds are handled case by case — see our refund policy for the full terms.' },
  { q: 'Do you take discount codes?',
    a: 'Yes. Enter a code at checkout and the discount is applied before payment.' },
] as const;
