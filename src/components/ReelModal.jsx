import { useEffect, useMemo, useRef, useState } from 'react'
import { reelMonths, buildScene, drawPreview, makeReel, shareReel, reelDurationMs, canMakeReel, MIN_PHOTOS } from '../lib/reel'
import { CropFrame } from './PhotoShape'

// Month reel: pick a month, tap any photo to edit its caption, framing or
// place in the order (or leave it out), choose whether your voice memos
// narrate it, then record. Edits live only in the reel; the journal entry
// is untouched. The canvas is the live preview
// while it records; the finished video plays back in its place.
//   entries — the journal, as JournalScreen already has it (with photoBlob)
//   profile — for the baby's name and date of birth
//   urls    — the Journal's object URLs by entry id (thumbnails and crop frames)
//   initialMonth — month key to open on
export default function ReelModal({ entries, profile, urls, initialMonth, onClose }) {
  const months = useMemo(() => reelMonths(entries, profile?.dateOfBirth), [entries, profile?.dateOfBirth])
  const [monthKey, setMonthKey] = useState(() => (initialMonth && months.some(m => m.key === initialMonth) ? initialMonth : months[0]?.key || null))
  const [excluded, setExcluded] = useState(() => new Set())
  const [edits, setEdits] = useState(() => new Map())   // id → { note?, position? }, reel-only
  const [order, setOrder] = useState(null)              // ids in reel order; null = the month's own order
  const [editing, setEditing] = useState(null)          // entry id open in the edit sheet
  const [previewIndex, setPreviewIndex] = useState(0)
  const [voice, setVoice] = useState(true)
  const [status, setStatus] = useState('setup')     // setup | loading | making | done | error
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)        // { blob, ext, url }
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')
  const canvasRef = useRef(null)
  const sceneRef = useRef(null)
  const abortRef = useRef(null)

  const month = months.find(m => m.key === monthKey) || null
  // Every photo of the month in reel order, with her edits laid over the entry.
  const ordered = useMemo(() => {
    if (!month) return []
    const byId = new Map(month.photos.map(p => [p.id, p]))
    const ids = order ? order.filter(id => byId.has(id)) : month.photos.map(p => p.id)
    for (const p of month.photos) if (!ids.includes(p.id)) ids.push(p.id)
    return ids.map(id => ({ ...byId.get(id), ...(edits.get(id) || {}) }))
  }, [month, order, edits])
  const photos = useMemo(() => ordered.filter(p => !excluded.has(p.id)), [ordered, excluded])
  const memos = month?.memos || []
  const seconds = Math.round(reelDurationMs(photos.length) / 1000)
  const supported = canMakeReel()

  useEffect(() => () => { abortRef.current?.abort() }, [])
  useEffect(() => () => { if (result?.url) URL.revokeObjectURL(result.url) }, [result])

  // A still preview whenever the selection changes (not while recording).
  useEffect(() => {
    if (!month || status === 'making' || status === 'done') return
    if (photos.length < MIN_PHOTOS) return
    let cancelled = false
    setStatus('loading')
    buildScene({
      photos, memos, babyName: profile?.babyName, dateOfBirth: profile?.dateOfBirth,
      monthName: month.monthName, monthLabel: month.monthLabel,
    }).then(scene => {
      if (cancelled) return
      sceneRef.current = scene
      if (canvasRef.current) drawPreview(canvasRef.current, scene, previewIndex)
      setStatus('setup')
    }).catch(err => {
      if (cancelled) return
      setError(err?.message || 'Could not load the photos')
      setStatus('error')
    })
    return () => { cancelled = true }
  }, [month, photos, memos, previewIndex, profile?.babyName, profile?.dateOfBirth]) // eslint-disable-line react-hooks/exhaustive-deps

  function setExcludedFor(id, out) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (out && photos.length > MIN_PHOTOS) next.add(id)
      if (!out) next.delete(id)
      return next
    })
  }
  function editPhoto(id, patch) {
    setEdits(prev => {
      const next = new Map(prev)
      next.set(id, { ...(next.get(id) || {}), ...patch })
      return next
    })
  }
  // Move a photo one step earlier or later in the reel.
  function move(id, dir) {
    const ids = ordered.map(p => p.id)
    const i = ids.indexOf(id)
    const j = i + dir
    if (i < 0 || j < 0 || j >= ids.length) return
    ids.splice(i, 1)
    ids.splice(j, 0, id)
    setOrder(ids)
  }
  function openEdit(id) {
    setEditing(id)
    const k = photos.findIndex(p => p.id === id)
    if (k >= 0) setPreviewIndex(k)
  }

  function pickMonth(key) {
    setMonthKey(key)
    setExcluded(new Set())
    setEdits(new Map())
    setOrder(null)
    setPreviewIndex(0)
    setResult(null)
    setOutcome('')
    setStatus('setup')
  }

  async function make() {
    const scene = sceneRef.current
    if (!scene || !canvasRef.current) return
    setError('')
    setOutcome('')
    setResult(null)
    setProgress(0)
    setStatus('making')
    const ac = new AbortController()
    abortRef.current = ac
    try {
      const out = await makeReel({
        canvas: canvasRef.current, scene, voice: voice && memos.length > 0,
        onProgress: (t, total) => setProgress(t / total),
        signal: ac.signal,
      })
      setResult({ ...out, url: URL.createObjectURL(out.blob) })
      setStatus('done')
    } catch (err) {
      if (err?.name === 'AbortError') { setStatus('setup'); return }
      setError(err?.message || 'Could not make the reel')
      setStatus('error')
    }
  }

  async function share() {
    if (!result) return
    const r = await shareReel(result.blob, result.ext, `${month.monthName} ${month.key.slice(0, 4)}`)
    setOutcome(r === 'shared' ? 'Shared 💜' : r === 'downloaded' ? 'Saved to your downloads' : '')
  }

  function again() {
    abortRef.current?.abort()
    setResult(null)
    setOutcome('')
    setStatus('setup')
    if (sceneRef.current && canvasRef.current) drawPreview(canvasRef.current, sceneRef.current)
  }

  const chip = on => ({
    flex: 'none', padding: '8px 14px', borderRadius: '999px', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    background: on ? 'rgba(124,111,247,0.45)' : 'rgba(255,255,255,0.08)',
    border: `1.5px solid ${on ? '#a78bfa' : 'rgba(255,255,255,0.15)'}`, color: on ? '#fff' : '#d4d2e3',
  })
  const btn = {
    flex: 1, padding: '14px 10px', borderRadius: '14px', border: 'none', fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  }
  const busy = status === 'making' || status === 'loading'

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0f0f1a', zIndex: 150, color: '#fff', overflowY: 'auto', animation: 'fadeIn 0.2s ease' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: 'calc(14px + env(safe-area-inset-top)) 18px calc(20px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>Month reel</h2>
            {month && (
              <p style={{ margin: '3px 0 0', fontSize: '12.5px', color: '#9d9bb5' }}>
                {photos.length} photos{memos.length ? ` · ${memos.length} voice ${memos.length === 1 ? 'memo' : 'memos'}` : ''} · about {seconds}s
              </p>
            )}
          </div>
          <button onClick={() => { abortRef.current?.abort(); onClose() }} aria-label="Close" style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }}>×</button>
        </div>

        {!supported ? (
          <p style={{ color: '#d4d2e3', lineHeight: 1.5 }}>This browser can't record video. On an iPhone, open the app in Safari or from the home screen.</p>
        ) : months.length === 0 ? (
          <p style={{ color: '#d4d2e3', lineHeight: 1.5 }}>A reel needs at least {MIN_PHOTOS} photos in one month. Add a few more memories and come back.</p>
        ) : (
          <>
            {/* Month chips */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '12px', scrollbarWidth: 'none' }}>
              {months.map(m => (
                <button key={m.key} onClick={() => !busy && pickMonth(m.key)} style={chip(m.key === monthKey)}>
                  {m.monthLabel}
                </button>
              ))}
            </div>

            {/* Preview: the canvas while setting up and recording, the video once done */}
            <div style={{ position: 'relative', width: 'min(62vw, 250px)', aspectRatio: '9 / 16', margin: '0 auto 12px', borderRadius: '18px', overflow: 'hidden', background: '#1e1b4b', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: status === 'done' ? 'none' : 'block' }} />
              {status === 'done' && result && (
                <video src={result.url} controls playsInline autoPlay style={{ width: '100%', height: '100%', display: 'block', background: '#000' }} />
              )}
              {status === 'making' && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '4px', background: 'rgba(255,255,255,0.2)' }}>
                  <div style={{ width: `${Math.round(progress * 100)}%`, height: '100%', background: '#a78bfa' }} />
                </div>
              )}
            </div>

            {status === 'making' && (
              <p style={{ textAlign: 'center', fontSize: '13px', color: '#d4d2e3', margin: '0 0 12px' }}>
                Making your reel… {Math.round(progress * seconds)}s of {seconds}s. Keep the app open.
              </p>
            )}

            {/* Photo strip in reel order: tap one to edit it */}
            {status !== 'making' && status !== 'done' && month && (
              <>
                <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', marginBottom: '4px', scrollbarWidth: 'none' }}>
                  {ordered.map(p => {
                    const out = excluded.has(p.id)
                    const n = photos.findIndex(q => q.id === p.id) + 1
                    return (
                      <button key={p.id} onClick={() => openEdit(p.id)} aria-label="Edit this photo" style={{ flex: 'none', width: '54px', height: '72px', borderRadius: '8px', overflow: 'hidden', border: out ? '1.5px solid rgba(255,255,255,0.15)' : editing === p.id ? '2px solid #fff' : '2px solid #a78bfa', padding: 0, background: '#000', cursor: 'pointer', position: 'relative', opacity: out ? 0.35 : 1 }}>
                        <img src={urls.get(p.id)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: p.position || 'center', display: 'block' }} />
                        {out
                          ? <span style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff', fontSize: '18px' }}>×</span>
                          : <span style={{ position: 'absolute', left: '4px', top: '4px', fontSize: '9px', fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,0.55)', borderRadius: '999px', padding: '1px 5px' }}>{n}</span>}
                      </button>
                    )
                  })}
                </div>
                <p style={{ margin: '0 0 12px', fontSize: '11px', color: '#7d7b96', textAlign: 'center' }}>Tap a photo to change its caption, framing or order, or leave it out.</p>
              </>
            )}

            {memos.length > 0 && status !== 'making' && status !== 'done' && (
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                <button onClick={() => setVoice(true)} style={{ ...chip(voice), flex: 1, textAlign: 'center' }}>🎙️ Your voice</button>
                <button onClick={() => setVoice(false)} style={{ ...chip(!voice), flex: 1, textAlign: 'center' }}>Quiet</button>
              </div>
            )}

            {error && <p style={{ color: '#fca5a5', fontSize: '13px', margin: '0 0 10px' }}>{error}</p>}
            {outcome && <p style={{ color: '#c4b5fd', fontSize: '13px', margin: '0 0 10px', textAlign: 'center' }}>{outcome}</p>}

            <div style={{ display: 'flex', gap: '10px' }}>
              {status === 'done' ? (
                <>
                  <button onClick={again} style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Make another</button>
                  <button onClick={share} style={{ ...btn, background: 'linear-gradient(135deg,#8b7cf6,#7C3AED)', color: '#fff' }}>Share reel</button>
                </>
              ) : status === 'making' ? (
                <button onClick={() => abortRef.current?.abort()} style={{ ...btn, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>Cancel</button>
              ) : (
                <button onClick={make} disabled={busy || photos.length < MIN_PHOTOS} style={{ ...btn, background: 'linear-gradient(135deg,#8b7cf6,#7C3AED)', color: '#fff', opacity: busy ? 0.6 : 1 }}>
                  {status === 'loading' ? 'Loading photos…' : `Make reel · ${seconds}s`}
                </button>
              )}
            </div>
          </>
        )}
      </div>
      {editing && (() => {
        const p = ordered.find(x => x.id === editing)
        if (!p) return null
        const out = excluded.has(p.id)
        const idx = ordered.findIndex(x => x.id === p.id)
        const small = { flex: 1, padding: '11px 6px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '12.5px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }
        return (
          <div onClick={() => setEditing(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 160, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '480px', maxHeight: '92vh', overflowY: 'auto', background: '#1a1830', borderRadius: '24px 24px 0 0', padding: '18px 18px calc(16px + env(safe-area-inset-bottom))', boxShadow: '0 -8px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>Photo {idx + 1} of {ordered.length}</h3>
                <button onClick={() => setEditing(null)} aria-label="Done" style={{ border: 'none', background: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '50%', width: '30px', height: '30px', fontSize: '16px', cursor: 'pointer', lineHeight: 1 }}>×</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '14px', alignItems: 'start' }}>
                <CropFrame
                  url={urls.get(p.id)}
                  ratio={9 / 16}
                  position={p.position || '50% 50%'}
                  onChange={pos => editPhoto(p.id, { position: pos })}
                  style={{ borderRadius: '12px', background: '#000' }}
                />
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9d9bb5', marginBottom: '6px' }}>Caption</label>
                  <textarea
                    value={p.note || ''}
                    onChange={e => editPhoto(p.id, { note: e.target.value })}
                    placeholder="A few words for this moment"
                    rows={3}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', border: '1.5px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: '14px', fontFamily: 'inherit', resize: 'none', outline: 'none' }}
                  />
                  <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#7d7b96', lineHeight: 1.4 }}>Only in the reel. The journal keeps its own note and framing.</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button onClick={() => move(p.id, -1)} disabled={idx === 0} style={{ ...small, opacity: idx === 0 ? 0.4 : 1 }}>◀ Earlier</button>
                <button onClick={() => move(p.id, 1)} disabled={idx === ordered.length - 1} style={{ ...small, opacity: idx === ordered.length - 1 ? 0.4 : 1 }}>Later ▶</button>
                <button
                  onClick={() => setExcludedFor(p.id, !out)}
                  disabled={!out && photos.length <= MIN_PHOTOS}
                  style={{ ...small, color: out ? '#fff' : '#fca5a5', opacity: !out && photos.length <= MIN_PHOTOS ? 0.4 : 1 }}
                >
                  {out ? 'Put back' : 'Leave out'}
                </button>
              </div>
              <button onClick={() => setEditing(null)} style={{ ...btn, width: '100%', marginTop: '10px', background: 'linear-gradient(135deg,#8b7cf6,#7C3AED)', color: '#fff' }}>Done</button>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
