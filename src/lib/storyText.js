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
export function renderLine(line, profile = {}) {
  const name = (profile.babyName || '').trim() || 'your baby'
  const p = PRONOUNS[profile.babySex] || PRONOUNS.X

  return String(line)
    // {name's} first — otherwise {name} matches the opening brace and leaves "'s}"
    .replace(/\{name's\}/g, possessive(name))
    .replace(/\{name\}/g, name)
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
export function toSegments(line) {
  const out = []
  const re = /\*([^*]+)\*/g
  let last = 0
  let m

  while ((m = re.exec(line)) !== null) {
    if (m.index > last) out.push({ text: line.slice(last, m.index), em: false })
    out.push({ text: m[1], em: true })
    last = m.index + m[0].length
  }
  if (last < line.length) out.push({ text: line.slice(last), em: false })
  return out.length ? out : [{ text: line, em: false }]
}

/** Convenience: render + split, for one line. */
export function renderSegments(line, profile) {
  return toSegments(renderLine(line, profile))
}
