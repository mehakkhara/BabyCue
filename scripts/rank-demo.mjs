// Dev-only demo: loads the lib through Vite so extensionless imports resolve,
// then runs the tip ranking over three synthetic baby histories.
// Usage: node scripts/rank-demo.mjs [monthOfBaby]
import { createServer } from 'vite'
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} }
const vite = await createServer({ root: process.cwd(), logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom', plugins: [] })
try {
  const { summarizeBaby } = await vite.ssrLoadModule('/src/lib/babySummary.js')
  const { rankTips, pickPersonalTip } = await vite.ssrLoadModule('/src/lib/tipRanking.js')
  const { pickDailyTip } = await vite.ssrLoadModule('/src/lib/dailyTip.js')
  const { getTipsForProfile } = await vite.ssrLoadModule('/src/data/tips.js')
  const { dayKey } = await vite.ssrLoadModule('/src/lib/streak.js')

  const MONTH = Number(process.argv[2] || 5)
  const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return dayKey(d) }
  const daily = pickDailyTip(MONTH)
  const show = r => `  [${r.score.toFixed(2)}] ${r.tip.topic.padEnd(11)} #${r.tip.id} ${r.tip.title}${r.because.length ? '\n' + ' '.repeat(10) + 'because ' + r.because.join('; ') : ''}`

  console.log(`Baby is ${MONTH} months. Tip of the day (unchanged, 1 of ${getTipsForProfile(MONTH).length}):\n  #${daily.id} ${daily.title}\n`)

  let s = summarizeBaby({ moodLog: {}, patterns: {} })
  console.log(`A) Nothing logged → evidence ${s.evidence}, enough=${s.enough}`)
  console.log('   For-baby card:', pickPersonalTip(MONTH, { summary: s, excludeId: daily.id }) ?? 'hidden (null)', '\n')

  s = summarizeBaby({ moodLog: { [ago(0)]: ['fussy'] }, patterns: {} })
  console.log(`B) One fussy day → evidence ${s.evidence}, enough=${s.enough}, concerns=${s.concerns.length}`)
  console.log('   For-baby card:', pickPersonalTip(MONTH, { summary: s, excludeId: daily.id }) ?? 'hidden (null)', '\n')

  const moodLog = {
    [ago(0)]: ['fussy', 'sleep'], [ago(1)]: ['fussy', 'sleep'], [ago(2)]: ['sleep'],
    [ago(3)]: ['happy'], [ago(5)]: ['fussy'], [ago(6)]: ['fussy'], [ago(9)]: ['great'], [ago(12)]: ['feeding'],
  }
  const patterns = { 'fussy:Overtired': { count: 3, lastAt: Date.now() }, 'sleep:Teething': { count: 1, lastAt: Date.now() } }
  s = summarizeBaby({ moodLog, patterns })
  console.log(`C) Fortnight: fussy 4 days, won't settle 3 days running, "Overtired" helped 3×, "Teething" once`)
  console.log(`   evidence ${s.evidence} (${s.loggedDays} logged days + 4 helped taps), enough=${s.enough}`)
  console.log('   concerns:', s.concerns.map(c => `${c.state}×${c.days}${c.streak ? ` (streak ${c.streak})` : ''}`).join(', '))
  const ranked = rankTips(getTipsForProfile(MONTH), s)
  console.log('   Top 6 of', ranked.length, 'for this baby:')
  ranked.slice(0, 6).forEach(r => console.log(show(r)))
  console.log('   …unboosted (score 0):', ranked.filter(r => r.score === 0).length, 'tips')
  const pick = pickPersonalTip(MONTH, { summary: s, excludeId: daily.id })
  console.log(`\n   For-baby card today → #${pick.tip.id} "${pick.tip.title}"\n   because ${pick.because.join('; ')}`)
  console.log('   Tomorrow →', pickPersonalTip(MONTH, { summary: s, excludeId: daily.id, offset: 1 }).tip.title)
  console.log('   Day after →', pickPersonalTip(MONTH, { summary: s, excludeId: daily.id, offset: 2 }).tip.title)
} finally { await vite.close() }
