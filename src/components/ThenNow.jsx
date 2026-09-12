import { useState } from 'react'
import { isVideoType, isKeepsake } from '../data/journalStore'
import { nameAndAgeAt } from '../lib/babyAge'

const PICK_KEY = 'thenNowPick'

export function thenNowPhotos(entries) {
  return entries.filter(e => e.photoBlob && !isVideoType(e.photoType) && !isKeepsake(e))
}

function loadPick() {
  try { return JSON.parse(localStorage.getItem(PICK_KEY) || 'null') || {} } catch { return {} }
}

// Remember which photo she chose for a side; null clears it.
export function rememberThenNow(side, id) {
  const next = { ...loadPick(), [side]: id }
  try { localStorage.setItem(PICK_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

// The oldest and newest photo (not video, not keepsake card) in the journal,
// unless she picked a different one for either side. Any two photos will
// do — the slider is fun even on day one, and the gap grows on its own.
export function pickThenNow(entries) {
  const photos = thenNowPhotos(entries)
  if (photos.length < 2) return null
  const pick = loadPick()
  const byId = id => photos.find(p => p.id === id)
  let oldest = byId(pick.oldest) || photos[photos.length - 1] // entries arrive newest-first
  let newest = byId(pick.newest) || photos[0]
  if (oldest.id === newest.id) {
    // Both sides on one photo — fall back on the other side.
    newest = photos.find(p => p.id !== oldest.id) || newest
  }
  // "Then" is always the earlier one, whichever side she tapped.
  if (oldest.createdAt > newest.createdAt) [oldest, newest] = [newest, oldest]
  return { oldest, newest }
}

function shortDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Draggable then/now comparison: the newest photo underneath, the oldest
// clipped on top, split at the handle. The range input is a full-size
// invisible overlay so dragging works with touch, mouse, and keyboard.
// Tap a date tag to swap that side for another photo.
//   photos  — all candidate photos (for the swap picker)
//   onSwap  — (side: 'oldest' | 'newest', entryId) → parent re-picks the pair
export default function ThenNow({ pair, urls, profile, photos = [], onSwap }) {
  const [cut, setCut] = useState(50)
  const [choosing, setChoosing] = useState(null)   // 'oldest' | 'newest'
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
    padding: '4px 9px',
    borderRadius: '10px',
    border: 'none',
    cursor: onSwap ? 'pointer' : 'default',
    fontFamily: 'inherit',
    zIndex: 2,
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
        <span style={{ fontSize: '11px', color: '#aaa' }}>drag to compare · tap a date to swap</span>
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
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: newest.position || 'center' }} />
        <img src={thenUrl} alt="" draggable={false}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: oldest.position || 'center',
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
        <button onClick={() => onSwap && setChoosing('oldest')} aria-label="Change the then photo" style={{ ...tag, left: '10px' }}>
          {shortDate(oldest.createdAt)}{onSwap ? ' ▾' : ''}
        </button>
        <button onClick={() => onSwap && setChoosing('newest')} aria-label="Change the now photo" style={{ ...tag, right: '10px' }}>
          {shortDate(newest.createdAt)}{onSwap ? ' ▾' : ''}
        </button>
      </div>

      {profile?.dateOfBirth && (
        <p style={{ margin: '8px 2px 0', fontSize: '12px', color: '#888', textAlign: 'center' }}>
          {nameAndAgeAt(profile.babyName, profile.dateOfBirth, oldest.createdAt)} → {nameAndAgeAt(profile.babyName, profile.dateOfBirth, newest.createdAt)} 💜
        </p>
      )}

      {choosing && (
        <div
          onClick={() => setChoosing(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(30,27,75,0.45)', zIndex: 150,
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%', maxWidth: '480px', maxHeight: '70vh',
              background: '#faf9ff', borderRadius: '24px 24px 0 0',
              padding: '18px 18px calc(16px + env(safe-area-inset-bottom))',
              overflowY: 'auto', boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>
                {choosing === 'oldest' ? 'Pick the “then” photo' : 'Pick the “now” photo'}
              </h2>
              <button
                onClick={() => setChoosing(null)}
                aria-label="Close"
                style={{ border: 'none', background: '#ece9f6', borderRadius: '50%', width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px' }}>
              {photos.map(p => {
                const current = p.id === (choosing === 'oldest' ? oldest.id : newest.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => { onSwap(choosing, p.id); setChoosing(null) }}
                    style={{
                      aspectRatio: '4 / 5', borderRadius: '12px', overflow: 'hidden', position: 'relative',
                      border: current ? '2.5px solid #7C3AED' : 'none', padding: 0, cursor: 'pointer', background: '#e8e5f5',
                    }}
                  >
                    <img src={urls.get(p.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.position || 'center', display: 'block' }} />
                    <span style={{
                      position: 'absolute', left: 0, right: 0, bottom: 0, padding: '8px 4px 4px',
                      background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))',
                      color: '#fff', fontSize: '9px', fontWeight: 700,
                    }}>
                      {shortDate(p.createdAt)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
