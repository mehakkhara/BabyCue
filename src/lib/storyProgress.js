// Which stories have been read, and which are favourites.
//
// localStorage only for now. When journal + chat move to Supabase (see
// FINAL_PLAN.md §4), this is a small, low-risk table to bring along:
// story_progress(user_id, story_id, read_count, favourite, last_read_at).

const READ_KEY = 'storyReadIds'
const FAV_KEY = 'storyFavourites'
const LAST_KEY = 'storyLastReadDate'

function load(key) {
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function save(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list))
  } catch {
    // Storage full or blocked (Safari private mode). Reading a story still
    // works; we just lose the "already read" mark.
  }
}

export function getReadIds() {
  return load(READ_KEY)
}

export function markRead(storyId) {
  const ids = load(READ_KEY)
  if (!ids.includes(storyId)) {
    ids.push(storyId)
    save(READ_KEY, ids)
  }
  try {
    localStorage.setItem(LAST_KEY, new Date().toISOString().split('T')[0])
  } catch {
    // See above — non-fatal.
  }
}

export function hasRead(storyId) {
  return load(READ_KEY).includes(storyId)
}

export function getFavourites() {
  return load(FAV_KEY)
}

export function isFavourite(storyId) {
  return load(FAV_KEY).includes(storyId)
}

export function toggleFavourite(storyId) {
  const favs = load(FAV_KEY)
  const i = favs.indexOf(storyId)
  if (i === -1) favs.push(storyId)
  else favs.splice(i, 1)
  save(FAV_KEY, favs)
  return i === -1
}

/** Local YYYY-MM-DD — used to seed tonight's pick so it's stable all evening. */
export function todayKey() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}
