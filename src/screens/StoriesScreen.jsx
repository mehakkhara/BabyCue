// Stories shelf: tonight's pick up top, then the stories for the baby's
// age, then the rest of the shelf. Reading happens in StoryReader.
import { useMemo, useState } from 'react'
import PaintingCanvas from '../components/PaintingCanvas'
import StoryReader from './StoryReader'
import { PAINTINGS } from '../data/paintings'
import { getBabyAgeInMonths } from '../data/tips'
import { bandForAge, storiesForAge, pickTonight, STORIES, storyExtras, readingMinutes } from '../data/stories'
import { getReadIds, getFavourites, todayKey } from '../lib/storyProgress'
import { Screen, IconButton, Pill, SectionHeader } from '../components/ui'
import { color, shadow, type } from '../theme'

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif"

const BEDTIME_CUE_KEY = 'storiesBedtimeCueShown'
const BEDTIME_CUE_TIMES = 3

// The app opens on Stories during wind-down hours. Say so the first few
// times, so it reads as a choice rather than the app losing her place.
function useBedtimeCue(openedForBedtime) {
  const [show, setShow] = useState(() => {
    if (!openedForBedtime) return false
    let n = 0
    try { n = Number(localStorage.getItem(BEDTIME_CUE_KEY) || 0) } catch { /* private mode */ }
    if (n >= BEDTIME_CUE_TIMES) return false
    try { localStorage.setItem(BEDTIME_CUE_KEY, String(n + 1)) } catch { /* ignore */ }
    return true
  })
  return [show, () => setShow(false)]
}

export default function StoriesScreen({ profile, openedForBedtime = false, onGoHome }) {
  const [open, setOpen] = useState(null)
  // Bumped when the reader closes, so "already read" and favourites refresh.
  const [version, setVersion] = useState(0)
  const [showCue, dismissCue] = useBedtimeCue(openedForBedtime)
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const band = bandForAge(ageInMonths)
  const babyName = (profile.babyName || '').trim() || 'your baby'

  const readIds = useMemo(() => getReadIds(), [version])
  const favourites = useMemo(() => getFavourites(), [version])

  const tonight = useMemo(
    () => pickTonight(ageInMonths, { seed: `${todayKey()}:${profile.babyName || ''}`, readIds }),
    [ageInMonths, profile.babyName, readIds],
  )

  const forAge = storiesForAge(ageInMonths)
  const others = STORIES.filter(s => !forAge.includes(s))
  const q = query.trim().toLowerCase()
  const matches = q
    ? STORIES.filter(s => s.title.toLowerCase().includes(q) || PAINTINGS[s.pages[0].art].title.toLowerCase().includes(q))
    : null

  function close() {
    setOpen(null)
    setVersion(v => v + 1)
  }

  const tonightArt = tonight ? PAINTINGS[tonight.pages[0].art] : null

  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...type.h1, fontSize: '24px' }}>Stories</h1>
          <p style={{ ...type.body, marginTop: '4px' }}>Calm, meaningful stories for curious minds</p>
        </div>
        <IconButton label="Search" active={showSearch} onClick={() => { setShowSearch(v => !v); setQuery('') }}>🔍</IconButton>
      </div>

      {showSearch && (
        <input
          autoFocus
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search stories or paintings"
          style={{ width: '100%', padding: '12px 14px', borderRadius: '14px', border: '1.5px solid #ddd6fe', fontSize: '14px', fontFamily: 'inherit', outline: 'none', marginBottom: '14px', background: '#fff', color: color.ink }}
        />
      )}

      {showCue && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#1a1a2e', color: '#fff', borderRadius: '14px', padding: '10px 12px', marginBottom: '14px' }}>
          <span style={{ fontSize: '18px' }}>🌙</span>
          <p style={{ flex: 1, margin: 0, fontSize: '12.5px', lineHeight: 1.45 }}>
            It's bedtime, so we opened Stories.{' '}
            {onGoHome ? (
              <button onClick={onGoHome} style={{ background: 'none', border: 'none', padding: 0, color: '#c4b5fd', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
                Today is still a tap away.
              </button>
            ) : 'Today is still a tap away.'}
          </p>
          <button onClick={dismissCue} aria-label="Dismiss" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '16px', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}>×</button>
        </div>
      )}

      {matches ? (
        <>
          <SectionHeader title={matches.length === 0 ? 'No stories match' : `${matches.length} ${matches.length === 1 ? 'story' : 'stories'}`} style={{ marginTop: '4px' }} />
          <List stories={matches} readIds={readIds} favourites={favourites} onOpen={setOpen} />
        </>
      ) : (
        <>
          {/* Tonight */}
          {tonight && (
            <div style={{ borderRadius: '24px', overflow: 'hidden', background: '#10131f', boxShadow: shadow.cardLg, position: 'relative' }}>
              <div style={{ position: 'relative', height: '250px' }}>
                <PaintingCanvas id={tonight.pages[0].art} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(16,19,31,0) 20%, rgba(16,19,31,0.35) 55%, rgba(16,19,31,0.92) 100%)' }} />
                <div style={{ position: 'absolute', left: '18px', right: '18px', bottom: '16px' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e8b13d', fontWeight: 700, marginBottom: '6px' }}>
                    Tonight's story
                  </div>
                  <div style={{ fontFamily: SERIF, fontSize: '24px', lineHeight: 1.15, color: '#f3e6c8' }}>{tonight.title}</div>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '10px', flexWrap: 'wrap' }}>
                    <Pill style={{ background: 'rgba(255,255,255,0.14)', color: '#f3e6c8' }}>⏱ {readingMinutes(tonight)} min</Pill>
                    <Pill style={{ background: 'rgba(255,255,255,0.14)', color: '#f3e6c8' }}>👶 {band.age}</Pill>
                  </div>
                  <button onClick={() => setOpen(tonight)} style={{
                    marginTop: '12px', border: 'none', borderRadius: '999px', padding: '10px 18px',
                    background: color.primary, color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 6px 16px rgba(124,111,247,0.35)',
                  }}>
                    ▶ Read now
                  </button>
                </div>
              </div>
            </div>
          )}
          {tonight && tonightArt && (
            <p style={{ ...type.small, margin: '8px 4px 0', textAlign: 'center', color: color.inkSoft }}>
              {storyExtras(tonight.id).blurb || `${tonightArt.title}, ${tonightArt.year}`}
            </p>
          )}

          <SectionHeader
            title={`More stories for ${babyName}`}
            action={others.length > 0 ? (showAll ? 'Just this age' : 'See all') : null}
            onAction={() => setShowAll(v => !v)}
          />
          <List stories={forAge.filter(s => s !== tonight)} readIds={readIds} favourites={favourites} onOpen={setOpen} />

          {showAll && others.length > 0 && (
            <>
              <SectionHeader title="The rest of the shelf" />
              <p style={{ ...type.small, margin: '-4px 2px 10px' }}>Written for other ages. Read them whenever you like.</p>
              <List stories={others} readIds={readIds} favourites={favourites} onOpen={setOpen} dim />
            </>
          )}
        </>
      )}

      {open && <StoryReader story={open} profile={profile} onClose={close} />}
    </Screen>
  )
}

function List({ stories, readIds, favourites, onOpen, dim = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {stories.map(story => {
        const read = readIds.includes(story.id)
        const fav = favourites.includes(story.id)
        return (
          <button key={story.id} onClick={() => onOpen(story)} style={{
            display: 'flex', alignItems: 'center', gap: '13px', width: '100%', padding: '9px',
            border: 'none', borderRadius: '16px', backgroundColor: color.surface, boxShadow: shadow.card,
            cursor: 'pointer', textAlign: 'left', opacity: dim ? 0.78 : 1, fontFamily: 'inherit',
          }}>
            <div style={{ flex: '0 0 58px', height: '58px', borderRadius: '12px', overflow: 'hidden' }}>
              <PaintingCanvas id={story.pages[0].art} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontSize: '16.5px', lineHeight: 1.25, color: color.ink, marginBottom: '3px' }}>
                {story.title}
              </div>
              <div style={{ fontSize: '11.5px', color: color.faint }}>
                {PAINTINGS[story.pages[0].art].title} · {readingMinutes(story)} min
                {read && <span style={{ color: color.primary, fontWeight: 600 }}> · Read</span>}
              </div>
            </div>
            {fav && <span aria-label="Favourite" style={{ fontSize: '14px', flexShrink: 0 }}>💜</span>}
          </button>
        )
      })}
    </div>
  )
}
