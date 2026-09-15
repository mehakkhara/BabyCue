// The baby's profile photo for the Today hero. One small JPEG data URL in
// localStorage (≈60–100 KB at 800 px). Falls back to the newest journal
// photo so the hero is never empty once she has added any memory.
import { compressImage, getEntries, isKeepsake, isVideoType } from '../data/journalStore'

const KEY = 'babyPhoto'

export function getBabyPhoto() {
  try { return localStorage.getItem(KEY) || null } catch { return null }
}

export async function setBabyPhoto(file) {
  const blob = await compressImage(file, 900, 0.82)
  const dataUrl = await new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = () => reject(r.error)
    r.readAsDataURL(blob)
  })
  localStorage.setItem(KEY, dataUrl)
  return dataUrl
}

export function clearBabyPhoto() {
  try { localStorage.removeItem(KEY) } catch { /* ignore */ }
}

// Newest plain photo memory, as an object URL (caller revokes).
export async function latestJournalPhotoUrl() {
  try {
    const entries = await getEntries()
    const e = entries.find(x => x.photoBlob && !isKeepsake(x) && !isVideoType(x.photoType))
    return e ? URL.createObjectURL(e.photoBlob) : null
  } catch {
    return null
  }
}
