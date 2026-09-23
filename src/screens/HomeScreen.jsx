// Today — a launcher, not a feed. One thing to know, one thing to do, one
// moment to remember, one story to read. Everything else lives a tap away.
import { useEffect, useMemo, useState } from 'react'
import { getBabyAgeInMonths, formatBabyAge } from '../data/tips'
import { pickTonight, STORIES } from '../data/stories'
import { getReadIds, todayKey as storyDayKey } from '../lib/storyProgress'
import { pickDailyTip, pickDailyActivity, clampMonth } from '../lib/dailyTip'
import { dueChecklists, itemCount } from '../data/checklists'
import { loadProgress, doneCount, isComplete, isHidden } from '../lib/checklistProgress'
import { overviewForMonth } from '../data/monthOverview'
import { getTodayMoods, topicForMoods } from '../lib/moodLog'
import { BABY_STATES } from '../data/babyStates'
import { getBabyPhoto, latestJournalPhotoUrl } from '../lib/babyPhoto'
import { greetingForHour, isBedtimeHour } from '../lib/timeOfDay'
import { personalize } from '../lib/pronouns'
import { getEntries } from '../data/journalStore'
import { pickFlashback } from '../components/Flashback'
import Flashback from '../components/Flashback'
import MemoryForm from '../components/MemoryForm'
import { markCheckIn } from '../lib/streak'
import { Screen, Card, ListRow, Avatar, SectionHeader, Chevron } from '../components/ui'
import { color, shadow, type } from '../theme'

// Warm, non-clinical lines under the photo. Not advice — just a breath.
const QUOTES = [
  'Curious minds make a brighter world.',
  'Small moments, big growing.',
  'You are exactly the parent {baby} needs.',
  'Every day, a little more of the world opens up.',
  'Slow days count too.',
  'Wonder first, milestones second.',
  'The ordinary days are the ones you will miss most.',
  'Rest when {baby} rests, when you can.',
  'A calm parent is the best toy in the room.',
  'Today is enough.',
]

function subtitleForHour(h, babyName) {
  if (h >= 19 || h < 5) return `A quiet wind-down with ${babyName}`
  if (h >= 17) return `A gentle evening with ${babyName}`
  if (h >= 12) return `A calm afternoon with ${babyName}`
  return `A calmer, brighter day with ${babyName}`
}

export default function HomeScreen({ profile, onOpen, onOpenJournal, photoVersion = 0 }) {
  const { babyName, dateOfBirth, momName } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)
  const month = clampMonth(ageInMonths)
  const [hour, setHour] = useState(() => new Date().getHours())
  const [moods, setMoods] = useState(() => getTodayMoods())
  const [adding, setAdding] = useState(false)
  const [savedNote, setSavedNote] = useState(null)
  const [heroUrl, setHeroUrl] = useState(() => getBabyPhoto())
  const [flashback, setFlashback] = useState(null)

  // Re-read the clock and today's mood on resume so the screen follows the day.
  useEffect(() => {
    function refresh() { setHour(new Date().getHours()); setMoods(getTodayMoods()) }
    const timer = setInterval(refresh, 10 * 60 * 1000)
    document.addEventListener('visibilitychange', refresh)
    window.addEventListener('focus', refresh)
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', refresh); window.removeEventListener('focus', refresh) }
  }, [])

  // Hero photo: profile photo, else the newest journal photo.
  useEffect(() => {
    let cancelled = false
    let objectUrl = null
    const own = getBabyPhoto()
    if (own) { setHeroUrl(own); return }
    ;(async () => {
      const url = await latestJournalPhotoUrl()
      if (cancelled) { if (url) URL.revokeObjectURL(url); return }
      objectUrl = url
      setHeroUrl(url)
    })()
    return () => { cancelled = true; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [photoVersion, savedNote])

  useEffect(() => {
    let cancelled = false
    getEntries().then(entries => { if (!cancelled) setFlashback(pickFlashback(entries)) }).catch(() => {})
    return () => { cancelled = true }
  }, [savedNote])

  const moodTopic = topicForMoods(moods)
  const tip = useMemo(() => pickDailyTip(month, { topic: moodTopic }), [month, moodTopic])
  const activity = useMemo(() => pickDailyActivity(month), [month])
  const overview = overviewForMonth(month)
  // To-dos: checklists due for this age that aren't finished or hidden.
  const todos = useMemo(() => {
    const p = loadProgress()
    return dueChecklists(ageInMonths).filter(c => !isComplete(p, c) && !isHidden(p, c.id)).map(c => ({ c, done: doneCount(p, c), total: itemCount(c) }))
  }, [ageInMonths])
  const tonight = useMemo(
    () => pickTonight(ageInMonths, { seed: `${storyDayKey()}:${babyName || ''}`, readIds: getReadIds() }),
    [ageInMonths, babyName],
  )
  const quote = personalize(QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length], profile)
  const dateLabel = new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
  const pickedStates = BABY_STATES.filter(s => moods.includes(s.key))

  function handleMemorySaved(first) {
    setAdding(false)
    markCheckIn('photo')
    setSavedNote(Date.now())
  }

  return (
    <Screen>
      {/* Greeting */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...type.h1, fontSize: '24px' }}>{greetingForHour(hour, momName)}</h1>
          <p style={{ ...type.body, marginTop: '4px' }}>{subtitleForHour(hour, babyName)}</p>
        </div>
        <Avatar name={momName} onClick={() => onOpen('profile')} label="Your profile" />
      </div>

      {/* Baby hero */}
      <button onClick={() => onOpen('profile')} aria-label={`${babyName}'s photo`} style={{
        display: 'block', width: '100%', padding: 0, border: 'none', cursor: 'pointer',
        borderRadius: '24px', overflow: 'hidden', position: 'relative', aspectRatio: '4 / 3',
        background: heroUrl ? `center / cover no-repeat url(${heroUrl})` : 'linear-gradient(135deg, #c4b5fd, #dce8f8 60%, #d4ede6)',
        boxShadow: shadow.cardLg, textAlign: 'left', fontFamily: 'inherit',
      }}>
        {!heroUrl && (
          <span style={{ position: 'absolute', left: '20px', top: '18px', fontSize: '13px', fontWeight: 600, color: '#fff', background: 'rgba(30,27,75,0.35)', padding: '6px 10px', borderRadius: '999px' }}>
            Add a photo of {babyName} →
          </span>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(20,16,60,0.55) 100%)' }} />
        <div style={{ position: 'absolute', right: '18px', bottom: '16px', textAlign: 'right', color: '#fff' }}>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 700, lineHeight: 1.1, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>{babyName}</p>
          <p style={{ margin: '3px 0 0', fontSize: '14px', fontWeight: 600, opacity: 0.95 }}>{formatBabyAge(dateOfBirth)}</p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', opacity: 0.85 }}>{dateLabel}</p>
        </div>
      </button>
      <p style={{ ...type.small, textAlign: 'center', margin: '12px 0 4px', fontStyle: 'italic', color: color.inkSoft }}>“{quote}”</p>

      {/* Today for you */}
      <SectionHeader title="Today for you" action="Browse by month" onAction={() => onOpen('browse')} style={{ marginTop: '18px' }} />
      <Card padding="4px 14px">
        <ListRow
          emoji="💡" hue="amber" title="Learn"
          subtitle={tip ? personalize(tip.title, profile) : 'A quick tip for today'}
          onClick={() => tip && onOpen('tip', { tip, kind: 'tip' })}
        />
        <ListRow
          emoji="🎯" hue="rose" title="Do"
          subtitle={activity ? personalize(activity.title, profile) : 'A 5-minute activity'}
          onClick={() => activity && onOpen('tip', { tip: activity, kind: 'activity' })}
        />
        <ListRow
          emoji="❤️" hue="lavender" title="Remember"
          subtitle={flashback ? `${flashback.monthsAgo === 1 ? 'One month' : `${flashback.monthsAgo} months`} ago today · capture a moment` : 'Capture a moment'}
          onClick={() => setAdding(true)}
        />
        <ListRow
          emoji="📖" hue="sky" title="Read"
          subtitle={tonight ? `${isBedtimeHour(hour) ? 'Tonight' : 'Bedtime'}: ${tonight.title}` : 'A bedtime story'}
          onClick={() => tonight && onOpen('story', { story: tonight })}
          last
        />
      </Card>

      {/* This month: what to expect (free, always one tap away) */}
      {overview && (
        <Card padding="4px 14px" style={{ marginTop: '14px' }}>
          <ListRow
            emoji="📅" hue="mint" title={`Month ${month}: what to expect`}
            subtitle={personalize(overview.headsUp, profile)}
            onClick={() => onOpen('month')}
            last
          />
        </Card>
      )}

      {/* To do: checklists due right now */}
      {todos.length > 0 && (
        <>
          <SectionHeader title="To do" action="All checklists" onAction={() => onOpen('checklists')} style={{ marginTop: '18px' }} />
          <Card padding="4px 14px">
            {todos.slice(0, 2).map(({ c, done, total }, i, arr) => (
              <ListRow
                key={c.id}
                emoji={c.emoji} hue={c.hue}
                title={personalize(c.title, profile)}
                subtitle={done === 0 ? personalize(c.intro, profile) : `${done} of ${total} done`}
                onClick={() => onOpen('checklist', { id: c.id })}
                last={i === arr.length - 1}
              />
            ))}
          </Card>
        </>
      )}

      {/* Mood check-in */}
      <Card onClick={() => onOpen('mood')} style={{ marginTop: '14px' }} padding="14px 18px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={type.bodyStrong}>How is {babyName} today?</p>
            <p style={{ ...type.small, marginTop: '2px' }}>
              {pickedStates.length === 0
                ? 'Tap to check in — it shapes today’s tip'
                : pickedStates.map(s => `${s.emoji} ${s.label}`).join(' · ')}
            </p>
          </div>
          <Chevron />
        </div>
      </Card>

      {/* A memory resurfaced from ~N months ago, when one exists */}
      <div style={{ marginTop: '14px' }}>
        <Flashback profile={profile} onOpenJournal={onOpenJournal} />
      </div>

      {savedNote && (
        <p style={{ ...type.small, textAlign: 'center', marginTop: '10px', color: color.success, fontWeight: 600 }}>
          ✓ Saved to your journal ·{' '}
          <button onClick={onOpenJournal} style={{ border: 'none', background: 'none', color: color.primary, fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontSize: '12px' }}>
            View in journal →
          </button>
        </p>
      )}

      {adding && (
        <MemoryForm profile={profile} onClose={() => setAdding(false)} onSaved={handleMemorySaved} />
      )}
    </Screen>
  )
}
