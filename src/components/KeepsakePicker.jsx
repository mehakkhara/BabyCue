import { useEffect, useState } from 'react'
import { getEntries, isVideoType, isKeepsake } from '../data/journalStore'
import KeepsakeModal from './KeepsakeModal'

// "Make a keepsake" from anywhere: pick one of the recent journal photos,
// then design the card. Videos and existing cards are left out.
export default function KeepsakePicker({ profile, onClose, onSaved, limit = 12 }) {
  const [photos, setPhotos] = useState(null)   // [{ entry, url }]
  const [chosen, setChosen] = useState(null)

  useEffect(() => {
    let cancelled = false
    let urls = []
    getEntries().then(entries => {
      if (cancelled) return
      const usable = entries
        .filter(e => e.photoBlob && !isVideoType(e.photoType) && !isKeepsake(e))
        .slice(0, limit)
      const list = usable.map(entry => {
        const url = URL.createObjectURL(entry.photoBlob)
        urls.push(url)
        return { entry, url }
      })
      setPhotos(list)
    }).catch(() => { if (!cancelled) setPhotos([]) })
    return () => {
      cancelled = true
      urls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [limit])

  if (chosen) {
    return (
      <KeepsakeModal
        photoUrl={chosen.url}
        title={chosen.entry.note}
        takenAt={chosen.entry.createdAt}
        profile={profile}
        onClose={onClose}
        onSaved={onSaved}
      />
    )
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
          width: '100%', maxWidth: '480px', maxHeight: '80vh',
          background: '#faf9ff', borderRadius: '24px 24px 0 0',
          padding: '20px 18px calc(20px + env(safe-area-inset-bottom))',
          overflowY: 'auto', boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e1b4b' }}>
            🎞 Make a keepsake
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
        <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#9ca3af' }}>
          Pick a photo from {profile.babyName}'s journal.
        </p>

        {photos === null && (
          <p style={{ textAlign: 'center', color: '#c4c4d4', fontSize: '13px', padding: '24px 0' }}>Loading…</p>
        )}
        {photos && photos.length === 0 && (
          <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px', padding: '24px 0', lineHeight: 1.5 }}>
            No photos yet. Catch a photo hunt moment first and it'll show up here.
          </p>
        )}
        {photos && photos.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px' }}>
            {photos.map(p => (
              <button
                key={p.entry.id}
                onClick={() => setChosen(p)}
                aria-label={p.entry.note || 'Photo'}
                style={{
                  aspectRatio: '4 / 5', borderRadius: '12px', overflow: 'hidden',
                  border: 'none', padding: 0, cursor: 'pointer', background: '#e8e5f5',
                }}
              >
                <img src={p.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.entry.position || 'center', display: 'block' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
