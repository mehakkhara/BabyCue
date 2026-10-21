// Picks the day's one tip and one activity. Pure functions over the curated
// pool so Today (for the row subtitle) and the detail page agree.
import { tips, getTipsForProfile } from '../data/tips'

// Days counted from local midnight, so the tip changes when the parent's day
// does (a UTC count flipped it at 8pm in New York, hours before the "seen
// today" flag reset).
export function dayIndex(now = new Date()) {
  const d = new Date(now)
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000)
}

export function clampMonth(m) {
  return Math.max(1, Math.min(24, m))
}

// Advice tips only: activities have their own row (pickDailyActivity), so the
// two never show the same thing. Shared by Today and the "For {baby}" ranking.
export function adviceTips(month, topic = null) {
  return getTipsForProfile(clampMonth(month), topic).filter(t => t.topic !== 'activity')
}

// One tip per day, advancing daily. `topic` leans the pool (mood check-in);
// if that pool is empty for the month, fall back to every tip for the month.
// `offset` is the "show me a different one" nudge for today only.
export function pickDailyTip(month, { topic = null, offset = 0 } = {}) {
  let pool = topic ? adviceTips(month, topic) : []
  if (pool.length === 0) pool = adviceTips(month)
  if (pool.length === 0) return null
  return pool[(dayIndex() + offset) % pool.length]
}

// The day's "one thing to do": a sourced activity for this age. Activities
// suit a span of ages (the page says "Great for 13–15 months"), so the pool
// takes the month on either side too; that keeps the repeat cycle long
// without drifting far from the baby's age. Widens further only if empty.
export function pickDailyActivity(month, { offset = 0 } = {}) {
  const m = clampMonth(month)
  const activities = tips.filter(t => t.topic === 'activity' && t.source)
  for (const span of [1, 2, 3]) {
    const pool = activities.filter(t => Math.abs(t.month - m) <= span)
    if (pool.length > 0) return pool[(dayIndex() + offset) % pool.length]
  }
  return null
}

// Two more tips on the same topic (then same month) for the detail page.
export function relatedTips(tip, month, n = 2) {
  if (!tip) return []
  const m = clampMonth(month)
  const same = getTipsForProfile(m, tip.topic).filter(t => t.id !== tip.id)
  const rest = getTipsForProfile(m).filter(t => t.id !== tip.id && t.topic !== tip.topic)
  return [...same, ...rest].slice(0, n)
}

// "Great for 12–15 months" from a tip's month unless the tip says otherwise.
export function ageRangeLabel(tip) {
  if (!tip) return ''
  if (Array.isArray(tip.ageRange)) return `${tip.ageRange[0]}–${tip.ageRange[1]} months`
  const lo = tip.month
  const hi = Math.min(24, lo + 2)
  return lo === hi ? `${lo} months` : `${lo}–${hi} months`
}

const TOPIC_LABEL = {
  sleep: 'Sleep', feeding: 'Feeding', development: 'Development', motor: 'Movement',
  regression: 'Regression', activity: 'Activity', play: 'Play', fussy: 'Fussy phase',
  leap: 'Developmental leap', teething: 'Teething',
}

export function topicLabel(topic) {
  return TOPIC_LABEL[topic] || 'Tip'
}

// Topic icon + tile colour, shared by the detail page and the month browser.
export const TOPIC_EMOJI = { sleep: '🌙', feeding: '🍼', development: '🧠', motor: '💪', regression: '🔄', activity: '🎨', play: '🎨', fussy: '😮‍💨', leap: '🧩', teething: '🦷' }
export const TOPIC_HUE = { sleep: 'lavender', feeding: 'sky', development: 'mint', motor: 'amber', regression: 'rose', activity: 'peach', play: 'peach', fussy: 'rose', leap: 'mint', teething: 'sky' }
