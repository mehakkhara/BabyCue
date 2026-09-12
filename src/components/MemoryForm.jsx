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
export default function MemoryForm({ profile, onClose, onSaved }) {
  const [files, setFiles] = useState([])
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

        {/* Media */}
        {files.length > 1 ? (
          <div style={{ marginBottom: '6px' }}>
            <MediaStrip files={files} />
            <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#9ca3af' }}>
              {files.length} photos — each saves as its own memory with this note.
            </p>
          </div>
        ) : previewUrl ? (
          // Outside the label so a drag doesn't reopen the file picker.
          <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '6px', background: '#fff' }}>
            {isVideo
              ? <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: '300px', display: 'block', background: '#000' }} />
              // Tiles are 4:5 — drag to choose what they show.
              : <CropFrame url={previewUrl} ratio={TILE_RATIO} position={position} onChange={setPosition} />}
          </div>
        ) : (
          <label
            htmlFor="memory-form-input"
            style={{
              display: 'block', border: '1.5px dashed #c4b5fd', borderRadius: '12px',
              padding: '26px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px', background: '#fff',
            }}
          >
            <span style={{ color: '#7c3aed', fontSize: '13px', fontWeight: 600 }}>📷 Tap to add photos or a video</span>
          </label>
        )}
        {files.length > 0 && (
          <label
            htmlFor="memory-form-input"
            style={{ display: 'block', marginBottom: '12px', fontSize: '12px', fontWeight: 600, color: '#7C3AED', cursor: 'pointer', textAlign: 'center' }}
          >
            {files.length > 1 ? 'Choose different photos' : 'Choose a different photo'}
          </label>
        )}
        <input
          id="memory-form-input"
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={e => setFiles(Array.from(e.target.files || []))}
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
