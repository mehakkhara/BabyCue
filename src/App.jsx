import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import ChatScreen from './screens/ChatScreen'
import StatsScreen from './screens/StatsScreen'
import JournalScreen from './screens/JournalScreen'
import AuthScreen from './screens/AuthScreen'
import { isSupabaseConfigured } from './lib/supabase'
import { useSession, signOut } from './lib/useSession'

function loadProfile() {
  try {
    const saved = localStorage.getItem('babyProfile')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

const HomeIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7C6FF7' : '#aab'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"/>
    <path d="M9 21V12h6v9"/>
  </svg>
)

const ChatIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7C6FF7' : '#aab'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>
)

const StatsIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7C6FF7' : '#aab'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6"  y1="20" x2="6"  y2="14"/>
    <line x1="2"  y1="20" x2="22" y2="20"/>
  </svg>
)

const JournalIcon = ({ active }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#7C6FF7' : '#aab'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const NAV_ITEMS = [
  { id: 'home',    label: 'Today',   Icon: HomeIcon    },
  { id: 'chat',    label: 'Ask',     Icon: ChatIcon    },
  { id: 'stats',   label: 'Growth',  Icon: StatsIcon   },
  { id: 'journal', label: 'Journal', Icon: JournalIcon },
]

export default function App() {
  const { status, session } = useSession()
  const [profile, setProfile] = useState(loadProfile)
  const [activeTab, setActiveTab] = useState('home')

  // Wait for Supabase to tell us whether there's an existing session before
  // we decide which screen to render — avoids a flash of the auth screen on
  // refresh for already-signed-in users.
  if (status === 'loading') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '14px',
      }}>
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
    return <OnboardingScreen onComplete={setProfile} />
  }

  const handleSignOut = async () => {
    await signOut()
    // Auth state change will re-render the app into AuthScreen. We also clear
    // the in-memory profile so the next signed-in user starts from onboarding
    // (their profile will come from Supabase once migration lands).
    setProfile(null)
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative', minHeight: '100vh' }}>
      <div style={{ paddingBottom: '72px' }}>
        {activeTab === 'home'    && <HomeScreen onResetProfile={() => setProfile(null)} onSignOut={isSupabaseConfigured ? handleSignOut : null} />}
        {activeTab === 'chat'    && <ChatScreen />}
        {activeTab === 'stats'   && <StatsScreen />}
        {activeTab === 'journal' && <JournalScreen />}
      </div>

      {/* Bottom nav */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: '480px',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255,255,255,0.6)',
        display: 'flex',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{
                flex: 1,
                padding: '12px 0 14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Icon active={isActive} />
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: isActive ? '#7C6FF7' : '#aab',
                letterSpacing: '0.02em',
              }}>
                {label}
              </span>
              {isActive && (
                <div style={{
                  width: '20px',
                  height: '3px',
                  borderRadius: '2px',
                  backgroundColor: '#7C6FF7',
                  marginTop: '1px',
                }} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
