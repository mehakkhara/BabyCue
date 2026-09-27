// The compact photo-hunt card on the Journal: title, progress, three cells
// and an Add tile. "All 9" and every tap open the full hunt page.
import { useEffect, useState } from 'react'
import { getEntries } from '../data/journalStore'
import { getBabyAgeInMonths } from '../data/tips'
import { promptsForAge } from '../data/photoPrompts'
import { loadHunt } from '../lib/photoHunt'
import { Card, IconTile } from '../components/ui'
import { color, type } from '../theme'

export default function PhotoHuntCard({ profile, onOpen, version = 0 }) {
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const prompts = promptsForAge(ageInMonths)
  const [captures, setCaptures] = useState(() => loadHunt())
  const [thumbs, setThumbs] = useState({})

  useEffect(() => { setCaptures(loadHunt()) }, [version])

  useEffect(() => {
    let cancelled = false
    const urls = []
    ;(async () => {
      const wanted = new Map(Object.entries(captures).map(([pid, c]) => [c.entryId, pid]))
      if (wanted.size === 0) { setThumbs({}); return }
      try {
        const entries = await getEntries()
        const next = {}
        for (const e of entries) {
          const pid = wanted.get(e.id)
          if (pid && e.photoBlob) { const u = URL.createObjectURL(e.photoBlob); urls.push(u); next[pid] = u }
        }
        if (cancelled) { urls.forEach(u => URL.revokeObjectURL(u)); return }
        setThumbs(next)
      } catch { /* cells show prompts */ }
    })()
    return () => { cancelled = true; urls.forEach(u => URL.revokeObjectURL(u)) }
  }, [captures])

  const month = new Date().toLocaleDateString(undefined, { month: 'long' })
  const done = prompts.filter(p => captures[p.id]).length
  // Captured cells first so the card shows her photos, then the next prompts.
  const shown = [...prompts.filter(p => captures[p.id]), ...prompts.filter(p => !captures[p.id])].slice(0, 3)

  return (
    <Card onClick={onOpen} padding="14px 16px">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <IconTile emoji="📷" hue="peach" size={30} />
        <p style={{ ...type.bodyStrong, flex: 1, color: '#c2410c' }}>{month} Photo Hunt</p>
        <span style={{ fontSize: '12px', fontWeight: 600, color: color.primary }}>All {prompts.length} ›</span>
      </div>
      <p style={{ ...type.small, marginTop: '4px' }}>
        {done === 0 ? `Nine little moments to catch this month.` : done === prompts.length ? 'All caught. Lovely.' : `${done} of ${prompts.length} caught so far.`}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '12px' }}>
        {shown.map(p => (
          <div key={p.id} style={{
            aspectRatio: '1', borderRadius: '12px', overflow: 'hidden',
            background: thumbs[p.id] ? `center / cover no-repeat url(${thumbs[p.id]})` : color.tintLight,
            border: thumbs[p.id] ? 'none' : `1.5px dashed ${color.lavender}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', padding: '4px',
          }}>
            {!thumbs[p.id] && (
              <>
                <span style={{ fontSize: '18px' }}>{p.emoji}</span>
                <span style={{ fontSize: '8.5px', fontWeight: 700, color: color.faint, textAlign: 'center', lineHeight: 1.15 }}>{p.label}</span>
              </>
            )}
          </div>
        ))}
        <div style={{
          aspectRatio: '1', borderRadius: '12px', border: `1.5px dashed ${color.lavender}`, background: color.surface,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2px', color: color.primary,
        }}>
          <span style={{ fontSize: '20px', lineHeight: 1 }}>+</span>
          <span style={{ fontSize: '10px', fontWeight: 700 }}>Add</span>
        </div>
      </div>
    </Card>
  )
}
