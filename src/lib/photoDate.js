// When was this photo taken? Phone JPEGs carry the moment in EXIF
// (DateTimeOriginal). Read it on-device so a July photo added in September
// lands in July. Falls back to the file's modified time, then to now.

const EXIF_DATE_TAGS = new Set([0x9003, 0x9004, 0x0132]) // DateTimeOriginal, DateTimeDigitized, DateTime

export async function photoTakenAt(file) {
  if (!file) return Date.now()
  try {
    if (file.type === 'image/jpeg' || /\.jpe?g$/i.test(file.name || '')) {
      const ts = parseExifDate(await readExif(file))
      if (ts) return ts
    }
  } catch { /* fall through */ }
  if (file.lastModified && file.lastModified > 0) return file.lastModified
  return Date.now()
}

async function readExif(file) {
  const buf = await file.slice(0, 128 * 1024).arrayBuffer()
  const view = new DataView(buf)
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return null

  // Walk JPEG segments to APP1/Exif.
  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset)
    const size = view.getUint16(offset + 2)
    if (marker === 0xffe1) {
      const start = offset + 4
      if (getAscii(view, start, 4) === 'Exif') return { view, tiff: start + 6 }
    }
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) break
    offset += 2 + size
  }
  return null
}

function getAscii(view, start, len) {
  let s = ''
  for (let i = 0; i < len && start + i < view.byteLength; i++) s += String.fromCharCode(view.getUint8(start + i))
  return s
}

function parseExifDate(exif) {
  if (!exif) return null
  const { view, tiff } = exif
  const little = view.getUint16(tiff) === 0x4949
  const u16 = o => view.getUint16(o, little)
  const u32 = o => view.getUint32(o, little)
  if (tiff + 8 > view.byteLength) return null

  const found = {}
  function readIfd(ifdOffset) {
    const base = tiff + ifdOffset
    if (base + 2 > view.byteLength) return
    const count = u16(base)
    for (let i = 0; i < count; i++) {
      const e = base + 2 + i * 12
      if (e + 12 > view.byteLength) return
      const tag = u16(e)
      const type = u16(e + 2)
      const n = u32(e + 4)
      if (tag === 0x8769) { // pointer to the Exif sub-IFD
        readIfd(u32(e + 8))
      } else if (EXIF_DATE_TAGS.has(tag) && type === 2 && n >= 19) {
        const at = tiff + u32(e + 8)
        found[tag] = getAscii(view, at, 19)
      }
    }
  }
  readIfd(u32(tiff + 4))

  const raw = found[0x9003] || found[0x9004] || found[0x0132]
  if (!raw) return null
  // "YYYY:MM:DD HH:MM:SS" in local time.
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
  if (!m) return null
  const ts = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +m[6]).getTime()
  return Number.isFinite(ts) && ts > 0 ? ts : null
}

// "YYYY-MM-DD" for a date input, in local time.
export function toDateInput(ts) {
  const d = new Date(ts)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// A date-input value back to a timestamp. Keeps the original time of day
// when the day didn't change, so re-saving doesn't shuffle the order.
export function fromDateInput(value, previousTs) {
  if (!value) return previousTs ?? Date.now()
  const [y, mo, d] = value.split('-').map(Number)
  const prev = previousTs != null ? new Date(previousTs) : null
  if (prev && toDateInput(previousTs) === value) return previousTs
  const now = new Date()
  const isToday = value === toDateInput(now.getTime())
  const h = isToday ? now.getHours() : 12
  const mi = isToday ? now.getMinutes() : 0
  return new Date(y, mo - 1, d, h, mi, 0).getTime()
}
