// Turns a story line into something we can put on screen: baby's name and
// pronouns substituted, and *emphasis* split out so the reader can render it
// without dangerouslySetInnerHTML.

const PRONOUNS = {
  M: { they: 'he',   them: 'him',  their: 'his',   theirs: 'his',    was: 'was'  },
  F: { they: 'she',  them: 'her',  their: 'her',   theirs: 'hers',   was: 'was'  },
  X: { they: 'they', them: 'them', their: 'their', theirs: 'theirs', was: 'were' },
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// "Charles" → "Charles's". Some parents write "Charles'" — if that preference
// ever becomes a setting, this is the one place to change it.
function possessive(name) {
  return `${name}'s`
}

/**
 * Replace {name}, {they}, {their} etc. in a single line.
 *
 * Tokens always refer to the baby. Animals and objects in the stories use
 * fixed "it"/"its" precisely so this function can't touch them.
 */
// Where the baby sleeps, from onboarding. A nested {parent} is resolved after.
const BED = {
  own_room:   'your own little bed',
  room_share: 'your bed, close to {parent}',
  bed_share:  'the big bed, snuggled up next to {parent}',
}

export function renderLine(line, profile = {}) {
  const name = (profile.babyName || '').trim() || 'your baby'
  const parent = (profile.momName || '').trim() || 'Mama'
  const bed = BED[profile.sleepArrangement] || 'your bed'
  const p = PRONOUNS[profile.babySex] || PRONOUNS.X

  return String(line)
    // {name's} first — otherwise {name} matches the opening brace and leaves "'s}"
    .replace(/\{name's\}/g, possessive(name))
    .replace(/\{name\}/g, name)
    .replace(/\{bed\}/g, bed)
    .replace(/\{parent\}/g, parent)
    .replace(/\{They\}/g, capitalize(p.they))
    .replace(/\{they\}/g, p.they)
    .replace(/\{Them\}/g, capitalize(p.them))
    .replace(/\{them\}/g, p.them)
    .replace(/\{Their\}/g, capitalize(p.their))
    .replace(/\{their\}/g, p.their)
    .replace(/\{theirs\}/g, p.theirs)
    .replace(/\{Was\}/g, capitalize(p.was))
    .replace(/\{was\}/g, p.was)
}

/**
 * Split a rendered line into segments on *emphasis* markers.
 * "The wheat went *swish*." → [{text:'The wheat went '}, {text:'swish', em:true}, {text:'.'}]
 */
const STORY_COLORS = {
  red: '#ff6b5d', orange: '#ff9a4d', yellow: '#ffd85a', green: '#79d85b',
  blue: '#69b8ff', purple: '#c4a2ff', pink: '#ff9dc4', brown: '#c99568',
  black: '#b5bacb', white: '#fffdf5', grey: '#c2c8d2', gray: '#c2c8d2',
  gold: '#f5c75a', silver: '#d4d8e3',
}

function splitColorWords(text, em) {
  const chunks = text.split(/\b(red|orange|yellow|green|blue|purple|pink|brown|black|white|grey|gray|gold|silver)\b/gi)
  return chunks.filter(Boolean).map(chunk => ({
    text: chunk,
    em,
    color: STORY_COLORS[chunk.toLowerCase()],
  }))
}

export function toSegments(line) {
  const out = []
  const re = /\*([^*]+)\*/g
  let last = 0
  let m

  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push(...splitColorWords(line.slice(last, m.index), false))
    out.push(...splitColorWords(m[1], true))
    last = m.index + m[0].length
  }
  if (last < line.length) out.push(...splitColorWords(line.slice(last), false))
  return out.length ? out : splitColorWords(line, false)
}

/** Convenience: render + split, for one line. */
export function renderSegments(line, profile) {
  return toSegments(renderLine(line, profile))
}
