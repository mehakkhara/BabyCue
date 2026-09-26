// "Did you try this?" — one rating per activity, kept locally. Feeds the
// activity picker later (loved ones come back, "not today" ones rest).
const KEY = 'activityFeedback'

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function getRating(id) {
  return load()[String(id)]?.rating || null
}

export function setRating(id, rating) {
  const all = load()
  all[String(id)] = { rating, at: Date.now() }
  try { localStorage.setItem(KEY, JSON.stringify(all)) } catch { /* quota */ }
  return rating
}

export const RATINGS = [
  { key: 'loved', emoji: '😄', label: 'Loved it' },
  { key: 'okay',  emoji: '🙂', label: 'It was okay' },
  { key: 'skip',  emoji: '😶', label: 'Not today' },
]
