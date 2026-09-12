import { useEffect, useRef, useState } from 'react'
import { addEntry, getEntries, compressImage, imageDimensions, isVideoType } from '../data/journalStore'
import { CropFrame, TILE_RATIO } from '../components/PhotoShape'
import { autoCropPosition } from '../lib/autoCrop'
import KeepsakeModal from './KeepsakeModal'
import KeepsakePicker from './KeepsakePicker'
import MediaStrip from './MediaStrip'
import { saveMediaEntries } from '../lib/journalSave'
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
  const cameraInputRef = useRef(null)    // capture="environment" → straight to the camera
  const libraryInputRef = useRef(null)   // plain picker → photo library, multi-select
  const [offerLibrary, setOfferLibrary] = useState(null)   // prompt whose camera she backed out of
  const [batchNote, setBatchNote] = useState('')           // "Saved 3 moments" after a multi-pick

  // Backing out of the camera fires `cancel` on the input (Safari 16.4+,
  // Chrome 113+). That's the moment to offer the library instead.
  useEffect(() => {
    const el = cameraInputRef.current
    if (!el) return
    const onCancel = () => {
      if (pendingPrompt.current) setOfferLibrary(pendingPrompt.current)
    }
    el.addEventListener('cancel', onCancel)
    return () => el.removeEventListener('cancel', onCancel)
  }, [])

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
  const [position, setPosition] = useState('50% 50%')

  useEffect(() => {
    if (!pending) return
    return () => URL.revokeObjectURL(pending.url)
  }, [pending])

  // Tapping a cell goes straight to the camera. The click must happen inside
  // the tap handler — browsers only open the camera from a user gesture.
  function pickFor(prompt) {
    if (captures[prompt.id] || saving || pending) return
    setOfferLibrary(null)
    setBatchNote('')
    pendingPrompt.current = prompt
    cameraInputRef.current?.click()
  }

  function openLibrary() {
    pendingPrompt.current = offerLibrary
    setOfferLibrary(null)
    libraryInputRef.current?.click()
  }

  // The always-visible library button: no cell chosen, so photos go to the
  // first empty cell(s) in grid order.
  const firstOpen = prompts.find(p => !captures[p.id]) || null
  function openLibraryForNext() {
    if (!firstOpen || saving || pending) return
    setOfferLibrary(null)
    setBatchNote('')
    pendingPrompt.current = firstOpen
    libraryInputRef.current?.click()
  }

  function handleChosen(e) {
    const files = Array.from(e.target.files || [])
    const prompt = pendingPrompt.current
    e.target.value = ''
    pendingPrompt.current = null
    if (files.length === 0 || !prompt) return
    setError('')
    if (files.length > 1) { saveBatch(prompt, files); return }
    const file = files[0]
    setFit('cover')
    setPosition('50% 50%')
    setPending({ prompt, file, url: URL.createObjectURL(file) })
    // Guess where the subject is; she can drag if the guess is off.
    autoCropPosition(file, 1).then(setPosition)
  }

  function cancelPending() {
    setPending(null)
  }

  function saveFailed(err) {
    console.error('Photo hunt save failed', err)
    setError(err?.name === 'QuotaExceededError'
      ? "There's no room left on this device for another photo."
      : 'Could not save that photo. Please try again.')
  }

  // Compress, write the journal entry, and link it to the grid cell.
  async function saveCapture(prompt, file, display) {
    const blob = await compressImage(file)
    const size = await imageDimensions(blob)
    const entryId = await addEntry({
      note: `📸 Photo hunt: ${prompt.label}`,
      photoBlob: blob,
      photoType: 'image/jpeg',
      width: size?.width,
      height: size?.height,
      fit: display.fit,
      position: display.position,
    })
    return { blob, state: recordCapture(prompt.id, entryId, display) }
  }

  async function savePending() {
    if (!pending || saving) return
    const { prompt, file } = pending
    setSaving(true)
    setError('')
    try {
      const { blob, state } = await saveCapture(prompt, file, { fit, position })
      setCaptures({ ...state })
      setPending(null)
      rememberSaved(blob, prompt.label)
      onSaved?.()
      onCheckIn?.()
    } catch (err) {
      saveFailed(err)
    } finally {
      setSaving(false)
    }
  }

  // Several library photos at once: the tapped cell takes the first, the
  // next empty cells take the rest in grid order. No crop step — each gets
  // the auto-crop guess, and she can re-tap a cell later if one sits badly.
  async function saveBatch(prompt, files) {
    const open = prompts.filter(p => p.id === prompt.id || !captures[p.id])
    const targets = [prompt, ...open.filter(p => p.id !== prompt.id)].slice(0, files.length)
    setSaving(true)
    setError('')
    let state = captures
    let firstBlob = null
    let count = 0
    try {
      for (let i = 0; i < targets.length; i++) {
        const position = await autoCropPosition(files[i], 1)
        const saved = await saveCapture(targets[i], files[i], { fit: 'cover', position })
        state = saved.state
        firstBlob = firstBlob || saved.blob
        count++
      }
      if (files.length > targets.length) {
        setBatchNote(`Saved ${count} — the grid was full, so ${files.length - targets.length} weren't added.`)
      } else {
        setBatchNote(`Saved ${count} moment${count === 1 ? '' : 's'} to the grid.`)
      }
      if (firstBlob) rememberSaved(firstBlob, targets[0].label)
      onSaved?.()
      onCheckIn?.()
    } catch (err) {
      saveFailed(err)
    } finally {
      setCaptures({ ...state })
      setSaving(false)
    }
  }

  const capturedCount = prompts.filter(p => captures[p.id]).length
  const monthName = new Date().toLocaleDateString(undefined, { month: 'long' })

  // Keepsakes from Home: a picker over recent journal photos, plus a nudge
  // right after a save while the moment is fresh.
  const [keepsake, setKeepsake] = useState(null)     // 'picker' | { url, title, ts }
  const [justSaved, setJustSaved] = useState(null)   // { url, title, ts } of the last photo saved here

  useEffect(() => {
    if (!justSaved) return
    return () => URL.revokeObjectURL(justSaved.url)
  }, [justSaved])

  function rememberSaved(blob, title) {
    setJustSaved({ url: URL.createObjectURL(blob), title, ts: Date.now() })
  }

  // Custom entry — for moments the hunt didn't ask for. Same journal, no prompt.
  const [customOpen, setCustomOpen] = useState(false)
  const [customFiles, setCustomFiles] = useState([])   // one or many; each saves as its own entry
  const customFile = customFiles.length === 1 ? customFiles[0] : null   // single-pick gets the crop step
  const [customPreview, setCustomPreview] = useState(null)
  const [customNote, setCustomNote] = useState('')
  const [customSaving, setCustomSaving] = useState(false)
  const [customError, setCustomError] = useState('')
  const [customSaved, setCustomSaved] = useState(false)
  const [customPosition, setCustomPosition] = useState('50% 50%')

  useEffect(() => {
    if (!customFile) { setCustomPreview(null); return }
    const url = URL.createObjectURL(customFile)
    setCustomPreview(url)
    setCustomPosition('50% 50%')
    if (!isVideoType(customFile.type)) autoCropPosition(customFile, TILE_RATIO).then(setCustomPosition)
    return () => URL.revokeObjectURL(url)
  }, [customFile])

  function closeCustom() {
    setCustomOpen(false)
    setCustomFiles([])
    setCustomNote('')
    setCustomError('')
  }

  async function saveCustom() {
    if (customFiles.length === 0 && !customNote.trim()) return
    setCustomSaving(true)
    setCustomError('')
    try {
      const note = customNote.trim()
      let firstPhoto = null
      if (customFiles.length === 0) {
        await addEntry({ note, photoBlob: null, photoType: null })
      } else {
        // A single pick keeps the position she dragged; a batch is auto-cropped.
        const saved = await saveMediaEntries(customFiles, note, customFile ? { 0: customPosition } : {})
        firstPhoto = saved.find(s => !s.isVideo)?.blob ?? null
      }
      closeCustom()
      setCustomSaved(true)
      setTimeout(() => setCustomSaved(false), 2500)
      if (firstPhoto) rememberSaved(firstPhoto, note)
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

  const canSaveCustom = Boolean(customFiles.length || customNote.trim()) && !customSaving

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '18px',
      marginTop: '12px',
      boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
      borderLeft: '4px solid #f472b6',
    }}>
      {/* Two hidden inputs for the hunt cells: capture="environment" opens the
          rear camera directly on phones (desktop ignores it); the second is the
          plain picker for the photo library. */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleChosen}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        multiple
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
        Nine little moments to catch this month — tap a cell to shoot it, or 🖼 to pull some in from your photos. Each saves to {profile.babyName}'s journal.
      </p>

      {/* Custom entry — a photo or note that isn't one of the nine prompts */}
      {!customOpen ? (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <button
            onClick={() => { setCustomOpen(true); setCustomSaved(false) }}
            disabled={saving}
            style={{
              flex: 3, padding: '10px 12px',
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
          <button
            onClick={() => setKeepsake('picker')}
            disabled={saving}
            aria-label="Make a keepsake card"
            style={{
              flex: 2, padding: '10px 8px',
              borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #7C6FF7, #a78bfa)', color: '#fff',
              fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
            }}
          >
            🎞 Keepsake
          </button>
          <button
            onClick={openLibraryForNext}
            disabled={saving || Boolean(pending) || !firstOpen}
            aria-label="Add hunt photos from your library"
            title="From your photos"
            style={{
              flex: '0 0 auto', padding: '10px 11px',
              borderRadius: '12px', border: '1.5px solid #fbcfe8',
              background: '#fff', color: '#db2777',
              fontSize: '15px', cursor: firstOpen ? 'pointer' : 'default', fontFamily: 'inherit',
              opacity: firstOpen ? 1 : 0.4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            🖼
          </button>
        </div>
      ) : (
        <div style={{
          marginBottom: '12px', padding: '12px',
          borderRadius: '14px', border: '1.5px solid #ddd6fe', background: '#faf9ff',
        }}>
          {customFiles.length > 1 ? (
            <div style={{ marginBottom: '6px' }}>
              <MediaStrip files={customFiles} />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                {customFiles.length} photos — each saves as its own memory with this note.
              </p>
            </div>
          ) : customPreview ? (
            // Outside the label so a drag doesn't reopen the file picker.
            <div style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '6px', background: '#fff' }}>
              {isVideoType(customFile?.type)
                ? <video src={customPreview} controls playsInline style={{ width: '100%', maxHeight: '240px', display: 'block', background: '#000' }} />
                // The journal's tiles are 4:5 — drag to choose what they show.
                : <CropFrame url={customPreview} ratio={TILE_RATIO} position={customPosition} onChange={setCustomPosition} />}
            </div>
          ) : (
            <label
              htmlFor="photo-hunt-custom-input"
              style={{
                display: 'block', border: '1.5px dashed #c4b5fd', borderRadius: '10px',
                padding: '18px 12px', textAlign: 'center',
                cursor: 'pointer', marginBottom: '10px', background: '#fff',
              }}
            >
              <span style={{ color: '#7c3aed', fontSize: '12px', fontWeight: 600 }}>📷 Tap to add photos or a video</span>
            </label>
          )}
          {customFiles.length > 0 && (
            <label
              htmlFor="photo-hunt-custom-input"
              style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: 600, color: '#7c3aed', cursor: 'pointer', textAlign: 'center' }}
            >
              {customFiles.length > 1 ? 'Choose different photos' : 'Choose a different photo'}
            </label>
          )}
          <input
            id="photo-hunt-custom-input"
            type="file"
            accept="image/*,video/*"
            multiple
            onChange={e => setCustomFiles(Array.from(e.target.files || []))}
            style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
          />


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

      {/* She backed out of the camera — offer the library (multi-select) instead. */}
      {offerLibrary && !pending && (
        <div style={{
          marginBottom: '12px', padding: '10px 12px',
          borderRadius: '14px', border: '1.5px solid #fbcfe8', background: '#fdf2f8',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#db2777' }}>
              {offerLibrary.emoji} {offerLibrary.label}
            </div>
            <div style={{ fontSize: '11px', color: '#9ca3af' }}>
              Already have this one? Pick it from your photos — or several at once.
            </div>
          </div>
          <button
            onClick={openLibrary}
            style={{
              padding: '9px 12px', borderRadius: '10px', border: 'none',
              background: '#db2777', color: '#fff', fontSize: '12px', fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            🖼 From library
          </button>
          <button
            onClick={() => setOfferLibrary(null)}
            aria-label="Dismiss"
            style={{ border: 'none', background: 'none', color: '#c4c4d4', fontSize: '15px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
          >
            ×
          </button>
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
            <div style={{ width: '150px', flexShrink: 0, borderRadius: '12px', overflow: 'hidden', border: '1.5px solid #fbcfe8' }}>
              <CropFrame url={pending.url} ratio={1} fit={fit} position={position} onChange={setPosition} />
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
                <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af', lineHeight: 1.45 }}>
                  We picked the busiest part of the photo. Drag it if {profile.babyName} isn't in view.
                </p>
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
      {batchNote && capturedCount < prompts.length && (
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
          {batchNote}
        </p>
      )}
      {capturedCount === prompts.length && (
        <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#15803d', fontWeight: 600, textAlign: 'center' }}>
          The whole grid — {monthName} is safely in the memory book 💜
        </p>
      )}

      {/* Fresh save → offer the card while the moment is still warm */}
      {justSaved && !keepsake && (
        <div style={{
          marginTop: '10px', padding: '9px 10px',
          background: '#fdf2f8', border: '1.5px solid #fbcfe8', borderRadius: '12px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <img
            src={justSaved.url}
            alt=""
            style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a2e' }}>Saved to the journal ✓</div>
            <div style={{ fontSize: '11px', color: '#888' }}>Make it a keepsake card?</div>
          </div>
          <button
            onClick={() => setKeepsake(justSaved)}
            style={{
              border: 'none', background: 'none', padding: '4px 2px',
              color: '#db2777', fontSize: '12px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            Make it →
          </button>
          <button
            onClick={() => setJustSaved(null)}
            aria-label="Dismiss"
            style={{ border: 'none', background: 'none', color: '#c4c4d4', fontSize: '15px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      )}

      {keepsake === 'picker' && (
        <KeepsakePicker
          profile={profile}
          onClose={() => setKeepsake(null)}
          onSaved={() => onSaved?.()}
        />
      )}
      {keepsake && keepsake !== 'picker' && (
        <KeepsakeModal
          photoUrl={keepsake.url}
          title={keepsake.title}
          takenAt={keepsake.ts}
          profile={profile}
          onClose={() => { setKeepsake(null); setJustSaved(null) }}
          onSaved={() => onSaved?.()}
        />
      )}
    </div>
  )
}
