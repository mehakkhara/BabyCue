const DB_NAME = 'baby-journal'
const STORE_NAME = 'entries'
const DB_VERSION = 1

// Entries store the media's MIME type in `photoType` (kept that name for
// backward compatibility). Videos and photos share the same blob storage —
// only the rendering differs.
export function isVideoType(type) {
  return typeof type === 'string' && type.startsWith('video/')
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function getEntries() {
  const db = await openDb()
  const raw = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).index('createdAt').openCursor(null, 'prev')
    const out = []
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) {
        out.push(cursor.value)
        cursor.continue()
      } else {
        resolve(out)
      }
    }
    req.onerror = () => reject(req.error)
  })
  return raw.map(e => ({
    ...normalizeLegacy(e),
    photoBlob: e.photoBuffer ? new Blob([e.photoBuffer], { type: e.photoType || 'image/jpeg' }) : null,
  }))
}

// Older photo-hunt entries stored "📸 Photo hunt: Standing up" as the note.
// The caption should be hers; the app's part is a `source` tag instead.
const LEGACY_HUNT_PREFIX = /^📸\s*Photo hunt:\s*/i
function normalizeLegacy(e) {
  if (!e.source && LEGACY_HUNT_PREFIX.test(e.note || '')) {
    return { ...e, note: e.note.replace(LEGACY_HUNT_PREFIX, '').trim(), source: PHOTO_HUNT_SOURCE }
  }
  return e
}

// Optional display hints saved with an entry so cards can take the photo's
// shape without decoding it first:
//   width/height — pixel size of the stored media (images measured on save)
//   fit          — 'cover' (default) | 'contain' (show the whole photo)
//   position     — which part to keep when cropping: 'top' | 'center' | 'bottom'
//   kind         — 'memory' (default) | 'keepsake' (a designed card she made)
//   source       — undefined (she added it) | 'photoHunt' (a hunt cell capture)
//   createdAt    — when the moment happened (editable), not when it was saved
export const KEEPSAKE_KIND = 'keepsake'
export const PHOTO_HUNT_SOURCE = 'photoHunt'

export function isKeepsake(entry) {
  return entry?.kind === KEEPSAKE_KIND
}

export function isPhotoHunt(entry) {
  return entry?.source === PHOTO_HUNT_SOURCE
}

export async function addEntry({ note, photoBlob, photoType, width, height, fit, position, kind, source, createdAt }) {
  let photoBuffer = null
  if (photoBlob) {
    photoBuffer = await photoBlob.arrayBuffer()
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).add({
      note: note || '',
      kind: kind === KEEPSAKE_KIND ? KEEPSAKE_KIND : 'memory',
      source: source === PHOTO_HUNT_SOURCE ? PHOTO_HUNT_SOURCE : undefined,
      photoBuffer,
      photoType: photoType || 'image/jpeg',
      width: width || null,
      height: height || null,
      fit: fit === 'contain' ? 'contain' : 'cover',
      position: position || 'center',
      createdAt: Number.isFinite(createdAt) && createdAt > 0 ? createdAt : Date.now(),
    })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

// Change the note, the date, or the crop of an existing entry in place.
// Only the fields passed are touched; the photo itself never changes.
export async function updateEntry(id, patch) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const get = store.get(id)
    get.onsuccess = () => {
      const current = get.result
      if (!current) { reject(new Error('Entry not found')); return }
      const next = { ...current }
      if (patch.note != null) next.note = String(patch.note)
      if (Number.isFinite(patch.createdAt) && patch.createdAt > 0) next.createdAt = patch.createdAt
      if (patch.position) next.position = patch.position
      if (patch.fit) next.fit = patch.fit === 'contain' ? 'contain' : 'cover'
      if (patch.source !== undefined) next.source = patch.source || undefined
      const put = store.put(next)
      put.onsuccess = () => resolve(next)
      put.onerror = () => reject(put.error)
    }
    get.onerror = () => reject(get.error)
  })
}

export async function deleteEntry(id) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).delete(id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

// Pixel size of an image blob/file. Resolves null if it can't be decoded.
export async function imageDimensions(blob) {
  const url = URL.createObjectURL(blob)
  try {
    return await new Promise(resolve => {
      const i = new Image()
      i.onload = () => resolve({ width: i.naturalWidth, height: i.naturalHeight })
      i.onerror = () => resolve(null)
      i.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

export async function compressImage(file, maxDim = 1200, quality = 0.8) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => reject(new Error('Could not decode image'))
      i.src = url
    })
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight))
    const w = Math.round(img.naturalWidth * scale)
    const h = Math.round(img.naturalHeight * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    canvas.getContext('2d').drawImage(img, 0, 0, w, h)
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob returned null')), 'image/jpeg', quality)
    })
    return blob
  } finally {
    URL.revokeObjectURL(url)
  }
}
