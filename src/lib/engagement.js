// Engagement store — the mom's daily interaction with her tip.
// Backed by localStorage (think of it as a small `tip_feedback` table:
// one row per day). Kept deliberately client-side so it works offline and
// on the static GitHub Pages build; can be mirrored to Supabase later.

const FEEDBACK_KEY = 'tipFeedback'

// Reaction vocabulary. The value is what we persist; the label/emoji drive UI.
// Framing is intentionally judgement-free — this audience is anxious new moms,
// so every option (including "not for us") is a valid, guilt-free answer.
export const REACTIONS = [
  { value: 'tried',    emoji: '👍', label: 'Tried it' },
  { value: 'notForUs', emoji: '👎', label: 'Not for us' },
  { value: 'notYet',   emoji: '⏳', label: 'Not yet' },
]

// Local calendar day (YYYY-MM-DD). Local — not UTC — so a 10pm check-in
// counts for the day the mom actually experienced, not the next UTC day.
export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(key, delta) {
  const [y, m, d] = key.split('-').map(Number)
  const dt = new Date(y, m - 1, d + delta)
  return dayKey(dt)
}

export function loadFeedback() {
  try {
    return JSON.parse(localStorage.getItem(FEEDBACK_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveFeedback(all) {
  try {
    localStorage.setItem(FEEDBACK_KEY, JSON.stringify(all))
  } catch {
    /* quota — non-critical */
  }
}

// Today's reaction, if the mom has already checked in today.
export function getTodayReaction(all = loadFeedback()) {
  return all[dayKey()] || null // { tipId, reaction, ts } | null
}

// Record (or change) today's reaction. One check-in per day — reacting again
// just updates it. Returns the fresh streak so the caller can celebrate.
export function recordReaction(tipId, reaction) {
  const all = loadFeedback()
  all[dayKey()] = { tipId, reaction, ts: Date.now() }
  saveFeedback(all)
  return computeStreak(all)
}

// Undo today's check-in (mom tapped the active reaction again). Returns the
// recomputed streak.
export function clearReaction() {
  const all = loadFeedback()
  delete all[dayKey()]
  saveFeedback(all)
  return computeStreak(all)
}

// Current streak = consecutive days, ending today or yesterday, with a check-in.
// We allow "ending yesterday" so a streak the mom hasn't extended *yet today*
// still shows as alive (something to continue), never as already broken.
export function computeStreak(all = loadFeedback()) {
  const today = dayKey()
  // Anchor at today if she's checked in, otherwise yesterday.
  let cursor = all[today] ? today : addDays(today, -1)
  let streak = 0
  while (all[cursor]) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

// A warm, encouragement-only streak message. Never scolds, never mentions
// a broken streak — always frames showing up as a win for the baby.
export function streakMessage(streak, babyName = 'your baby') {
  if (streak <= 0) return null
  if (streak === 1) return `Day 1 — you showed up for ${babyName} today 💜`
  return `${streak} days strong — you're showing up for ${babyName} 🔥`
}
