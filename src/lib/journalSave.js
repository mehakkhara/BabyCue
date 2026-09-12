import { addEntry, compressImage, imageDimensions, isVideoType } from '../data/journalStore'
import { autoCropPosition } from './autoCrop'
import { TILE_RATIO } from '../components/PhotoShape'

// Saves each picked file as its own journal entry, all sharing one note.
// `positions` maps file index -> object-position for photos she has already
// framed by hand; anything else gets the auto-crop guess.
export async function saveMediaEntries(files, note, positions = {}) {
  const saved = []
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const isVideo = isVideoType(file.type)
    const blob = isVideo ? file : await compressImage(file)
    const size = isVideo ? null : await imageDimensions(blob)
    const position = positions[i] || (isVideo ? '50% 50%' : await autoCropPosition(file, TILE_RATIO))
    const id = await addEntry({
      note,
      photoBlob: blob,
      photoType: isVideo ? file.type : 'image/jpeg',
      width: size?.width,
      height: size?.height,
      position,
    })
    saved.push({ id, blob, isVideo })
  }
  return saved
}
