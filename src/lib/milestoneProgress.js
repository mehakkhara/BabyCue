// Milestone progress — per-milestone status: 'done' (yes, my baby does this)
// or 'notyet' (working on it → we show an encouraging tip). localStorage map
// of { milestoneId: status }. A keepsake + a sense of progress; never used to
// flag or judge.
import { readState, writeState } from './syncedStore'

const KEY = 'milestoneStatus'
const LEGACY_KEY = 'milestonesChecked' // old format: array of done IDs

export function loadStatuses() {
  const current = readState(KEY, null)
  if (current) return current
  // Migrate the old checked-only format: every checked ID becomes 'done'.
  const legacy = readState(LEGACY_KEY, [])
  if (Array.isArray(legacy) && legacy.length) {
    const map = {}
    legacy.forEach(id => { map[id] = 'done' })
    writeState(KEY, map)
    return map
  }
  return {}
}

// Set a milestone's status. Tapping the already-active status clears it back
// to unset. Returns the updated map.
export function setStatus(id, status) {
  const map = loadStatuses()
  if (map[id] === status) delete map[id]
  else map[id] = status
  writeState(KEY, map)
  return map
}
