// Milestones the parent adds themselves.
//
// The CDC list covers development; it can't cover "slept through the night",
// "let Grandma hold her without crying", or "said dada and meant it". Those are
// the ones a parent actually wants to remember, so they get to add their own.
//
// Custom entries are shaped like the curated ones — id, checkpoint, text — so
// the screen renders them through the same path and the existing Yes/Not-yet
// status map in milestoneProgress.js works on them unchanged. Ids are prefixed
// 'c-' so they can never collide with a curated 'm4-1'.
import { readState, writeState } from './syncedStore'
import { tipForIdea } from '../data/milestoneIdeas'

const KEY = 'customMilestones'

export function loadCustom() {
  const raw = readState(KEY, [])
  if (!Array.isArray(raw)) return []
  // Entries added before ideas carried tips: look the tip up by text.
  return raw.map(m => (m.tip || !m.text ? m : { ...m, tip: tipForIdea(m.text) || undefined }))
}

function persist(list) {
  writeState(KEY, list)
  return list
}

/** Add one. Returns the full updated list. */
export function addCustom({ text, checkpoint, tip }) {
  const clean = (text || '').trim()
  if (!clean) return loadCustom()

  const list = loadCustom()
  list.push({
    id: `c-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    text: clean.slice(0, 120),
    tip: tip || tipForIdea(clean) || undefined,   // a suggested idea brings its "Not yet" tip along
    checkpoint,
    domain: 'custom',
    custom: true,
    createdAt: Date.now(),
  })
  return persist(list)
}

/** Remove one. Returns the full updated list. */
export function removeCustom(id) {
  return persist(loadCustom().filter(m => m.id !== id))
}

/**
 * The parent's own milestones for a checkpoint, newest first — so the one they
 * just added is the first thing they see, not the last.
 */
export function customForCheckpoint(list, checkpoint) {
  return list
    .filter(m => m.checkpoint === checkpoint)
    .sort((a, b) => b.createdAt - a.createdAt)
}
