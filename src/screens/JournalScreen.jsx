import { useEffect, useMemo, useState } from 'react'
import { getEntries, deleteEntry, updateEntry, isVideoType, isKeepsake, isPhotoHunt } from '../data/journalStore'
import { groupByMonth, pickHero, nameAndAgeAt } from '../lib/babyAge'
import ThenNow, { pickThenNow, thenNowPhotos, rememberThenNow } from '../components/ThenNow'
import { ShapedMedia, TILE_RATIO } from '../components/PhotoShape'
import { toDateInput, fromDateInput } from '../lib/photoDate'
import MemoryForm from '../components/MemoryForm'
import KeepsakeNudge from '../components/KeepsakeNudge'
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

// A photo-hunt capture: the caption is hers, this is the app's part.
function PhotoHuntBadge({ light = false, style }) {
  return (
    <span style={{
      display: 'inline-block', fontSize: '8.5px', fontWeight: 800, letterSpacing: '0.06em',
      textTransform: 'uppercase', borderRadius: '999px', padding: '2px 7px',
      background: light ? 'rgba(255,255,255,0.9)' : '#fce7f3',
      color: '#db2777', ...style,
    }}>
      📷 Photo hunt
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
          {isPhotoHunt(hero) && urls.get(hero.id) && (
            <PhotoHuntBadge light style={{ position: 'absolute', top: '10px', left: '10px' }} />
          )}
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
                  {isPhotoHunt(entry) && <PhotoHuntBadge light style={{ position: 'absolute', top: '7px', left: '7px' }} />}
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

function EntrySheet({ entry, url, profile, onClose, onDelete, onUpdate, onMakeKeepsake, onShareCard }) {
  const card = isKeepsake(entry)
  const canMakeCard = Boolean(url) && !card && !isVideoType(entry.photoType)

  // Edit in place: the date and the note become fields; Save writes them back.
  const [editing, setEditing] = useState(false)
  const [draftNote, setDraftNote] = useState(entry.note || '')
  const [draftDate, setDraftDate] = useState(toDateInput(entry.createdAt))
  const [savingEdit, setSavingEdit] = useState(false)

  function startEdit() {
    setDraftNote(entry.note || '')
    setDraftDate(toDateInput(entry.createdAt))
    setEditing(true)
  }

  async function saveEdit() {
    if (savingEdit) return
    setSavingEdit(true)
    try {
      await onUpdate(entry.id, { note: draftNote.trim(), createdAt: fromDateInput(draftDate, entry.createdAt) })
      setEditing(false)
    } finally {
      setSavingEdit(false)
    }
  }

  const field = {
    width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #ddd6fe',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1a1a2e',
  }

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
          {editing ? (
            <>
              <label style={{ display: 'block', marginBottom: '10px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>When was this?</span>
                <input type="date" value={draftDate} max={toDateInput(Date.now())} onChange={e => setDraftDate(e.target.value)} style={field} />
              </label>
              <textarea
                value={draftNote}
                onChange={e => setDraftNote(e.target.value)}
                placeholder="What happened?"
                rows={3}
                autoFocus
                style={{ ...field, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => setEditing(false)}
                  disabled={savingEdit}
                  style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1.5px solid #E5E7EB', backgroundColor: '#fff', color: '#555', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  disabled={savingEdit}
                  style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #7C6FF7, #a78bfa)', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {savingEdit ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Tap the date or the note to edit them. */}
              <button
                onClick={card ? undefined : startEdit}
                style={{
                  display: 'block', width: '100%', padding: 0, border: 'none', background: 'none',
                  textAlign: 'left', cursor: card ? 'default' : 'text', fontFamily: 'inherit',
                }}
              >
                <div style={{ fontSize: '11.5px', color: '#999', fontWeight: 500 }}>
                  {new Date(entry.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                  {profile?.dateOfBirth && ` · ${nameAndAgeAt(profile.babyName, profile.dateOfBirth, entry.createdAt)}`}
                </div>
                {card && <KeepsakeBadge style={{ marginTop: '8px' }} />}
                {isPhotoHunt(entry) && <PhotoHuntBadge style={{ marginTop: '8px' }} />}
                {entry.note ? (
                  <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#1a1a2e', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                    {entry.note}
                  </p>
                ) : !card && (
                  <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#c4c4d4', fontStyle: 'italic' }}>
                    Add a note…
                  </p>
                )}
              </button>
              {!card && (
                <button
                  onClick={startEdit}
                  style={{ marginTop: '10px', padding: 0, border: 'none', background: 'none', color: '#7C3AED', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  ✎ Edit date or note
                </button>
              )}
            </>
          )}

          {/* A card is one tap from any photo; an existing card can be shared again. */}
          {canMakeCard && !editing && (
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
          {card && !editing && (
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

          {!editing && (
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
          )}
        </div>
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
  const [justSaved, setJustSaved] = useState(null)         // { url, title, ts, position } after a save here
  const [pickVersion, setPickVersion] = useState(0)        // bumps when she swaps a Then↔Now side

  const urls = useObjectUrls(entries)
  useEffect(() => () => { urls.forEach(u => URL.revokeObjectURL(u)) }, [urls])

  useEffect(() => {
    if (!justSaved) return
    return () => URL.revokeObjectURL(justSaved.url)
  }, [justSaved])

  const months = useMemo(
    () => groupByMonth(entries, profile?.dateOfBirth),
    [entries, profile?.dateOfBirth],
  )

  const thenNowPair = useMemo(() => pickThenNow(entries), [entries, pickVersion]) // eslint-disable-line react-hooks/exhaustive-deps
  const photoCount = useMemo(() => thenNowPhotos(entries).length, [entries])

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

  // Date/note edits: write, then refresh so age labels and month groups follow.
  async function handleUpdate(id, patch) {
    const next = await updateEntry(id, patch)
    await refresh()
    setOpened(o => (o && o.id === id ? { ...o, ...next, photoBlob: o.photoBlob } : o))
  }

  function handleMemorySaved(first) {
    setAdding(false)
    if (first) setJustSaved({ url: URL.createObjectURL(first.blob), title: first.title, ts: first.ts, position: first.position })
    refresh()
  }

  function handleSwap(side, id) {
    rememberThenNow(side, id)
    setPickVersion(v => v + 1)
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
        {justSaved && !keepsakeFrom && (
          <KeepsakeNudge
            url={justSaved.url}
            onMake={() => setKeepsakeFrom({ fromNudge: true, ...justSaved })}
            onDismiss={() => setJustSaved(null)}
            style={{ marginBottom: '16px' }}
          />
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
            {thenNowPair ? (
              <ThenNow pair={thenNowPair} urls={urls} profile={profile} photos={thenNowPhotos(entries)} onSwap={handleSwap} />
            ) : (
              // Never let the section seem missing — say what unlocks it.
              <p style={{ margin: '0 2px 18px', fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
                Then ↔ now appears once there are two photos{photoCount === 1 ? ' — one more to go' : ''}.
              </p>
            )}
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
          onUpdate={handleUpdate}
          onMakeKeepsake={setKeepsakeFrom}
          onShareCard={e => shareKeepsake(e.photoBlob, e.note)}
        />
      )}

      {keepsakeFrom && (
        <KeepsakeModal
          photoUrl={keepsakeFrom.fromNudge ? keepsakeFrom.url : urls.get(keepsakeFrom.id)}
          title={keepsakeFrom.fromNudge ? keepsakeFrom.title : keepsakeFrom.note}
          takenAt={keepsakeFrom.fromNudge ? keepsakeFrom.ts : keepsakeFrom.createdAt}
          position={keepsakeFrom.position}
          profile={profile}
          onClose={() => { setKeepsakeFrom(null); setOpened(null); if (keepsakeFrom.fromNudge) setJustSaved(null) }}
          onSaved={refresh}
        />
      )}

      {adding && (
        <MemoryForm
          profile={profile}
          onClose={() => setAdding(false)}
          onSaved={handleMemorySaved}
        />
      )}
    </div>
  )
}
