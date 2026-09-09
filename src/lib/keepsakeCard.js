// Keepsake card composition — turns a journal photo + headline into a designed,
// shareable image. Everything happens on a canvas on the device: no uploads,
// no image service, no cost. Output is a 1080×1350 (4:5) JPEG — the size
// every chat app and feed handles well.

const W = 1080
const H = 1350

export const KEEPSAKE_THEMES = [
  { id: 'lavender', label: 'Lavender', swatch: 'linear-gradient(135deg, #7C6FF7, #a78bfa)' },
  { id: 'sunset',   label: 'Sunset',   swatch: 'linear-gradient(135deg, #f472b6, #fbbf24)' },
  { id: 'midnight', label: 'Midnight', swatch: 'linear-gradient(135deg, #1e1b4b, #443a78)' },
]

const THEME_STYLES = {
  lavender: { overlay: '30,27,75',  accent: '#dcd6ff', badge: '#7C6FF7' },
  sunset:   { overlay: '157,23,77', accent: '#fde68a', badge: '#db2777' },
  midnight: { overlay: '4,6,20',    accent: '#e8b13d', badge: '#1e1b4b' },
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load photo'))
    img.src = url
  })
}

// Greedy word-wrap for canvas text; returns at most maxLines (last line
// ellipsized if the text overflows).
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = text.split(/\s+/)
  const lines = []
  let line = ''
  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word
    if (ctx.measureText(attempt).width <= maxWidth || !line) {
      line = attempt
    } else {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && line && lines[maxLines - 1] !== line) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) {
      last = last.slice(0, -1)
    }
    lines[maxLines - 1] = `${last}…`
  }
  return lines
}

export async function composeKeepsake({ photoUrl, title, subtitle, theme = 'lavender' }) {
  const style = THEME_STYLES[theme] || THEME_STYLES.lavender
  const img = await loadImage(photoUrl)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // Photo, cover-fit and centered.
  const scale = Math.max(W / img.width, H / img.height)
  const dw = img.width * scale
  const dh = img.height * scale
  ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)

  // Dusk gradient so the text always reads, whatever the photo.
  const grad = ctx.createLinearGradient(0, H * 0.38, 0, H)
  grad.addColorStop(0, `rgba(${style.overlay},0)`)
  grad.addColorStop(1, `rgba(${style.overlay},0.92)`)
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)

  // Small brand badge, top right.
  const badgeText = '✦ BabyCue'
  ctx.font = '600 34px Inter, system-ui, sans-serif'
  const bw = ctx.measureText(badgeText).width + 48
  const bx = W - bw - 40
  ctx.fillStyle = 'rgba(255,255,255,0.88)'
  if (ctx.roundRect) {
    ctx.beginPath()
    ctx.roundRect(bx, 40, bw, 64, 32)
    ctx.fill()
  } else {
    ctx.fillRect(bx, 40, bw, 64)
  }
  ctx.fillStyle = style.badge
  ctx.textBaseline = 'middle'
  ctx.fillText(badgeText, bx + 24, 40 + 33)

  // Milestone title (serif, wrapped) + subtitle, anchored to the bottom.
  const margin = 70
  const maxWidth = W - margin * 2
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 76px Georgia, 'Times New Roman', serif`
  const lines = wrapText(ctx, title, maxWidth, 3)
  const lineHeight = 92
  const subtitleY = H - 84
  const titleBottom = subtitleY - 74

  ctx.fillStyle = '#ffffff'
  lines.forEach((l, i) => {
    ctx.fillText(l, margin, titleBottom - (lines.length - 1 - i) * lineHeight)
  })

  ctx.font = '500 40px Inter, system-ui, sans-serif'
  ctx.fillStyle = style.accent
  ctx.fillText(subtitle, margin, subtitleY)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      b => (b ? resolve(b) : reject(new Error('Could not create the card'))),
      'image/jpeg',
      0.9,
    )
  })
}

// Share via the native sheet where available, otherwise download the file —
// same outcome either way: the card leaves the app.
export async function shareKeepsake(blob, title) {
  const file = new File([blob], 'babycue-keepsake.jpg', { type: 'image/jpeg' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
      // fall through to download
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'babycue-keepsake.jpg'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
