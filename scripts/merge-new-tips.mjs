#!/usr/bin/env node
// Merge a batch of newly written tips into src/data/tips.js.
//
// Input: a folder of JSON files, each an array of { month, topic, title, body, source }
// (what the research writers hand back). The script normalises source labels,
// validates every row, assigns sequential ids after the current max, and splices
// the rows in before the closing `]` of RAW_TIPS with a dated comment.
//
// Usage (from the repo root):
//   node scripts/merge-new-tips.mjs <folder>            # validate only, print a report
//   node scripts/merge-new-tips.mjs <folder> --write    # validate and merge
import fs from 'node:fs'
import path from 'node:path'

const [folder, ...rest] = process.argv.slice(2)
if (!folder) { console.error('usage: merge-new-tips.mjs <folder> [--write]'); process.exit(1) }
const WRITE = rest.includes('--write')
const TIPS = path.resolve('src/data/tips.js')

const TOPICS = new Set(['sleep', 'feeding', 'development', 'motor', 'activity', 'fussy', 'teething', 'leap', 'regression'])
const SOURCES = {
  'aap': 'AAP', 'healthychildren.org': 'AAP', 'healthychildren.org (aap)': 'AAP', 'american academy of pediatrics': 'AAP', 'aap (healthychildren.org)': 'AAP',
  'cdc': 'CDC', 'cdc.gov': 'CDC',
  'who': 'WHO', 'who.int': 'WHO',
  'zero to three': 'Zero to Three', 'zerotothree.org': 'Zero to Three',
  'asha': 'ASHA', 'american speech-language-hearing association': 'ASHA',
  'pediatric sleep council': 'Pediatric Sleep Council',
  'nemours kidshealth': 'Nemours KidsHealth', 'kidshealth': 'Nemours KidsHealth', 'nemours': 'Nemours KidsHealth',
}
const normSource = s => SOURCES[String(s || '').trim().toLowerCase()] || null
const key = t => String(t || '').toLowerCase().replace(/\{[a-z]+\}/g, '').replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()

const src = fs.readFileSync(TIPS, 'utf8')
const existing = [...src.matchAll(/\{ id: (\d+), month: (\d+),[^\n]*?title: (['"])((?:\\.|(?!\3).)*)\3/g)]
  .map(m => ({ id: +m[1], month: +m[2], title: m[4] }))
const maxId = Math.max(...existing.map(e => e.id))
const seen = new Map(existing.map(e => [`${e.month}:${key(e.title)}`, e.id]))

const rows = []
const problems = []
for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.json')).sort()) {
  let arr
  try { arr = JSON.parse(fs.readFileSync(path.join(folder, file), 'utf8')) } catch (e) { problems.push(`${file}: not JSON (${e.message})`); continue }
  if (!Array.isArray(arr)) { problems.push(`${file}: not an array`); continue }
  arr.forEach((r, i) => {
    const where = `${file}[${i}]`
    const month = Number(r.month)
    if (!Number.isInteger(month) || month < 1 || month > 24) problems.push(`${where}: bad month ${r.month}`)
    if (!TOPICS.has(r.topic)) problems.push(`${where}: bad topic "${r.topic}"`)
    const source = normSource(r.source)
    if (!source) problems.push(`${where}: unknown source "${r.source}"`)
    if (typeof r.title !== 'string' || r.title.length < 8) problems.push(`${where}: bad title`)
    if (typeof r.body !== 'string' || r.body.split(/\s+/).length < 20) problems.push(`${where}: body too short`)
    if (/\b(he|she|him|her|his|hers|himself|herself)\b/i.test(`${r.title} ${r.body}`)) problems.push(`${where}: gendered pronoun in "${r.title}"`)
    if (/[!]|[\u{1F300}-\u{1FAFF}]/u.test(`${r.title} ${r.body}`)) problems.push(`${where}: exclamation or emoji in "${r.title}"`)
    const k = `${month}:${key(r.title)}`
    if (seen.has(k)) problems.push(`${where}: duplicate title "${r.title}" (month ${month})`)
    seen.set(k, 'new')
    rows.push({ month, topic: r.topic, title: r.title.trim(), body: r.body.trim(), source })
  })
}

// Cross-month repeats: the app shows one month at a time and a parent moves
// through months in order, so the same idea in months 16, 17 and 19 reads as
// "the same tip again". Flag any new title that overlaps an existing or new
// title in another month (word overlap, ignoring filler words).
const STOP = new Set('a the and to with for of in on your baby them their they play game make let try at up out into it an you is are then this that or as'.split(' '))
const words = t => new Set(key(t).split(' ').filter(w => w && !STOP.has(w)))
const overlap = (a, b) => { const i = [...a].filter(w => b.has(w)).length; return i / Math.max(1, new Set([...a, ...b]).size) }
const corpus = [...existing.map(e => ({ month: e.month, title: e.title })), ...rows]
for (let i = 0; i < rows.length; i++) {
  const w = words(rows[i].title)
  for (const other of corpus) {
    if (other === rows[i] || other.month === rows[i].month) continue
    if (overlap(w, words(other.title)) >= 0.6) problems.push(`month ${rows[i].month} "${rows[i].title}" repeats month ${other.month} "${other.title}"`)
  }
}

const perMonth = {}
for (const r of rows) {
  perMonth[r.month] = perMonth[r.month] || { total: 0, activity: 0 }
  perMonth[r.month].total++
  if (r.topic === 'activity') perMonth[r.month].activity++
}
console.log(`${rows.length} new tips across ${Object.keys(perMonth).length} months (existing max id ${maxId})`)
for (const m of Object.keys(perMonth).sort((a, b) => a - b)) console.log(`  month ${m}: +${perMonth[m].total} (${perMonth[m].activity} activity)`)
if (problems.length) {
  console.log(`\n${problems.length} problem(s):`)
  for (const p of problems) console.log('  - ' + p)
  process.exit(2)
}
if (!WRITE) { console.log('\nValidation passed. Re-run with --write to merge.'); process.exit(0) }

rows.sort((a, b) => a.month - b.month)
const today = new Date().toISOString().slice(0, 10)
const lines = rows.map((r, i) => `  { id: ${maxId + 1 + i}, month: ${r.month}, topic: ${JSON.stringify(r.topic)}, title: ${JSON.stringify(r.title)}, body: ${JSON.stringify(r.body)}, source: ${JSON.stringify(r.source)} },`)
const block = `  // --- ${today}: months 13-24 fill + more activities every month (ids ${maxId + 1}-${maxId + rows.length}) ---\n${lines.join('\n')}\n`
const close = src.indexOf('\n]\n\nexport const tips')
if (close < 0) { console.error('could not find the end of RAW_TIPS'); process.exit(1) }
fs.writeFileSync(TIPS, src.slice(0, close + 1) + block + src.slice(close + 1))
console.log(`\nWrote ${rows.length} tips (ids ${maxId + 1}-${maxId + rows.length}) into ${TIPS}`)
