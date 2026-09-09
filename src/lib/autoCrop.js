// Where is the interesting part of a photo? A cheap, on-device guess: shrink
// the image to a thumbnail, measure how much detail (edge energy) each row
// and column has, and slide a window of the target shape to where the detail
// is densest. Faces and bodies carry far more edges than walls, sky or floor,
// so this lands on the subject most of the time. Runs in a few milliseconds.
//
// Returns a CSS object-position string ("50% 32%") for use with
// object-fit: cover. Percentages describe which part of the overflow is kept:
// 0% = show the start (top/left), 100% = show the end (bottom/right).

const SAMPLE = 64

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not decode image'))
    img.src = src
  })
}

// Energy per row and per column of a grayscale thumbnail.
function energyProfiles(ctx, w, h) {
  const { data } = ctx.getImageData(0, 0, w, h)
  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]
  }
  const rows = new Float32Array(h)
  const cols = new Float32Array(w)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x
      const gx = Math.abs(gray[i + 1] - gray[i - 1])
      const gy = Math.abs(gray[i + w] - gray[i - w])
      const e = gx + gy
      rows[y] += e
      cols[x] += e
    }
  }
  return { rows, cols }
}

// Best start offset (0..1) for a window of `win` cells over a profile of
// `len` cells, favouring the densest stretch. Ties resolve toward the centre.
function bestWindow(profile, len, win) {
  if (win >= len) return 0.5
  let sum = 0
  for (let i = 0; i < win; i++) sum += profile[i]
  let best = sum
  let bestStart = 0
  for (let start = 1; start <= len - win; start++) {
    sum += profile[start + win - 1] - profile[start - 1]
    if (sum > best * 1.02) { // small hysteresis so noise doesn't pull it around
      best = sum
      bestStart = start
    }
  }
  return bestStart / (len - win)
}

// targetRatio = width / height of the frame the photo will fill.
export async function autoCropPosition(source, targetRatio = 1) {
  const url = source instanceof Blob ? URL.createObjectURL(source) : source
  try {
    const img = await loadImage(url)
    const iw = img.naturalWidth
    const ih = img.naturalHeight
    if (!iw || !ih) return '50% 50%'

    const scale = SAMPLE / Math.max(iw, ih)
    const w = Math.max(3, Math.round(iw * scale))
    const h = Math.max(3, Math.round(ih * scale))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, w, h)
    const { rows, cols } = energyProfiles(ctx, w, h)

    const imageRatio = iw / ih
    if (imageRatio < targetRatio) {
      // Taller than the frame: the crop slides up and down.
      const win = Math.round(w / targetRatio)
      const y = bestWindow(rows, h, win)
      return `50% ${Math.round(y * 100)}%`
    }
    if (imageRatio > targetRatio) {
      // Wider than the frame: the crop slides left and right.
      const win = Math.round(h * targetRatio)
      const x = bestWindow(cols, w, win)
      return `${Math.round(x * 100)}% 50%`
    }
    return '50% 50%'
  } catch {
    return '50% 50%'
  } finally {
    if (source instanceof Blob) URL.revokeObjectURL(url)
  }
}
