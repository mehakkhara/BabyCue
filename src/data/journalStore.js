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
    ...e,
    photoBlob: e.photoBuffer ? new Blob([e.photoBuffer], { type: e.photoType || 'image/jpeg' }) : null,
  }))
}

// Optional display hints saved with an entry so cards can take the photo's
// shape without decoding it first:
//   width/height — pixel size of the stored media (images measured on save)
//   fit          — 'cover' (default) | 'contain' (show the whole photo)
//   position     — which part to keep when cropping: 'top' | 'center' | 'bottom'
//   kind         — 'memory' (default) | 'keepsake' (a designed card she made)
export const KEEPSAKE_KIND = 'keepsake'

export function isKeepsake(entry) {
  return entry?.kind === KEEPSAKE_KIND
}

export async function addEntry({ note, photoBlob, photoType, width, height, fit, position, kind }) {
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
      photoBuffer,
      photoType: photoType || 'image/jpeg',
      width: width || null,
      height: height || null,
      fit: fit === 'contain' ? 'contain' : 'cover',
      position: position || 'center',
      createdAt: Date.now(),
    })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
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
