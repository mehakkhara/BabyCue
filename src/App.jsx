import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import OnboardingScreen from './screens/OnboardingScreen'
import ChatScreen from './screens/ChatScreen'

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

const NAV_ITEMS = [
  { id: 'home', label: 'Today', Icon: HomeIcon },
  { id: 'chat', label: 'Ask',   Icon: ChatIcon },
]

export default function App() {
  const [profile, setProfile] = useState(loadProfile)
  const [activeTab, setActiveTab] = useState('home')

  if (!profile) {
    return <OnboardingScreen onComplete={setProfile} />
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative', minHeight: '100vh' }}>
      <div style={{ paddingBottom: '72px' }}>
        {activeTab === 'home' && <HomeScreen onResetProfile={() => setProfile(null)} />}
        {activeTab === 'chat' && <ChatScreen />}
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
