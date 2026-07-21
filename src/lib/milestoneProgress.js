// Milestone progress — per-milestone status: 'done' (yes, my baby does this)
// or 'notyet' (working on it → we show an encouraging tip). localStorage map
// of { milestoneId: status }. A keepsake + a sense of progress; never used to
// flag or judge.

const KEY = 'milestoneStatus'
const LEGACY_KEY = 'milestonesChecked' // old format: array of done IDs

export function loadStatuses() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
    // Migrate the old checked-only format: every checked ID becomes 'done'.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
    if (Array.isArray(legacy) && legacy.length) {
      const map = {}
      legacy.forEach(id => { map[id] = 'done' })
      localStorage.setItem(KEY, JSON.stringify(map))
      return map
    }
    return {}
  } catch {
    return {}
  }
}

// Set a milestone's status. Tapping the already-active status clears it back
// to unset. Returns the updated map.
export function setStatus(id, status) {
  const map = loadStatuses()
  if (map[id] === status) delete map[id]
  else map[id] = status
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* quota — non-critical */
  }
  return map
}
