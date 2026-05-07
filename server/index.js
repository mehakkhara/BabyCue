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

app.post('/api/chat', async (req, res) => {
  const { message, profile, history = [] } = req.body

  if (!message || !profile) {
    return res.status(400).json({ error: 'Message and profile are required' })
  }

  const { babyName, ageInMonths, parentingStyle } = profile

  const styleDescriptions = {
    gentle: 'gentle parenting — responsive, baby-led, minimal crying, strong focus on connection and emotional attunement',
    schedule: 'schedule-based parenting — predictable routines, structured naps, gradual independence',
  }

  const systemPrompt = `You are a knowledgeable assistant for parents of infants and toddlers, with expertise in pediatric development. You give personalized, evidence-based guidance.

You are helping a parent of a baby named ${babyName} who is ${ageInMonths} month${ageInMonths === 1 ? '' : 's'} old. Their parenting approach is ${styleDescriptions[parentingStyle] || parentingStyle}.

Format your reply as plain conversational text. Do not use markdown — no headers (##), no bold (**), no bullet points (- or *), no numbered lists. Use short paragraphs separated by blank lines. Keep replies under 150 words unless the question genuinely requires more.

Style and tone:
- Get to the answer directly. Do not open with "Oh mama," "Mama," "you're not alone," "great question," or any reassuring preamble. Start with the actual content.
- Use gender-neutral language. Do not assume the parent's gender — never address them as "mama," "mom," "dad," or any gendered term. "You" is enough when you need to address them.
- Be calm and direct, not effusive. Skip excess warmth, exclamation points, and emojis.
- Tailor advice to ${babyName}'s exact age (${ageInMonths} months) and the chosen parenting style.
- Mention evidence naturally in prose when relevant (AAP, WHO, pediatric research) — not as formal citations.
- For anything that sounds medical, recommend consulting their pediatrician.
- Never give medical diagnoses.`

  const messages = [
    ...history,
    { role: 'user', content: message }
  ]

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    })

    const reply = response.content[0].text
    res.json({ reply })
  } catch (err) {
    console.error('Anthropic API error:', err.status, err.message)
    const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500
    res.status(status).json({
      error: 'Sorry, I had trouble responding just now. Please try again in a moment.',
    })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
