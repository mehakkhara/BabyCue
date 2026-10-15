// The baby's profile photo for the Today hero. One small JPEG data URL in
// localStorage (≈60–100 KB at 800 px) is the local cache; sync.js copies it
// to Supabase storage at baby-photos/<user>/baby-photo.jpg so a new phone
// gets it back (sync-scope.md, Phase C). Falls back to the newest journal
// photo so the hero is never empty once she has added any memory.
import { compressImage, getEntries, isKeepsake, isVideoType, isAudioType } from '../data/journalStore'

const KEY = 'babyPhoto'
const META_KEY = 'babyPhoto:meta'   // { updatedAt: ISO, dirty: bool }
export const REMOTE_NAME = 'baby-photo.jpg'

function readMeta() {
  try { return JSON.parse(localStorage.getItem(META_KEY)) || {} } catch { return {} }
}

function writeMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)) } catch { /* quota */ }
}

function announce() {
  try { window.dispatchEvent(new Event('babyPhoto:changed')) } catch { /* not in a browser */ }
}

export function getBabyPhoto() {
  try { return localStorage.getItem(KEY) || null } catch { return null }
}

export async function setBabyPhoto(file) {
  const blob = await compressImage(file, 900, 0.82)
  const dataUrl = await blobToDataUrl(blob)
  localStorage.setItem(KEY, dataUrl)
  writeMeta({ updatedAt: new Date().toISOString(), dirty: true })
  announce()
  return dataUrl
}

export function clearBabyPhoto() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  writeMeta({ updatedAt: new Date().toISOString(), dirty: true })
  announce()
}

// ---- sync hooks (used by sync.js only) ----

/** { updatedAt, dirty } — dirty means this device's change is not on the server yet. */
export function babyPhotoMeta() {
  const meta = readMeta()
  // A photo set before sync existed: stamp it old and send it up once.
  if (!meta.updatedAt && getBabyPhoto()) {
    const fresh = { updatedAt: new Date(0).toISOString(), dirty: true }
    writeMeta(fresh)
    return fresh
  }
  return { updatedAt: meta.updatedAt || null, dirty: Boolean(meta.dirty) }
}

export function markBabyPhotoSynced(iso) {
  writeMeta({ updatedAt: iso, dirty: false })
}

/** The cached photo as a Blob for upload, or null when there is none. */
export async function babyPhotoBlob() {
  const dataUrl = getBabyPhoto()
  if (!dataUrl) return null
  const res = await fetch(dataUrl)
  return res.blob()
}

/** A photo (or its removal) arrived from the server and is newer than ours. */
export async function applyRemoteBabyPhoto(blob, iso) {
  if (blob) {
    localStorage.setItem(KEY, await blobToDataUrl(blob))
  } else {
    try { localStorage.removeItem(KEY) } catch { /* ignore */ }
  }
  writeMeta({ updatedAt: iso, dirty: false })
  announce()
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
}

// Newest plain photo memory, as an object URL (caller revokes).
export async function latestJournalPhotoUrl() {
  try {
    const entries = await getEntries()
    const e = entries.find(x => x.photoBlob && !isKeepsake(x) && !isVideoType(x.photoType) && !isAudioType(x.photoType))
    return e ? URL.createObjectURL(e.photoBlob) : null
  } catch {
    return null
  }
}
