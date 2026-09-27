// "How is baby today?" — one entry per day, several states allowed.
// localStorage-backed like the streak; Supabase sync comes with the rest.
// The log is used to (1) show today's pick on Today and (2) lean the day's
// tip toward the matching topic. It is not a tracker: no history screens.
import { dayKey } from './streak'

const KEY = 'moodLog'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

function save(log) {
  try { localStorage.setItem(KEY, JSON.stringify(log)) } catch { /* quota */ }
}

export function getTodayMoods() {
  return load()[dayKey()] || []
}

export function saveTodayMoods(states) {
  const log = load()
  log[dayKey()] = [...new Set(states)]
  // Keep the log small — the last 60 days is plenty for patterns later.
  const keys = Object.keys(log).sort()
  for (const k of keys.slice(0, Math.max(0, keys.length - 60))) delete log[k]
  save(log)
  return log[dayKey()]
}

// Which tip topic each concern leans toward. Positive states leave the
// rotation alone.
const MOOD_TOPIC = {
  sleep: 'sleep',
  sleepy: 'sleep',
  feeding: 'feeding',
  tummy: 'feeding',
  fussy: 'fussy',
  clingy: 'development',
}

export function topicForMoods(states) {
  for (const s of states) {
    if (MOOD_TOPIC[s]) return MOOD_TOPIC[s]
  }
  return null
}
