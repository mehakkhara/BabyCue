import { useState } from 'react'
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

// Tall enough that a 4:5 frame would cut something off.
export function isTallerThanTile(width, height) {
  return Boolean(width && height) && width / height < TILE_RATIO - 0.02
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

// "Keep which part?" — Top / Middle / Bottom for photos that will be cropped.
export function KeepWhichPart({ value, onChange, accent = '#7C3AED', tint = '#ede9fe' }) {
  const options = [
    { id: 'top', label: 'Top' },
    { id: 'center', label: 'Middle' },
    { id: 'bottom', label: 'Bottom' },
  ]
  return (
    <div>
      <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>
        Keep which part?
      </p>
      <div style={{ display: 'flex', gap: '6px' }}>
        {options.map(o => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            style={{
              flex: 1, padding: '6px 4px', borderRadius: '9px',
              border: value === o.id ? `1.5px solid ${accent}` : '1.5px solid #e5e7eb',
              background: value === o.id ? tint : '#fff',
              color: value === o.id ? accent : '#555',
              fontSize: '11px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
