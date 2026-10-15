// The compact photo-hunt card on the Journal: title, progress, three cells
// and a camera tile. The camera tile opens the phone's camera straight away
// and files the shot under the next empty prompt, so catching a moment is one
// tap from here. Everything else on the card opens the full hunt page.
//   onCaptured — a shot was saved; the parent refreshes the journal
import { useEffect, useRef, useState } from 'react'
import { getEntries, addEntry, compressImage, imageDimensions, PHOTO_HUNT_SOURCE } from '../data/journalStore'
import { autoCropPosition } from '../lib/autoCrop'
import { getBabyAgeInMonths } from '../data/tips'
import { promptsForAge } from '../data/photoPrompts'
import { loadHunt, recordCapture } from '../lib/photoHunt'
import { Card, IconTile } from '../components/ui'
import { color, type } from '../theme'

export default function PhotoHuntCard({ profile, onOpen, onCaptured, version = 0 }) {
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const prompts = promptsForAge(ageInMonths)
  const [captures, setCaptures] = useState(() => loadHunt())
  const [thumbs, setThumbs] = useState({})
  const [saving, setSaving] = useState(false)
  const cameraRef = useRef(null)

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

  const nextOpen = prompts.find(p => !captures[p.id]) || null

  function openCamera(e) {
    e.stopPropagation()   // the card itself opens the hunt page
    if (!nextOpen || saving) return
    cameraRef.current?.click()
  }

  // Straight from the camera to the journal, under the next empty prompt.
  // Same save as the hunt page's own cells, minus the crop step: the subject
  // is guessed and she can drag it later from the photo's own sheet.
  async function handleShot(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !nextOpen || saving) return
    setSaving(true)
    try {
      const blob = await compressImage(file)
      const [size, position] = await Promise.all([imageDimensions(blob), autoCropPosition(file, 1).catch(() => '50% 50%')])
      const entryId = await addEntry({
        note: nextOpen.label, source: PHOTO_HUNT_SOURCE, photoBlob: blob, photoType: 'image/jpeg',
        width: size?.width, height: size?.height, fit: 'cover', position, createdAt: Date.now(),
      })
      recordCapture(nextOpen.id, entryId, { fit: 'cover', position })
      setCaptures(loadHunt())
      onCaptured?.(entryId)
    } catch { /* the hunt page shows any error on its own */ } finally {
      setSaving(false)
    }
  }

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
        <button
          onClick={openCamera}
          disabled={!nextOpen || saving}
          aria-label={nextOpen ? `Take a photo for “${nextOpen.label}”` : 'All caught'}
          style={{
            aspectRatio: '1', borderRadius: '12px', border: 'none', padding: '4px', cursor: nextOpen ? 'pointer' : 'default', fontFamily: 'inherit',
            background: nextOpen ? 'linear-gradient(135deg,#8b7cf6,#7C3AED)' : color.tintLight, color: nextOpen ? '#fff' : color.faint,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
            boxShadow: nextOpen ? '0 3px 10px rgba(124,111,247,0.35)' : 'none', opacity: saving ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: '20px', lineHeight: 1 }}>📷</span>
          <span style={{ fontSize: '8.5px', fontWeight: 700, textAlign: 'center', lineHeight: 1.15 }}>
            {saving ? 'Saving…' : nextOpen ? nextOpen.label : 'All caught'}
          </span>
        </button>
      </div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleShot} onClick={e => e.stopPropagation()} style={{ display: 'none' }} />
    </Card>
  )
}
