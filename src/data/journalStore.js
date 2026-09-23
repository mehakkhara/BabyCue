const DB_NAME = 'baby-journal'
const STORE_NAME = 'entries'
const OUTBOX_NAME = 'outbox'
// v2 (2026-09-22): every entry gets a device-independent `clientId`, an
// `updatedAt` and a `synced` flag, and a second store holds the sync outbox.
// See sync-scope.md. Reads are unchanged: screens keep using getEntries().
const DB_VERSION = 2

// Entries store the media's MIME type in `photoType` (kept that name for
// backward compatibility). Videos and photos share the same blob storage —
// only the rendering differs.
export function isVideoType(type) {
  return typeof type === 'string' && type.startsWith('video/')
}

// Voice memos share the same blob slot; only the rendering differs.
export function isAudioType(type) {
  return typeof type === 'string' && type.startsWith('audio/')
}

export function newClientId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  // Old WebViews: good enough for a per-entry id.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = event => {
      const db = req.result
      const tx = req.transaction
      let store
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
        store.createIndex('createdAt', 'createdAt')
      } else {
        store = tx.objectStore(STORE_NAME)
      }
      if (!store.indexNames.contains('clientId')) store.createIndex('clientId', 'clientId', { unique: false })
      if (!db.objectStoreNames.contains(OUTBOX_NAME)) {
        const outbox = db.createObjectStore(OUTBOX_NAME, { keyPath: 'id', autoIncrement: true })
        outbox.createIndex('clientId', 'clientId')
      }
      // v1 → v2: stamp existing entries so they can be backed up.
      if (event.oldVersion < 2) {
        const cursorReq = store.openCursor()
        cursorReq.onsuccess = () => {
          const cursor = cursorReq.result
          if (!cursor) return
          const e = cursor.value
          if (!e.clientId) {
            // updatedAt is "last change", not the memory's date — stamp the migration time.
            cursor.update({ ...e, clientId: newClientId(), updatedAt: e.updatedAt || Date.now(), synced: false })
          }
          cursor.continue()
        }
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function toBlob(e) {
  return e.photoBuffer ? new Blob([e.photoBuffer], { type: e.photoType || 'image/jpeg' }) : null
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
  return raw.map(e => ({ ...normalizeLegacy(e), photoBlob: toBlob(e) }))
}

// One entry by its device-independent id, with the raw media buffer. Used by
// the sync worker; screens use getEntries().
export async function getEntryByClientId(clientId) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const req = tx.objectStore(STORE_NAME).index('clientId').get(clientId)
    req.onsuccess = () => resolve(req.result ? { ...normalizeLegacy(req.result), photoBlob: toBlob(req.result) } : null)
    req.onerror = () => reject(req.error)
  })
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
// Sync fields (never shown):
//   clientId     — the entry's id on every device
//   updatedAt    — last local change, for last-write-wins
//   synced       — true once the row and its media are on Supabase
//   remotePath   — storage key of the uploaded media
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
  const clientId = newClientId()
  const db = await openDb()
  const id = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const req = tx.objectStore(STORE_NAME).add({
      clientId,
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
      updatedAt: Date.now(),
      synced: false,
    })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  await enqueue('upsert', clientId)
  return id
}

// Change the note, the date, or the crop of an existing entry in place.
// Only the fields passed are touched; the photo itself never changes.
export async function updateEntry(id, patch) {
  const db = await openDb()
  const next = await new Promise((resolve, reject) => {
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
      if (!next.clientId) next.clientId = newClientId()
      next.updatedAt = Date.now()
      next.synced = false
      const put = store.put(next)
      put.onsuccess = () => resolve(next)
      put.onerror = () => reject(put.error)
    }
    get.onerror = () => reject(get.error)
  })
  await enqueue('upsert', next.clientId)
  return next
}

export async function deleteEntry(id) {
  const db = await openDb()
  const gone = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const get = store.get(id)
    get.onsuccess = () => {
      const current = get.result
      const del = store.delete(id)
      del.onsuccess = () => resolve(current || null)
      del.onerror = () => reject(del.error)
    }
    get.onerror = () => reject(get.error)
  })
  // Only tell the server about entries it may have seen.
  if (gone?.clientId && (gone.synced || gone.remotePath)) await enqueue('delete', gone.clientId, { remotePath: gone.remotePath || null })
  else if (gone?.clientId) await removeJobsFor(gone.clientId)
}

// ---- Sync bookkeeping (used by lib/sync.js) --------------------------------

// Queue one job per entry: a later upsert replaces an earlier one, a delete
// replaces everything.
export async function enqueue(op, clientId, extra = {}) {
  const db = await openDb()
  await removeJobsFor(clientId, db)
  const jobId = await new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_NAME, 'readwrite')
    const req = tx.objectStore(OUTBOX_NAME).add({ op, clientId, attempts: 0, lastError: null, queuedAt: Date.now(), ...extra })
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  // Let the sync worker know without importing it (keeps this module Supabase-free).
  try { window.dispatchEvent(new Event('journal:changed')) } catch { /* not in a browser */ }
  return jobId
}

export async function listOutbox() {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_NAME, 'readonly')
    const req = tx.objectStore(OUTBOX_NAME).getAll()
    req.onsuccess = () => resolve((req.result || []).sort((a, b) => a.queuedAt - b.queuedAt))
    req.onerror = () => reject(req.error)
  })
}

export async function removeJob(jobId) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_NAME, 'readwrite')
    const req = tx.objectStore(OUTBOX_NAME).delete(jobId)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export async function updateJob(jobId, patch) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_NAME, 'readwrite')
    const store = tx.objectStore(OUTBOX_NAME)
    const get = store.get(jobId)
    get.onsuccess = () => {
      if (!get.result) { resolve(); return }
      const put = store.put({ ...get.result, ...patch })
      put.onsuccess = () => resolve()
      put.onerror = () => reject(put.error)
    }
    get.onerror = () => reject(get.error)
  })
}

async function removeJobsFor(clientId, db) {
  db = db || await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(OUTBOX_NAME, 'readwrite')
    const req = tx.objectStore(OUTBOX_NAME).index('clientId').openCursor(IDBKeyRange.only(clientId))
    req.onsuccess = () => {
      const cursor = req.result
      if (cursor) { cursor.delete(); cursor.continue() } else resolve()
    }
    req.onerror = () => reject(req.error)
  })
}

// Mark an entry as safely on the server.
export async function markSynced(clientId, remotePath) {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const req = store.index('clientId').openCursor(IDBKeyRange.only(clientId))
    req.onsuccess = () => {
      const cursor = req.result
      if (!cursor) { resolve(false); return }
      cursor.update({ ...cursor.value, synced: true, remotePath: remotePath || cursor.value.remotePath || null })
      resolve(true)
    }
    req.onerror = () => reject(req.error)
  })
}

// Entries that have never reached the server and have no job waiting — the
// pre-sync journal on first sign-in. Returns their clientIds.
export async function unsyncedClientIds() {
  const db = await openDb()
  const [entries, jobs] = await Promise.all([
    new Promise((resolve, reject) => {
      const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAll()
      req.onsuccess = () => resolve(req.result || [])
      req.onerror = () => reject(req.error)
    }),
    listOutbox(),
  ])
  const queued = new Set(jobs.map(j => j.clientId))
  return entries.filter(e => e.clientId && !e.synced && !queued.has(e.clientId)).map(e => e.clientId)
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
