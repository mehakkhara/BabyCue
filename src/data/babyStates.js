// "How's baby feeling today?" responder — curated, age-aware.
// The parent taps a feeling; we return the likely reasons for the baby's age
// with one concrete thing to try for each. Positive states celebrate what's
// developing instead of listing problems.
// Evidence-informed (AAP/WHO framing); NOT medical advice — concern states
// carry a red-flag line pointing to the pediatrician.

export const BABY_STATES = [
  { key: 'fussy',   emoji: '😣', tone: 'concern',  label: 'Fussy',       ask: name => `Why might ${name} be fussy?` },
  { key: 'clingy',  emoji: '😢', tone: 'concern',  label: 'Clingy',      ask: name => `Why is ${name} extra clingy?` },
  { key: 'sleep',   emoji: '🌙', tone: 'concern',  label: "Won't settle", ask: name => `Why won't ${name} settle?` },
  { key: 'feeding', emoji: '🍼', tone: 'concern',  label: "Won't eat",    ask: name => `Why might ${name} be fighting feeds?` },
  { key: 'unwell',  emoji: '🤒', tone: 'concern',  label: 'Unwell',      ask: name => `${name} seems unwell — what to know` },
  { key: 'happy',   emoji: '😊', tone: 'positive', label: 'Happy',       ask: name => `What's blooming for ${name}? 💛` },
]

const BAND_LABEL = {
  '0-3':  'newborn stage',
  '4-6':  '4–6 months',
  '7-12': '7–12 months',
  '13-24':'toddler stage',
}

export function bandFor(months) {
  if (months <= 3) return '0-3'
  if (months <= 6) return '4-6'
  if (months <= 12) return '7-12'
  return '13-24'
}

// reasons[state][band] = [{ cause, action }]
const REASONS = {
  fussy: {
    '0-3': [
      { cause: 'Hungry', action: 'Newborns feed 8–12× a day — offer a feed even if it seems soon.' },
      { cause: 'Needs to burp', action: 'Hold upright against your chest and pat gently; trapped gas is a top cause.' },
      { cause: 'Overtired', action: 'Wake windows are only 45–60 min. Try a calm, dark wind-down.' },
      { cause: 'Wants closeness', action: 'Skin-to-skin or a wrap carry — you cannot spoil a newborn.' },
      { cause: 'Witching hour', action: 'Evening fussiness (5–11pm) peaks around 6 weeks and is normal.' },
    ],
    '4-6': [
      { cause: 'Overtired', action: 'Wake windows are ~1.5–2h now — watch for eye-rubbing and yawns.' },
      { cause: 'Teething', action: 'Drooling and chewing can start now. Offer a cold (not frozen) teether.' },
      { cause: '4-month leap', action: 'The sleep regression peaks this month — extra fussiness is developmental.' },
      { cause: 'Overstimulated', action: 'Too much noise or light. Move to a calm, dim space.' },
    ],
    '7-12': [
      { cause: 'Separation anxiety', action: 'Peaks 8–10 months. Extra reassurance now is appropriate, not spoiling.' },
      { cause: 'Teething', action: 'Offer a cold teether or gently rub the gums with a clean finger.' },
      { cause: 'Frustration', action: 'New mobility — wants to move and can’t quite yet. Give floor time to practice.' },
      { cause: 'Nap transition', action: 'Dropping to 2 naps around 7–9 months can cause overtired fussiness.' },
    ],
    '13-24': [
      { cause: 'Big feelings, few words', action: 'Name the feeling out loud — "you’re frustrated" — it helps them settle.' },
      { cause: 'Molars coming in', action: 'The bigger molars can be more uncomfortable. A cold teether helps.' },
      { cause: 'Wants control', action: 'Offer two simple choices to give a sense of independence.' },
      { cause: 'Overtired', action: 'Most toddlers still need ~11–14h total sleep including one nap.' },
    ],
  },
  clingy: {
    '0-3': [
      { cause: 'Needs contact', action: 'Newborns are wired for closeness; being held regulates them. A wrap frees your hands.' },
      { cause: 'Cluster feeding', action: 'Wanting to nurse constantly, especially in the evening, is normal and temporary.' },
      { cause: 'Overtired', action: 'Clinginess can mean "help me sleep." Try a calm wind-down.' },
      { cause: 'Witching hour', action: 'Evening neediness peaks around 6 weeks — extra holding is fine.' },
    ],
    '4-6': [
      { cause: '4-month leap', action: 'A wave of clinginess rides along with the developmental leap.' },
      { cause: 'Teething', action: 'Discomfort makes them want comfort. Offer a cold teether and extra cuddles.' },
      { cause: 'Overstimulated', action: 'After a busy day they seek your calm. Wind down together somewhere quiet.' },
      { cause: 'Overtired', action: 'Clinging can be a bid for help getting to sleep.' },
    ],
    '7-12': [
      { cause: 'Separation anxiety', action: 'Peaks 8–10 months — a sign of secure attachment. Play peek-a-boo to practice "you come back."' },
      { cause: 'A big new skill', action: 'Crawling or standing often brings a clingy phase. It settles as they master it.' },
      { cause: 'Teething', action: 'Sore gums send them to you for comfort.' },
      { cause: 'Coming down with something', action: 'Extra clinginess can precede a cold — keep an eye out for other signs.' },
    ],
    '13-24': [
      { cause: 'Separation anxiety, round two', action: 'Common again in toddlerhood, especially at drop-offs. Keep goodbyes short and warm.' },
      { cause: 'Overwhelmed', action: 'They seek you as an anchor when feelings get big. Offer a calm lap.' },
      { cause: 'A change in routine', action: 'A new sitter, a move, or a sibling can spike clinginess. Extra predictability helps.' },
      { cause: 'Might be unwell', action: 'Sudden clinginess can be an early illness sign — watch for fever or off feeds.' },
    ],
  },
  sleep: {
    '0-3': [
      { cause: 'Overtired', action: 'Missed the sleep window — shorten wake time and try again sooner.' },
      { cause: 'Hungry', action: 'Cluster feeding and frequent night waking are normal for newborns.' },
      { cause: 'Day/night mix-up', action: 'Bright, active days and dark, quiet nights help reset the clock.' },
      { cause: 'Needs help settling', action: 'Newborns can’t self-soothe yet — rocking or holding to sleep is fine.' },
    ],
    '4-6': [
      { cause: '4-month regression', action: 'Sleep cycles are maturing — expect disruption; it passes in a few weeks.' },
      { cause: 'Wrong wake window', action: 'Aim for ~1.5–2h awake. Over- or under-tired both make settling hard.' },
      { cause: 'No wind-down cue', action: 'A short, consistent routine (dim, feed, song) signals that sleep is coming.' },
      { cause: 'Teething', action: 'Sore gums often disrupt sleep. A dose of comfort goes a long way.' },
    ],
    '7-12': [
      { cause: 'Separation anxiety', action: 'Peaks now. A longer cuddle or an extra song at bedtime is appropriate.' },
      { cause: 'Practicing new skills', action: 'Crawling/standing in the crib is common. Give lots of daytime practice.' },
      { cause: 'Nap transition', action: 'Moving 3→2 naps can throw nights off for a couple of weeks.' },
      { cause: 'Teething', action: 'Offer comfort; a cold teether before bed can help.' },
    ],
    '13-24': [
      { cause: 'Nap transition (2→1)', action: 'Around 15–18 months. Nights wobble while the schedule resets.' },
      { cause: 'New fears', action: 'Fear of the dark can emerge. A dim nightlight and reassurance help.' },
      { cause: 'Needs routine', action: 'Toddlers settle best with a predictable, unrushed bedtime sequence.' },
      { cause: 'Independence push', action: 'Testing limits at bedtime is normal. Stay calm, warm, and consistent.' },
    ],
  },
  feeding: {
    '0-3': [
      { cause: 'Too sleepy to feed', action: 'Undress a layer or tickle the feet to rouse for a full feed.' },
      { cause: 'Needs a burp', action: 'Pause and burp mid-feed — trapped gas makes them stop early.' },
      { cause: 'Reflux discomfort', action: 'Keep upright 20–30 min after feeds; feed calmly and unhurried.' },
      { cause: 'Not hungry yet', action: 'Offer again in a bit and watch for rooting/hand-to-mouth cues.' },
    ],
    '4-6': [
      { cause: 'Teething', action: 'Sore gums make sucking uncomfortable. Try a slower, calmer feed.' },
      { cause: 'Distracted', action: 'Baby is noticing the world — feed in a calm, dim, quiet room.' },
      { cause: 'Not ready for solids', action: 'Before 6 months, milk is still the main event — follow their lead.' },
      { cause: 'Appetite shift', action: 'Growth spurts can change how much they want, day to day.' },
    ],
    '7-12': [
      { cause: 'Wants to self-feed', action: 'Offer soft finger foods so they can take the lead.' },
      { cause: 'New foods/textures', action: 'It can take 10+ tries. Keep offering calmly, no pressure.' },
      { cause: 'Full on milk', action: 'Balance milk feeds and solids so there’s room for both.' },
      { cause: 'Teething', action: 'Cool, soft foods can soothe sore gums during meals.' },
    ],
    '13-24': [
      { cause: 'Picky phase', action: 'Totally normal. Keep offering variety without forcing — pressure backfires.' },
      { cause: 'Smaller appetite', action: 'Growth slows after age 1, so toddlers naturally eat less than babies.' },
      { cause: 'Wants autonomy', action: 'Let them choose from a couple of healthy options to feel in control.' },
      { cause: 'Molars', action: 'Chewing can be sore while molars come in — offer softer foods.' },
    ],
  },
  unwell: {
    '0-3': [
      { cause: 'Any fever is urgent', action: 'Under 3 months, a temp of 100.4°F (38°C)+ needs a same-day call to the doctor.' },
      { cause: 'Fewer wet diapers', action: 'Watch hydration — fewer than 6 wet diapers a day warrants a call.' },
      { cause: 'Extra sleepy / hard to wake', action: 'Rouse for feeds; unusual lethargy needs medical advice.' },
      { cause: 'Congestion', action: 'Saline drops and a bulb syringe before feeds help a stuffy newborn breathe.' },
    ],
    '4-6': [
      { cause: 'Fever', action: 'Comfort and fluids; call if it’s 102°F+, lasts over 24h, or baby seems very unwell.' },
      { cause: 'Teething isn’t illness', action: 'Teething may cause mild fussiness but NOT high fever or diarrhea — if those appear, it’s likely illness.' },
      { cause: 'A cold', action: 'Most colds pass in about a week. Keep them hydrated and upright to breathe easier.' },
      { cause: 'Off their feeds', action: 'Offer smaller, more frequent feeds and prioritize fluids.' },
    ],
    '7-12': [
      { cause: 'Fever', action: 'Fluids and comfort; call for 102°F+, over 24h, or lethargy.' },
      { cause: 'Colds are frequent now', action: 'Especially with daycare — usually self-resolve in a week or so.' },
      { cause: 'Tugging at ears', action: 'Could be teething or an ear infection; if paired with fever, get it checked.' },
      { cause: 'Reduced appetite', action: 'Common when unwell — prioritize fluids over solids for now.' },
    ],
    '13-24': [
      { cause: 'Fever', action: 'Comfort measures; call for 104°F, a febrile seizure, or unusual lethargy.' },
      { cause: 'Tummy bug', action: 'Offer small sips often to prevent dehydration; watch wet diapers.' },
      { cause: 'Frequent colds', action: 'The immune system is still learning — catching many colds is normal.' },
      { cause: 'Wants rest', action: 'Let them sleep more than usual while they recover.' },
    ],
  },
  happy: {
    '0-3': [
      { cause: 'Social smiles', action: 'Around 6–8 weeks they smile back at you. Mirror their expressions to encourage it.' },
      { cause: 'Tracking your face', action: 'They love your face most. Get close (8–12 inches) and chat away.' },
      { cause: 'Cooing', action: 'Early vowel sounds! Pause and "reply" — it teaches the rhythm of conversation.' },
      { cause: 'Bonding deepening', action: 'Skin-to-skin and eye contact are building trust right now. Soak it up.' },
    ],
    '4-6': [
      { cause: 'Belly laughs', action: 'Silly faces and gentle tickles earn real giggles now — chase that laugh.' },
      { cause: 'Reaching & grabbing', action: 'Offer safe toys to bat, hold, and explore with their mouth.' },
      { cause: 'Loves mirrors', action: 'Mirror play delights them and builds early self-awareness.' },
      { cause: 'Babbling begins', action: '"Serve and return" — respond to every babble like it’s a word.' },
    ],
    '7-12': [
      { cause: 'Peek-a-boo joy', action: 'Object permanence is clicking — hide-and-find games are perfect right now.' },
      { cause: 'Imitating you', action: 'Clapping, waving — model it and celebrate when they copy you.' },
      { cause: 'Cause & effect', action: 'Loves toys that respond — buttons, or stacking to knock down.' },
      { cause: 'First "words"', action: 'Name things all day long to fuel the language explosion coming.' },
    ],
    '13-24': [
      { cause: 'On the move', action: 'Chasing games and safe climbing burn all that happy energy.' },
      { cause: 'Loves books', action: 'Read the same one again and again — repetition is how they learn.' },
      { cause: 'Pretend play begins', action: 'Feed the teddy, pretend phone calls — join in and follow their lead.' },
      { cause: 'Word explosion', action: 'Narrate and expand: "ball" → "yes, a big red ball!"' },
    ],
  },
}

const RED_FLAGS = {
  fussy: 'Call your pediatrician for a fever of 100.4°F (38°C)+, crying that can’t be soothed for hours, a weak or high-pitched cry, or if something just feels wrong.',
  clingy: 'Sudden, extreme clinginess alongside fever, poor feeding, or lethargy is worth a call to your pediatrician.',
  sleep: 'Call your pediatrician if sleep changes come with fever, breathing trouble, or unusual lethargy.',
  feeding: 'Call your pediatrician for fewer than 6 wet diapers a day, no weight gain, forceful vomiting, or refusing several feeds in a row.',
  unwell: 'Trust your instincts. Call your pediatrician for a high or persistent fever, trouble breathing, dehydration (few wet diapers, no tears), a rash that doesn’t fade when pressed, or if your baby just isn’t themselves. Under 3 months, ANY fever is an emergency.',
}

const POSITIVE_NOTE = 'Soak it up — this is your baby thriving. These connected little moments are exactly what they need most. 💛'

export function getStateResponse(stateKey, months) {
  const state = BABY_STATES.find(s => s.key === stateKey)
  if (!state) return null
  const band = bandFor(months)
  const positive = state.tone === 'positive'
  return {
    state,
    tone: state.tone,
    band,
    bandLabel: BAND_LABEL[band],
    reasons: REASONS[stateKey]?.[band] ?? [],
    redFlag: positive ? null : RED_FLAGS[stateKey],
    positiveNote: positive ? POSITIVE_NOTE : null,
  }
}
