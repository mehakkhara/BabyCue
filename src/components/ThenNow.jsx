import { useEffect, useRef, useState } from 'react'
import { parsePosition, formatPosition } from './PhotoShape'
import { isVideoType, isAudioType, isKeepsake } from '../data/journalStore'
import { nameAndAgeAt } from '../lib/babyAge'

const PICK_KEY = 'thenNowPick'

export function thenNowPhotos(entries) {
  return entries.filter(e => e.photoBlob && !isVideoType(e.photoType) && !isAudioType(e.photoType) && !isKeepsake(e))
}

function loadPick() {
  try { return JSON.parse(localStorage.getItem(PICK_KEY) || 'null') || {} } catch { return {} }
}

function savePick(next) {
  try { localStorage.setItem(PICK_KEY, JSON.stringify(next)) } catch { /* ignore */ }
}

// Remember which photo she chose for a side; null clears it.
export function rememberThenNow(side, id) {
  savePick({ ...loadPick(), [side]: id })
}

// How a photo is framed in the comparison: { position, zoom }. Kept here, not
// on the journal entry, because lining two faces up is a Then ↔ now concern
// and the journal tile should not move with it.
function frameFor(id) {
  return loadPick().frame?.[id] || { position: '50% 50%', zoom: 1 }
}
function rememberFrame(id, frame) {
  const pick = loadPick()
  savePick({ ...pick, frame: { ...(pick.frame || {}), [id]: frame } })
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
// clipped on top, split at the handle. Drag the handle to compare. Drag a
// photo to move it and pinch (or scroll) to zoom it, so the two faces can be
// lined up across the split; the framing saves itself on release. Tap a date
// tag to swap that side for another photo.
//   photos  — all candidate photos (for the swap picker)
//   onSwap  — (side: 'oldest' | 'newest', entryId) → parent re-picks the pair
export default function ThenNow({ pair, urls, profile, photos = [], onSwap }) {
  const [cut, setCut] = useState(50)
  const [choosing, setChoosing] = useState(null)   // 'oldest' | 'newest'
  const [live, setLive] = useState(null)           // { side, position, zoom } mid-gesture
  const [frameVersion, setFrameVersion] = useState(0)
  const frameRef = useRef(null)
  const natural = useRef({})                 // entry id → { w, h } once loaded
  const pointers = useRef(new Map())         // active pointers (one = drag, two = pinch)
  const gesture = useRef(null)               // { side, x, y, zoom, dist, startX, startY }
  const liveRef = useRef(null)
  liveRef.current = live
  const cutRef = useRef(cut)
  cutRef.current = cut
  const { oldest, newest } = pair
  const thenUrl = urls.get(oldest.id)
  const nowUrl = urls.get(newest.id)

  // Scroll-to-zoom has to be a non-passive listener, or the page scrolls instead.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const onWheel = e => {
      const box = el.getBoundingClientRect()
      const side = (e.clientX - box.left) / box.width * 100 < cutRef.current ? 'oldest' : 'newest'
      const entry = side === 'oldest' ? oldest : newest
      const cur = liveRef.current?.side === side ? liveRef.current : { side, ...frameFor(entry.id) }
      const zoom = Math.max(1, Math.min(3, cur.zoom * (e.deltaY < 0 ? 1.04 : 0.96)))
      e.preventDefault()
      rememberFrame(entry.id, { position: cur.position, zoom })
      setLive({ side, position: cur.position, zoom })
      setFrameVersion(v => v + 1)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [oldest, newest])

  if (!thenUrl || !nowUrl) return null
  void frameVersion

  const HANDLE_W = 28   // px either side of the split that drags the handle rather than a photo
  function entryFor(side) { return side === 'oldest' ? oldest : newest }
  function frameStyle(side) {
    const f = live?.side === side ? live : frameFor(entryFor(side).id)
    return { objectPosition: f.position, transform: f.zoom !== 1 ? `scale(${f.zoom})` : undefined, transformOrigin: f.position }
  }
  function overflow(side, zoom) {
    const nat = natural.current[entryFor(side).id]
    const box = frameRef.current?.getBoundingClientRect()
    if (!nat || !box) return { x: 0, y: 0 }
    const scale = Math.max(box.width / nat.w, box.height / nat.h) * zoom
    return { x: Math.max(0, nat.w * scale - box.width), y: Math.max(0, nat.h * scale - box.height) }
  }
  const clamp01 = n => Math.max(0, Math.min(100, n))
  function pinchDist() {
    const [a, b] = [...pointers.current.values()]
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0
  }
  function beginGesture(side, startX, startY) {
    const cur = liveRef.current?.side === side ? liveRef.current : { side, ...frameFor(entryFor(side).id) }
    const pos = parsePosition(cur.position)
    gesture.current = { side, x: pos.x, y: pos.y, zoom: cur.zoom, dist: pinchDist(), startX, startY }
    setLive({ side, position: cur.position, zoom: cur.zoom })
  }
  function cutFromX(clientX) {
    const box = frameRef.current.getBoundingClientRect()
    return Math.max(4, Math.min(96, ((clientX - box.left) / box.width) * 100))
  }
  function onPointerDown(e) {
    if (e.target.tagName === 'BUTTON') return
    const box = frameRef.current.getBoundingClientRect()
    const xPct = ((e.clientX - box.left) / box.width) * 100
    // Near the split: this drag moves the handle, not a photo.
    if (!gesture.current && Math.abs(xPct - cut) * box.width / 100 <= HANDLE_W) {
      e.currentTarget.setPointerCapture?.(e.pointerId)
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      gesture.current = { kind: 'slider' }
      return
    }
    const side = xPct < cut ? 'oldest' : 'newest'
    if (gesture.current && gesture.current.side !== side && pointers.current.size) return   // second finger on the other half: ignore
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    beginGesture(side, e.clientX, e.clientY)
  }
  function onPointerMove(e) {
    const g = gesture.current
    if (!g || !pointers.current.has(e.pointerId)) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (g.kind === 'slider') { setCut(cutFromX(e.clientX)); return }
    if (pointers.current.size >= 2 && g.dist > 0) {
      const zoom = Math.max(1, Math.min(3, g.zoom * (pinchDist() / g.dist)))
      setLive(l => ({ ...l, zoom }))
      return
    }
    const zoom = liveRef.current?.zoom ?? g.zoom
    const over = overflow(g.side, zoom)
    // Finger right reveals more of the left edge, so the percentage falls.
    const nx = over.x > 0 ? g.x - ((e.clientX - g.startX) / over.x) * 100 : g.x
    const ny = over.y > 0 ? g.y - ((e.clientY - g.startY) / over.y) * 100 : g.y
    setLive(l => ({ ...l, position: formatPosition({ x: clamp01(nx), y: clamp01(ny) }) }))
  }
  function onPointerUp(e) {
    if (!pointers.current.has(e.pointerId)) return
    pointers.current.delete(e.pointerId)
    e.currentTarget.releasePointerCapture?.(e.pointerId)
    if (gesture.current?.kind === 'slider') { if (!pointers.current.size) gesture.current = null; return }
    const l = liveRef.current
    if (!l) return
    if (pointers.current.size) {
      // One finger left after a pinch: carry on dragging from here.
      const rest = [...pointers.current.values()][0]
      const pos = parsePosition(l.position)
      gesture.current = { side: l.side, x: pos.x, y: pos.y, zoom: l.zoom, dist: 0, startX: rest.x, startY: rest.y }
      return
    }
    rememberFrame(entryFor(l.side).id, { position: l.position, zoom: l.zoom })
    gesture.current = null
    setLive(null)
    setFrameVersion(v => v + 1)
  }
  function resetFrame(side) {
    rememberFrame(entryFor(side).id, { position: '50% 50%', zoom: 1 })
    setFrameVersion(v => v + 1)
    setChoosing(null)
  }

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
    zIndex: 3,
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
        <span style={{ fontSize: '11px', color: '#aaa' }}>tap a date to swap</span>
      </div>

      <div
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{
          position: 'relative',
          height: '240px',
          borderRadius: '14px',
          overflow: 'hidden',
          backgroundColor: '#111',
          boxShadow: '0 2px 9px rgba(0,0,0,0.1)',
          userSelect: 'none', WebkitUserSelect: 'none',
          touchAction: 'none',
          cursor: live ? 'grabbing' : 'grab',
        }}
      >
        <img src={nowUrl} alt="" draggable={false}
          onLoad={e => { natural.current[newest.id] = { w: e.target.naturalWidth, h: e.target.naturalHeight } }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...frameStyle('newest'), pointerEvents: 'none' }} />
        {/* The clip lives on a wrapper so zooming the photo never moves the split. */}
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - cut}% 0 0)`, overflow: 'hidden', pointerEvents: 'none' }}>
          <img src={thenUrl} alt="" draggable={false}
            onLoad={e => { natural.current[oldest.id] = { w: e.target.naturalWidth, h: e.target.naturalHeight } }}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...frameStyle('oldest') }} />
        </div>
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
        {/* Keyboard access to the split; pointer drags are handled on the card. */}
        <div
          role="slider"
          tabIndex={0}
          aria-label="Compare then and now photos"
          aria-valuemin={4}
          aria-valuemax={96}
          aria-valuenow={Math.round(cut)}
          onKeyDown={e => {
            if (e.key === 'ArrowLeft') setCut(c => Math.max(4, c - 2))
            if (e.key === 'ArrowRight') setCut(c => Math.min(96, c + 2))
          }}
          style={{
            position: 'absolute', top: '50%', left: `${cut}%`, transform: 'translate(-50%,-50%)',
            width: '34px', height: '34px', borderRadius: '50%', outline: 'none', zIndex: 2, cursor: 'ew-resize',
          }}
        />
        {!live && (
          <span style={{
            position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
            fontSize: '10px', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.45)',
            borderRadius: '999px', padding: '3px 9px', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 3,
          }}>
            Drag a photo to line it up · pinch to zoom
          </span>
        )}
        {live && (
          <span style={{ ...tag, bottom: 'auto', top: '10px', left: '50%', transform: 'translateX(-50%)', cursor: 'default' }}>
            {live.zoom.toFixed(1)}×
          </span>
        )}
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
            <button
              onClick={() => resetFrame(choosing)}
              style={{
                width: '100%', marginBottom: '12px', padding: '11px 12px', borderRadius: '12px', border: '1.5px dashed #c4b5fd',
                background: '#f5f3ff', color: '#6d28d9', fontSize: '13px', fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
              }}
            >
              Reset this photo's framing
            </button>
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
