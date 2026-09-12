// Tips are written with placeholders — "{baby} may roll onto {their} side" —
// so the same line reads right for a boy, a girl, or a baby whose sex isn't
// set yet. Substitute at render time from the profile.
//
//   {baby}        Kabir / your baby            (singular verb: "{baby} sleeps")
//   {they}        he / she / they              (only before will/can/'ll/past tense)
//   {them}        him / her / them
//   {their}       his / her / their
//   {theirs}      his / hers / theirs
//   {themselves}  himself / herself / themselves
// Capitalised forms ({They}, {Their}, {Baby}) capitalise the result.

const SETS = {
  M: { they: 'he',   them: 'him',  their: 'his',   theirs: 'his',    themselves: 'himself' },
  F: { they: 'she',  them: 'her',  their: 'her',   theirs: 'hers',   themselves: 'herself' },
  N: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', themselves: 'themselves' },
}

const PATTERN = /\{(baby|they|them|their|theirs|themselves)\}/gi

export function personalize(text, profile) {
  if (typeof text !== 'string' || text.indexOf('{') === -1) return text
  const set = SETS[profile?.babySex] || SETS.N
  const name = (profile?.babyName || '').trim() || 'your baby'
  return text.replace(PATTERN, (match, key) => {
    const lower = key.toLowerCase()
    const word = lower === 'baby' ? name : set[lower]
    const capital = key[0] === key[0].toUpperCase()
    return capital ? word[0].toUpperCase() + word.slice(1) : word
  })
}

// Same substitution over a tip object's title and body.
export function personalizeTip(tip, profile) {
  if (!tip) return tip
  return { ...tip, title: personalize(tip.title, profile), body: personalize(tip.body, profile) }
}
