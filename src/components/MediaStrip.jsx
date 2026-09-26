import { useEffect, useState } from 'react'
import { isVideoType } from '../data/journalStore'

// Thumbnail row for a multi-pick. Each file becomes its own journal entry, so
// there's no crop step here — the auto-crop guess is applied on save.
export default function MediaStrip({ files }) {
  const [urls, setUrls] = useState([])

  useEffect(() => {
    const next = files.map(f => URL.createObjectURL(f))
    setUrls(next)
    return () => next.forEach(u => URL.revokeObjectURL(u))
  }, [files])

  return (
    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
      {files.map((f, i) => (
        <div
          key={i}
          style={{
            width: '72px', height: '90px', flexShrink: 0,
            borderRadius: '8px', overflow: 'hidden', background: '#f3f4f6',
            position: 'relative',
          }}
        >
          {urls[i] && (isVideoType(f.type)
            ? <video src={urls[i]} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <img src={urls[i]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />)}
          {isVideoType(f.type) && (
            <span style={{
              position: 'absolute', right: '4px', bottom: '4px',
              fontSize: '10px', color: '#fff', background: 'rgba(0,0,0,0.55)',
              borderRadius: '4px', padding: '1px 4px',
            }}>▶</span>
          )}
        </div>
      ))}
    </div>
  )
}
