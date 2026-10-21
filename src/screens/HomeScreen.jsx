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
import { getTodayMoods } from '../lib/moodLog'
import { BABY_STATES } from '../data/babyStates'
import { getBabyPhoto, latestJournalPhotoUrl } from '../lib/babyPhoto'
import { greetingForHour, isBedtimeHour } from '../lib/timeOfDay'
import { personalize } from '../lib/pronouns'
import { sourceLabel } from '../lib/disclaimer'
import { getEntries } from '../data/journalStore'
import { pickFlashback } from '../components/Flashback'
import Flashback from '../components/Flashback'
import MemoryForm from '../components/MemoryForm'
import { markCheckIn, dayKey } from '../lib/streak'
import { hasSeenTipToday, markTipSeenToday } from '../lib/tipCard'
import { Screen, Card, ListRow, Avatar, SectionHeader, PrimaryButton, SecondaryButton, IconTile } from '../components/ui'
import { color, shadow, type } from '../theme'

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
  // Today's tip stays in full on the screen all day; "Got it" only marks it
  // read (and counts the check-in), it no longer collapses the card.
  const [gotIt, setGotIt] = useState(() => hasSeenTipToday())
  // The local calendar day; everything "of the day" re-picks when it changes.
  const [today, setToday] = useState(() => dayKey())

  // Re-read the clock and today's mood on resume so the screen follows the day.
  useEffect(() => {
    function refresh() {
      setHour(new Date().getHours())
      setMoods(getTodayMoods())
      // Past midnight since last look: new day, new tip, not yet read.
      setToday(prev => {
        const next = dayKey()
        if (next !== prev) setGotIt(hasSeenTipToday())
        return next
      })
    }
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

  // Tip of the day rotates through every advice tip for the month (activities
  // have their own row below).
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `today` re-picks at midnight
  const tip = useMemo(() => pickDailyTip(month), [month, today])
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `today` re-picks at midnight
  const activity = useMemo(() => pickDailyActivity(month), [month, today])
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
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const pickedStates = BABY_STATES.filter(s => moods.includes(s.key))

  function tipCardGotIt() {
    markCheckIn('tip')
    markTipSeenToday()
    setGotIt(true)
  }

  function tipCardReadMore() {
    onOpen('tip', { tip, kind: 'tip' })
  }

  function handleMemorySaved(first) {
    setAdding(false)
    markCheckIn('photo')
    setSavedNote(Date.now())
  }

  return (
    <Screen>
      {/* Greeting: name and the date. Profile sits behind the avatar. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...type.h1, fontSize: '24px' }}>{greetingForHour(hour, momName)}</h1>
          <p style={{ ...type.body, marginTop: '4px' }}>{dateLabel}</p>
        </div>
        <Avatar name={momName} onClick={() => onOpen('profile')} label="Your profile" />
      </div>

      {/* Baby hero: the photo, with name and age on it. Tap for the profile. */}
      <button onClick={() => onOpen('profile')} aria-label={`${babyName}'s photo`} style={{
        display: 'block', width: '100%', padding: 0, border: 'none', cursor: 'pointer', marginTop: '14px',
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
        </div>
      </button>

      {/* Mood check-in: one slim line under the photo, so it gets logged before the tip. */}
      <button onClick={() => onOpen('mood')} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 4px 0', border: 'none', background: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        <p style={{ ...type.body, color: color.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {pickedStates.length === 0
            ? <>How is {babyName} today? <span style={{ color: color.primary, fontWeight: 600 }}>Check in ›</span></>
            : <>{pickedStates.map(s => `${s.emoji} ${s.label}`).join(' · ')} <span style={{ color: color.primary, fontWeight: 600 }}>Update ›</span></>}
        </p>
      </button>

      {/* Today's tip: first thing on the screen, in full, all day. "Got it" marks it read
          and stays ticked; tomorrow brings the next tip. */}
      {tip && (
        <Card padding="18px 16px" style={{ marginTop: '10px', background: 'linear-gradient(160deg, #f5f3ff, #ffffff 70%)', border: '1px solid #e6e3f5' }}>
          <p style={type.kicker}>💡 Today's tip</p>
          <p style={{ ...type.bodyStrong, fontSize: '19px', lineHeight: 1.3, marginTop: '8px' }}>{personalize(tip.title, profile)}</p>
          <p style={{ ...type.body, color: color.text, marginTop: '8px' }}>{personalize(tip.body, profile)}</p>
          {tip.source && <p style={{ ...type.small, marginTop: '8px' }}>{sourceLabel(tip.source)}</p>}
          <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
            <SecondaryButton onClick={tipCardReadMore} style={{ flex: 1 }}>Read more</SecondaryButton>
            <PrimaryButton onClick={tipCardGotIt} done={gotIt} style={{ flex: 1, padding: '12px' }}>✓ Got it</PrimaryButton>
          </div>
        </Card>
      )}

      {/* Do today: the day's activity, with how long it takes. */}
      <Card onClick={() => activity && onOpen('tip', { tip: activity, kind: 'activity' })} style={{ marginTop: '14px' }} padding="14px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IconTile emoji="🎯" hue="rose" size={40} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={type.bodyStrong}>Do today</p>
            <p style={{ ...type.small, marginTop: '2px' }}>{activity ? personalize(activity.title, profile) : 'A 5-minute activity'}</p>
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#b45309', background: '#fef3c7', padding: '4px 8px', borderRadius: '999px', whiteSpace: 'nowrap' }}>
            {activity?.minutes ? `${activity.minutes} min` : '5 min'}
          </span>
        </div>
      </Card>

      {/* Journal and Read, side by side. */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
        <Card onClick={() => setAdding(true)} padding="12px">
          <IconTile emoji="🧸" hue="peach" size={32} />
          <p style={{ ...type.bodyStrong, fontSize: '13.5px', marginTop: '10px' }}>Journal</p>
          <p style={{ ...type.small, marginTop: '2px' }}>
            {flashback ? `${flashback.monthsAgo === 1 ? 'One month' : `${flashback.monthsAgo} months`} ago today · add a moment` : "Add today's moment"}
          </p>
        </Card>
        <Card onClick={() => tonight && onOpen('story', { story: tonight })} padding="12px">
          <IconTile emoji="🌙" hue="sky" size={32} />
          <p style={{ ...type.bodyStrong, fontSize: '13.5px', marginTop: '10px' }}>{isBedtimeHour(hour) ? 'Read tonight' : 'Read at bedtime'}</p>
          <p style={{ ...type.small, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tonight ? tonight.title : 'A bedtime story'}</p>
        </Card>
      </div>

      {/* This month: what to expect (free, always one tap away) and anything due now. */}
      <SectionHeader title="This month" action="Browse by month" onAction={() => onOpen('browse')} style={{ marginTop: '18px' }} />
      {(overview || todos.length > 0) && (
        <Card padding="4px 14px">
          {overview && (
            <ListRow
              emoji="📅" hue="mint" title={`Month ${month}: what to expect`}
              subtitle={personalize(overview.headsUp, profile)}
              onClick={() => onOpen('month')}
              last={todos.length === 0}
            />
          )}
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
      )}

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
