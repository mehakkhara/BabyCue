import { dayKey } from './streak'

// Remembers whether today's tip card on Today has been acknowledged, so it
// hides for the rest of the day and returns tomorrow with the next tip.
// Device-local on purpose: it's a daily nudge, not data worth syncing.
const KEY = 'tipCardSeenDay'

export function hasSeenTipToday() {
  try { return localStorage.getItem(KEY) === dayKey() } catch { return true }
}

export function markTipSeenToday() {
  try { localStorage.setItem(KEY, dayKey()) } catch { /* private mode */ }
}
