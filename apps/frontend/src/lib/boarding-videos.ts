export const BOARDING_SKIP_KEY = 'zerocancer_boarding_skipped'

export type BoardingVideoStep = {
  id: string
  title: string
  kicker: string
  summary: string
  src?: string
  facts?: Array<{ label: string; detail: string }>
}

export const BOARDING_VIDEOS: BoardingVideoStep[] = [
  {
    id: 'intro',
    kicker: 'Step 1',
    title: 'Meet ZeroCancer',
    summary:
      'A short intro to how communities, hospitals, and donors close the gap between knowing and screening.',
    src: '/ZeroCancer_Video_ewxn02.webm',
  },
  {
    id: 'cost-manage',
    kicker: 'Step 2',
    title: 'The cost of managing cervical cancer',
    summary:
      'Treatment after cancer has taken hold is long, expensive, and often too late for families who could have screened.',
    facts: [
      {
        label: '₦1.5m – ₦5m+',
        detail: 'Typical cost of treating invasive cervical cancer in Nigeria, before lost work and travel.',
      },
      {
        label: 'Months of care',
        detail: 'Surgery, chemo, and follow-up pull women out of work and family life.',
      },
    ],
  },
  {
    id: 'cost-prevent',
    kicker: 'Step 3',
    title: 'The cost of not preventing it',
    summary:
      'Cervical cancer is one of the cancers we can stop. Waiting is the expensive choice.',
    facts: [
      {
        label: '₦15,000',
        detail: 'A sponsored cervical screening on ZeroCancer — a fraction of treatment.',
      },
      {
        label: 'Early is everything',
        detail: 'Catching changes early means a simple visit, not a cancer diagnosis.',
      },
    ],
  },
  {
    id: 'how-it-works',
    kicker: 'Step 4',
    title: 'How ZeroCancer works',
    summary:
      'Someone invites you. You create an account. A donor funds the screening. You visit a nearby facility.',
    src: '/Mobilab HPV Testing Video.mp4',
  },
  {
    id: 'if-positive',
    kicker: 'Step 5',
    title: 'If the test is positive',
    summary:
      'A positive screen is not the end of the story. You are not left to figure out the next step alone.',
    facts: [
      {
        label: 'Clear next steps',
        detail: 'Your facility walks you through follow-up. Results stay private — even from the person who invited you.',
      },
      {
        label: 'You are not abandoned',
        detail: 'ZeroCancer is built so screening is the start of care, not a scare and a closed door.',
      },
    ],
  },
]
