import { useEffect, useRef } from 'react'
import { PAINTINGS } from '../data/paintings'
import { paintTo } from '../lib/paintingCanvas'

/**
 * Shows a painting. Renders the real image once `file` exists on the painting
 * in data/paintings.js; until then, draws the placeholder from its palette.
 *
 * `style` is spread last so callers control sizing and radius.
 */
export default function PaintingCanvas({ id, alt = '', style = {} }) {
  const ref = useRef(null)
  const painting = PAINTINGS[id]
  const file = painting?.file

  useEffect(() => {
    if (file) return
    const el = ref.current
    if (!el) return

    let frame = requestAnimationFrame(() => paintTo(el, id))

    // Redraw on resize so the canvas doesn't stretch — debounced, because
    // iOS fires resize on every scroll that moves the address bar.
    let timer
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(() => paintTo(el, id), 180)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      window.removeEventListener('resize', onResize)
    }
  }, [id, file])

  if (!painting) return null

  if (file) {
    return (
      <img
        src={file}
        alt={alt || painting.title}
        style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', ...style }}
      />
    )
  }

  return (
    <canvas
      ref={ref}
      role="img"
      aria-label={alt || painting.title}
      style={{ display: 'block', width: '100%', height: '100%', ...style }}
    />
  )
}
