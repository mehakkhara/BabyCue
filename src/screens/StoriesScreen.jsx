import { useMemo, useState } from 'react'
import PaintingCanvas from '../components/PaintingCanvas'
import StoryReader from './StoryReader'
import { PAINTINGS } from '../data/paintings'
import { getBabyAgeInMonths } from '../data/tips'
import { bandForAge, storiesForAge, pickTonight, STORIES } from '../data/stories'
import { getReadIds, todayKey } from '../lib/storyProgress'

const SERIF = "Georgia, 'Iowan Old Style', 'Palatino Linotype', Palatino, serif"

export default function StoriesScreen({ profile }) {
  const [open, setOpen] = useState(null)
  // Bumped when the reader closes, so "already read" marks refresh.
  const [version, setVersion] = useState(0)

  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const band = bandForAge(ageInMonths)
  const babyName = (profile.babyName || '').trim() || 'your baby'

  const readIds = useMemo(() => getReadIds(), [version])

  const tonight = useMemo(
    () => pickTonight(ageInMonths, {
      seed: `${todayKey()}:${profile.babyName || ''}`,
      readIds,
    }),
    [ageInMonths, profile.babyName, readIds],
  )

  const forAge = storiesForAge(ageInMonths)
  const others = STORIES.filter(s => !forAge.includes(s))

  function close() {
    setOpen(null)
    setVersion(v => v + 1)
  }

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
    }}>
      <div style={{
        padding: '20px 20px 16px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <h1 style={{ margin: '0 0 2px', fontSize: '20px', fontWeight: 700, color: '#1a1a2e' }}>
          Stories
        </h1>
        <p style={{ margin: 0, fontSize: '13px', color: '#888' }}>
          Bedtime stories for {babyName}, told through paintings
        </p>
      </div>

      <div style={{ padding: '16px' }}>
        {tonight && (
          <>
            <SectionLabel>Tonight</SectionLabel>
            <button
              onClick={() => setOpen(tonight)}
              style={{
                width: '100%',
                display: 'block',
                padding: 0,
                border: 'none',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: 'pointer',
                backgroundColor: '#10131f',
                boxShadow: '0 2px 10px rgba(26,26,46,0.16)',
                marginBottom: '26px',
                textAlign: 'left',
              }}
            >
              <div style={{ position: 'relative', height: '168px' }}>
                <PaintingCanvas id={tonight.pages[0].art} />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to bottom, rgba(16,19,31,0) 30%, rgba(16,19,31,0.94) 100%)',
                }} />
                <div style={{ position: 'absolute', left: '18px', right: '18px', bottom: '14px' }}>
                  <div style={{
                    fontSize: '10px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: '#e8b13d',
                    fontWeight: 700,
                    marginBottom: '5px',
                  }}>
                    Tonight's story
                  </div>
                  <div style={{
                    fontFamily: SERIF,
                    fontSize: '22px',
                    lineHeight: 1.2,
                    color: '#f3e6c8',
                  }}>
                    {tonight.title}
                  </div>
                </div>
              </div>
            </button>
          </>
        )}

        <SectionLabel>
          For {babyName} <span style={{ color: '#aaa', fontWeight: 500 }}>· {band.age}</span>
        </SectionLabel>
        <List stories={forAge} readIds={readIds} onOpen={setOpen} />

        {others.length > 0 && (
          <>
            <SectionLabel style={{ marginTop: '26px' }}>The rest of the shelf</SectionLabel>
            <p style={{ margin: '0 0 10px', fontSize: '12.5px', color: '#999', lineHeight: 1.5 }}>
              Written for other ages — read them whenever you like.
            </p>
            <List stories={others} readIds={readIds} onOpen={setOpen} dim />
          </>
        )}
      </div>

      {open && <StoryReader story={open} profile={profile} onClose={close} />}
    </div>
  )
}

function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      fontSize: '11px',
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: '#7C6FF7',
      fontWeight: 700,
      marginBottom: '10px',
      ...style,
    }}>
      {children}
    </div>
  )
}

function List({ stories, readIds, onOpen, dim = false }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '9px' }}>
      {stories.map(story => {
        const read = readIds.includes(story.id)
        return (
          <button
            key={story.id}
            onClick={() => onOpen(story)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '13px',
              width: '100%',
              padding: '9px',
              border: 'none',
              borderRadius: '14px',
              backgroundColor: '#fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              cursor: 'pointer',
              textAlign: 'left',
              opacity: dim ? 0.72 : 1,
            }}
          >
            <div style={{ flex: '0 0 56px', height: '56px', borderRadius: '10px', overflow: 'hidden' }}>
              <PaintingCanvas id={story.pages[0].art} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontFamily: SERIF,
                fontSize: '16.5px',
                lineHeight: 1.25,
                color: '#1a1a2e',
                marginBottom: '3px',
              }}>
                {story.title}
              </div>
              <div style={{ fontSize: '11.5px', color: '#999' }}>
                {read && <span style={{ color: '#7C6FF7', fontWeight: 600 }}>Read · </span>}
                {PAINTINGS[story.pages[0].art].title}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
