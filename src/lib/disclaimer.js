// The one place the app's legal wording lives, so every screen says the same
// thing. Two concerns, kept separate on purpose: the tips are general guidance
// (not medical advice), and the sources we draw on have not endorsed the app.
export const SOURCE_ORGS = 'the American Academy of Pediatrics, the CDC, the WHO, Zero to Three, ASHA, the Pediatric Sleep Council, Nemours KidsHealth and a few other public health and research bodies'

// Under a tip: one calm line. {baby} is personalized by the caller.
export const TIP_FOOTNOTE = 'General guidance written in our own words, not medical advice. For anything about {baby}’s health, ask your pediatrician.'

// The source row label. "Based on guidance from" rather than "Source:" so it
// reads as attribution, not as the organisation vouching for the app.
export const sourceLabel = source => `Based on guidance from ${source}`

// Profile → About card.
export const ABOUT_PARAGRAPHS = [
  `Tips are written in our own words from publicly available guidance by ${SOURCE_ORGS}. This app is independent and is not affiliated with, sponsored by or endorsed by any of them.`,
  'Nothing in this app is medical advice, diagnosis or treatment, and it is not a substitute for your pediatrician. Every baby is different; use your own judgement and ask a professional about anything that concerns you.',
]

// Onboarding, under Get started.
export const ONBOARDING_LINE = 'By continuing you understand this app offers general guidance, not medical advice.'
