// "Record a moment" — a voice note saved into the journal like a photo would
// be. Uses MediaRecorder; the blob is stored in the same IndexedDB slot as
// photos and videos (photoType carries the audio MIME type).
// Needs a secure context on the phone (HTTPS or localhost) for the microphone.
import { useEffect, useRef, useState } from 'react'
import { addEntry } from '../data/journalStore'
import { toDateInput, fromDateInput } from '../lib/photoDate'
import AudioPlayer from './AudioPlayer'
import { color, gradient, type } from '../theme'

export const VOICE_SOURCE = 'voice'

function pickMime() {
  if (typeof MediaRecorder === 'undefined') return null
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus']) {
    if (MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

function fmt(s) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

const MAX_SECONDS = 180

export default function VoiceMemo({ profile, onClose, onSaved }) {
  const babyName = (profile?.babyName || '').trim() || 'your baby'
  const supported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && pickMime() !== null
  const [phase, setPhase] = useState('idle')      // idle | recording | review | saving
  const [seconds, setSeconds] = useState(0)
  const [blob, setBlob] = useState(null)
  const [url, setUrl] = useState(null)
  const [note, setNote] = useState('')
  const [date, setDate] = useState(() => toDateInput(Date.now()))
  const [error, setError] = useState('')
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
      stopStream()
      if (url) URL.revokeObjectURL(url)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function stopStream() {
    clearInterval(timerRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  async function start() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mime = pickMime()
      const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
      chunksRef.current = []
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      rec.onstop = () => {
        const type = (rec.mimeType || mime || 'audio/webm').split(';')[0]
        const b = new Blob(chunksRef.current, { type })
        setBlob(b)
        setUrl(URL.createObjectURL(b))
        setPhase('review')
        stopStream()
      }
      recRef.current = rec
      rec.start(250)
      setSeconds(0)
      setPhase('recording')
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= MAX_SECONDS) stop()
          return s + 1
        })
      }, 1000)
    } catch (err) {
      console.error('Microphone failed:', err)
      setError(err?.name === 'NotAllowedError'
        ? 'Microphone access was blocked. Allow it in your browser settings to record.'
        : 'Could not start recording on this device.')
    }
  }

  function stop() {
    clearInterval(timerRef.current)
    const rec = recRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
  }

  function discard() {
    if (url) URL.revokeObjectURL(url)
    setBlob(null); setUrl(null); setSeconds(0); setPhase('idle')
  }

  async function save() {
    if (!blob || phase === 'saving') return
    setPhase('saving')
    try {
      const ts = fromDateInput(date, Date.now())
      await addEntry({
        note: note.trim(),
        photoBlob: blob,
        photoType: blob.type || 'audio/webm',
        createdAt: ts,
        source: VOICE_SOURCE,
      })
      onSaved?.()
    } catch (err) {
      console.error('Voice memo save failed:', err)
      setError('Could not save the recording. Please try again.')
      setPhase('review')
    }
  }

  const field = {
    width: '100%', padding: '11px 12px', borderRadius: '12px', border: '1.5px solid #ddd6fe',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', color: color.ink,
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(30,27,75,0.45)', zIndex: 150, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: '480px', background: color.sheet, borderRadius: '24px 24px 0 0',
        padding: '18px 18px calc(18px + env(safe-area-inset-bottom))', boxShadow: '0 -8px 40px rgba(100,100,180,0.25)', animation: 'fadeIn 0.2s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
          <h2 style={{ ...type.h2, fontSize: '18px' }}>🎙️ Record a moment</h2>
          <button onClick={onClose} aria-label="Close" style={{ border: 'none', background: '#ece9f6', borderRadius: '50%', width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer', color: color.muted, lineHeight: 1 }}>×</button>
        </div>
        <p style={{ ...type.small, marginBottom: '16px' }}>
          A giggle, a first word, or just you telling {babyName} about today. Up to three minutes.
        </p>

        {!supported ? (
          <p style={{ ...type.body, background: color.warnBg, border: `1px solid ${color.warnBorder}`, color: color.warn, borderRadius: '12px', padding: '12px 14px' }}>
            This browser can't record audio. On the phone this needs the installed app or an https link.
          </p>
        ) : phase === 'idle' || phase === 'recording' ? (
          <div style={{ textAlign: 'center', padding: '10px 0 6px' }}>
            <div style={{ fontSize: '34px', fontWeight: 700, color: color.ink, letterSpacing: '0.02em', fontVariantNumeric: 'tabular-nums' }}>{fmt(seconds)}</div>
            <p style={{ ...type.small, marginTop: '2px', marginBottom: '18px' }}>{phase === 'recording' ? 'Recording…' : 'Tap to start'}</p>
            <button onClick={phase === 'recording' ? stop : start} aria-label={phase === 'recording' ? 'Stop' : 'Record'} style={{
              width: 76, height: 76, borderRadius: '50%', border: phase === 'recording' ? `4px solid ${color.tint}` : 'none',
              background: phase === 'recording' ? '#fff' : gradient.primary, cursor: 'pointer',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: phase === 'recording' ? '0 0 0 8px rgba(124,111,247,0.15)' : '0 8px 24px rgba(124,111,247,0.35)',
            }}>
              {phase === 'recording'
                ? <span style={{ width: 24, height: 24, borderRadius: 6, background: '#e11d48' }} />
                : <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#fff' }} />}
            </button>
          </div>
        ) : (
          <>
            <div style={{ background: '#fff', borderRadius: '16px', padding: '14px' }}>
              <AudioPlayer url={url} durationHint={seconds} />
            </div>
            <label style={{ display: 'block', margin: '14px 0 10px' }}>
              <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: color.faint, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>When was this?</span>
              <input type="date" value={date} max={toDateInput(Date.now())} onChange={e => setDate(e.target.value)} style={field} />
            </label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder={`What is this moment? (optional)`} rows={2} style={{ ...field, resize: 'vertical', marginBottom: '12px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={discard} disabled={phase === 'saving'} style={{ flex: 1, padding: '13px', borderRadius: '14px', border: '1.5px solid #E6E3F0', background: '#fff', color: color.ink, fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Record again</button>
              <button onClick={save} disabled={phase === 'saving'} style={{ flex: 2, padding: '13px', borderRadius: '14px', border: 'none', background: gradient.primary, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>{phase === 'saving' ? 'Saving…' : 'Save to journal'}</button>
            </div>
          </>
        )}

        {error && (
          <p style={{ margin: '12px 0 0', fontSize: '12.5px', color: color.danger, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '8px 10px' }}>{error}</p>
        )}
      </div>
    </div>
  )
}
