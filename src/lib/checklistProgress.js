// Which checklist items are ticked, and which checklists the parent has
// hidden from Today. localStorage for now (per device), Supabase later.
//   { items: { [checklistId]: { [itemId]: true } }, hidden: { [checklistId]: true } }
import { itemCount } from '../data/checklists'

const KEY = 'checklistProgress'

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}')
    return { items: raw.items || {}, hidden: raw.hidden || {} }
  } catch {
    return { items: {}, hidden: {} }
  }
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full or blocked */ }
  return state
}

export function loadProgress() { return load() }

export function isChecked(state, checklistId, itemId) {
  return !!state.items[checklistId]?.[itemId]
}

export function toggleItem(checklistId, itemId) {
  const state = load()
  const list = { ...(state.items[checklistId] || {}) }
  if (list[itemId]) delete list[itemId]
  else list[itemId] = true
  return save({ ...state, items: { ...state.items, [checklistId]: list } })
}

export function setAll(checklist, on) {
  const state = load()
  const list = {}
  if (on) for (const s of checklist.sections) for (const i of s.items) list[i.id] = true
  return save({ ...state, items: { ...state.items, [checklist.id]: list } })
}

export function doneCount(state, checklist) {
  const list = state.items[checklist.id] || {}
  let n = 0
  for (const s of checklist.sections) for (const i of s.items) if (list[i.id]) n++
  return n
}

export function isComplete(state, checklist) {
  return doneCount(state, checklist) >= itemCount(checklist)
}

export function isHidden(state, checklistId) {
  return !!state.hidden[checklistId]
}

export function setHidden(checklistId, on) {
  const state = load()
  const hidden = { ...state.hidden }
  if (on) hidden[checklistId] = true
  else delete hidden[checklistId]
  return save({ ...state, hidden })
}
