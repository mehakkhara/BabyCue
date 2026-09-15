// Small play/pause pill for a recorded moment. Used on journal tiles and in
// the opened memory. One <audio> per player; the URL is an object URL the
// parent owns.
import { useEffect, useRef, useState } from 'react'
import { color, gradient } from '../theme'

function fmt(s) {
  if (!isFinite(s) || s < 0) return '0:00'
  const m = Math.floor(s / 60), r = Math.floor(s % 60)
  return `${m}:${String(r).padStart(2, '0')}`
}

export default function AudioPlayer({ url, compact = false, durationHint = null }) {
  const ref = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [time, setTime] = useState(0)
  const [duration, setDuration] = useState(durationHint || 0)

  useEffect(() => {
    const a = ref.current
    if (!a) return
    const onTime = () => setTime(a.currentTime)
    const onMeta = () => { if (isFinite(a.duration)) setDuration(a.duration) }
    const onEnd = () => { setPlaying(false); setTime(0) }
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('durationchange', onMeta)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('durationchange', onMeta)
      a.removeEventListener('ended', onEnd)
    }
  }, [url])

  function toggle(e) {
    e.stopPropagation()
    const a = ref.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) }
    else { a.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0
  const size = compact ? 34 : 44

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: compact ? '8px' : '12px' }}>
      <audio ref={ref} src={url} preload="metadata" />
      <button onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} style={{
        width: size, height: size, borderRadius: '50%', border: 'none', flexShrink: 0,
        background: gradient.primary, color: '#fff', fontSize: compact ? '13px' : '16px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: playing ? 0 : '2px',
      }}>
        {playing ? '❚❚' : '▶'}
      </button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: '6px', borderRadius: '3px', background: color.tint, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color.primary, transition: 'width 0.2s linear' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: compact ? '10px' : '11px', color: color.faint, fontWeight: 600 }}>
          <span>{fmt(time)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  )
}
