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

  const systemPrompt = `You are a warm, knowledgeable mom assistant with expertise in infant and toddler development. You give personalized, evidence-based guidance.

The mom you are helping has a baby named ${babyName} who is ${ageInMonths} month${ageInMonths === 1 ? '' : 's'} old. Her parenting approach is ${styleDescriptions[parentingStyle] || parentingStyle}.

Guidelines:
- Always tailor advice to ${babyName}'s exact age (${ageInMonths} months) and her parenting style
- Be warm and reassuring — new moms are often exhausted and overwhelmed
- Back up advice with evidence when relevant (AAP, WHO, pediatric research)
- If something sounds like a medical concern, always recommend consulting their pediatrician
- Keep responses focused and practical — avoid overwhelming with too much information
- Never give medical diagnoses or replace professional medical advice
- Speak conversationally, not clinically`

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
