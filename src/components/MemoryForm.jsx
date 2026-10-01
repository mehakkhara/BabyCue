import { useEffect, useState } from 'react'
import { addEntry, isVideoType } from '../data/journalStore'
import { CropFrame, TILE_RATIO } from './PhotoShape'
import { autoCropPosition } from '../lib/autoCrop'
import { saveMediaEntries } from '../lib/journalSave'
import { photoTakenAt, toDateInput, fromDateInput } from '../lib/photoDate'
import MediaStrip from './MediaStrip'

// The one "add a memory" form, opened as a bottom sheet from Home and from
// the Journal. Photo(s) or a video with a drag frame, the date it happened,
// and a note. Several photos save as several entries sharing the note.
//   onSaved — called with { blob, title, ts, position } of the first photo
//             (null if the memory was a note only) once everything is stored
// `initialFiles` lets a caller open the picker itself (inside the tap, as
// browsers require) and hand the files over; `autoFocusNote` opens straight
// into writing.
export default function MemoryForm({ profile, onClose, onSaved, initialFiles = [], autoFocusNote = false }) {
  const [files, setFiles] = useState(initialFiles)
  const file = files.length === 1 ? files[0] : null   // single pick gets the crop step
  const [previewUrl, setPreviewUrl] = useState(null)
  const [position, setPosition] = useState('50% 50%')
  const [fileDates, setFileDates] = useState([])     // per-file timestamps from the photos
  const [date, setDate] = useState(() => toDateInput(Date.now()))
  const [dateTouched, setDateTouched] = useState(false)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isVideo = isVideoType(file?.type)
  const babyName = (profile?.babyName || '').trim() || 'your baby'
  const today = toDateInput(Date.now())

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Single pick: preview + auto-crop guess.
  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPosition('50% 50%')
    if (!isVideoType(file.type)) autoCropPosition(file, TILE_RATIO).then(setPosition)
    return () => URL.revokeObjectURL(url)
  }, [file])

  // Every pick: read when the photos were taken and pre-fill the date from
  // the first one, unless she has already set a date herself.
  useEffect(() => {
    let cancelled = false
    if (files.length === 0) { setFileDates([]); return }
    Promise.all(files.map(f => photoTakenAt(f))).then(dates => {
      if (cancelled) return
      setFileDates(dates)
      if (!dateTouched && dates[0]) setDate(toDateInput(dates[0]))
    })
    return () => { cancelled = true }
  }, [files]) // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = Boolean(files.length || note.trim()) && !saving

  async function handleSave() {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      const text = note.trim()
      let first = null
      if (files.length === 0) {
        const ts = fromDateInput(date)
        await addEntry({ note: text, photoBlob: null, photoType: null, createdAt: ts })
      } else {
        // She set a date → every entry gets it. Otherwise each photo keeps its own.
        const options = dateTouched
          ? { createdAt: fromDateInput(date) }
          : { dates: fileDates }
        const saved = await saveMediaEntries(files, text, file ? { 0: position } : {}, options)
        const photo = saved.find(s => !s.isVideo)
        if (photo) first = { blob: photo.blob, title: text, ts: photo.createdAt, position: photo.position }
      }
      onSaved?.(first)
    } catch (err) {
      console.error('Save failed', err)
      setError(err?.name === 'QuotaExceededError'
        ? "There's no room left on this device for another memory. Try deleting an older video."
        : 'Could not save that memory. Please try again.')
      setSaving(false)
    }
  }

  // Every pick adds to what she already has, so she can take one photo,
  // then another, then a few from the library. Clearing the input lets the
  // same file be picked again after a remove.
  function addFiles(e) {
    const picked = Array.from(e.target.files || [])
    e.target.value = ''
    if (picked.length) setFiles(prev => [...prev, ...picked])
  }

  function removeFile(index) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const pickBtn = {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
    padding: '11px 8px', borderRadius: '10px', background: '#ede9fe', color: '#6d28d9',
    fontSize: '13px', fontWeight: 600, cursor: 'pointer', textAlign: 'center',
  }

  const field = {
    width: '100%', padding: '11px 12px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff',
    color: '#1a1a2e',
  }
  const label = { display: 'block', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }

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
          width: '100%', maxWidth: '480px', maxHeight: '92vh',
          background: '#faf9ff', borderRadius: '24px 24px 0 0',
          padding: '18px 18px calc(16px + env(safe-area-inset-bottom))',
          overflowY: 'auto', boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
          animation: 'fadeIn 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e1b4b' }}>
            ＋ A moment for the journal
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

        {/* Media: photos from the camera one at a time, or several from the library. */}
        {files.length > 1 ? (
          <div style={{ marginBottom: '6px' }}>
            <MediaStrip files={files} onRemove={removeFile} />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              {files.length} photos — each saves as its own memory with this note.
            </p>
          </div>
        ) : previewUrl ? (
          // Outside the label so a drag doesn't reopen the file picker.
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '6px', background: '#fff', position: 'relative' }}>
            {isVideo
              ? <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: '300px', display: 'block', background: '#000' }} />
              // Tiles are 4:5 — drag to choose what they show.
              : <CropFrame url={previewUrl} ratio={TILE_RATIO} position={position} onChange={setPosition} />}
            <button
              onClick={() => removeFile(0)}
              aria-label="Remove this photo"
              style={{
                position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px',
                borderRadius: '50%', border: 'none', background: 'rgba(30,27,75,0.6)', color: '#fff',
                fontSize: '16px', lineHeight: 1, cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        ) : null}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px',
          ...(files.length === 0 ? { border: '1.5px dashed #c4b5fd', borderRadius: '12px', padding: '14px', background: '#fff' } : {}),
        }}>
          <label htmlFor="memory-form-camera" style={pickBtn}>
            📷 {files.length ? 'Take another' : 'Take a photo'}
          </label>
          <label htmlFor="memory-form-library" style={pickBtn}>
            🖼️ {files.length ? 'Add from library' : 'Choose from library'}
          </label>
        </div>
        {/* capture="environment" opens the rear camera directly on phones
            (desktop ignores it and shows the normal picker). */}
        <input
          id="memory-form-camera"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={addFiles}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />
        <input
          id="memory-form-library"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={addFiles}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
        />

        {/* When */}
        <div style={{ marginBottom: '12px' }}>
          <span style={label}>When was this?</span>
          <input
            type="date"
            value={date}
            max={today}
            onChange={e => { setDate(e.target.value); setDateTouched(true) }}
            style={field}
          />
          {files.length > 1 && !dateTouched && (
            <p style={{ margin: '5px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              Each photo keeps its own date. Change this to set one date for all of them.
            </p>
          )}
        </div>

        {/* Note */}
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder={`What happened with ${babyName}?`}
          rows={3}
          autoFocus={autoFocusNote}
          style={{ ...field, resize: 'vertical', marginBottom: '12px' }}
        />

        {error && (
          <p style={{
            margin: '0 0 10px', fontSize: '12.5px', color: '#b91c1c',
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 10px',
          }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1, padding: '12px', borderRadius: '12px', border: '1.5px solid #E5E7EB',
              background: '#fff', color: '#555', fontSize: '14px', fontWeight: 600,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2, padding: '12px', borderRadius: '12px', border: 'none',
              background: canSave ? 'linear-gradient(135deg, #7C6FF7, #a78bfa)' : '#E5E7EB',
              color: '#fff', fontSize: '14px', fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed', fontFamily: 'inherit',
            }}
          >
            {saving ? 'Saving…' : 'Save to journal'}
          </button>
        </div>
      </div>
    </div>
  )
}
