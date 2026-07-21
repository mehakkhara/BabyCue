// "What helped" store — the one signal worth keeping from the responder.
// When the parent marks a cause as the thing that helped, we tally it per
// state+cause. Over time this reveals *this* baby's patterns ("evenings are
// usually overtired") and can feed personalization / the briefing agent.
// localStorage-backed; no raw activity logs.

const KEY = 'babyPatterns'

export function loadPatterns() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}')
  } catch {
    return {}
  }
}

function save(p) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    /* quota — non-critical */
  }
}

const id = (state, cause) => `${state}:${cause}`

export function markHelped(state, cause) {
  const p = loadPatterns()
  const key = id(state, cause)
  const prev = p[key] || { count: 0, lastAt: 0 }
  p[key] = { count: prev.count + 1, lastAt: Date.now() }
  save(p)
  return p
}

export function timesHelped(state, cause, p = loadPatterns()) {
  return p[id(state, cause)]?.count ?? 0
}
