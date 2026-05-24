import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  // Default to 'signin' — most visits are returning users. First-time visitors
  // can flip to 'signup' via the toggle below the form.
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phase, setPhase] = useState('idle') // 'idle' | 'submitting' | 'magicLinkSent' | 'confirmEmail' | 'error'
  const [errorMsg, setErrorMsg] = useState('')

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) return

    setPhase('submitting')
    setErrorMsg('')

    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      })
      if (error) {
        setPhase('error')
        setErrorMsg(error.message || 'Could not sign in. Please try again.')
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      })
      if (error) {
        setPhase('error')
        setErrorMsg(error.message || 'Could not create account. Please try again.')
      } else if (!data.session) {
        // No session on signUp means Supabase has "Confirm email" ON — user must
        // click the verification email before signInWithPassword will work.
        setPhase('confirmEmail')
      }
    }
  }

  async function handleMagicLink() {
    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setPhase('error')
      setErrorMsg('Enter your email first.')
      return
    }
    setPhase('submitting')
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: window.location.origin + window.location.pathname },
    })
    if (error) {
      setPhase('error')
      setErrorMsg(error.message || 'Could not send the magic link. Please try again.')
    } else {
      setPhase('magicLinkSent')
    }
  }

  function toggleMode() {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'))
    setErrorMsg('')
    setPhase('idle')
  }

  const submitting = phase === 'submitting'
  const passwordSubmitDisabled = submitting || !email.trim() || !password
  const magicLinkDisabled = submitting
  const primaryLabel = mode === 'signin' ? 'Sign in' : 'Create account'
  const submittingLabel = mode === 'signin' ? 'Signing in…' : 'Creating account…'

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    outline: 'none',
    boxSizing: 'border-box',
    marginBottom: '12px',
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
          Age-aware, evidence-based tips for your baby's exact month.
        </p>

        {phase === 'magicLinkSent' ? (
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
        ) : phase === 'confirmEmail' ? (
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
            Account created! Check <strong>{email}</strong> to confirm your address, then come back to sign in.
          </div>
        ) : (
          <>
            <form onSubmit={handlePasswordSubmit}>
              <input
                type="email"
                required
                autoFocus
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                placeholder="Email"
                style={inputStyle}
              />

              <input
                type="password"
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                placeholder="Password"
                style={inputStyle}
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
                disabled={passwordSubmitDisabled}
                style={{
                  width: '100%',
                  padding: '13px',
                  background: passwordSubmitDisabled
                    ? '#c4b5fd'
                    : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  cursor: passwordSubmitDisabled ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(124,111,247,0.3)',
                }}
              >
                {submitting ? submittingLabel : primaryLabel}
              </button>
            </form>

            <button
              type="button"
              onClick={toggleMode}
              style={{
                width: '100%',
                marginTop: '12px',
                padding: 0,
                background: 'none',
                border: 'none',
                fontSize: '13px',
                color: '#6b7280',
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              {mode === 'signin'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '20px 0 14px',
              color: '#9ca3af',
              fontSize: '12px',
            }}>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
              <span>or</span>
              <div style={{ flex: 1, height: 1, background: '#e5e7eb' }} />
            </div>

            <button
              type="button"
              onClick={handleMagicLink}
              disabled={magicLinkDisabled}
              style={{
                width: '100%',
                padding: '12px',
                background: '#fff',
                color: '#7C6FF7',
                border: '1px solid #ddd6fe',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: magicLinkDisabled ? 'not-allowed' : 'pointer',
              }}
            >
              Email me a sign-in link instead
            </button>
          </>
        )}

        <p style={{
          margin: '20px 0 0',
          fontSize: '11px',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Your data stays private and is never shared.
        </p>
      </div>
    </div>
  )
}
