import { useEffect, useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import StoriesScreen from './screens/StoriesScreen'
import GrowthScreen from './screens/GrowthScreen'
import JournalScreen from './screens/JournalScreen'
import AuthScreen from './screens/AuthScreen'
import TipDetail from './screens/TipDetail'
import MoodScreen from './screens/MoodScreen'
import ProfileScreen from './screens/ProfileScreen'
import SavedTipsScreen from './screens/SavedTipsScreen'
import ChecklistsScreen from './screens/ChecklistsScreen'
import ChecklistDetail from './screens/ChecklistDetail'
import StoryReader from './screens/StoryReader'
import PhotoHunt from './components/PhotoHunt'
import { Screen } from './components/ui'
import { markCheckIn } from './lib/streak'
import { isSupabaseConfigured } from './lib/supabase'
import { useSession, signOut } from './lib/useSession'
import { getProfile, saveProfile, backfillLocalProfileIfNeeded } from './lib/db'
import { isBedtimeHour } from './lib/timeOfDay'
import { useViewStack } from './lib/viewStack'
import { color } from './theme'

const ICON_ON = color.primary
const ICON_OFF = '#a7a4c0'

const HomeIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? ICON_ON : 'none'} stroke={active ? ICON_ON : ICON_OFF} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V13h6v8" stroke={active ? '#fff' : ICON_OFF} fill="none"/>
  </svg>
)

const StoriesIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? ICON_ON : 'none'} stroke={active ? ICON_ON : ICON_OFF} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h6a4 4 0 014 4v13a3 3 0 00-3-3H2z"/>
    <path d="M22 4h-6a4 4 0 00-4 4v13a3 3 0 013-3h7z"/>
  </svg>
)

const StatsIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={active ? ICON_ON : ICON_OFF} strokeWidth={active ? 2.8 : 2} strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
)

const JournalIcon = ({ active }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? ICON_ON : 'none'} stroke={active ? ICON_ON : ICON_OFF} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="4" ry="4"/>
    <circle cx="8.5" cy="8.5" r="1.5" fill={active ? '#fff' : 'none'} stroke={active ? '#fff' : ICON_OFF}/>
    <polyline points="21 15 16 10 5 21" stroke={active ? '#fff' : ICON_OFF} fill="none"/>
  </svg>
)

const NAV_ITEMS = [
  { id: 'home',    label: 'Today',   Icon: HomeIcon    },
  { id: 'stories', label: 'Stories', Icon: StoriesIcon },
  { id: 'stats',   label: 'Growth',  Icon: StatsIcon   },
  { id: 'journal', label: 'Journal', Icon: JournalIcon },
]

export default function App() {
  const { status, session } = useSession()
  // undefined = loading, null = no profile yet, object = ready
  const [profile, setProfile] = useState(undefined)
  // During wind-down hours the app opens on Stories — bedtime is what she's
  // here for at 8pm. Initial tab only; navigation stays entirely hers.
  const [activeTab, setActiveTab] = useState(() => (isBedtimeHour() ? 'stories' : 'home'))
  // True only when the app itself chose Stories at launch — Stories uses it
  // to say why, the first few times.
  const [openedForBedtime] = useState(() => isBedtimeHour())
  // Detail pages (tip, activity, mood, profile, story) sit on top of the tabs.
  const { view, push, pop, replace } = useViewStack()
  const [photoVersion, setPhotoVersion] = useState(0)

  // Each tab opens at its top, like a native app. Tapping the tab you're
  // already on also scrolls to the top (the iOS convention).
  function goToTab(id) {
    setActiveTab(id)
    window.scrollTo({ top: 0, left: 0, behavior: id === activeTab ? 'smooth' : 'auto' })
  }

  // Dusk backdrop during wind-down hours. Re-checked on resume and on a slow
  // interval — a phone app crosses 7pm while backgrounded, not while watched.
  useEffect(() => {
    function applyTheme() {
      document.body.classList.toggle('evening', isBedtimeHour())
    }
    applyTheme()
    const timer = setInterval(applyTheme, 10 * 60 * 1000)
    document.addEventListener('visibilitychange', applyTheme)
    window.addEventListener('focus', applyTheme)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', applyTheme)
      window.removeEventListener('focus', applyTheme)
    }
  }, [])

  useEffect(() => {
    if (status !== 'ready') return
    // Not signed in (and Supabase is configured) — don't load anything yet.
    if (isSupabaseConfigured && !session) {
      setProfile(null)
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        // First sign-in: push any guest-mode localStorage profile up to Supabase.
        const backfilled = isSupabaseConfigured && session
          ? await backfillLocalProfileIfNeeded()
          : null
        const p = backfilled ?? (await getProfile())
        if (!cancelled) setProfile(p)
      } catch (err) {
        console.error('Profile load failed:', err)
        if (!cancelled) setProfile(null)
      }
    })()
    return () => { cancelled = true }
  }, [status, session])

  async function handleProfileChange(next) {
    await saveProfile(next)
    setProfile(next)
  }

  // Wait for Supabase to tell us whether there's an existing session before
  // we decide which screen to render — avoids a flash of the auth screen on
  // refresh for already-signed-in users.
  if (status === 'loading' || profile === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: '14px' }}>
        Loading…
      </div>
    )
  }

  // When Supabase is wired up, require sign-in before anything else.
  // When it isn't, fall straight through to guest mode (localStorage).
  if (isSupabaseConfigured && !session) {
    return <AuthScreen />
  }

  if (!profile) {
    return <OnboardingScreen onComplete={handleProfileChange} />
  }

  const handleSignOut = async () => {
    await signOut()
    setProfile(null)
  }

  // Detail pages hide the tab bar; the back arrow (or the phone's back
  // gesture) returns to the tab underneath.
  if (view) {
    const { name, params, key } = view
    const openTip = (tip, kind = 'related') => replace('tip', { tip, kind })
    let page = null
    if (name === 'tip') page = <TipDetail tip={params.tip} kind={params.kind} profile={profile} onBack={pop} onOpenTip={openTip} />
    else if (name === 'mood') page = <MoodScreen profile={profile} onBack={pop} />
    else if (name === 'profile') page = (
      <ProfileScreen
        profile={profile}
        onBack={pop}
        onEditProfile={() => push('editProfile')}
        onSavedTips={() => push('savedTips')}
        onChecklists={() => push('checklists')}
        onSignOut={isSupabaseConfigured ? handleSignOut : null}
        onPhotoChange={() => setPhotoVersion(v => v + 1)}
      />
    )
    else if (name === 'checklists') page = <ChecklistsScreen profile={profile} onBack={pop} onOpenChecklist={id => push('checklist', { id })} />
    else if (name === 'checklist') page = <ChecklistDetail id={params.id} profile={profile} onBack={pop} />
    else if (name === 'savedTips') page = <SavedTipsScreen profile={profile} onBack={pop} onOpenTip={tip => push('tip', { tip, kind: 'saved' })} />
    else if (name === 'month') page = <MonthScreen profile={profile} onBack={pop} />
    else if (name === 'browse') page = <BrowseScreen profile={profile} onBack={pop} onOpenTip={tip => push('tip', { tip, kind: 'browse' })} />
    else if (name === 'editProfile') page = <OnboardingScreen onComplete={async p => { await handleProfileChange(p); pop() }} />
    else if (name === 'story') page = <StoryReader story={params.story} profile={profile} onClose={pop} />
    else if (name === 'photoHunt') page = (
      <Screen onBack={pop} detail>
        <PhotoHunt profile={profile} onCheckIn={() => markCheckIn('photo')} />
      </Screen>
    )
    return (
      <div key={key} style={{ maxWidth: '480px', margin: '0 auto', minHeight: '100vh', animation: 'fadeIn 0.18s ease' }}>
        {page}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative', minHeight: '100vh' }}>
      <div key={activeTab} style={{ paddingBottom: '72px', animation: 'fadeIn 0.22s ease' }}>
        {activeTab === 'home'    && <HomeScreen profile={profile} onOpen={push} onOpenJournal={() => goToTab('journal')} photoVersion={photoVersion} />}
        {activeTab === 'stories' && <StoriesScreen profile={profile} openedForBedtime={openedForBedtime} onGoHome={() => goToTab('home')} />}
        {activeTab === 'stats'   && <GrowthScreen profile={profile} onProfileChange={handleProfileChange} onOpen={push} />}
        {activeTab === 'journal' && <JournalScreen profile={profile} onOpen={push} />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(124,111,247,0.08)',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          const bedtimeMark = id === 'stories' && openedForBedtime
          return (
            <button
              key={id}
              onClick={() => goToTab(id)}
              style={{
                flex: 1,
                padding: '10px 0 12px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
                fontFamily: 'inherit',
              }}
            >
              <span style={{ position: 'relative', display: 'inline-flex' }}>
                <Icon active={isActive} />
                {/* A tiny moon during wind-down hours: opening on Stories was on purpose. */}
                {bedtimeMark && (
                  <span aria-hidden="true" style={{ position: 'absolute', top: '-6px', right: '-9px', fontSize: '10px', lineHeight: 1 }}>🌙</span>
                )}
              </span>
              <span style={{ fontSize: '11px', fontWeight: isActive ? 700 : 600, color: isActive ? ICON_ON : ICON_OFF, letterSpacing: '0.01em' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
