// Check-in streak store — one row per local calendar day, localStorage-backed
// so it works offline and on the static build (mirror to Supabase later).
// A "check-in" is any small daily act of showing up: tapping Got it on the
// tip, marking a cause that helped in the feelings responder, or capturing a
// photo-hunt prompt. Framing is encouragement-only: the streak counts runs
// ending today OR yesterday, so mid-day it reads as alive-and-continuable,
// never as already broken. (Logic adapted from the retired engagement.js.)

const KEY = 'checkIns'

// Local calendar day (YYYY-MM-DD). Local — not UTC — so a 10pm check-in
// counts for the day the mom actually experienced.
export function dayKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addDays(key, delta) {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + delta))
}

export function loadCheckIns() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function save(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch {
    /* quota — non-critical */
  }
}

// Record today's check-in (first action of the day wins; later ones are
// no-ops so the stored `source` reflects what actually started the day).
// Returns the fresh summary so callers can update UI in one move.
export function markCheckIn(source) {
  const all = loadCheckIns()
  if (!all[dayKey()]) {
    all[dayKey()] = { source, ts: Date.now() }
    save(all)
  }
  return streakSummary(all)
}

export function computeStreak(all = loadCheckIns()) {
  const today = dayKey()
  let cursor = all[today] ? today : addDays(today, -1)
  let streak = 0
  while (all[cursor]) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

// The last 7 local days, oldest first — one cell per day for the tracker row.
function last7(all) {
  const today = dayKey()
  return Array.from({ length: 7 }, (_, i) => {
    const key = addDays(today, i - 6)
    return { key, done: Boolean(all[key]), isToday: key === today }
  })
}

export function streakSummary(all = loadCheckIns()) {
  return {
    streak: computeStreak(all),
    days: last7(all),
    todayDone: Boolean(all[dayKey()]),
  }
}
