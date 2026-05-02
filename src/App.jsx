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

const NAV_ITEMS = [
  { id: 'home', label: 'Today', emoji: '🏠' },
  { id: 'chat', label: 'Ask',   emoji: '💬' },
]

export default function App() {
  const [profile, setProfile] = useState(loadProfile)
  const [activeTab, setActiveTab] = useState('home')

  if (!profile) {
    return <OnboardingScreen onComplete={setProfile} />
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', position: 'relative', minHeight: '100vh' }}>
      {/* Screen content */}
      <div style={{ paddingBottom: '68px' }}>
        {activeTab === 'home' && (
          <HomeScreen onResetProfile={() => setProfile(null)} />
        )}
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
        backgroundColor: '#fff',
        borderTop: '1px solid #F0F0F0',
        display: 'flex',
        zIndex: 100,
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                flex: 1,
                padding: '10px 0 14px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '3px',
              }}
            >
              <span style={{ fontSize: '20px' }}>{item.emoji}</span>
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                color: isActive ? '#7C3AED' : '#AAA',
              }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
