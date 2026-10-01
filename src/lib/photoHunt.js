// Photo-hunt month state — which prompts she's captured this calendar month,
// each linked to the journal entry it created. localStorage, one key per
// month (photoHunt:YYYY-MM), so past months' grids stay retrievable and a new
// month starts fresh automatically. Synced through syncedStore.
import { readState, writeState } from './syncedStore'

export function currentMonthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function storageKey(monthKey) {
  return `photoHunt:${monthKey}`
}

// { [promptId]: { entryId, ts, fit?, position? } }
//   fit:      'cover' (fill the square, default) | 'contain' (show the whole photo)
//   position: CSS object-position for 'cover' — 'top' | 'center' | 'bottom'
export function loadHunt(monthKey = currentMonthKey()) {
  return readState(storageKey(monthKey), {})
}

export function recordCapture(promptId, entryId, display = {}, monthKey = currentMonthKey()) {
  const state = loadHunt(monthKey)
  state[promptId] = {
    entryId,
    ts: Date.now(),
    fit: display.fit === 'contain' ? 'contain' : 'cover',
    position: display.position || 'center',
  }
  writeState(storageKey(monthKey), state)
  return state
}
