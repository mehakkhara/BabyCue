// The small JSON stores (moods, streak, checklists, saved tips, …) live in
// localStorage so reads stay synchronous and the app works offline. This
// wrapper is the one place they read and write through, so every write also
// gets a timestamp and a "dirty" mark that sync.js turns into an upsert on the
// `user_state` table (sync-scope.md, Phase B). Pulls come back through
// applyRemote(), which keeps whichever side is newer and merges maps/lists so
// a day logged on the phone and a day logged on the Mac both survive.
//
// Not routed through here on purpose: the profile (its own table), the hero
// photo (PR 4), and per-device nudges like the tip card flag.

const META_KEY = 'userState:meta'     // { [key]: ISO time of the last local write }
const DIRTY_KEY = 'userState:dirty'   // [key, …] waiting to be pushed

// Keys this device may hold that belong in user_state. photoHunt keys are per
// month, so they're matched by prefix.
export const SYNCED_KEYS = [
  'activityFeedback', 'babyPatterns', 'checklistProgress', 'customMilestones',
  'milestoneStatus', 'moodLog', 'savedTips', 'storyReadIds', 'storyFavourites',
  'checkIns', 'growthEntries',
]
const SYNCED_PREFIXES = ['photoHunt:']

export function isSyncedKey(key) {
  return SYNCED_KEYS.includes(key) || SYNCED_PREFIXES.some(p => key.startsWith(p))
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw == null ? fallback : JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true } catch { return false }
}

/** Read a store. Synchronous; never throws. */
export function readState(key, fallback) {
  return readJson(key, fallback)
}

/** Write a store locally and queue it for the next sync. */
export function writeState(key, value) {
  const ok = writeJson(key, value)
  if (!ok) return false            // quota or private mode: nothing to sync either
  stamp(key, new Date().toISOString())
  markDirty(key)
  try { window.dispatchEvent(new Event('userState:changed')) } catch { /* not in a browser */ }
  return true
}

function stamp(key, iso) {
  const meta = readJson(META_KEY, {})
  meta[key] = iso
  writeJson(META_KEY, meta)
}

export function updatedAtOf(key) {
  return readJson(META_KEY, {})[key] || null
}

function markDirty(key) {
  const dirty = readJson(DIRTY_KEY, [])
  if (!dirty.includes(key)) { dirty.push(key); writeJson(DIRTY_KEY, dirty) }
}

export function dirtyKeys() {
  return readJson(DIRTY_KEY, []).filter(isSyncedKey)
}

export function clearDirty(keys) {
  const left = readJson(DIRTY_KEY, []).filter(k => !keys.includes(k))
  writeJson(DIRTY_KEY, left)
}

/** Every synced key that has a value on this device. */
export function localSyncedKeys() {
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && isSyncedKey(k)) out.push(k)
    }
  } catch { /* storage blocked */ }
  return out
}

/**
 * Keys with a value but no timestamp were written before sync existed.
 * Stamp them (as old) and mark them dirty so a first sign-in uploads them.
 */
export function backfillUnstamped() {
  const meta = readJson(META_KEY, {})
  let n = 0
  for (const key of localSyncedKeys()) {
    if (meta[key]) continue
    meta[key] = new Date(0).toISOString()
    markDirty(key)
    n++
  }
  if (n) writeJson(META_KEY, meta)
  return n
}

/** Rows to upsert for the given keys. */
export function rowsFor(keys, userId) {
  return keys.map(key => ({
    user_id: userId,
    key,
    value: readJson(key, null),
    updated_at: updatedAtOf(key) || new Date().toISOString(),
  })).filter(r => r.value !== null)
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function itemKey(item) {
  return isPlainObject(item) && item.id != null ? String(item.id) : JSON.stringify(item)
}

/**
 * Combine two versions of a store. Maps merge key by key with the newer side
 * winning on clashes; lists keep every distinct item, newer side first.
 * Anything else: the newer side as is.
 */
export function mergeValues(older, newer) {
  if (isPlainObject(older) && isPlainObject(newer)) return { ...older, ...newer }
  if (Array.isArray(older) && Array.isArray(newer)) {
    const seen = new Set()
    const out = []
    for (const item of [...newer, ...older]) {
      const k = itemKey(item)
      if (seen.has(k)) continue
      seen.add(k)
      out.push(item)
    }
    return out
  }
  return newer
}

/**
 * A row arrived from the server. Returns 'applied' when the local copy
 * changed, 'merged' when the result differs from both sides (so it needs to
 * go back up), or 'kept' when the local copy already had everything.
 */
export function applyRemote(key, remoteValue, remoteUpdatedAt) {
  if (!isSyncedKey(key)) return 'kept'
  const localValue = readJson(key, null)
  const localAt = updatedAtOf(key)

  if (localValue === null) {
    writeJson(key, remoteValue)
    stamp(key, remoteUpdatedAt)
    return 'applied'
  }

  const remoteNewer = !localAt || remoteUpdatedAt > localAt
  const merged = remoteNewer ? mergeValues(localValue, remoteValue) : mergeValues(remoteValue, localValue)
  const mergedJson = JSON.stringify(merged)
  if (mergedJson === JSON.stringify(localValue)) {
    // Local already covers it; adopt the server's time so we don't re-push.
    if (remoteNewer) stamp(key, remoteUpdatedAt)
    return 'kept'
  }
  writeJson(key, merged)
  if (mergedJson === JSON.stringify(remoteValue)) {
    stamp(key, remoteUpdatedAt)
    return 'applied'
  }
  // Union of both sides: newer than either, and the server needs it too.
  stamp(key, new Date().toISOString())
  markDirty(key)
  return 'merged'
}
