import { useState } from 'react'
import HomeScreen from './screens/HomeScreen'
import OnboardingScreen from './screens/OnboardingScreen'

function loadProfile() {
  try {
    const saved = localStorage.getItem('babyProfile')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export default function App() {
  const [profile, setProfile] = useState(loadProfile)

  if (!profile) {
    return <OnboardingScreen onComplete={setProfile} />
  }

  return <HomeScreen onResetProfile={() => setProfile(null)} />
}
