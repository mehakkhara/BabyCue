import { useMemo } from 'react'
import { reelMonths, reelDurationMs, canMakeReel } from '../lib/reel'
import { Card } from './ui'
import { color, type } from '../theme'

// The reel's front door. Lives at the bottom of the Journal and appears on
// its own once a month has enough photos: a strip from the newest such month,
// what the reel would be, and one button. Other months, and photos from any
// month, are a tap away inside.
//   entries — the journal, as JournalScreen has it
//   urls    — the Journal's object URLs by entry id
//   onOpen  — (monthKey) → open the maker on that month
export default function ReelCard({ entries, profile, urls, onOpen }) {
  const months = useMemo(() => reelMonths(entries, profile?.dateOfBirth), [entries, profile?.dateOfBirth])
  if (!months.length || !canMakeReel()) return null
  const m = months[0]
  const seconds = Math.round(reelDurationMs(m.photos.length) / 1000)
  const strip = m.photos.slice(-4).reverse()
  const name = (profile?.babyName || '').trim() || 'your baby'

  return (
    <section style={{ marginBottom: '26px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', margin: '0 2px 10px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#7C3AED' }}>
          Reel
        </span>
        <span style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.09)' }} />
        <span style={{ fontSize: '11px', color: '#aaa' }}>{months.length > 1 ? `${months.length} months ready` : 'ready'}</span>
      </div>

      <Card padding="0" onClick={() => onOpen(m.key)} style={{ overflow: 'hidden', cursor: 'pointer' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', background: '#1e1b4b' }}>
          {strip.map(p => (
            <div key={p.id} style={{ aspectRatio: '3 / 4', overflow: 'hidden', position: 'relative' }}>
              <img src={urls.get(p.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.position || 'center', display: 'block' }} />
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ ...type.bodyStrong, margin: 0 }}>{m.monthName} in {seconds} seconds</p>
            <p style={{ ...type.small, margin: '3px 0 0' }}>
              {m.photos.length} photos{m.memos.length ? `, with ${m.memos.length === 1 ? 'your voice memo' : `${m.memos.length} of your voice memos`}` : ''} · {name}'s {m.monthName.toLowerCase()} as a short video to keep or share.
            </p>
          </div>
          <span style={{ flex: 'none', padding: '10px 14px', borderRadius: '999px', background: 'linear-gradient(135deg,#8b7cf6,#7C3AED)', color: '#fff', fontSize: '12.5px', fontWeight: 700, whiteSpace: 'nowrap' }}>
            ▶ Make it
          </span>
        </div>
      </Card>
    </section>
  )
}
