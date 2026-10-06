// Ranks the month's tips against the baby summary. Age still sets the pool
// (one month of tips); patterns only reorder within it, and every boost
// carries a plain-English "because" so the parent can see why.
import { MOOD_TOPIC } from './moodLog'
import { getTipsForProfile } from '../data/tips'
import { clampMonth, dayIndex } from './dailyTip'
import { loadBabySummary } from './babySummary'

// What a "this helped" tap tells us about which tips to favour. `words` are
// matched against the tip title + body; a cause not listed here still boosts
// its state's topic and matches its own words (e.g. "Teething" → /teething/).
const CAUSE_HINTS = {
  'Overtired':            { topic: 'sleep',       words: ['overtired', 'wake window', 'sleepy cue', 'nap'] },
  'Wrong wake window':    { topic: 'sleep',       words: ['wake window', 'overtired', 'nap'] },
  'No wind-down cue':     { topic: 'sleep',       words: ['routine', 'wind-down', 'bedtime'] },
  'Nap transition':       { topic: 'sleep',       words: ['nap'] },
  'Nap transition (2→1)': { topic: 'sleep',       words: ['nap'] },
  'Day/night mix-up':     { topic: 'sleep',       words: ['night', 'daylight', 'dark'] },
  '4-month regression':   { topic: 'regression',  words: ['regression', 'sleep cycle'] },
  '4-month leap':         { topic: 'leap',        words: ['leap', 'regression'] },
  'Teething':             { topic: 'teething',    words: ['teeth', 'gum', 'drool'] },
  'Molars coming in':     { topic: 'teething',    words: ['molar', 'teeth', 'gum'] },
  'Molars':               { topic: 'teething',    words: ['molar', 'teeth', 'gum'] },
  'Hungry':               { topic: 'feeding',     words: ['feed', 'hunger cue', 'cluster'] },
  'Cluster feeding':      { topic: 'feeding',     words: ['cluster', 'feed'] },
  'Needs to burp':        { topic: 'feeding',     words: ['burp', 'gas', 'upright'] },
  'Needs a burp':         { topic: 'feeding',     words: ['burp', 'gas', 'upright'] },
  'Reflux discomfort':    { topic: 'feeding',     words: ['reflux', 'upright', 'spit'] },
  'Distracted':           { topic: 'feeding',     words: ['calm', 'quiet', 'distract'] },
  'New foods/textures':   { topic: 'feeding',     words: ['texture', 'new food', 'tries'] },
  'Separation anxiety':   { topic: 'development', words: ['separation', 'peek-a-boo', 'reassur'] },
  'Overstimulated':       { topic: 'fussy',       words: ['overstimulat', 'calm', 'dim', 'quiet'] },
  'Witching hour':        { topic: 'fussy',       words: ['evening', 'witching'] },
  'Wants closeness':      { topic: 'development', words: ['skin-to-skin', 'carry', 'hold'] },
  'Needs contact':        { topic: 'development', words: ['skin-to-skin', 'carry', 'hold'] },
  'Frustration':          { topic: 'motor',       words: ['floor time', 'reach', 'practice'] },
  'A big new skill':      { topic: 'motor',       words: ['crawl', 'stand', 'pull up'] },
  'Practicing new skills':{ topic: 'motor',       words: ['crawl', 'stand', 'practice'] },
}

const TOP_BUCKET = 5
const text = tip => `${tip.title} ${tip.body}`.toLowerCase()
const cap = (n, max) => Math.min(n, max) / max

// Returns [{ tip, score, because: [string] }] sorted best first (ties keep
// pool order). Score 0 means "nothing about this baby favours it".
export function rankTips(pool, summary) {
  if (!summary?.enough) return pool.map(tip => ({ tip, score: 0, because: [] }))
  const ranked = pool.map(tip => {
    const t = text(tip)
    let score = 0
    const because = []
    for (const c of summary.concerns) {
      const topic = MOOD_TOPIC[c.state]
      if (!topic || tip.topic !== topic) continue
      score += 2 * cap(c.days, summary.windowDays) + (c.streak >= 2 ? 0.5 : 0)
      because.push(c.streak >= 2
        ? `${label(c.state)} ${c.streak} days running`
        : `${label(c.state)} on ${c.days} of the last ${summary.windowDays} days`)
    }
    for (const h of summary.helped) {
      const hint = CAUSE_HINTS[h.cause] || { topic: MOOD_TOPIC[h.state], words: [h.cause.toLowerCase()] }
      const w = cap(h.count, 3)
      let hit = false
      if (hint.topic && tip.topic === hint.topic) { score += 0.5 * w; hit = true }
      if (hint.words.some(word => t.includes(word))) { score += 1 * w; hit = true }
      if (hit) because.push(`"${h.cause}" helped ${h.count === 1 ? 'once' : `${h.count} times`}`)
    }
    return { tip, score: Math.round(score * 100) / 100, because: [...new Set(because)] }
  })
  return ranked
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map(({ i, ...r }) => r)
}

// The "For {baby}" pick: the best-scoring tips that aren't today's tip,
// rotating through the top bucket day by day so it still changes. Null when
// there is not enough evidence or nothing is boosted, so the card hides.
export function pickPersonalTip(month, { summary = loadBabySummary(), excludeId = null, offset = 0 } = {}) {
  const m = clampMonth(month)
  const ranked = rankTips(getTipsForProfile(m), summary).filter(r => r.score > 0 && r.tip.id !== excludeId)
  if (ranked.length === 0) return null
  // Rotate through the top few so the card changes daily but stays on-pattern.
  const bucket = ranked.slice(0, TOP_BUCKET)
  return bucket[(dayIndex() + offset) % bucket.length]
}

const STATE_LABEL = { sleep: "Won't settle", sleepy: 'Sleepy', feeding: 'Not eating well', tummy: 'Tummy issues', fussy: 'Fussy', clingy: 'Clingy' }
function label(state) { return STATE_LABEL[state] || state }
