// Notification "nudges" — curiosity-gap re-engagement copy. The point of #5:
// a notification should promise the loop (a question, a "wait, is that normal?"),
// not announce content ("here's your tip"). Age-aware so it lands on what the
// parent is actually living through right now. Delivery-agnostic — the same
// copy works for Web Push or native later.

import { bandFor } from './babyStates'

const interp = (s, name) => s.replaceAll('{baby}', name || 'your baby')

const NUDGES = {
  any: [
    { id: 'any-1', title: 'Quick check-in 💜', body: 'How did last night go with {baby}? Tap to see what might help tonight.' },
    { id: 'any-2', title: 'Is this normal? 👀', body: 'That thing that worried you at 2am probably has a simple answer.' },
    { id: 'any-3', title: 'A little something for today', body: 'There’s a fresh tip waiting for {baby} — takes about 20 seconds.' },
  ],
  '0-3': [
    { id: 'nb-1', title: 'The witching hour 🌙', body: 'Evening fussiness peaks around now — here’s why, and what actually helps.' },
    { id: 'nb-2', title: 'Is it normal…', body: '…that {baby} grunts and squirms all night? (Yes — and here’s why.)' },
    { id: 'nb-3', title: 'Cluster feeding again? 🍼', body: 'Exhausting — and completely normal. A 20-second read on what’s going on.' },
  ],
  '4-6': [
    { id: 'm4-n1', title: 'The 4-month thing 🌀', body: 'If sleep just fell apart, you’re not imagining it. Here’s what’s happening.' },
    { id: 'm4-n2', title: 'Drooling everywhere? 🦷', body: 'Teething can start now — even with no tooth in sight. What to look for.' },
    { id: 'm4-n3', title: 'Ready for solids? 🥄', body: 'The signs to check for before {baby}’s very first spoonful.' },
  ],
  '7-12': [
    { id: 'm9-n1', title: 'Suddenly clingy? 😢', body: 'Separation anxiety peaks around now — and it’s actually a good sign. Here’s why.' },
    { id: 'm9-n2', title: 'Is it normal…', body: '…that {baby} wakes the second you put them down? Here’s the fix parents swear by.' },
    { id: 'm9-n3', title: 'On the move soon 🧗', body: 'What to babyproof before {baby} starts cruising the furniture.' },
  ],
  '13-24': [
    { id: 't-n1', title: 'The toddler “no” 🙅', body: 'It’s not defiance — it’s development. How to roll with it without a battle.' },
    { id: 't-n2', title: 'Picky all of a sudden? 🍽️', body: 'Totally normal after age 1. What helps — and what quietly backfires.' },
    { id: 't-n3', title: 'Big feelings, few words 😤', body: 'Why toddler meltdowns happen — and one phrase that helps {baby} settle.' },
  ],
}

// Pick a nudge for the baby's age, avoiding the last one shown. Randomised so
// the daily nudge varies (variable reward).
export function pickNudge(ageMonths, babyName, excludeId = null) {
  const band = bandFor(ageMonths)
  let pool = [...(NUDGES[band] || []), ...NUDGES.any]
  const fresh = pool.filter(n => n.id !== excludeId)
  if (fresh.length) pool = fresh
  const n = pool[Math.floor(Math.random() * pool.length)]
  return { id: n.id, title: interp(n.title, babyName), body: interp(n.body, babyName) }
}
