// "Did you try this?" — one rating per activity, kept locally. Feeds the
// activity picker later (loved ones come back, "not today" ones rest).
import { readState, writeState } from './syncedStore'

const KEY = 'activityFeedback'

function load() {
  return readState(KEY, {})
}

export function getRating(id) {
  return load()[String(id)]?.rating || null
}

export function setRating(id, rating) {
  const all = load()
  all[String(id)] = { rating, at: Date.now() }
  writeState(KEY, all)
  return rating
}

export const RATINGS = [
  { key: 'loved', emoji: '😄', label: 'Loved it' },
  { key: 'okay',  emoji: '🙂', label: 'It was okay' },
  { key: 'skip',  emoji: '😶', label: 'Not today' },
]
