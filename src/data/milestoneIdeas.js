// Suggestions for "Add a milestone".
//
// Deliberately NOT developmental — the CDC list in milestones.js already covers
// rolling, babbling and pincer grips. These are the other kind: the firsts a
// parent wants to remember rather than the ones a pediatrician asks about.
// Keepsake, not assessment.
//
// Keyed by the same checkpoints as MILESTONES so a parent is offered things
// that are plausibly happening right about now.

export const MILESTONE_IDEAS = {
  2: [
    'Slept a long stretch',
    'Met the whole family',
    'First bath at home',
    'Outgrew newborn clothes',
    'First proper outing',
  ],
  4: [
    'Slept through the night',
    'Laughed out loud',
    'Found their own feet',
    'First time in a swing',
    'Grabbed my hair',
  ],
  6: [
    'First taste of real food',
    'First tooth',
    'Sat up on their own',
    'First time in a high chair',
    'Splashed in the pool',
  ],
  9: [
    'Pulled up on the sofa',
    'Waved goodbye',
    'Crawled to me',
    'Ate with their fingers',
    'Slept in their own room',
  ],
  12: [
    'First birthday',
    'First steps',
    'First haircut',
    'Blew out a candle',
    'Said a real word',
  ],
  15: [
    'Ran for the first time',
    'Used a spoon properly',
    'Danced to music',
    'First trip away',
    'Climbed something they shouldn’t',
  ],
  18: [
    'Put two words together',
    'Walked up the stairs',
    'Named a body part',
    'Slept in a big bed',
    'Helped tidy up',
  ],
  24: [
    'Counted to three',
    'Got dressed (mostly) alone',
    'Made a friend',
    'Used the potty',
    'Told their first joke',
  ],
}

/**
 * Ideas for a checkpoint, minus anything already added.
 * Matching is case- and whitespace-insensitive so "first tooth" doesn't get
 * offered again after the parent typed "First Tooth" themselves.
 */
export function ideasFor(checkpoint, alreadyAdded = []) {
  const taken = new Set(alreadyAdded.map(m => (m.text || '').trim().toLowerCase()))
  return (MILESTONE_IDEAS[checkpoint] || []).filter(text => !taken.has(text.toLowerCase()))
}
