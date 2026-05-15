import { useState, useRef, useEffect } from 'react'
import { getBabyAgeInMonths } from '../data/tips'
import { loadLatestGrowth, loadRecentJournalNotes } from '../lib/aiContext'

const SUGGESTIONS_BY_AGE = {
  newborn: [
    'Is cluster feeding normal at this age?',
    'How much should my baby be sleeping?',
    'Why does my baby cry so much in the evening?',
    'When will my baby start to smile?',
  ],
  early: [
    "Why won't my baby sleep through the night?",
    'When should I start tummy time?',
    "Is the 4-month sleep regression real?",
    'How do I know my baby is getting enough milk?',
  ],
  middle: [
    'When should I start solid foods?',
    'What foods should I introduce first?',
    'How do I help my baby learn to sit up?',
    'Is separation anxiety normal at this age?',
  ],
  late: [
    'How do I drop the morning nap?',
    'Should I be worried about a tantrum like this?',
    'When should I phase out the bottle?',
    'How do I handle a picky eater?',
  ],
}

function getSuggestions(ageInMonths) {
  if (ageInMonths < 4) return SUGGESTIONS_BY_AGE.newborn
  if (ageInMonths < 7) return SUGGESTIONS_BY_AGE.early
  if (ageInMonths < 13) return SUGGESTIONS_BY_AGE.middle
  return SUGGESTIONS_BY_AGE.late
}

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'
const CHAT_STORAGE_KEY = 'chatMessages'

function loadMessages() {
  try {
    const saved = localStorage.getItem(CHAT_STORAGE_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

export default function ChatScreen({ profile }) {
  const [messages, setMessages] = useState(loadMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)

  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)

  // Persist messages so they survive tab switches (each tab unmounts ChatScreen)
  // and full refreshes.
  useEffect(() => {
    try { localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)) } catch { /* quota */ }
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function sendMessage(text) {
    const userMessage = text || input.trim()
    if (!userMessage || loading) return

    setInput('')
    const updatedMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(updatedMessages)
    setLoading(true)

    try {
      const latestGrowth = loadLatestGrowth(profile)
      const recentJournal = await loadRecentJournalNotes(5)

      const res = await fetch(`${SERVER_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          profile: { ...profile, ageInMonths },
          context: { latestGrowth, recentJournal },
          history: updatedMessages.slice(-10),
        }),
      })

      const data = await res.json()
      const content = res.ok && data.reply
        ? data.reply
        : data.error || 'Something went wrong — please try again.'
      setMessages(prev => [...prev, { role: 'assistant', content }])
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Something went wrong — please check your connection and try again.',
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      backgroundColor: '#FAFAFA',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 20px 16px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <h1 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: '700', color: '#1a1a2e' }}>
          Ask anything
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
          Personalized for {profile.babyName}, {ageInMonths} month{ageInMonths === 1 ? '' : 's'} old
        </p>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
        {messages.length === 0 && (
          <div>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '16px', textAlign: 'center' }}>
              What's on your mind?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {getSuggestions(ageInMonths).map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid #E5E7EB',
                    backgroundColor: '#fff',
                    color: '#444',
                    fontSize: '14px',
                    textAlign: 'left',
                    cursor: 'pointer',
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: '12px',
          }}>
            <div style={{
              maxWidth: '80%',
              padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              backgroundColor: msg.role === 'user' ? '#7C3AED' : '#fff',
              color: msg.role === 'user' ? '#fff' : '#1a1a2e',
              fontSize: '14px',
              lineHeight: '1.6',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              color: '#888',
              fontSize: '14px',
            }}>
              Thinking...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px 24px',
        backgroundColor: '#fff',
        boxShadow: '0 -1px 4px rgba(0,0,0,0.07)',
        display: 'flex',
        gap: '8px',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder={`Ask about ${profile.babyName}...`}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: '24px',
            border: '1.5px solid #E5E7EB',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: '#FAFAFA',
          }}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: 'none',
            backgroundColor: input.trim() && !loading ? '#7C3AED' : '#E5E7EB',
            color: '#fff',
            fontSize: '18px',
            cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  )
}
