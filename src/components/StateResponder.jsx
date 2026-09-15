// The "why might baby be X" answer: likely causes for this age, one thing to
// try for each, and the red-flag line. Rendered inline on the Mood screen.
import { useState } from 'react'
import { getStateResponse } from '../data/babyStates'
import { markHelped, timesHelped } from '../lib/babyPatterns'
import { markCheckIn } from '../lib/streak'
import { personalize } from '../lib/pronouns'
import { color, shadow } from '../theme'

export default function StateResponder({ stateKey, ageInMonths, profile, onCheckIn }) {
  const [helpedCause, setHelpedCause] = useState(null)
  const [tried, setTried] = useState([])
  const [reflection, setReflection] = useState(null)

  const r = getStateResponse(stateKey, ageInMonths)
  if (!r) return null
  const babyName = (profile?.babyName || '').trim() || 'your baby'
  const positive = r.tone === 'positive'

  function toggleTried(cause) {
    setTried(prev => prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause])
  }

  function handleHelped(cause) {
    const prior = timesHelped(stateKey, cause)
    setHelpedCause(cause)
    markHelped(stateKey, cause)
    onCheckIn?.(markCheckIn('feeling'))
    setReflection(prior >= 1 ? `💜 This often helps ${babyName} — good to remember.` : null)
  }

  return (
    <div>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: color.primarySoft, fontWeight: 600 }}>
        {positive ? "What's blooming right now" : 'Common at this age'} · {r.bandLabel}
        {!positive && tried.length > 0 && <span style={{ color: color.lavender }}> · {tried.length} of {r.reasons.length} tried</span>}
      </p>

      {r.reasons.map(reason => {
        const wasHelp = helpedCause === reason.cause
        const isTried = tried.includes(reason.cause)
        const dimmed = isTried && !wasHelp
        return (
          <div key={reason.cause} style={{
            background: wasHelp ? color.successBg : color.surface,
            border: wasHelp ? '1.5px solid #86efac' : '1.5px solid transparent',
            borderRadius: '16px', padding: '14px 16px', marginBottom: '10px',
            boxShadow: shadow.card, opacity: dimmed ? 0.55 : 1, transition: 'opacity 0.15s',
          }}>
            <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: color.ink, textDecoration: dimmed ? 'line-through' : 'none' }}>
              {personalize(reason.cause, profile)}
            </p>
            <p style={{ margin: positive ? 0 : '0 0 10px', fontSize: '13px', lineHeight: 1.6, color: color.muted }}>
              {personalize(reason.action, profile)}
            </p>
            {!positive && (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => handleHelped(reason.cause)} disabled={wasHelp} style={{
                  border: 'none', background: wasHelp ? 'transparent' : color.tintLight,
                  color: wasHelp ? color.success : color.primary, borderRadius: '8px',
                  padding: wasHelp ? 0 : '5px 10px', fontSize: '12px', fontWeight: 600,
                  cursor: wasHelp ? 'default' : 'pointer', fontFamily: 'inherit',
                }}>
                  {wasHelp ? '💜 Glad this helped' : 'This helped'}
                </button>
                {!wasHelp && (
                  <button onClick={() => toggleTried(reason.cause)} style={{
                    border: 'none', background: 'transparent', color: isTried ? color.primarySoft : '#c4c4d4',
                    fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '5px 4px', fontFamily: 'inherit',
                  }}>
                    {isTried ? '↩︎ Not yet' : 'Tried it'}
                  </button>
                )}
              </div>
            )}
            {wasHelp && reflection && (
              <p style={{ margin: '8px 0 0', fontSize: '12px', color: color.success, fontWeight: 600 }}>{reflection}</p>
            )}
          </div>
        )
      })}

      {positive ? (
        <div style={{ background: '#fdf4ff', border: '1px solid #f5d0fe', borderRadius: '14px', padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: '#a21caf' }}>{r.positiveNote}</p>
        </div>
      ) : r.redFlag ? (
        <div style={{ background: color.warnBg, border: `1px solid ${color.warnBorder}`, borderRadius: '14px', padding: '12px 14px' }}>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: color.warn }}>
            <strong>When to call the doctor:</strong> {personalize(r.redFlag, profile)}
          </p>
        </div>
      ) : null}
    </div>
  )
}
