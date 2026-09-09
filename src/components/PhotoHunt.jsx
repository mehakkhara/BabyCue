import { useEffect, useRef, useState } from 'react'
import { addEntry, getEntries, compressImage, imageDimensions, isVideoType } from '../data/journalStore'
import { ShapedMedia, KeepWhichPart, isTallerThanTile } from '../components/PhotoShape'
import { getBabyAgeInMonths } from '../data/tips'
import { promptsForAge } from '../data/photoPrompts'
import { loadHunt, recordCapture } from '../lib/photoHunt'

// This month's photo hunt — a 3×3 grid of tiny photo missions. Capturing one
// saves the photo to the journal (prompt as the note) and fills the cell with
// its thumbnail, so the grid doubles as a month-at-a-glance keepsake.
export default function PhotoHunt({ profile, onSaved, onCheckIn, onOpenJournal }) {
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const prompts = promptsForAge(ageInMonths)

  const [captures, setCaptures] = useState(() => loadHunt())
  const [thumbs, setThumbs] = useState({})       // promptId -> object URL
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const pendingPrompt = useRef(null)
  const inputRef = useRef(null)

  // Resolve captured entries to thumbnails; revoke the batch on change.
  useEffect(() => {
    let cancelled = false
    const urls = []
    ;(async () => {
      const wanted = new Map(
        Object.entries(captures).map(([promptId, c]) => [c.entryId, promptId]),
      )
      if (wanted.size === 0) { setThumbs({}); return }
      try {
        const entries = await getEntries()
        const next = {}
        for (const e of entries) {
          const promptId = wanted.get(e.id)
          if (promptId && e.photoBlob) {
            const url = URL.createObjectURL(e.photoBlob)
            urls.push(url)
            next[promptId] = url
          }
        }
        if (cancelled) { urls.forEach(u => URL.revokeObjectURL(u)); return }
        setThumbs(next)
      } catch { /* grid just shows prompts */ }
    })()
    return () => {
      cancelled = true
      urls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [captures])

  // A picked-but-not-yet-saved hunt photo. Phone photos are usually tall, so
  // before it lands in a square cell she chooses how it should sit there.
  const [pending, setPending] = useState(null)   // { prompt, file, url }
  const [fit, setFit] = useState('cover')         // 'cover' | 'contain'
  const [position, setPosition] = useState('center')

  useEffect(() => {
    if (!pending) return
    return () => URL.revokeObjectURL(pending.url)
  }, [pending])

  function pickFor(prompt) {
    if (captures[prompt.id] || saving || pending) return
    pendingPrompt.current = prompt
    inputRef.current?.click()
  }

  function handleChosen(e) {
    const file = e.target.files?.[0]
    const prompt = pendingPrompt.current
    e.target.value = ''
    pendingPrompt.current = null
    if (!file || !prompt) return
    setError('')
    setFit('cover')
    setPosition('center')
    setPending({ prompt, file, url: URL.createObjectURL(file) })
  }

  function cancelPending() {
    setPending(null)
  }

  async function savePending() {
    if (!pending || saving) return
    const { prompt, file } = pending
    setSaving(true)
    setError('')
    try {
      const blob = await compressImage(file)
      const size = await imageDimensions(blob)
      const entryId = await addEntry({
        note: `📸 Photo hunt: ${prompt.label}`,
        photoBlob: blob,
        photoType: 'image/jpeg',
        width: size?.width,
        height: size?.height,
        fit,
        position,
      })
      setCaptures({ ...recordCapture(prompt.id, entryId, { fit, position }) })
      setPending(null)
      onSaved?.()
      onCheckIn?.()
    } catch (err) {
      console.error('Photo hunt save failed', err)
      setError(err?.name === 'QuotaExceededError'
        ? "There's no room left on this device for another photo."
        : 'Could not save that photo. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const capturedCount = prompts.filter(p => captures[p.id]).length
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long' })

  // Custom entry — for moments the hunt didn't ask for. Same journal, no prompt.
  const [customOpen, setCustomOpen] = useState(false)
  const [customFile, setCustomFile] = useState(null)
  const [customPreview, setCustomPreview] = useState(null)
  const [customNote, setCustomNote] = useState('')
  const [customSaving, setCustomSaving] = useState(false)
  const [customError, setCustomError] = useState('')
  const [customSaved, setCustomSaved] = useState(false)
  const [customDims, setCustomDims] = useState(null)
  const [customPosition, setCustomPosition] = useState('center')

  useEffect(() => {
    if (!customFile) { setCustomPreview(null); setCustomDims(null); return }
    const url = URL.createObjectURL(customFile)
    setCustomPreview(url)
    setCustomPosition('center')
    if (!isVideoType(customFile.type)) imageDimensions(customFile).then(setCustomDims)
    return () => URL.revokeObjectURL(url)
  }, [customFile])

  function closeCustom() {
    setCustomOpen(false)
    setCustomFile(null)
    setCustomNote('')
    setCustomError('')
  }

  async function saveCustom() {
    if (!customFile && !customNote.trim()) return
    setCustomSaving(true)
    setCustomError('')
    try {
      const isVideo = isVideoType(customFile?.type)
      const blob = customFile ? (isVideo ? customFile : await compressImage(customFile)) : null
      const size = blob && !isVideo ? await imageDimensions(blob) : null
      await addEntry({
        note: customNote.trim(),
        photoBlob: blob,
        photoType: customFile ? (isVideo ? customFile.type : 'image/jpeg') : null,
        width: size?.width,
        height: size?.height,
        position: customPosition,
      })
      closeCustom()
      setCustomSaved(true)
      setTimeout(() => setCustomSaved(false), 2500)
      onSaved?.()
      onCheckIn?.()
    } catch (err) {
      console.error('Custom journal save failed', err)
      setCustomError(err?.name === 'QuotaExceededError'
        ? "There's no room left on this device for another memory."
        : 'Could not save that memory. Please try again.')
    } finally {
      setCustomSaving(false)
    }
  }

  const canSaveCustom = Boolean(customFile || customNote.trim()) && !customSaving

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '18px',
      marginTop: '12px',
      boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
      borderLeft: '4px solid #f472b6',
    }}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleChosen}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>📷</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#db2777', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {monthName} photo hunt
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: capturedCount === prompts.length ? '#15803d' : '#f472b6' }}>
            {capturedCount === prompts.length ? `All ${prompts.length} 🎉` : `${capturedCount} of ${prompts.length}`}
          </span>
          {onOpenJournal && (
            <button
              onClick={onOpenJournal}
              style={{
                background: 'none', border: 'none', padding: 0,
                color: '#7C6FF7', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
              }}
            >
              Journal →
            </button>
          )}
        </div>
      </div>
      <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
        Nine little moments to catch this month — each one saves to {profile.babyName}'s journal.
      </p>

      {/* Custom entry — a photo or note that isn't one of the nine prompts */}
      {!customOpen ? (
        <button
          onClick={() => { setCustomOpen(true); setCustomSaved(false) }}
          disabled={saving}
          style={{
            width: '100%', marginBottom: '10px', padding: '10px 12px',
            borderRadius: '12px', border: '1.5px dashed #c4b5fd',
            background: customSaved ? '#f0fdf4' : '#f5f3ff',
            color: customSaved ? '#15803d' : '#6d28d9',
            fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
            transition: 'all 0.25s ease',
          }}
        >
          {customSaved ? '✓ Saved to the journal' : <><span style={{ fontSize: '15px' }}>＋</span> Add your own moment</>}
        </button>
      ) : (
        <div style={{
          marginBottom: '12px', padding: '12px',
          borderRadius: '14px', border: '1.5px solid #ddd6fe', background: '#faf9ff',
        }}>
          <label
            htmlFor="photo-hunt-custom-input"
            style={{
              display: 'block', border: '1.5px dashed #c4b5fd', borderRadius: '10px',
              padding: customPreview ? 0 : '18px 12px', textAlign: 'center',
              cursor: 'pointer', marginBottom: '10px', overflow: 'hidden', background: '#fff',
            }}
          >
            {customPreview ? (
              // Preview exactly as the journal's month card will show it.
              <ShapedMedia url={customPreview} type={customFile?.type} entry={{ ...customDims, position: customPosition }} />
            ) : (
              <span style={{ color: '#7c3aed', fontSize: '12px', fontWeight: 600 }}>📷 Tap to add a photo or video</span>
            )}
          </label>
          <input
            id="photo-hunt-custom-input"
            type="file"
            accept="image/*,video/*"
            onChange={e => setCustomFile(e.target.files?.[0] || null)}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          />

          {customDims && isTallerThanTile(customDims.width, customDims.height) && (
            <div style={{ marginBottom: '10px' }}>
              <KeepWhichPart value={customPosition} onChange={setCustomPosition} />
            </div>
          )}

          <textarea
            value={customNote}
            onChange={e => setCustomNote(e.target.value)}
            placeholder={`What happened with ${profile.babyName} today?`}
            rows={2}
            style={{
              width: '100%', padding: '10px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
              fontSize: '13px', resize: 'vertical', fontFamily: 'inherit', outline: 'none',
              boxSizing: 'border-box', marginBottom: '10px', background: '#fff',
            }}
          />

          {customError && (
            <p style={{
              margin: '0 0 10px', fontSize: '12px', color: '#b91c1c',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '10px', padding: '8px 10px',
            }}>
              {customError}
            </p>
          )}

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={closeCustom}
              disabled={customSaving}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                background: '#fff', color: '#555', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              onClick={saveCustom}
              disabled={!canSaveCustom}
              style={{
                flex: 2, padding: '10px', borderRadius: '10px', border: 'none',
                background: canSaveCustom ? '#7C3AED' : '#E5E7EB',
                color: '#fff', fontSize: '13px', fontWeight: 600,
                cursor: canSaveCustom ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
              }}
            >
              {customSaving ? 'Saving…' : 'Save to journal'}
            </button>
          </div>
        </div>
      )}

      {/* Fit step — how the picked photo should sit in its square */}
      {pending && (
        <div style={{
          marginBottom: '12px', padding: '12px',
          borderRadius: '14px', border: '1.5px solid #fbcfe8', background: '#fdf2f8',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#db2777' }}>
            {pending.prompt.emoji} {pending.prompt.label}
          </p>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {/* Live square preview — exactly what the grid cell will show */}
            <div style={{
              width: '120px', height: '120px', flexShrink: 0,
              borderRadius: '12px', overflow: 'hidden',
              background: fit === 'contain' ? '#1a1a2e' : '#fff',
              border: '1.5px solid #fbcfe8',
            }}>
              <img
                src={pending.url}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: fit, objectPosition: position, display: 'block' }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 6px', fontSize: '11px', fontWeight: 600, color: '#6b7280' }}>
                How should it fit the square?
              </p>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                {[
                  { id: 'cover', label: 'Fill' },
                  { id: 'contain', label: 'Whole photo' },
                ].map(o => (
                  <button
                    key={o.id}
                    onClick={() => setFit(o.id)}
                    style={{
                      flex: 1, padding: '7px 6px', borderRadius: '9px',
                      border: fit === o.id ? '1.5px solid #db2777' : '1.5px solid #e5e7eb',
                      background: fit === o.id ? '#db2777' : '#fff',
                      color: fit === o.id ? '#fff' : '#555',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    {o.label}
                  </button>
                ))}
              </div>

              {fit === 'cover' && (
                <KeepWhichPart value={position} onChange={setPosition} accent="#db2777" tint="#fce7f3" />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button
              onClick={cancelPending}
              disabled={saving}
              style={{
                flex: 1, padding: '10px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                background: '#fff', color: '#555', fontSize: '13px', fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              onClick={savePending}
              disabled={saving}
              style={{
                flex: 2, padding: '10px', borderRadius: '10px', border: 'none',
                background: saving ? '#E5E7EB' : '#db2777',
                color: '#fff', fontSize: '13px', fontWeight: 600,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {saving ? 'Saving…' : 'Save to journal'}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '7px' }}>
        {prompts.map(p => {
          const done = Boolean(captures[p.id])
          const thumb = thumbs[p.id]
          const cellFit = captures[p.id]?.fit === 'contain' ? 'contain' : 'cover'
          const cellPos = captures[p.id]?.position || 'center'
          return (
            <button
              key={p.id}
              onClick={() => pickFor(p)}
              disabled={saving || Boolean(pending)}
              aria-label={done ? `${p.label} — captured` : `Capture: ${p.label}`}
              style={{
                position: 'relative',
                aspectRatio: '1',
                borderRadius: '12px',
                border: done ? '1.5px solid #fbcfe8' : '1.5px dashed #ddd6fe',
                background: thumb && cellFit === 'contain' ? '#1a1a2e' : done ? '#fdf2f8' : '#faf9ff',
                cursor: done ? 'default' : 'pointer',
                overflow: 'hidden',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                fontFamily: 'inherit',
                transition: 'all 0.25s ease',
              }}
            >
              {thumb ? (
                <>
                  <img src={thumb} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: cellFit, objectPosition: cellPos }} />
                  <span style={{
                    position: 'absolute', left: 0, right: 0, bottom: 0,
                    padding: '10px 4px 4px',
                    background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.55))',
                    color: '#fff', fontSize: '8.5px', fontWeight: 700, lineHeight: 1.2,
                  }}>
                    ✓ {p.label}
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '20px' }}>{done ? '📸' : p.emoji}</span>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: done ? '#db2777' : '#9ca3af', lineHeight: 1.2, textAlign: 'center' }}>
                    {p.label}
                  </span>
                </>
              )}
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{
          margin: '10px 0 0', fontSize: '12px', color: '#b91c1c',
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '10px', padding: '8px 10px',
        }}>
          {error}
        </p>
      )}
      {capturedCount === prompts.length && (
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
          The whole grid — {monthName} is safely in the memory book 💜
        </p>
      )}
    </div>
  )
}
