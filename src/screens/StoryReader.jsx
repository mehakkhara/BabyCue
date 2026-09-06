import { useEffect, useRef, useState } from 'react'
import PaintingCanvas from '../components/PaintingCanvas'
import { PAINTINGS } from '../data/paintings'
import { renderSegments } from '../lib/storyText'
import { markRead } from '../lib/storyProgress'

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif"

// The reader stays dark whatever the rest of the app is doing. It's read in a
// dark room at 8pm; a bright screen defeats the purpose.
const NIGHT = '#10131f'
const GLOW = '#f3e6c8'
const GOLD = '#e8b13d'

export default function StoryReader({ story, profile, onClose }) {
  const [page, setPage] = useState(0)
  const [hint, setHint] = useState(true)
  const textRef = useRef(null)
  const touchX = useRef(0)

  const total = story.pages.length
  const current = story.pages[page]
  const art = PAINTINGS[current.art]
  const isLast = page === total - 1

  // Mark read once the last page is reached, not on open — opening and backing
  // out shouldn't count.
  useEffect(() => {
    if (isLast) markRead(story.id)
  }, [isLast, story.id])

  useEffect(() => {
    const t = setTimeout(() => setHint(false), 3200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (textRef.current) textRef.current.scrollTop = 0
  }, [page])

  function next() {
    if (page < total - 1) setPage(p => p + 1)
    else onClose()
  }

  function prev() {
    if (page > 0) setPage(p => p - 1)
    else onClose()
  }

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // Lock the page behind the reader so the story doesn't scroll the shelf.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prevOverflow }
  }, [])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
      onTouchStart={e => { touchX.current = e.changedTouches[0].clientX }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 55) (dx < 0 ? next : prev)()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        backgroundColor: NIGHT,
        color: GLOW,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{
        maxWidth: '480px',
        width: '100%',
        margin: '0 auto',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}>
        {/* Painting */}
        <div style={{ position: 'relative', flex: '0 0 auto', height: '46dvh', overflow: 'hidden' }}>
          <PaintingCanvas id={current.art} />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(to bottom, rgba(16,19,31,.22) 0%, rgba(16,19,31,0) 34%, ${NIGHT} 100%)`,
            pointerEvents: 'none',
          }} />
          {/* Museum wall label */}
          <div style={{
            position: 'absolute',
            left: 0, right: 0, bottom: '9px',
            textAlign: 'center',
            padding: '0 22px',
            fontFamily: SERIF,
            fontSize: '11.5px',
            fontStyle: 'italic',
            letterSpacing: '0.05em',
            color: 'rgba(243,230,200,0.62)',
          }}>
            {art.title}, {art.year}
            {'  ·  '}
            <span style={{ fontStyle: 'normal', letterSpacing: '0.09em', fontSize: '10.5px' }}>
              {art.collection}
            </span>
          </div>
        </div>

        {/* Story text */}
        <div
          ref={textRef}
          key={page}
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: '24px 30px 20px',
            fontFamily: SERIF,
            fontSize: '20px',
            lineHeight: 1.72,
            animation: 'fadeIn 0.5s ease both',
          }}
        >
          {current.text.map((line, i) => (
            <p key={i} style={{ margin: i === current.text.length - 1 ? 0 : '0 0 1.05em' }}>
              {renderSegments(line, profile).map((seg, j) => (
                seg.em
                  ? <em key={j} style={{ color: GOLD }}>{seg.text}</em>
                  : <span key={j}>{seg.text}</span>
              ))}
            </p>
          ))}
        </div>

        {/* Controls */}
        <div style={{
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px',
          padding: '12px 22px calc(16px + env(safe-area-inset-bottom))',
          borderTop: '1px solid rgba(243,230,200,0.09)',
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: '1px solid rgba(243,230,200,0.2)',
              color: 'rgba(243,230,200,0.8)',
              fontSize: '13px',
              fontFamily: 'inherit',
              padding: '7px 15px',
              borderRadius: '20px',
              cursor: 'pointer',
            }}
          >
            Shelf
          </button>

          <div style={{ display: 'flex', gap: '7px' }}>
            {story.pages.map((_, i) => (
              <span key={i} style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: i === page ? GOLD : 'rgba(243,230,200,0.24)',
                transform: i === page ? 'scale(1.35)' : 'none',
                transition: 'background-color .3s ease, transform .3s ease',
              }} />
            ))}
          </div>

          <button
            onClick={next}
            style={{
              border: 'none',
              backgroundColor: GOLD,
              color: NIGHT,
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'inherit',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
            }}
          >
            {isLast ? 'Goodnight' : 'Next'}
          </button>
        </div>
      </div>

      {/* Tap zones sit above the art and text but below the controls. */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: '74px', display: 'flex' }}>
        <button aria-label="Previous page" onClick={prev} style={tapZone(0.32)} />
        <button aria-label="Next page" onClick={next} style={tapZone(1)} />
      </div>

      {hint && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0, bottom: '84px',
          textAlign: 'center',
          fontSize: '11px',
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
          color: 'rgba(243,230,200,0.3)',
          pointerEvents: 'none',
        }}>
          Tap right to turn the page
        </div>
      )}
    </div>
  )
}

function tapZone(flex) {
  return {
    flex: flex === 1 ? 1 : `0 0 ${flex * 100}%`,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    WebkitTapHighlightColor: 'transparent',
  }
}
