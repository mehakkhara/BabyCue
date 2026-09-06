// Placeholder art for the goodnight stories.
//
// The real paintings are public domain and will ship as image files in
// public/art/ — until they do, this draws a soft abstract stand-in from each
// painting's actual palette and motif. It is deliberately impressionistic
// rather than an attempt to imitate the canvas: it exists so the reader can be
// designed and tested with the right colour and mood in place.
//
// To swap in the real images: add a `file` field to the painting in
// data/paintings.js. PaintingCanvas renders the <img> and never calls this.

import { PAINTINGS } from '../data/paintings'

// Deterministic per painting id, so a story looks the same every night.
function seeded(seed) {
  let s = 0
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

export function paintTo(canvas, paintingId) {
  const art = PAINTINGS[paintingId]
  if (!canvas || !art) return

  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const w = canvas.clientWidth || 320
  const h = canvas.clientHeight || 320
  canvas.width = Math.round(w * dpr)
  canvas.height = Math.round(h * dpr)

  const g = canvas.getContext('2d')
  if (!g) return
  g.setTransform(dpr, 0, 0, dpr, 0, 0)

  const r = seeded(paintingId)
  const pal = art.palette
  const pick = () => pal[Math.floor(r() * pal.length)]

  g.fillStyle = pal[0]
  g.fillRect(0, 0, w, h)

  function stroke(x, y, len, ang, wid, col, alpha) {
    g.save()
    g.globalAlpha = alpha
    g.strokeStyle = col
    g.lineWidth = wid
    g.lineCap = 'round'
    g.beginPath()
    g.moveTo(x, y)
    g.quadraticCurveTo(
      x + Math.cos(ang) * len * 0.5 + (r() - 0.5) * 12,
      y + Math.sin(ang) * len * 0.5 + (r() - 0.5) * 12,
      x + Math.cos(ang) * len,
      y + Math.sin(ang) * len,
    )
    g.stroke()
    g.restore()
  }

  let i, n

  switch (art.motif) {
    case 'swirl': {
      g.fillStyle = pal[1]
      g.fillRect(0, 0, w, h * 0.78)
      for (i = 0; i < 5; i++) {
        const cx = r() * w
        const cy = r() * h * 0.6
        const rad = 22 + r() * h * 0.22
        for (n = 0; n < 34; n++) {
          const a = (n / 34) * Math.PI * 4
          const fade = 1 - n / 60
          stroke(cx + Math.cos(a) * rad * fade, cy + Math.sin(a) * rad * 0.6 * fade,
            16 + r() * 16, a + 1.5, 3 + r() * 4, n % 3 ? pal[4] : pal[1], 0.5)
        }
      }
      for (i = 0; i < 11; i++) {
        const sx = r() * w, sy = r() * h * 0.55, sr = 5 + r() * 11
        const gd = g.createRadialGradient(sx, sy, 0, sx, sy, sr * 2.6)
        gd.addColorStop(0, pal[2])
        gd.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = gd
        g.beginPath(); g.arc(sx, sy, sr * 2.6, 0, 6.3); g.fill()
      }
      g.fillStyle = pal[3]
      g.beginPath()
      g.moveTo(0, h)
      for (i = 0; i <= 10; i++) g.lineTo((w * i) / 10, h * (0.74 + Math.sin(i) * 0.04))
      g.lineTo(w, h); g.closePath(); g.fill()
      break
    }

    case 'field': {
      for (i = 0; i < 5; i++) {
        g.globalAlpha = 0.9
        g.fillStyle = pal[i % pal.length]
        g.fillRect(0, h * (i / 5) * 1.05, w, h / 4)
      }
      g.globalAlpha = 1
      for (i = 0; i < 420; i++) {
        stroke(r() * w, h * 0.28 + r() * h * 0.72, 8 + r() * 16,
          Math.PI / 2 + (r() - 0.5) * 0.7, 1.5 + r() * 3, pick(), 0.45)
      }
      break
    }

    case 'blossom': {
      const bg = g.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, pal[1]); bg.addColorStop(1, pal[0])
      g.fillStyle = bg; g.fillRect(0, 0, w, h)
      for (i = 0; i < 9; i++) {
        stroke(r() * w, h, h * (0.5 + r() * 0.5),
          -Math.PI / 2 + (r() - 0.5) * 1.4, 4 + r() * 7, pal[4], 0.75)
      }
      for (i = 0; i < 190; i++) {
        g.globalAlpha = 0.55 + r() * 0.4
        g.fillStyle = r() > 0.4 ? pal[2] : pal[3]
        g.beginPath()
        g.ellipse(r() * w, r() * h, 3 + r() * 8, 2 + r() * 5, r() * 6, 0, 6.3)
        g.fill()
      }
      g.globalAlpha = 1
      break
    }

    case 'flowers': {
      g.fillStyle = pal[4]; g.fillRect(0, 0, w, h)
      g.fillStyle = pal[0]; g.fillRect(0, h * 0.62, w, h * 0.38)
      for (i = 0; i < 30; i++) {
        const fx = w * 0.1 + r() * w * 0.8
        const fy = h * 0.12 + r() * h * 0.55
        stroke(fx, fy, 30 + r() * 40, Math.PI / 2, 3, pal[3], 0.6)
        for (n = 0; n < 9; n++) {
          g.globalAlpha = 0.85
          g.fillStyle = n % 2 ? pal[1] : pal[2]
          g.beginPath()
          g.ellipse(fx + Math.cos(n) * 11, fy + Math.sin(n) * 11, 8, 4, n, 0, 6.3)
          g.fill()
        }
      }
      g.globalAlpha = 1
      break
    }

    case 'sea': {
      const sg = g.createLinearGradient(0, 0, 0, h)
      sg.addColorStop(0, pal[0]); sg.addColorStop(0.55, pal[3]); sg.addColorStop(1, pal[1])
      g.fillStyle = sg; g.fillRect(0, 0, w, h)
      for (i = 0; i < 200; i++) {
        stroke(r() * w, h * 0.1 + r() * h * 0.5, 14 + r() * 26,
          (r() - 0.5) * 0.3, 2 + r() * 3, r() > 0.5 ? pal[0] : pal[4], 0.4)
      }
      for (i = 0; i < 4; i++) {
        const bx = w * (0.12 + i * 0.24)
        const by = h * (0.62 + r() * 0.2)
        g.fillStyle = [pal[2], pal[3], pal[0], pal[4]][i]
        g.beginPath()
        g.moveTo(bx - 26, by); g.lineTo(bx + 26, by)
        g.lineTo(bx + 16, by + 13); g.lineTo(bx - 16, by + 13)
        g.closePath(); g.fill()
        stroke(bx, by, 46, -Math.PI / 2 - 0.15, 3, pal[4], 0.85)
      }
      break
    }

    case 'interior': {
      g.fillStyle = pal[0]; g.fillRect(0, 0, w, h)
      g.fillStyle = pal[4]; g.fillRect(0, h * 0.58, w, h * 0.42)
      g.fillStyle = pal[3]
      g.fillRect(w * 0.06, h * 0.16, w * 0.16, h * 0.4)
      g.fillRect(w * 0.78, h * 0.16, w * 0.16, h * 0.4)
      g.fillStyle = pal[2]
      g.beginPath()
      g.moveTo(w * 0.22, h * 0.62); g.lineTo(w * 0.88, h * 0.55)
      g.lineTo(w * 0.92, h * 0.86); g.lineTo(w * 0.18, h * 0.95)
      g.closePath(); g.fill()
      g.fillStyle = pal[1]
      g.beginPath(); g.ellipse(w * 0.34, h * 0.6, w * 0.09, h * 0.05, -0.1, 0, 6.3); g.fill()
      for (i = 0; i < 220; i++) {
        stroke(r() * w, r() * h, 8 + r() * 14, (r() - 0.5) * 0.6, 1.5 + r() * 2, pick(), 0.16)
      }
      break
    }

    case 'nightstreet': {
      g.fillStyle = pal[1]; g.fillRect(0, 0, w, h)
      const lg = g.createRadialGradient(w * 0.34, h * 0.34, 6, w * 0.34, h * 0.34, w * 0.66)
      lg.addColorStop(0, pal[0]); lg.addColorStop(0.45, pal[3]); lg.addColorStop(1, 'rgba(0,0,0,0)')
      g.fillStyle = lg; g.fillRect(0, 0, w, h)
      g.fillStyle = pal[2]
      g.beginPath()
      g.moveTo(0, h); g.lineTo(w, h); g.lineTo(w, h * 0.62); g.lineTo(0, h * 0.78)
      g.closePath(); g.fill()
      for (i = 0; i < 16; i++) {
        const stx = r() * w, sty = r() * h * 0.35
        const sgd = g.createRadialGradient(stx, sty, 0, stx, sty, 9)
        sgd.addColorStop(0, pal[3]); sgd.addColorStop(1, 'rgba(0,0,0,0)')
        g.fillStyle = sgd
        g.beginPath(); g.arc(stx, sty, 9, 0, 6.3); g.fill()
      }
      break
    }

    case 'snow': {
      g.fillStyle = pal[3]; g.fillRect(0, 0, w, h * 0.34)
      g.fillStyle = pal[0]; g.fillRect(0, h * 0.3, w, h * 0.7)
      for (i = 0; i < 240; i++) {
        stroke(r() * w, h * 0.34 + r() * h * 0.66, 12 + r() * 30,
          (r() - 0.5) * 0.4, 1.5 + r() * 3, r() > 0.7 ? pal[4] : pal[1], 0.4)
      }
      g.fillStyle = pal[2]
      g.beginPath()
      g.moveTo(w * 0.56, h * 0.44); g.lineTo(w * 0.86, h * 0.4)
      g.lineTo(w * 0.88, h * 0.5); g.lineTo(w * 0.56, h * 0.53)
      g.closePath(); g.fill()
      break
    }

    case 'tree': {
      const tg = g.createLinearGradient(0, 0, 0, h)
      tg.addColorStop(0, pal[3]); tg.addColorStop(1, pal[4])
      g.fillStyle = tg; g.fillRect(0, 0, w, h)
      g.fillStyle = pal[2]
      g.fillRect(w * 0.46, h * 0.55, w * 0.08, h * 0.45)
      for (i = 0; i < 340; i++) {
        const ta = r() * 6.3
        const td = r() * Math.min(w, h) * 0.4
        g.globalAlpha = 0.55 + r() * 0.4
        g.fillStyle = r() > 0.45 ? pal[0] : pal[1]
        g.beginPath()
        g.ellipse(w * 0.5 + Math.cos(ta) * td, h * 0.42 + Math.sin(ta) * td * 0.72,
          4 + r() * 7, 3 + r() * 5, ta, 0, 6.3)
        g.fill()
      }
      g.globalAlpha = 1
      break
    }

    default:
      break
  }

  // Shared canvas grain, so the flat fills don't read as digital.
  g.globalAlpha = 0.05
  for (i = 0; i < 900; i++) {
    g.fillStyle = i % 2 ? '#fff' : '#000'
    g.fillRect(r() * w, r() * h, 1.4, 1.4)
  }
  g.globalAlpha = 1
}
