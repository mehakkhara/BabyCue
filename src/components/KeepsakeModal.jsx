import { useState } from 'react'
import { nameAndAgeAt } from '../lib/babyAge'
import { composeKeepsake, shareKeepsake, KEEPSAKE_THEMES } from '../lib/keepsakeCard'
import { addEntry, KEEPSAKE_KIND } from '../data/journalStore'
import { CropFrame } from './PhotoShape'

// Preview + share sheet for a keepsake card. Works from any journal photo:
// the headline starts as the entry's note and can be edited. Every card she
// shares or saves also lands in the journal as its own entry, so the cards
// have a home without needing their own screen.
//   photoUrl  — object URL of the source photo
//   title     — starting headline (entry note, prompt label…)
//   takenAt   — timestamp of the moment, for "{Name}, {age}" (defaults to now)
//   position  — the crop she chose for the entry; she can drag it again here
//   onSaved   — called with the new journal entry id after the card is stored
const CARD_RATIO = 4 / 5

// The preview is the live photo in a drag frame with the card's text drawn
// over it in CSS; the real 1080×1350 JPEG is composed only when she shares or
// saves, from the same position.
const PREVIEW_THEMES = {
  lavender: { overlay: '30,27,75',  accent: '#dcd6ff', badge: '#7C6FF7' },
  sunset:   { overlay: '157,23,77', accent: '#fde68a', badge: '#db2777' },
  midnight: { overlay: '4,6,20',    accent: '#e8b13d', badge: '#1e1b4b' },
}

export default function KeepsakeModal({ photoUrl, title: initialTitle = '', takenAt, position: initialPosition, profile, onClose, onSaved }) {
  const [theme, setTheme] = useState('lavender')
  const [title, setTitle] = useState(String(initialTitle || '').trim())
  const [position, setPosition] = useState(initialPosition || '50% 50%')
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')
  const [saved, setSaved] = useState(null)   // { id, key } — key is what was saved, so an edit makes a new card
  const [busy, setBusy] = useState(false)

  const when = takenAt || Date.now()
  const dateLabel = new Date(when).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  const subtitle = profile?.dateOfBirth
    ? `${nameAndAgeAt(profile.babyName, profile.dateOfBirth, when)} · ${dateLabel}`
    : dateLabel

  const headline = title.trim() || 'A little moment'
  const cardKey = `${headline}|${subtitle}|${theme}|${position}`
  const alreadySaved = saved?.key === cardKey
  const look = PREVIEW_THEMES[theme] || PREVIEW_THEMES.lavender

  async function compose() {
    return composeKeepsake({ photoUrl, title: headline, subtitle, theme, position })
  }

  async function saveToJournal(blob) {
    if (alreadySaved) return saved.id
    const id = await addEntry({
      note: headline,
      kind: KEEPSAKE_KIND,
      photoBlob: blob,
      photoType: 'image/jpeg',
      width: 1080,
      height: 1350,
      createdAt: when,
    })
    setSaved({ id, key: cardKey })
    onSaved?.(id)
    return id
  }

  function failed(err) {
    console.error('Keepsake save failed', err)
    setError(err?.name === 'QuotaExceededError'
      ? "There's no room left on this device to save the card."
      : 'Could not build or save the card. Please try again.')
  }

  async function handleShare() {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const blob = await compose()
      await saveToJournal(blob)
      const result = await shareKeepsake(blob, headline)
      if (result === 'shared') setOutcome('Shared, and saved to the journal 💜')
      if (result === 'downloaded') setOutcome('Saved to the journal and your downloads 💜')
      if (result === 'cancelled') setOutcome('Saved to the journal 💜')
    } catch (err) {
      failed(err)
    } finally {
      setBusy(false)
    }
  }

  async function handleSaveOnly() {
    if (busy || alreadySaved) return
    setBusy(true)
    setError('')
    try {
      const blob = await compose()
      await saveToJournal(blob)
      setOutcome('Saved to the journal 💜')
    } catch (err) {
      failed(err)
    } finally {
      setBusy(false)
    }
  }

  const btn = {
    flex: 1, padding: '13px 10px', borderRadius: '12px', border: 'none',
    fontSize: '14px', fontWeight: '600', fontFamily: 'inherit', cursor: busy ? 'wait' : 'pointer',
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
          padding: '18px 18px calc(16px + env(safe-area-inset-bottom))',
          overflowY: 'auto', boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
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

        {/* Headline first, so the card preview is the last thing before the buttons. */}
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
            color: '#1e1b4b', marginBottom: '10px',
          }}
        />

        {/* Theme, by name */}
        <div style={{ display: 'flex', gap: '6px', background: '#ece9f6', borderRadius: '12px', padding: '3px', marginBottom: '10px' }}>
          {KEEPSAKE_THEMES.map(t => {
            const on = theme === t.id
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                aria-pressed={on}
                style={{
                  flex: 1, padding: '7px 6px', borderRadius: '9px', border: 'none',
                  background: on ? '#fff' : 'transparent',
                  boxShadow: on ? '0 2px 8px rgba(100,100,180,0.12)' : 'none',
                  color: on ? '#1e1b4b' : '#6b7280', fontSize: '12.5px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                }}
              >
                <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: t.swatch, flexShrink: 0 }} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Card preview: drag the photo to choose what the card shows. */}
        <div style={{ borderRadius: '16px', overflow: 'hidden', marginBottom: '12px', background: '#e8e5f5', position: 'relative' }}>
          <CropFrame url={photoUrl} ratio={CARD_RATIO} position={position} onChange={setPosition} hint={false} />
          <span style={{
            position: 'absolute', top: '10px', left: '10px', pointerEvents: 'none',
            fontSize: '10px', fontWeight: 700, color: '#fff',
            background: 'rgba(0,0,0,0.45)', borderRadius: '999px', padding: '3px 9px',
          }}>
            Drag to adjust
          </span>
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(to bottom, rgba(${look.overlay},0) 38%, rgba(${look.overlay},0.92) 100%)`,
          }} />
          <span style={{
            position: 'absolute', top: '10px', right: '10px', pointerEvents: 'none',
            background: 'rgba(255,255,255,0.88)', color: look.badge,
            fontSize: '9.5px', fontWeight: 700, borderRadius: '999px', padding: '4px 9px',
          }}>
            ✦ BabyCue
          </span>
          <div style={{ position: 'absolute', left: '16px', right: '16px', bottom: '16px', pointerEvents: 'none' }}>
            <div style={{
              fontFamily: "Georgia, 'Times New Roman', serif", fontWeight: 700, color: '#fff',
              fontSize: '20px', lineHeight: 1.2,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {headline}
            </div>
            <div style={{ marginTop: '6px', fontSize: '10.5px', fontWeight: 500, color: look.accent }}>{subtitle}</div>
          </div>
        </div>

        {error && (
          <p style={{
            margin: '0 0 10px', fontSize: '13px', color: '#b91c1c', background: '#fef2f2',
            border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px',
          }}>
            {error}
          </p>
        )}

        {/* Both actions in view, side by side. */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSaveOnly}
            disabled={busy || alreadySaved}
            style={{
              ...btn, flex: 1,
              background: '#fff', border: '1.5px solid #ddd6fe',
              color: alreadySaved ? '#15803d' : '#6d28d9',
              cursor: alreadySaved ? 'default' : btn.cursor,
            }}
          >
            {alreadySaved ? '✓ In the journal' : 'Save to journal'}
          </button>
          <button
            onClick={handleShare}
            disabled={busy}
            style={{
              ...btn, flex: 1.4,
              background: busy ? '#c4b5fd' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
              color: '#fff',
            }}
          >
            {busy ? 'One moment…' : 'Share the moment'}
          </button>
        </div>
        {outcome && (
          <p style={{ margin: '8px 0 0', fontSize: '12.5px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
            {outcome}
          </p>
        )}
      </div>
    </div>
  )
}
