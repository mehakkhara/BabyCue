import { addEntry, compressImage, imageDimensions, isVideoType } from '../data/journalStore'
import { autoCropPosition } from './autoCrop'
import { photoTakenAt } from './photoDate'
import { TILE_RATIO } from '../components/PhotoShape'

// Saves each picked file as its own journal entry, all sharing one note.
//   positions — file index → object-position for photos she framed by hand;
//               anything else gets the auto-crop guess.
//   options.createdAt — one date for every entry (she set it herself)
//   options.dates     — per-file timestamps (from the photos' own metadata)
//   Neither given: each photo's own date, read on the spot.
export async function saveMediaEntries(files, note, positions = {}, options = {}) {
  const saved = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const isVideo = isVideoType(file.type)
    const blob = isVideo ? file : await compressImage(file)
    const size = isVideo ? null : await imageDimensions(blob)
    const position = positions[i] || (isVideo ? '50% 50%' : await autoCropPosition(file, TILE_RATIO))
    const createdAt = options.createdAt
      ?? options.dates?.[i]
      ?? await photoTakenAt(file)
    const id = await addEntry({
      note,
      photoBlob: blob,
      photoType: isVideo ? file.type : 'image/jpeg',
      width: size?.width,
      height: size?.height,
      position,
      createdAt,
    })
    saved.push({ id, blob, isVideo, position, createdAt })
  }
  return saved
}
