import { useState } from 'react'
import { isVideoType, isKeepsake } from '../data/journalStore'
import { nameAndAgeAt } from '../lib/babyAge'

// The oldest and newest photo (not video, not keepsake card) in the journal.
// Any two photos will do — the slider is fun even on day one, and the gap
// grows on its own as the journal fills.
export function pickThenNow(entries) {
  const photos = entries.filter(e => e.photoBlob && !isVideoType(e.photoType) && !isKeepsake(e))
  if (photos.length < 2) return null
  const newest = photos[0] // entries arrive newest-first
  const oldest = photos[photos.length - 1]
  return { oldest, newest }
}

function shortDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Draggable then/now comparison: the newest photo underneath, the oldest
// clipped on top, split at the handle. The range input is a full-size
// invisible overlay so dragging works with touch, mouse, and keyboard.
export default function ThenNow({ pair, urls, profile }) {
  const [cut, setCut] = useState(50)
  const { oldest, newest } = pair
  const thenUrl = urls.get(oldest.id)
  const nowUrl = urls.get(newest.id)
  if (!thenUrl || !nowUrl) return null

  const tag = {
    position: 'absolute',
    bottom: '10px',
    fontSize: '10.5px',
    fontWeight: 700,
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    padding: '3px 9px',
    borderRadius: '10px',
    pointerEvents: 'none',
  }

  return (
    <section style={{ marginBottom: '26px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', margin: '0 2px 10px' }}>
        <span style={{
          fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: '#7C3AED',
        }}>
          Then ↔ now
        </span>
        <span style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.09)' }} />
        <span style={{ fontSize: '11px', color: '#aaa' }}>drag to compare</span>
      </div>

      <div style={{
        position: 'relative',
        height: '240px',
        borderRadius: '14px',
        overflow: 'hidden',
        backgroundColor: '#111',
        boxShadow: '0 2px 9px rgba(0,0,0,0.1)',
        userSelect: 'none',
      }}>
        <img src={nowUrl} alt="" draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        <img src={thenUrl} alt="" draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            clipPath: `inset(0 ${100 - cut}% 0 0)`,
          }} />
        <div style={{
          position: 'absolute', top: 0, bottom: 0, left: `${cut}%`, width: '3px',
          background: '#fff', boxShadow: '0 0 8px rgba(0,0,0,0.35)', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', top: '50%', left: `${cut}%`, transform: 'translate(-50%,-50%)',
          width: '34px', height: '34px', borderRadius: '50%', background: '#fff',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)', pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', color: '#7C3AED', fontWeight: 700,
        }}>
          ⟷
        </div>
        <span style={{ ...tag, left: '10px' }}>{shortDate(oldest.createdAt)}</span>
        <span style={{ ...tag, right: '10px' }}>{shortDate(newest.createdAt)}</span>
        <input
          type="range"
          min="4"
          max="96"
          value={cut}
          onChange={e => setCut(Number(e.target.value))}
          aria-label="Compare then and now photos"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            opacity: 0, cursor: 'ew-resize', margin: 0,
            WebkitAppearance: 'none', appearance: 'none',
          }}
        />
      </div>

      {profile?.dateOfBirth && (
        <p style={{ margin: '8px 2px 0', fontSize: '12px', color: '#888', textAlign: 'center' }}>
          {nameAndAgeAt(profile.babyName, profile.dateOfBirth, oldest.createdAt)} → {nameAndAgeAt(profile.babyName, profile.dateOfBirth, newest.createdAt)} 💜
        </p>
      )}
    </section>
  )
}
