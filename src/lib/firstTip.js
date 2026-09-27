// Remembers whether the "your first tip" welcome card on Today has been
// acknowledged. Device-local on purpose: it's a one-time nudge, not data.
const KEY = 'firstTipSeen'

export function hasSeenFirstTip() {
  try { return localStorage.getItem(KEY) === '1' } catch { return true }
}

export function markFirstTipSeen() {
  try { localStorage.setItem(KEY, '1') } catch { /* private mode */ }
}
