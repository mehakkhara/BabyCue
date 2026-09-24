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
import { color, type } from '../theme'

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif"

export default function StoriesScreen({ profile }) {
  const [open, setOpen] = useState(null)
  // Bumped when the reader closes, so "already read" and favourites refresh.
  const [version, setVersion] = useState(0)
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
  const discovery = forAge.filter(s => s.series === 'discovery' && s !== tonight)
  const museum = forAge.filter(s => s.series === 'museum' && s !== tonight)
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
    <Screen style={{ background: '#fffdf9' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '14px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...type.h1, fontSize: '24px' }}>Stories</h1>
          <p style={{ ...type.body, marginTop: '4px' }}>Calm, meaningful stories for curious minds</p>
        </div>
        <IconButton label="Search stories" active={showSearch} onClick={() => { setShowSearch(v => !v); setQuery('') }}>
          <SearchIcon />
        </IconButton>
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


      {matches ? (
        <>
          <SectionHeader title={matches.length === 0 ? 'No stories match' : `${matches.length} ${matches.length === 1 ? 'story' : 'stories'}`} style={{ marginTop: '4px' }} />
          <List stories={matches} readIds={readIds} favourites={favourites} onOpen={setOpen} />
        </>
      ) : (
        <>
          {/* Tonight */}
          {tonight && (
            <div style={{ borderRadius: '22px', overflow: 'hidden', background: '#fff', border: '1px solid #f1eadf', boxShadow: '0 10px 26px rgba(77, 62, 38, .09)', position: 'relative' }}>
              <div style={{ position: 'relative', height: '238px' }}>
                <PaintingCanvas id={tonight.pages[0].art} fit="contain" style={{ background: '#f7f0df' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 46%, rgba(28,24,59,.18) 100%)' }} />
              </div>
              <div style={{ padding: '16px 17px 17px' }}>
                <div style={{ fontSize: '10px', letterSpacing: '.12em', textTransform: 'uppercase', color: color.primary, fontWeight: 800, marginBottom: '5px' }}>Tonight's story</div>
                <div style={{ fontFamily: SERIF, fontSize: '25px', lineHeight: 1.12, color: color.ink }}>{tonight.title}</div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px', color: color.inkSoft, fontSize: '12px', fontWeight: 600 }}>
                  <span>◷ {readingMinutes(tonight)} min</span><span>▣ {band.age}</span>
                </div>
                <button onClick={() => setOpen(tonight)} style={{ marginTop: '14px', border: 'none', borderRadius: '999px', padding: '11px 22px', background: 'linear-gradient(135deg, #7869f3, #967df7)', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 14px rgba(124,111,247,.28)' }}>
                  <span style={{ marginRight: '8px' }}>▶</span> Read now
                </button>
              </div>
            </div>
          )}
          {tonight && tonightArt && (
            <p style={{ ...type.small, margin: '8px 4px 0', textAlign: 'center', color: color.inkSoft }}>
              {storyExtras(tonight.id).blurb || `${tonightArt.title}, ${tonightArt.year}`}
            </p>
          )}

          <SectionHeader title={`Discovery stories for ${babyName}`} />
          <p style={{ ...type.small, margin: '-4px 2px 10px', color: color.inkSoft }}>One small thing to learn in each: an animal, a colour, a number, a routine.</p>
          <List stories={discovery} readIds={readIds} favourites={favourites} onOpen={setOpen} />

          {museum.length > 0 && (
            <>
              <SectionHeader title="From the museum" />
              <p style={{ ...type.small, margin: '-4px 2px 10px', color: color.inkSoft }}>A real painting to look at together, with calm words to go with it.</p>
              <List stories={museum} readIds={readIds} favourites={favourites} onOpen={setOpen} />
            </>
          )}

          {others.length > 0 && (
            <SectionHeader
              title="Other ages"
              action={showAll ? 'Just this age' : 'See all'}
              onAction={() => setShowAll(v => !v)}
              style={{ marginTop: '6px' }}
            />
          )}

          {showAll && others.length > 0 && (
            <>
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
            display: 'flex', alignItems: 'center', gap: '13px', width: '100%', padding: '8px',
            border: '1px solid #f0ebf6', borderRadius: '15px', backgroundColor: color.surface,
            cursor: 'pointer', textAlign: 'left', opacity: dim ? 0.78 : 1, fontFamily: 'inherit',
          }}>
            <div style={{ flex: '0 0 62px', height: '62px', borderRadius: '11px', overflow: 'hidden' }}>
              <PaintingCanvas id={story.pages[0].art} fit="contain" style={{ background: '#f7f0df' }} />
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: SERIF, fontSize: '16px', lineHeight: 1.2, color: color.ink, marginBottom: '4px' }}>
                {story.title}
              </div>
              <div style={{ fontSize: '11.5px', color: color.faint }}>
                {PAINTINGS[story.pages[0].art].title} · {readingMinutes(story)} min
                {read && <span style={{ color: color.primary, fontWeight: 600 }}> · Read</span>}
              </div>
            </div>
            {fav && <span aria-label="Favourite" style={{ fontSize: '14px', flexShrink: 0, color: color.primary }}>♥</span>}
          </button>
        )
      })}
    </div>
  )
}

function SearchIcon() {
  return <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
}
