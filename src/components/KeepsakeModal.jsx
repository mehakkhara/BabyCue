import { useEffect, useState } from 'react'
import { nameAndAgeAt } from '../lib/babyAge'
import { composeKeepsake, shareKeepsake, KEEPSAKE_THEMES } from '../lib/keepsakeCard'
import { addEntry, KEEPSAKE_KIND } from '../data/journalStore'

// Preview + share sheet for a keepsake card. Works from any journal photo:
// the headline starts as the entry's note and can be edited. Every card she
// shares or saves also lands in the journal as its own entry, so the cards
// have a home without needing their own screen.
//   photoUrl  — object URL of the source photo
//   title     — starting headline (entry note, prompt label…)
//   takenAt   — timestamp of the moment, for "{Name}, {age}" (defaults to now)
//   onSaved   — called with the new journal entry id after the card is stored
export default function KeepsakeModal({ photoUrl, title: initialTitle = '', takenAt, profile, onClose, onSaved }) {
  const [theme, setTheme] = useState('lavender')
  const [title, setTitle] = useState(cleanTitle(initialTitle))
  const [preview, setPreview] = useState(null) // { url, blob }
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')
  const [savedId, setSavedId] = useState(null)
  const [busy, setBusy] = useState(false)

  const when = takenAt || Date.now()
  const dateLabel = new Date(when).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  const subtitle = profile?.dateOfBirth
    ? `${nameAndAgeAt(profile.babyName, profile.dateOfBirth, when)} · ${dateLabel}`
    : dateLabel

  const headline = title.trim() || 'A little moment'

  // Recompose on every change; the canvas work is near-instant at this size.
  useEffect(() => {
    let cancelled = false
    let url = null
    setError('')
    setSavedId(null)   // an edited card is a new card
    setOutcome('')
    const t = setTimeout(() => {
      composeKeepsake({ photoUrl, title: headline, subtitle, theme })
        .then(blob => {
          if (cancelled) return
          url = URL.createObjectURL(blob)
          setPreview({ url, blob })
        })
        .catch(() => { if (!cancelled) setError('Could not build the card from this photo.') })
    }, 150)
    return () => {
      cancelled = true
      clearTimeout(t)
      if (url) URL.revokeObjectURL(url)
    }
  }, [photoUrl, headline, subtitle, theme])

  async function saveToJournal() {
    if (savedId) return savedId
    const id = await addEntry({
      note: headline,
      kind: KEEPSAKE_KIND,
      photoBlob: preview.blob,
      photoType: 'image/jpeg',
      width: 1080,
      height: 1350,
    })
    setSavedId(id)
    onSaved?.(id)
    return id
  }

  async function handleShare() {
    if (!preview || busy) return
    setBusy(true)
    try {
      await saveToJournal()
      const result = await shareKeepsake(preview.blob, headline)
      if (result === 'shared') setOutcome('Shared, and saved to the journal 💜')
      if (result === 'downloaded') setOutcome('Saved to the journal and your downloads 💜')
      if (result === 'cancelled') setOutcome('Saved to the journal 💜')
    } catch (err) {
      console.error('Keepsake save failed', err)
      setError(err?.name === 'QuotaExceededError'
        ? "There's no room left on this device to save the card."
        : 'Could not save the card. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveOnly() {
    if (!preview || busy) return
    setBusy(true)
    try {
      await saveToJournal()
      setOutcome('Saved to the journal 💜')
    } catch (err) {
      console.error('Keepsake save failed', err)
      setError('Could not save the card. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(30,27,75,0.45)', zIndex: 150,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px', maxHeight: '92vh',
          background: '#faf9ff', borderRadius: '24px 24px 0 0',
          padding: '20px 18px calc(20px + env(safe-area-inset-bottom))',
          overflowY: 'auto', boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e1b4b' }}>
            🎞 Keepsake card
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              border: 'none', background: '#ece9f6', borderRadius: '50%',
              width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer',
              color: '#6b7280', lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {error ? (
          <p style={{
            fontSize: '13px', color: '#b91c1c', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px',
          }}>
            {error}
          </p>
        ) : (
          <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', background: '#e8e5f5', aspectRatio: '4 / 5' }}>
            {preview && (
              <img src={preview.url} alt="Keepsake card preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            )}
          </div>
        )}

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's the moment?"
          maxLength={90}
          aria-label="Card headline"
          style={{
            width: '100%', padding: '11px 12px', borderRadius: '10px',
            border: '1.5px solid #ddd6fe', background: '#fff', fontSize: '14px',
            fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
            color: '#1e1b4b', marginBottom: '12px',
          }}
        />

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
          {KEEPSAKE_THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              aria-label={`${t.label} theme`}
              style={{
                width: '32px', height: '32px', borderRadius: '50%',
                border: theme === t.id ? '2.5px solid #1e1b4b' : '2.5px solid transparent',
                background: t.swatch, cursor: 'pointer', padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={handleShare}
          disabled={!preview || busy}
          style={{
            width: '100%', padding: '13px', borderRadius: '12px', border: 'none',
            background: preview && !busy ? 'linear-gradient(135deg, #7C6FF7, #a78bfa)' : '#c4b5fd',
            color: '#fff', fontSize: '14px', fontWeight: '600',
            cursor: preview && !busy ? 'pointer' : 'wait', fontFamily: 'inherit',
          }}
        >
          {busy ? 'One moment…' : 'Share the moment'}
        </button>
        <button
          onClick={handleSaveOnly}
          disabled={!preview || busy || Boolean(savedId)}
          style={{
            width: '100%', marginTop: '8px', padding: '10px', borderRadius: '12px',
            border: 'none', background: 'none',
            color: savedId ? '#15803d' : '#7C6FF7', fontSize: '13px', fontWeight: '600',
            cursor: savedId ? 'default' : 'pointer', fontFamily: 'inherit',
          }}
        >
          {savedId ? '✓ In the journal' : 'Just save to the journal'}
        </button>
        {outcome && (
          <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
            {outcome}
          </p>
        )}
      </div>
    </div>
  )
}

// Journal notes carry small prefixes ("📸 Photo hunt: …") that don't belong
// on a card.
function cleanTitle(text) {
  return String(text || '').replace(/^📸\s*Photo hunt:\s*/i, '').trim()
}
