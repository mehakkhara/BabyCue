import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState('idle') // idle | sending | sent | error
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    setPhase('sending')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    })

    if (error) {
      setPhase('error')
      setErrorMsg(error.message || 'Could not send the magic link. Please try again.')
    } else {
      setPhase('sent')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #f5f3ff 0%, #ede8ff 50%, #dce8f8 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '32px 24px',
        width: '100%',
        maxWidth: '380px',
        boxShadow: '0 10px 40px rgba(100,100,180,0.15)',
      }}>
        <h1 style={{
          margin: '0 0 6px',
          fontSize: '24px',
          fontWeight: '700',
          color: '#1e1b4b',
          textAlign: 'center',
        }}>
          Welcome to BabyCue
        </h1>
        <p style={{
          margin: '0 0 24px',
          fontSize: '14px',
          color: '#6b7280',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Sign in to keep your baby's profile and chats safe across devices.
        </p>

        {phase === 'sent' ? (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: '14px',
            padding: '16px',
            color: '#065f46',
            fontSize: '14px',
            lineHeight: 1.5,
            textAlign: 'center',
          }}>
            Check <strong>{email}</strong> — we sent a sign-in link. Tap it on this device to continue.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '700',
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: '6px',
            }}>
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={phase === 'sending'}
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '12px 14px',
                fontSize: '15px',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: '14px',
              }}
            />

            {phase === 'error' && (
              <p style={{
                margin: '0 0 12px',
                fontSize: '13px',
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '10px 12px',
              }}>
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={phase === 'sending' || !email.trim()}
              style={{
                width: '100%',
                padding: '13px',
                background: phase === 'sending' || !email.trim()
                  ? '#c4b5fd'
                  : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: phase === 'sending' || !email.trim() ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(124,111,247,0.3)',
              }}
            >
              {phase === 'sending' ? 'Sending link…' : 'Send magic link'}
            </button>
          </form>
        )}

        <p style={{
          margin: '20px 0 0',
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          We'll email a one-tap sign-in link. No password to remember.
        </p>
      </div>
    </div>
  )
}
