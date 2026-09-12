import { useEffect, useMemo, useState } from 'react'
import { getEntries, addEntry, deleteEntry, isVideoType, isKeepsake } from '../data/journalStore'
import { groupByMonth, pickHero, nameAndAgeAt } from '../lib/babyAge'
import ThenNow, { pickThenNow } from '../components/ThenNow'
import { ShapedMedia, CropFrame, TILE_RATIO } from '../components/PhotoShape'
import { autoCropPosition } from '../lib/autoCrop'
import { saveMediaEntries } from '../lib/journalSave'
import MediaStrip from '../components/MediaStrip'
import KeepsakeModal from '../components/KeepsakeModal'
import { shareKeepsake } from '../lib/keepsakeCard'

function shortDate(ts) {
  return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Small tag that marks a designed card among the photos.
function KeepsakeBadge({ light = false, style }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', borderRadius: '999px', padding: '2px 7px',
      background: light ? 'rgba(255,255,255,0.9)' : '#ede9fe',
      color: '#6d28d9', ...style,
    }}>
      🎞 Keepsake
    </span>
  )
}

// One object URL per entry, revoked together when the set changes. Creating
// these per-card would leak on every re-render.
function useObjectUrls(entries) {
  return useMemo(() => {
    const map = new Map()
    for (const e of entries) {
      if (e.photoBlob) map.set(e.id, URL.createObjectURL(e.photoBlob))
    }
    return map
  }, [entries])
}

function PlayBadge({ size = 30 }) {
  return (
    <span style={{
      position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: 'rgba(0,0,0,0.45)', color: '#fff', fontSize: `${size * 0.42}px`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      paddingLeft: '2px', pointerEvents: 'none',
    }}>▶</span>
  )
}

/* ---------------- month section: one hero, then pairs ---------------- */

function MonthSection({ group, urls, profile, onOpen }) {
  const hero = pickHero(group.entries)
  const rest = group.entries.filter(e => e !== hero)

  return (
    <section style={{ marginBottom: '26px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '9px', margin: '0 2px 10px' }}>
        {group.ageLabel && (
          <span style={{
            fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: '#7C3AED',
          }}>
            {group.ageLabel}
          </span>
        )}
        <span style={{ flex: 1, height: '1px', backgroundColor: 'rgba(0,0,0,0.09)' }} />
        <span style={{ fontSize: '11px', color: '#aaa' }}>{group.monthLabel}</span>
      </div>

      {hero && (
        <button
          onClick={() => onOpen(hero)}
          style={{
            position: 'relative', display: 'block', width: '100%', padding: 0, border: 'none',
            borderRadius: '14px', overflow: 'hidden', cursor: 'pointer', marginBottom: '9px',
            backgroundColor: '#fff', boxShadow: '0 2px 9px rgba(0,0,0,0.1)', textAlign: 'left',
          }}
        >
          {urls.get(hero.id) && (
            // The hero takes the photo's own shape — tall for a phone portrait, wide for landscape.
            <ShapedMedia url={urls.get(hero.id)} type={hero.photoType} entry={hero} />
          )}
          {isVideoType(hero.photoType) && urls.get(hero.id) && <PlayBadge size={38} />}
          {isKeepsake(hero) && urls.get(hero.id) ? (
            // The card already carries its own headline and date — just tag it.
            <KeepsakeBadge light style={{ position: 'absolute', top: '10px', left: '10px' }} />
          ) : urls.get(hero.id) ? (
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 0,
              padding: '26px 13px 11px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.68))',
              color: '#fff',
            }}>
              {hero.note && (
                <div style={{ fontSize: '13.5px', fontWeight: 600, lineHeight: 1.35 }}>{hero.note}</div>
              )}
              <div style={{ fontSize: '10.5px', opacity: 0.85, marginTop: '2px' }}>
                {shortDate(hero.createdAt)}
                {profile?.dateOfBirth && ` · ${nameAndAgeAt(profile.babyName, profile.dateOfBirth, hero.createdAt)}`}
              </div>
            </div>
          ) : (
            // A note with no photo still deserves a place in the book.
            <div style={{ padding: '15px 14px' }}>
              <div style={{ fontSize: '14px', color: '#1a1a2e', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{hero.note}</div>
              <div style={{ fontSize: '11px', color: '#999', marginTop: '6px' }}>
                {shortDate(hero.createdAt)}
                {profile?.dateOfBirth && ` · ${nameAndAgeAt(profile.babyName, profile.dateOfBirth, hero.createdAt)}`}
              </div>
            </div>
          )}
        </button>
      )}

      {rest.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {rest.map(entry => (
            <button
              key={entry.id}
              onClick={() => onOpen(entry)}
              style={{
                position: 'relative', padding: 0, border: 'none', borderRadius: '12px',
                overflow: 'hidden', cursor: 'pointer', backgroundColor: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)', textAlign: 'left',
              }}
            >
              {urls.get(entry.id) && (
                <div style={{ position: 'relative' }}>
                  {/* Tiles share one 4:5 shape so pairs line up; the saved position picks the crop. */}
                  <ShapedMedia url={urls.get(entry.id)} type={entry.photoType} entry={entry} ratio={TILE_RATIO} />
                  {isVideoType(entry.photoType) && <PlayBadge size={26} />}
                  {isKeepsake(entry) && <KeepsakeBadge light style={{ position: 'absolute', top: '7px', left: '7px' }} />}
                </div>
              )}
              <div style={{ padding: '8px 9px 9px' }}>
                {entry.note && !isKeepsake(entry) && (
                  <div style={{
                    fontSize: '11.5px', color: '#1a1a2e', lineHeight: 1.35,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {entry.note}
                  </div>
                )}
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: entry.note && !isKeepsake(entry) ? '4px' : 0 }}>
                  {shortDate(entry.createdAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

/* ---------------- opened memory ---------------- */

function EntrySheet({ entry, url, profile, onClose, onDelete, onMakeKeepsake, onShareCard }) {
  const card = isKeepsake(entry)
  const canMakeCard = Boolean(url) && !card && !isVideoType(entry.photoType)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 120, backgroundColor: 'rgba(20,20,35,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#fff', borderRadius: '16px', overflow: 'hidden',
          maxWidth: '420px', width: '100%', maxHeight: '86vh', overflowY: 'auto',
        }}
      >
        {url && (
          isVideoType(entry.photoType)
            ? <video src={url} controls playsInline autoPlay style={{ width: '100%', display: 'block', maxHeight: '60vh', background: '#000' }} />
            : <img src={url} alt="" style={{ width: '100%', display: 'block', maxHeight: '60vh', objectFit: 'contain', background: '#111' }} />
        )}
        <div style={{ padding: '15px 17px 17px' }}>
          <div style={{ fontSize: '11.5px', color: '#999', fontWeight: 500 }}>
            {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            {profile?.dateOfBirth && ` · ${nameAndAgeAt(profile.babyName, profile.dateOfBirth, entry.createdAt)}`}
          </div>
          {card && <KeepsakeBadge style={{ marginTop: '8px' }} />}
          {entry.note && (
            <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#1a1a2e', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
              {entry.note}
            </p>
          )}

          {/* A card is one tap from any photo; an existing card can be shared again. */}
          {canMakeCard && (
            <button
              onClick={() => onMakeKeepsake(entry)}
              style={{
                width: '100%', marginTop: '14px', padding: '11px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #7C6FF7, #a78bfa)', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              🎞 Make a keepsake
            </button>
          )}
          {card && (
            <button
              onClick={() => onShareCard(entry)}
              style={{
                width: '100%', marginTop: '14px', padding: '11px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #7C6FF7, #a78bfa)', color: '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Share this card
            </button>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: canMakeCard || card ? '8px' : '16px' }}>
            <button
              onClick={onClose}
              style={{
                flex: 2, padding: '11px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
                backgroundColor: '#fff', color: '#555', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Close
            </button>
            <button
              onClick={() => { if (confirm('Delete this memory?')) onDelete(entry.id) }}
              style={{
                flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #f3d6d6',
                backgroundColor: '#fff', color: '#c44', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------- add form ---------------- */

function AddForm({ onSave, onCancel }) {
  const [files, setFiles] = useState([])   // one or many; each saves as its own entry
  const file = files.length === 1 ? files[0] : null   // single-pick gets the crop step
  const [previewUrl, setPreviewUrl] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [position, setPosition] = useState('50% 50%')

  const isVideo = isVideoType(file?.type)

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return }
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setPosition('50% 50%')
    // Guess where the subject is; she can drag if the guess is off.
    if (!isVideoType(file.type)) autoCropPosition(file, TILE_RATIO).then(setPosition)
    return () => URL.revokeObjectURL(url)
  }, [file])

  async function handleSave() {
    if (files.length === 0 && !note.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      if (files.length === 0) {
        await addEntry({ note: note.trim(), photoBlob: null, photoType: null })
      } else {
        // A single pick keeps the position she dragged; a batch is auto-cropped.
        await saveMediaEntries(files, note.trim(), file ? { 0: position } : {})
      }
      onSave()
    } catch (err) {
      // Raw storage errors ("QuotaExceededError: ...") mean nothing to a
      // parent. Keep the detail in the console, say something useful here.
      console.error('Save failed', err)
      setSaveError(err?.name === 'QuotaExceededError'
        ? "There's no room left on this device for another memory. Try deleting an older video."
        : 'Could not save that memory. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canSave = Boolean(files.length || note.trim())

  return (
    <div style={{
      backgroundColor: '#fff', borderRadius: '14px', padding: '16px',
      marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    }}>
      {files.length > 1 ? (
        <div style={{ marginBottom: '6px' }}>
          <MediaStrip files={files} />
        </div>
      ) : previewUrl ? (
        // Outside the label so a drag doesn't reopen the file picker.
        <div style={{ borderRadius: '12px', overflow: 'hidden', marginBottom: '6px' }}>
          {isVideo
            ? <video src={previewUrl} controls playsInline style={{ width: '100%', maxHeight: '320px', display: 'block', background: '#000' }} />
            // Tiles are 4:5 — drag to choose what they show.
            : <CropFrame url={previewUrl} ratio={TILE_RATIO} position={position} onChange={setPosition} />}
        </div>
      ) : (
        <label
          htmlFor="journal-photo-input"
          style={{
            display: 'block', border: '2px dashed #d4d8e3', borderRadius: '12px',
            padding: '32px 16px', textAlign: 'center', cursor: 'pointer', marginBottom: '12px',
          }}
        >
          <span style={{ color: '#888', fontSize: '14px' }}>Tap to add photos or a video</span>
        </label>
      )}
      {files.length > 0 && (
        <label
          htmlFor="journal-photo-input"
          style={{ display: 'block', marginBottom: '10px', fontSize: '12px', fontWeight: 600, color: '#7C3AED', cursor: 'pointer', textAlign: 'center' }}
        >
          {files.length > 1 ? 'Choose different photos' : 'Choose a different photo'}
        </label>
      )}
      <input
        id="journal-photo-input"
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={e => setFiles(Array.from(e.target.files || []))}
        style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      />

      {file && (
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#888' }}>
          {file.name} — {(file.size / 1024 / 1024).toFixed(1)} MB
        </p>
      )}
      {files.length > 1 && (
        <p style={{ margin: '0 0 12px', fontSize: '12px', color: '#888' }}>
          {files.length} photos — each saves as its own memory with this note.
        </p>
      )}


      <textarea
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="What happened? (optional)"
        rows={3}
        style={{
          width: '100%', padding: '12px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
          fontSize: '14px', resize: 'vertical', fontFamily: 'inherit', outline: 'none',
          boxSizing: 'border-box', marginBottom: '12px',
        }}
      />

      {saveError && (
        <p style={{ margin: '0 0 10px', fontSize: '13px', color: '#c44', lineHeight: 1.45 }}>
          {saveError}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onCancel}
          disabled={saving}
          style={{
            flex: 1, padding: '12px', borderRadius: '10px', border: '1.5px solid #E5E7EB',
            backgroundColor: '#fff', color: '#555', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !canSave}
          style={{
            flex: 2, padding: '12px', borderRadius: '10px', border: 'none',
            backgroundColor: canSave && !saving ? '#7C3AED' : '#E5E7EB',
            color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: canSave && !saving ? 'pointer' : 'not-allowed',
          }}
        >
          {saving ? 'Saving...' : 'Save memory'}
        </button>
      </div>
    </div>
  )
}

/* ---------------- screen ---------------- */

export default function JournalScreen({ profile }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [opened, setOpened] = useState(null)
  const [keepsakeFrom, setKeepsakeFrom] = useState(null)   // entry a card is being made from

  const urls = useObjectUrls(entries)
  useEffect(() => () => { urls.forEach(u => URL.revokeObjectURL(u)) }, [urls])

  const months = useMemo(
    () => groupByMonth(entries, profile?.dateOfBirth),
    [entries, profile?.dateOfBirth],
  )

  const thenNowPair = useMemo(() => pickThenNow(entries), [entries])

  async function refresh() {
    setEntries(await getEntries())
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleDelete(id) {
    await deleteEntry(id)
    setOpened(null)
    refresh()
  }

  return (
    <div style={{
      maxWidth: '480px', margin: '0 auto',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: '100vh', backgroundColor: '#FAFAFA',
    }}>
      <div style={{
        padding: '20px 20px 16px', backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>
            Journal
          </h1>
          <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
            {entries.length} {entries.length === 1 ? 'memory' : 'memories'}
          </p>
        </div>
        {!adding && (
          <button
            onClick={() => setAdding(true)}
            style={{
              padding: '8px 14px', borderRadius: '20px', border: 'none',
              backgroundColor: '#7C3AED', color: '#fff', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + Add
          </button>
        )}
      </div>

      <div style={{ padding: '16px' }}>
        {adding && (
          <AddForm onSave={() => { setAdding(false); refresh() }} onCancel={() => setAdding(false)} />
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: '#888', fontSize: '14px', marginTop: '40px' }}>
            Loading...
          </p>
        ) : entries.length === 0 && !adding ? (
          <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>📷</div>
            <p style={{ fontSize: '15px', color: '#666', lineHeight: 1.5, margin: 0 }}>
              Save a memory of your baby — a photo, a video, a note, a tiny moment to look back on.
            </p>
            <button
              onClick={() => setAdding(true)}
              style={{
                marginTop: '20px', padding: '12px 24px', borderRadius: '24px', border: 'none',
                backgroundColor: '#7C3AED', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              Add your first memory
            </button>
          </div>
        ) : (
          <>
            {thenNowPair && <ThenNow pair={thenNowPair} urls={urls} profile={profile} />}
            {months.map(group => (
              <MonthSection
                key={group.key}
                group={group}
                urls={urls}
                profile={profile}
                onOpen={setOpened}
              />
            ))}
          </>
        )}
      </div>

      {opened && !keepsakeFrom && (
        <EntrySheet
          entry={opened}
          url={urls.get(opened.id)}
          profile={profile}
          onClose={() => setOpened(null)}
          onDelete={handleDelete}
          onMakeKeepsake={setKeepsakeFrom}
          onShareCard={e => shareKeepsake(e.photoBlob, e.note)}
        />
      )}

      {keepsakeFrom && (
        <KeepsakeModal
          photoUrl={urls.get(keepsakeFrom.id)}
          title={keepsakeFrom.note}
          takenAt={keepsakeFrom.createdAt}
          profile={profile}
          onClose={() => { setKeepsakeFrom(null); setOpened(null) }}
          onSaved={refresh}
        />
      )}
    </div>
  )
}
