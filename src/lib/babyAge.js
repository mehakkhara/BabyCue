// How old was the baby on a given day?
//
// tips.js has formatBabyAge(), but it only answers "how old is the baby right
// now". A memory book needs "how old were they when this happened" — the whole
// point of the caption under a photo from six months ago.

/** Age in whole months between two dates. */
export function monthsAt(dateOfBirth, when) {
  const dob = new Date(dateOfBirth)
  const at = new Date(when)
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return null
  let months = (at.getFullYear() - dob.getFullYear()) * 12 + (at.getMonth() - dob.getMonth())
  if (at.getDate() < dob.getDate()) months--
  return Math.max(0, months)
}

/** Whole days between two dates. */
export function daysAt(dateOfBirth, when) {
  const dob = new Date(dateOfBirth)
  const at = new Date(when)
  if (Number.isNaN(dob.getTime()) || Number.isNaN(at.getTime())) return null
  return Math.max(0, Math.floor((at - dob) / 86400000))
}

/**
 * "3 weeks" · "4 months 2 weeks" · "1 year 3 months"
 *
 * Weeks matter enormously in the first few months and stop mattering after the
 * first birthday, so the unit changes with age rather than staying fixed.
 */
export function ageLabelAt(dateOfBirth, when) {
  const days = daysAt(dateOfBirth, when)
  if (days == null) return null

  if (days < 14) return days === 1 ? '1 day' : `${days} days`

  const months = monthsAt(dateOfBirth, when)
  if (months < 3) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? '1 week' : `${weeks} weeks`
  }

  if (months < 12) {
    // Remaining weeks past the month boundary — "4 months 2 weeks".
    const dob = new Date(dateOfBirth)
    const anniversary = new Date(dob)
    anniversary.setMonth(dob.getMonth() + months)
    const extraWeeks = Math.floor((new Date(when) - anniversary) / (86400000 * 7))
    const head = `${months} months`
    if (extraWeeks < 1) return head
    return `${head} ${extraWeeks === 1 ? '1 week' : `${extraWeeks} weeks`}`
  }

  const years = Math.floor(months / 12)
  const rem = months % 12
  const head = years === 1 ? '1 year' : `${years} years`
  if (rem === 0) return head
  return `${head} ${rem === 1 ? '1 month' : `${rem} months`}`
}

/** "Kabir, 4 months 2 weeks" — falls back to just the name if the DOB is missing. */
export function nameAndAgeAt(babyName, dateOfBirth, when) {
  const name = (babyName || '').trim()
  const age = dateOfBirth ? ageLabelAt(dateOfBirth, when) : null
  if (!name) return age || ''
  return age ? `${name}, ${age}` : name
}

/** Groups entries into months, newest first. Used by the album layout. */
export function groupByMonth(entries, dateOfBirth) {
  const buckets = new Map()

  for (const entry of entries) {
    const d = new Date(entry.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        monthLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        ageLabel: dateOfBirth ? ageLabelAt(dateOfBirth, entry.createdAt) : null,
        entries: [],
      })
    }
    buckets.get(key).entries.push(entry)
  }

  return [...buckets.values()].sort((a, b) => (a.key < b.key ? 1 : -1))
}

/**
 * Which memory leads a month?
 *
 * "Most recent" is arbitrary and often lands on an untitled snap. A memory the
 * parent bothered to write about is far more likely to be the one worth
 * enlarging, so a captioned entry wins — newest first within that preference.
 */
export function pickHero(entries) {
  if (!entries.length) return null
  // Voice memos have nothing to enlarge; they stay in the grid.
  const visual = entries.filter(e => !(typeof e.photoType === 'string' && e.photoType.startsWith('audio/')))
  const pool = visual.length ? visual : entries
  return pool.find(e => e.note && e.note.trim()) || pool[0]
}
