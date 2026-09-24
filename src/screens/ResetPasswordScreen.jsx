import { useState } from 'react'
import { supabase } from '../lib/supabase'

// Shown right after someone taps the link in a "reset your password" email.
// Supabase has already signed them in from that link; this just asks for the
// replacement password and saves it. Same look as AuthScreen so it feels like
// the last step of signing in rather than a new place.
export default function ResetPasswordScreen({ onDone }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    setError('')
    const { error: err } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (err) {
      setError(err.message || 'Could not update password. Please try again.')
      return
    }
    setSaved(true)
    setTimeout(onDone, 1200)
  }

  const disabled = busy || !password || !confirm

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
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: '700', color: '#1e1b4b', textAlign: 'center' }}>
          Choose a new password
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#6b7280', textAlign: 'center', lineHeight: 1.5 }}>
          You're signed in from the email link. Pick the password you'll use from now on.
        </p>

        {saved ? (
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
            Password updated. Taking you in…
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input
              type="password"
              required
              autoFocus
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={busy}
              placeholder="New password"
              style={inputStyle}
            />
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={busy}
              placeholder="Confirm new password"
              style={inputStyle}
            />

            {error && (
              <p style={{
                margin: '0 0 12px',
                fontSize: '13px',
                color: '#b91c1c',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                padding: '10px 12px',
              }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={disabled}
              style={{
                width: '100%',
                padding: '13px',
                background: disabled ? '#c4b5fd' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(124,111,247,0.3)',
              }}
            >
              {busy ? 'Saving…' : 'Save new password'}
            </button>

            <button
              type="button"
              onClick={onDone}
              disabled={busy}
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
              Not now, keep my current password
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
