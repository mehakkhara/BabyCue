#!/usr/bin/env node
// Enrich the curated tips with the three structured fields the tip page shows:
//   tryToday     — one concrete example for today (the model may illustrate; no new claims)
//   whyItMatters — the reason the body gives, reworded ("" if none)
//   minutes      — how long the action takes (null when it isn't an action)
//
// Content rule (chosen 2026-09-14): whyItMatters is body-only; tryToday may
// illustrate the action but adds no recommendation or claim. The model marks `grounded: false` and writes
// `note` when it could not stay inside the source, and those rows are left
// out of the app until you review them.
//
// Usage (from the repo root; needs ANTHROPIC_API_KEY in the env or server/.env):
//   node scripts/enrich-tips.mjs --dry-run          # count tips, estimate cost, no API calls
//   node scripts/enrich-tips.mjs --limit 20         # a small sample to review first
//   node scripts/enrich-tips.mjs                    # everything not yet enriched (resumable)
//   node scripts/enrich-tips.mjs --review           # write scripts/enrichment-review.html
//   node scripts/enrich-tips.mjs --topic sleep      # one topic only
//
// Output: src/data/tipEnrichment.json  { [tipId]: { tryToday, whyItMatters, minutes, grounded, note, model, at } }
// The tip page shows the body in full, then these extras beneath it.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const OUT = path.join(root, 'src/data/tipEnrichment.json')
const REVIEW = path.join(root, 'scripts/enrichment-review.html')
const MODEL = 'claude-opus-5'
const BATCH = 20

const args = process.argv.slice(2)
const flag = name => args.includes(`--${name}`)
const opt = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : null }

// The server's .env holds the key for Railway; reuse it locally.
if (!process.env.ANTHROPIC_API_KEY) {
  const envPath = path.join(root, 'server/.env')
  if (fs.existsSync(envPath)) {
    const m = fs.readFileSync(envPath, 'utf8').match(/^ANTHROPIC_API_KEY=(.+)$/m)
    if (m) process.env.ANTHROPIC_API_KEY = m[1].trim().replace(/^["']|["']$/g, '')
  }
}

const { tips } = await import(pathToFileUrl(path.join(root, 'src/data/tips.js')))
const existing = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, 'utf8')) : {}

function pathToFileUrl(p) { return 'file://' + p }

const SYSTEM = `You write short structured extras for parenting tips in a calm, evidence-based app for parents of babies 0–24 months. The app shows the tip body in full, then your extras beneath it.

For each tip you receive its title, body, month, topic and the source it cites. Produce:

- tryToday: ONE concrete example of doing the tip today, under 18 words. In quotes if it is something to say. This may be your own illustration of the action (a specific moment, phrase, or object), but it must not introduce a new recommendation, claim, or age guidance that is not in the body.
- whyItMatters: ONE sentence (under 22 words) restating a reason that is ALREADY PRESENT in the tip body, worded differently from the body. If the body gives no reason, return an empty string. Never add reasons from your own knowledge.
- minutes: how long the action takes, as an integer 1–30, or null if the tip is guidance rather than an action.
- grounded: true only if whyItMatters stays inside the body and tryToday adds no new recommendation or claim. Otherwise false.
- note: when grounded is false, one short line saying what was added. Otherwise an empty string.

Rules: plain, warm, second person ("you"), no exclamation marks, no emoji, no medical advice, no "mama"/"great job" filler. Use the placeholder {baby} for the baby's name and {they}/{them}/{their} for pronouns; never write "he" or "she".

Return one entry per input id, in the same order.`

const Entry = z.object({
  id: z.number(),
  tryToday: z.string(),
  whyItMatters: z.string(),
  minutes: z.number().int().min(1).max(30).nullable(),
  grounded: z.boolean(),
  note: z.string(),
})
const Result = z.object({ entries: z.array(Entry) })

function userMessage(batch) {
  return batch.map(t => JSON.stringify({
    id: t.id, month: t.month, topic: t.topic, source: t.source || null, title: t.title, body: t.body,
  })).join('\n')
}

function writeReview() {
  const rows = tips.filter(t => existing[t.id]).map(t => ({ ...t, ...existing[t.id] }))
  const esc = s => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))
  const html = `<!doctype html><meta charset="utf-8"><title>Tip enrichment review</title>
<style>body{font:14px/1.5 Inter,system-ui,sans-serif;margin:24px;color:#1e1b4b;max-width:900px}
.t{border:1px solid #ece9f6;border-radius:12px;padding:12px 14px;margin:10px 0}.t.flag{border-color:#fdba74;background:#fff7ed}
.k{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af}.b{color:#4b4a63}.n{color:#9a3412;font-weight:600}
h1{font-size:20px}summary{cursor:pointer;font-weight:600}</style>
<h1>Tip enrichment review · ${rows.length} of ${tips.length} tips</h1>
<p>Orange = the model said it could not stay inside the source. Those are not shown in the app until you edit or accept them in <code>src/data/tipEnrichment.json</code> (set <code>grounded</code> to true).</p>
${['flagged', 'ok'].map(group => {
  const list = rows.filter(r => group === 'flagged' ? !r.grounded : r.grounded)
  return `<details ${group === 'flagged' ? 'open' : ''}><summary>${group === 'flagged' ? 'Needs a look' : 'Grounded'} · ${list.length}</summary>
${list.map(r => `<div class="t ${r.grounded ? '' : 'flag'}"><div class="k">#${r.id} · month ${r.month} · ${esc(r.topic)} · ${esc(r.source || 'no source')}</div>
<b>${esc(r.title)}</b><div class="b">${esc(r.body)}</div>
<div style="margin-top:8px"><span class="k">Try it today</span> ${esc(r.tryToday) || '—'}</div>
<div><span class="k">Why it matters</span> ${esc(r.whyItMatters) || '—'}</div>
<div><span class="k">Minutes</span> ${r.minutes ?? '—'}</div>
${r.note ? `<div class="n">${esc(r.note)}</div>` : ''}</div>`).join('\n')}</details>`
}).join('\n')}`
  fs.writeFileSync(REVIEW, html)
  console.log(`Review page: ${REVIEW}`)
}

if (flag('review')) { writeReview(); process.exit(0) }

const topic = opt('topic')
let todo = tips.filter(t => !existing[t.id] && (!topic || t.topic === topic))
const limit = Number(opt('limit')) || 0
if (limit) todo = todo.slice(0, limit)
// Batch by topic so the reviewer's judgment stays consistent within a topic.
todo.sort((a, b) => a.topic.localeCompare(b.topic) || a.month - b.month)
const batches = []
for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH))

console.log(`${tips.length} tips, ${Object.keys(existing).length} already enriched, ${todo.length} to do in ${batches.length} requests.`)
console.log(`${tips.filter(t => !t.source).length} tips have no source (they get enriched from the body only and are flagged).`)

if (todo.length === 0) process.exit(0)

const client = new Anthropic()

if (flag('dry-run')) {
  const sample = batches[0]
  const count = await client.messages.countTokens({ model: MODEL, system: SYSTEM, messages: [{ role: 'user', content: userMessage(sample) }] })
  const inputPerBatch = count.input_tokens
  const outputPerBatch = sample.length * 90
  const totalIn = inputPerBatch * batches.length
  const totalOut = outputPerBatch * batches.length
  const cost = (totalIn * 5 + totalOut * 25) / 1e6   // Claude Opus 5: $5 in / $25 out per 1M tokens
  console.log(`Estimate: ~${totalIn.toLocaleString()} input + ~${totalOut.toLocaleString()} output tokens ≈ $${cost.toFixed(2)} (system prompt cached after the first request, so likely a little less).`)
  process.exit(0)
}

for (const [i, batch] of batches.entries()) {
  process.stdout.write(`Batch ${i + 1}/${batches.length} (${batch[0].topic}, ${batch.length} tips)… `)
  try {
    const res = await client.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system: [{ type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: userMessage(batch) }],
      output_config: { format: zodOutputFormat(Result), effort: 'medium' },
    })
    if (res.stop_reason === 'refusal') { console.log('refused, skipping'); continue }
    const parsed = res.parsed_output
    if (!parsed) { console.log('could not parse, skipping'); continue }
    const ids = new Set(batch.map(t => t.id))
    let n = 0
    for (const e of parsed.entries) {
      if (!ids.has(e.id)) continue
      existing[e.id] = {
        tryToday: e.tryToday.trim(),
        whyItMatters: e.whyItMatters.trim(),
        minutes: e.minutes,
        grounded: e.grounded,
        note: e.note.trim(),
        model: MODEL,
        at: new Date().toISOString().slice(0, 10),
      }
      n++
    }
    fs.writeFileSync(OUT, JSON.stringify(existing, null, 2) + '\n')
    console.log(`${n} saved (cache read ${res.usage.cache_read_input_tokens ?? 0} tokens)`)
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) { console.log('rate limited, waiting 30 s'); await new Promise(r => setTimeout(r, 30000)); i-- ; continue }
    if (err instanceof Anthropic.APIError) { console.log(`API error ${err.status}: ${err.message}`); continue }
    throw err
  }
}

writeReview()
console.log(`Done. ${Object.keys(existing).length} tips enriched → ${path.relative(root, OUT)}`)
