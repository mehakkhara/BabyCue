import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const allowedOrigins = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:5174,http://localhost:5175,http://localhost:5176'
).split(',').map(s => s.trim())

app.use(cors({ origin: allowedOrigins }))
app.use(express.json())

app.get('/health', (_req, res) => res.json({ ok: true }))

const FEEDING_DESCRIPTIONS = {
  breast:  'exclusively breastfed',
  formula: 'formula fed',
  mixed:   'mixed feeding (breast and formula)',
  solids:  'mostly on solids now',
}

const SLEEP_DESCRIPTIONS = {
  own_room:   'sleeps in their own room',
  room_share: 'room-shares with parents',
  bed_share:  'bed-shares / co-sleeps with parents',
}

const BIRTH_DESCRIPTIONS = {
  full_term: 'born full-term',
  preterm:   'born preterm (before 37 weeks) — adjust developmental expectations for corrected age',
}

const SIBLING_DESCRIPTIONS = {
  only:     'is an only child or first baby in the home',
  siblings: 'has older sibling(s) at home',
}

function buildContextLines(profile, context) {
  const lines = []
  const sex = profile.babySex === 'F' ? 'girl' : profile.babySex === 'M' ? 'boy' : null
  if (sex) lines.push(`${profile.babyName} is a ${sex}.`)

  if (FEEDING_DESCRIPTIONS[profile.feedingMethod]) {
    lines.push(`Feeding: ${FEEDING_DESCRIPTIONS[profile.feedingMethod]}.`)
  }
  if (SLEEP_DESCRIPTIONS[profile.sleepArrangement]) {
    lines.push(`Sleep setup: ${SLEEP_DESCRIPTIONS[profile.sleepArrangement]}.`)
  }
  if (BIRTH_DESCRIPTIONS[profile.birthContext]) {
    lines.push(BIRTH_DESCRIPTIONS[profile.birthContext] + '.')
  }
  if (SIBLING_DESCRIPTIONS[profile.siblings]) {
    lines.push(`Family: ${SIBLING_DESCRIPTIONS[profile.siblings]}.`)
  }
  if (profile.notes && profile.notes.trim()) {
    lines.push(`Parent's notes about this baby: ${profile.notes.trim()}`)
  }

  const g = context?.latestGrowth
  if (g && (g.weight != null || g.height != null)) {
    const parts = []
    if (g.weight != null) {
      parts.push(`${g.weight} lbs${g.weightPercentile ? ` (${g.weightPercentile} percentile WHO)` : ''}`)
    }
    if (g.height != null) {
      parts.push(`${g.height} cm${g.heightPercentile ? ` (${g.heightPercentile} percentile WHO)` : ''}`)
    }
    lines.push(`Most recent growth (${g.date}, ~${Math.round(g.ageMonths)} months old): ${parts.join(', ')}.`)
  }

  const journal = Array.isArray(context?.recentJournal) ? context.recentJournal : []
  if (journal.length) {
    const formatted = journal
      .map(j => `- ${j.date}: ${j.note}`)
      .join('\n')
    lines.push(`Recent notes the parent has written in their journal (use only if relevant to the question):\n${formatted}`)
  }

  return lines
}

app.post('/api/daily-tip', async (req, res) => {
  const { profile, context } = req.body

  if (!profile || !profile.babyName || profile.ageInMonths == null) {
    return res.status(400).json({ error: 'Profile is required' })
  }

  const { babyName, ageInMonths } = profile
  const contextLines = buildContextLines(profile, context)
  const contextBlock = contextLines.length
    ? `\n\nAdditional context about this specific baby and family:\n${contextLines.join('\n')}`
    : ''

  const systemPrompt = `You are a pediatric-development expert generating one personalized daily tip for the parent of ${babyName}, who is ${ageInMonths} month${ageInMonths === 1 ? '' : 's'} old.${contextBlock}

Produce exactly ONE tip tailored to ${babyName}'s exact age and the context above.

Output strict JSON only, no prose before or after, no markdown fence. Schema:
{"title": string, "body": string, "source": string}

Rules:
- title: 4–8 words, sentence case, no trailing period.
- body: 2–3 sentences, plain text, gender-neutral, no "mama"/"mom"/"dad", no preamble like "Great question". Directly actionable for this exact age and style.
- source: must be a real, verifiable citation — AAP (American Academy of Pediatrics), WHO, CDC, NIH, or a named peer-reviewed study/journal. Do NOT fabricate citations or specific paper titles you are unsure of. Prefer well-known organizational guidance ("AAP", "WHO", "CDC", "AAP Bright Futures") over specific paper names.
- If you cannot produce a tip with a real, verifiable source, return exactly: {"tip": null}

Return JSON only.`

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Generate the tip now.' }],
    })

    const raw = response.content[0].text.trim()

    let parsed
    try {
      parsed = JSON.parse(raw)
    } catch {
      return res.json({ tip: null })
    }

    if (parsed.tip === null) {
      return res.json({ tip: null })
    }

    const { title, body, source } = parsed
    if (typeof title !== 'string' || typeof body !== 'string' || typeof source !== 'string'
        || !title.trim() || !body.trim() || !source.trim()) {
      return res.json({ tip: null })
    }

    res.json({ tip: { title: title.trim(), body: body.trim(), source: source.trim() } })
  } catch (err) {
    console.error('Daily tip error:', err.status, err.message)
    res.status(500).json({ tip: null, _error: { status: err.status, message: err.message } })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
