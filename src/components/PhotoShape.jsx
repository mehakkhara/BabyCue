import { useRef, useState } from 'react'
import { isVideoType } from '../data/journalStore'

// Cards take the photo's shape. A tall phone photo makes a tall card, a wide
// one a shorter card — but never taller than 4:5 (portrait) or wider than
// 16:9, so one photo can't swallow the screen.
const MIN_RATIO = 4 / 5
const MAX_RATIO = 16 / 9
export const TILE_RATIO = 4 / 5

export function clampRatio(width, height) {
  if (!width || !height) return null
  return Math.min(MAX_RATIO, Math.max(MIN_RATIO, width / height))
}

// A photo/video in a box that matches its shape.
//   ratio: fixed width/height ratio; omit to use the media's own (clamped)
//   entry: { width, height, fit, position } display hints saved with it
export function ShapedMedia({ url, type, entry = {}, ratio, style, mediaStyle }) {
  const [measured, setMeasured] = useState(null)
  const known = clampRatio(entry.width, entry.height) ?? measured
  const box = ratio ?? known ?? 4 / 3
  const fit = entry.fit === 'contain' ? 'contain' : 'cover'
  const position = entry.position || 'center'
  const video = isVideoType(type)

  const inner = {
    position: 'absolute', inset: 0, width: '100%', height: '100%',
    objectFit: fit, objectPosition: position, display: 'block',
    ...mediaStyle,
  }

  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: String(box),
      background: fit === 'contain' || video ? '#1a1a2e' : '#f3f4f6',
      overflow: 'hidden',
      ...style,
    }}>
      {url && (video
        ? <video
            src={url} muted playsInline preload="metadata" style={inner}
            onLoadedMetadata={e => setMeasured(clampRatio(e.target.videoWidth, e.target.videoHeight))}
          />
        : <img
            src={url} alt="" style={inner}
            onLoad={e => setMeasured(clampRatio(e.target.naturalWidth, e.target.naturalHeight))}
          />
      )}
    </div>
  )
}

// object-position as numbers. Accepts "50% 30%" and the old keywords.
export function parsePosition(value) {
  const named = { top: [50, 0], center: [50, 50], bottom: [50, 100], left: [0, 50], right: [100, 50] }
  if (!value) return { x: 50, y: 50 }
  if (named[value]) return { x: named[value][0], y: named[value][1] }
  const m = String(value).match(/([\d.]+)%\s+([\d.]+)%/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 }
}

export function formatPosition({ x, y }) {
  return `${Math.round(x)}% ${Math.round(y)}%`
}

// A frame of fixed shape with the photo filling it. Drag the photo to choose
// what stays in view — the same gesture as setting a profile picture. Only the
// overflowing axis moves; a photo that already fits can't be dragged.
//   ratio     — width / height of the frame
//   position  — current object-position string
//   onChange  — receives the new object-position string while dragging
//   hint      — show the "Drag to adjust" pill (off where the caller draws its own overlay)
export function CropFrame({ url, ratio = 1, position, onChange, fit = 'cover', style, hint = true }) {
  const [natural, setNatural] = useState(null)   // { w, h }
  const drag = useRef(null)                      // { startX, startY, x, y, boxW, boxH }
  const pos = parsePosition(position)

  // How many pixels of photo overflow the frame on each axis, for a given box size.
  function overflow(boxW, boxH) {
    if (!natural) return { x: 0, y: 0 }
    const scale = Math.max(boxW / natural.w, boxH / natural.h)
    return { x: natural.w * scale - boxW, y: natural.h * scale - boxH }
  }

  function onPointerDown(e) {
    if (fit !== 'cover' || !natural) return
    const box = e.currentTarget.getBoundingClientRect()
    drag.current = { startX: e.clientX, startY: e.clientY, x: pos.x, y: pos.y, boxW: box.width, boxH: box.height }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }

  function onPointerMove(e) {
    const d = drag.current
    if (!d) return
    const over = overflow(d.boxW, d.boxH)
    // Moving the finger right reveals more of the left, so the percentage falls.
    const nx = over.x > 0 ? d.x - ((e.clientX - d.startX) / over.x) * 100 : d.x
    const ny = over.y > 0 ? d.y - ((e.clientY - d.startY) / over.y) * 100 : d.y
    onChange?.(formatPosition({ x: clamp(nx), y: clamp(ny) }))
  }

  function onPointerUp(e) {
    drag.current = null
    e.currentTarget.releasePointerCapture?.(e.pointerId)
  }

  const canDrag = fit === 'cover' && natural && (() => {
    // Any overflow at all on either axis?
    const r = natural.w / natural.h
    return Math.abs(r - ratio) > 0.01
  })()

  return (
    <div
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        position: 'relative', width: '100%', aspectRatio: String(ratio), overflow: 'hidden',
        background: fit === 'contain' ? '#1a1a2e' : '#f3f4f6',
        touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none',
        cursor: canDrag ? 'grab' : 'default',
        ...style,
      }}
    >
      {url && (
        <img
          src={url}
          alt=""
          draggable={false}
          onLoad={e => setNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: fit, objectPosition: position || '50% 50%', display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
      {canDrag && hint && (
        <span style={{
          position: 'absolute', left: '50%', bottom: '8px', transform: 'translateX(-50%)',
          fontSize: '10px', fontWeight: 700, color: '#fff',
          background: 'rgba(0,0,0,0.45)', borderRadius: '999px', padding: '3px 9px',
          pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          Drag to adjust
        </span>
      )}
    </div>
  )
}

function clamp(n) {
  return Math.max(0, Math.min(100, n))
}
