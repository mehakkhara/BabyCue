// Photo-hunt month state — which prompts she's captured this calendar month,
// each linked to the journal entry it created. localStorage, one key per
// month (photoHunt:YYYY-MM), so past months' grids stay retrievable and a new
// month starts fresh automatically.

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
  try {
    return JSON.parse(localStorage.getItem(storageKey(monthKey)) || '{}')
  } catch {
    return {}
  }
}

export function recordCapture(promptId, entryId, display = {}, monthKey = currentMonthKey()) {
  const state = loadHunt(monthKey)
  state[promptId] = {
    entryId,
    ts: Date.now(),
    fit: display.fit === 'contain' ? 'contain' : 'cover',
    position: display.position || 'center',
  }
  try {
    localStorage.setItem(storageKey(monthKey), JSON.stringify(state))
  } catch {
    /* quota — the journal entry still exists, only the grid link is lost */
  }
  return state
}
