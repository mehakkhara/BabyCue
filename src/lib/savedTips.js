// Saved-tips store — the mom's personal collection of bookmarked tips.
// Backed by localStorage. Stores full tip objects (not just IDs) so that AI
// tips — whose text lives only in that day's response — survive being saved.
// This is the "investment" rung of the retention loop: the more she saves,
// the more the app is hers.

import { tips } from '../data/tips'

const KEY = 'savedTips'

const curatedById = new Map(tips.map(t => [t.id, t]))

// Load saved tips as full objects, newest first.
// Migrates the legacy format (a bare array of IDs) in place: curated IDs are
// resolved to full tips; legacy AI IDs (`ai:<date>`) can't be recovered — the
// text was never stored — so they're dropped.
export function loadSaved() {
  let raw
  try {
    raw = JSON.parse(localStorage.getItem(KEY) || '[]')
  } catch {
    return []
  }
  if (!Array.isArray(raw)) return []
  if (raw.length === 0) return []
  // New format: array of objects.
  if (raw.every(x => x && typeof x === 'object')) return raw
  // Legacy format: array of IDs — resolve what we can, persist the upgrade.
  const migrated = raw
    .map(id => {
      const t = curatedById.get(id)
      return t
        ? { id: t.id, title: t.title, body: t.body, source: t.source, topic: t.topic, savedAt: 0 }
        : null
    })
    .filter(Boolean)
  save(migrated)
  return migrated
}

function save(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list))
  } catch {
    /* quota — non-critical */
  }
}

export function isSaved(id, list = loadSaved()) {
  return list.some(t => t.id === id)
}

// Toggle a tip in/out of the collection. Pass the FULL tip object
// ({ id, title, body, source, topic }) so AI tips persist their text.
// Returns the updated list (newest first).
export function toggleSaved(tip) {
  const list = loadSaved()
  const next = list.some(t => t.id === tip.id)
    ? list.filter(t => t.id !== tip.id)
    : [{ ...tip, savedAt: Date.now() }, ...list]
  save(next)
  return next
}

export function removeSaved(id) {
  const next = loadSaved().filter(t => t.id !== id)
  save(next)
  return next
}
