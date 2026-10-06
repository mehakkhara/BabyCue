// "What does this baby look like lately?" — a small, explainable summary
// computed from two stores that already exist: the mood log (which states
// were ticked on which days) and babyPatterns (which cause helped, per
// state). Nothing new is tracked. Pure functions take the data in so they can
// be tested without a browser; loadBabySummary() reads the live stores.
//
// Not medical inference: the summary says "fussy came up 4 of the last 14
// days", never why. Tips are ranked, nothing is diagnosed.
import { dayKey } from './streak'
import { readState } from './syncedStore'
import { loadPatterns } from './babyPatterns'

export const WINDOW_DAYS = 14
export const MIN_EVIDENCE = 3   // mood days + helped taps before we personalise at all
export const MIN_CONCERN_DAYS = 2 // a single bad day should not reshape the week

function keyDaysAgo(n, now) {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return dayKey(d)
}

// moodLog: { 'YYYY-MM-DD': ['fussy', 'sleep'], … }
// patterns: { 'fussy:Overtired': { count, lastAt }, … }
export function summarizeBaby({ moodLog = {}, patterns = {}, now = Date.now(), windowDays = WINDOW_DAYS } = {}) {
  const keys = Array.from({ length: windowDays }, (_, i) => keyDaysAgo(i, now)) // today first
  const perState = {}
  let loggedDays = 0
  keys.forEach((k, i) => {
    const states = moodLog[k]
    if (!states || states.length === 0) return
    loggedDays++
    for (const s of states) {
      const e = (perState[s] ||= { state: s, days: 0, streak: 0, lastDaysAgo: null, streakOpen: true })
      e.days++
      if (e.lastDaysAgo === null) e.lastDaysAgo = i
    }
  })
  // Streak: consecutive logged days ending today or yesterday that include the state.
  for (const e of Object.values(perState)) {
    let n = 0
    for (let i = e.lastDaysAgo; i < keys.length && i <= e.lastDaysAgo + windowDays; i++) {
      if (moodLog[keys[i]]?.includes(e.state)) n++
      else break
    }
    e.streak = e.lastDaysAgo <= 1 ? n : 0
    delete e.streakOpen
  }

  const concerns = Object.values(perState)
    .filter(e => e.days >= MIN_CONCERN_DAYS)
    .sort((a, b) => b.days - a.days || a.lastDaysAgo - b.lastDaysAgo)

  const helped = Object.entries(patterns)
    .map(([k, v]) => { const [state, ...rest] = k.split(':'); return { state, cause: rest.join(':'), count: v?.count ?? 0, lastAt: v?.lastAt ?? 0 } })
    .filter(h => h.count > 0)
    .sort((a, b) => b.count - a.count || b.lastAt - a.lastAt)

  const helpedTaps = helped.reduce((n, h) => n + h.count, 0)
  const evidence = loggedDays + helpedTaps
  return { windowDays, loggedDays, concerns, helped, evidence, enough: evidence >= MIN_EVIDENCE }
}

export function loadBabySummary(now = Date.now()) {
  return summarizeBaby({ moodLog: readState('moodLog', {}), patterns: loadPatterns(), now })
}
