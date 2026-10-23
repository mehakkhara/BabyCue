// Month reel — one month of journal photos as a short vertical video, narrated
// by the parent's own voice memos from that month. Like the keepsake cards,
// everything happens on the device: frames are drawn to a canvas in real time,
// the canvas stream is recorded with MediaRecorder, and the voice memos play
// into the same stream through an AudioContext. No uploads, no stock music.
//
// Recording is real time, so a 30-second reel takes 30 seconds to make. The
// canvas doubles as the live preview while it records.
import { ageLabelAt, monthsAt } from './babyAge'
import { isAudioType, isVideoType } from '../data/journalStore'
import { wrapText } from './keepsakeCard'

export const W = 1080
export const H = 1920
export const MIN_PHOTOS = 3
const INTRO_MS = 1800
const OUTRO_MS = 1700
const PHOTO_MS = 1900
const FADE_MS = 450
const FPS = 30

const FONT_SERIF = `700 68px Georgia, 'Times New Roman', serif`
const FONT_SANS = '500 38px Inter, system-ui, sans-serif'
const FONT_SMALL = '600 32px Inter, system-ui, sans-serif'

/** Months that have enough photos for a reel, newest first. */
export function reelMonths(entries, dateOfBirth) {
  const buckets = new Map()
  for (const e of entries) {
    if (!e.photoBlob) continue
    const d = new Date(e.createdAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        monthName: d.toLocaleDateString(undefined, { month: 'long' }),
        monthLabel: d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
        ageMonths: dateOfBirth ? monthsAt(dateOfBirth, e.createdAt) : null,
        photos: [],
        memos: [],
      })
    }
    const b = buckets.get(key)
    if (isAudioType(e.photoType)) b.memos.push(e)
    else if (!isVideoType(e.photoType)) b.photos.push(e)
  }
  return [...buckets.values()]
    .map(b => ({ ...b, photos: b.photos.sort((a, z) => a.createdAt - z.createdAt), memos: b.memos.sort((a, z) => a.createdAt - z.createdAt) }))
    .filter(b => b.photos.length >= MIN_PHOTOS)
    .sort((a, b) => (a.key < b.key ? 1 : -1))
}

export function reelDurationMs(photoCount) {
  return INTRO_MS + photoCount * PHOTO_MS + OUTRO_MS
}

export function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null
  const candidates = [
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ]
  return candidates.find(m => MediaRecorder.isTypeSupported(m)) || null
}

export function canMakeReel() {
  return Boolean(pickMimeType() && HTMLCanvasElement.prototype.captureStream)
}

// Decoded once per photo blob, so retyping a caption or nudging the framing
// does not decode the whole month again for the preview.
const imageCache = new WeakMap()

function loadImage(blob) {
  if (imageCache.has(blob)) return imageCache.get(blob)
  const p = new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); imageCache.delete(blob); reject(new Error('Could not load a photo')) }
    img.src = url
  })
  imageCache.set(blob, p)
  return p
}

function parsePos(value) {
  const named = { top: [50, 0], center: [50, 50], bottom: [50, 100] }
  if (!value) return { x: 50, y: 50 }
  if (named[value]) return { x: named[value][0], y: named[value][1] }
  const m = String(value).match(/([\d.]+)%\s+([\d.]+)%/)
  return m ? { x: Number(m[1]), y: Number(m[2]) } : { x: 50, y: 50 }
}

/**
 * Decode the photos once. The scene is everything drawFrame needs, so the
 * modal can draw a still preview and then hand the same scene to makeReel.
 */
export async function buildScene({ photos, memos = [], babyName, dateOfBirth, monthName, monthLabel }) {
  const images = await Promise.all(photos.map(p => loadImage(p.photoBlob)))
  const name = (babyName || '').trim() || 'Your baby'
  const slides = photos.map((p, i) => ({
    img: images[i],
    pos: parsePos(p.position),
    note: (p.note || '').trim(),
    dateLabel: new Date(p.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    ageLabel: dateOfBirth ? ageLabelAt(dateOfBirth, p.createdAt) : null,
  }))
  const first = photos[0]?.createdAt
  const ageAtMonth = dateOfBirth && first ? ageLabelAt(dateOfBirth, first) : null
  return {
    slides, memos, name, monthName, monthLabel,
    subtitle: ageAtMonth ? `${name} · ${ageAtMonth}` : name,
    total: reelDurationMs(photos.length),
  }
}

const ease = t => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))

function drawCover(ctx, img, pos, scale) {
  const base = Math.max(W / img.width, H / img.height) * scale
  const dw = img.width * base
  const dh = img.height * base
  ctx.drawImage(img, (W - dw) * (pos.x / 100), (H - dh) * (pos.y / 100), dw, dh)
}

function drawBackdrop(ctx) {
  const g = ctx.createLinearGradient(0, 0, W, H)
  g.addColorStop(0, '#1e1b4b')
  g.addColorStop(1, '#4c3d8f')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, W, H)
}

function drawBadge(ctx, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.font = FONT_SMALL
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.textBaseline = 'top'
  ctx.fillText('✦ Babylume', 70, 70)
  ctx.restore()
}

function drawSlide(ctx, scene, i, local) {
  const s = scene.slides[i]
  const p = local / PHOTO_MS
  drawCover(ctx, s.img, s.pos, 1 + 0.1 * p)

  const grad = ctx.createLinearGradient(0, H * 0.5, 0, H)
  grad.addColorStop(0, 'rgba(20,16,50,0)')
  grad.addColorStop(1, 'rgba(20,16,50,0.88)')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, W, H)
  const top = ctx.createLinearGradient(0, 0, 0, 260)
  top.addColorStop(0, 'rgba(20,16,50,0.55)')
  top.addColorStop(1, 'rgba(20,16,50,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, W, 260)

  // Header: name left, month right.
  ctx.font = FONT_SMALL
  ctx.textBaseline = 'top'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(scene.subtitle.toUpperCase(), 70, 76)
  const ml = scene.monthLabel.toUpperCase()
  ctx.fillText(ml, W - 70 - ctx.measureText(ml).width, 76)

  // Caption: note (serif, up to 2 lines) then date · age.
  const margin = 70
  const metaY = H - 190
  ctx.textBaseline = 'alphabetic'
  ctx.font = FONT_SANS
  ctx.fillStyle = '#dcd6ff'
  const meta = s.ageLabel ? `${s.dateLabel} · ${s.ageLabel}` : s.dateLabel
  ctx.fillText(meta, margin, metaY)
  if (s.note) {
    ctx.font = FONT_SERIF
    ctx.fillStyle = '#ffffff'
    const lines = wrapText(ctx, s.note, W - margin * 2, 2)
    const lh = 82
    lines.forEach((l, k) => ctx.fillText(l, margin, metaY - 70 - (lines.length - 1 - k) * lh))
  }
}

function drawIntro(ctx, scene, local) {
  drawBackdrop(ctx)
  const a = Math.min(ease(local / 500), ease((INTRO_MS - local) / FADE_MS))
  ctx.save()
  ctx.globalAlpha = a
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `700 150px Georgia, 'Times New Roman', serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(scene.monthName, W / 2, H / 2 - 20)
  ctx.font = '500 48px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#dcd6ff'
  ctx.fillText(scene.subtitle, W / 2, H / 2 + 70)
  ctx.restore()
  drawBadge(ctx, a)
}

function drawOutro(ctx, scene, local) {
  drawBackdrop(ctx)
  const a = Math.min(ease(local / FADE_MS), ease((OUTRO_MS - local) / 400))
  ctx.save()
  ctx.globalAlpha = a
  ctx.textAlign = 'center'
  ctx.font = `700 92px Georgia, 'Times New Roman', serif`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(`${scene.name}'s ${scene.monthName}`, W / 2, H / 2 - 10)
  ctx.font = '500 44px Inter, system-ui, sans-serif'
  ctx.fillStyle = '#dcd6ff'
  const n = scene.slides.length
  ctx.fillText(`${n} little moments`, W / 2, H / 2 + 70)
  ctx.font = FONT_SMALL
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  ctx.fillText('✦ Babylume', W / 2, H / 2 + 220)
  ctx.restore()
}

/** Draw the frame for time t (ms) into ctx. Pure in t, so it can be scrubbed. */
export function drawFrame(ctx, scene, t) {
  ctx.save()
  ctx.textAlign = 'left'
  if (t < INTRO_MS) {
    drawIntro(ctx, scene, t)
  } else if (t < INTRO_MS + scene.slides.length * PHOTO_MS) {
    const rel = t - INTRO_MS
    const i = Math.min(scene.slides.length - 1, Math.floor(rel / PHOTO_MS))
    const local = rel - i * PHOTO_MS
    if (i > 0 && local < FADE_MS) {
      // Crossfade from the previous slide's final frame.
      drawSlide(ctx, scene, i - 1, PHOTO_MS)
      ctx.globalAlpha = ease(local / FADE_MS)
      drawSlide(ctx, scene, i, local)
      ctx.globalAlpha = 1
    } else if (i === 0 && local < FADE_MS) {
      drawBackdrop(ctx)
      ctx.globalAlpha = ease(local / FADE_MS)
      drawSlide(ctx, scene, 0, local)
      ctx.globalAlpha = 1
    } else {
      drawSlide(ctx, scene, i, local)
    }
    // Progress hairline along the bottom.
    ctx.fillStyle = 'rgba(255,255,255,0.25)'
    ctx.fillRect(0, H - 8, W, 8)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, H - 8, W * (t / scene.total), 8)
  } else {
    drawOutro(ctx, scene, t - INTRO_MS - scene.slides.length * PHOTO_MS)
  }
  ctx.restore()
}

/** A still from the middle of one photo (the first by default), for the preview before recording. */
export function drawPreview(canvas, scene, index = 0) {
  canvas.width = W
  canvas.height = H
  const i = Math.max(0, Math.min(scene.slides.length - 1, index))
  drawFrame(canvas.getContext('2d'), scene, INTRO_MS + PHOTO_MS * (i + 0.6))
}

// Voice memos, played back to back into the recording. Memos the browser
// cannot decode (a format from another phone) are skipped, not fatal.
async function buildNarration(memos, startAt, totalMs) {
  const Ctx = window.AudioContext || window.webkitAudioContext
  if (!Ctx || !memos.length) return null
  const ac = new Ctx()
  try { await ac.resume() } catch { /* starts on first schedule */ }
  const buffers = []
  for (const m of memos) {
    try {
      buffers.push(await ac.decodeAudioData(await m.photoBlob.arrayBuffer()))
    } catch { /* skip */ }
  }
  if (!buffers.length) { await ac.close(); return null }

  const dest = ac.createMediaStreamDestination()
  const gain = ac.createGain()
  gain.connect(dest)
  const total = totalMs / 1000
  const t0 = ac.currentTime + startAt / 1000
  gain.gain.setValueAtTime(0, t0)
  gain.gain.linearRampToValueAtTime(1, t0 + 0.4)
  gain.gain.setValueAtTime(1, Math.max(t0 + 0.4, ac.currentTime + total - 1.4))
  gain.gain.linearRampToValueAtTime(0, ac.currentTime + total - 0.1)

  let at = t0
  for (const buf of buffers) {
    if (at >= ac.currentTime + total) break
    const src = ac.createBufferSource()
    src.buffer = buf
    src.connect(gain)
    src.start(at)
    at += buf.duration + 0.35
  }
  return { stream: dest.stream, close: () => ac.close().catch(() => {}) }
}

/**
 * Record the reel. Resolves with { blob, mimeType, ext }.
 *   canvas     — the visible preview canvas; it is drawn into in real time
 *   scene      — from buildScene()
 *   voice      — include the month's voice memos
 *   onProgress — (elapsedMs, totalMs)
 *   signal     — AbortSignal to cancel
 */
export function makeReel({ canvas, scene, voice = true, onProgress, signal }) {
  return new Promise((resolve, reject) => {
    const mimeType = pickMimeType()
    if (!mimeType || !canvas.captureStream) {
      reject(new Error('This browser cannot record video'))
      return
    }
    canvas.width = W
    canvas.height = H
    const ctx = canvas.getContext('2d')
    drawFrame(ctx, scene, 0)

    const stream = canvas.captureStream(FPS)
    let narration = null
    let raf = 0
    let recorder = null
    const chunks = []

    const finish = () => {
      cancelAnimationFrame(raf)
      stream.getTracks().forEach(tr => tr.stop())
      narration?.close()
    }
    const fail = err => { finish(); try { recorder?.state !== 'inactive' && recorder.stop() } catch { /* ignore */ } reject(err) }

    const start = async () => {
      try {
        narration = voice ? await buildNarration(scene.memos, INTRO_MS, scene.total) : null
        narration?.stream.getAudioTracks().forEach(tr => stream.addTrack(tr))
        recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6_000_000 })
        recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data) }
        recorder.onerror = e => fail(e.error || new Error('Recording failed'))
        recorder.onstop = () => {
          finish()
          const blob = new Blob(chunks, { type: mimeType.split(';')[0] })
          resolve({ blob, mimeType, ext: mimeType.includes('mp4') ? 'mp4' : 'webm' })
        }
        recorder.start()
        const t0 = performance.now()
        const tick = () => {
          if (signal?.aborted) { fail(new DOMException('Cancelled', 'AbortError')); return }
          const t = performance.now() - t0
          if (t >= scene.total) {
            drawFrame(ctx, scene, scene.total - 1)
            onProgress?.(scene.total, scene.total)
            // A beat so the last frame is captured before the stream ends.
            setTimeout(() => recorder.stop(), 150)
            return
          }
          drawFrame(ctx, scene, t)
          onProgress?.(t, scene.total)
          raf = requestAnimationFrame(tick)
        }
        raf = requestAnimationFrame(tick)
      } catch (err) {
        fail(err)
      }
    }
    start()
  })
}

export async function shareReel(blob, ext, title) {
  const safe = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  const file = new File([blob], `babylume-reel-${safe}.${ext}`, { type: blob.type })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
  return 'downloaded'
}
