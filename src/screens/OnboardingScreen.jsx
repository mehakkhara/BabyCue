import { useState } from 'react'

const styleOptions = [
  {
    value: 'gentle',
    label: 'Gentle Parenting',
    description: 'Follow your baby\'s cues, responsive feeding, minimal crying',
    emoji: '🌿',
  },
  {
    value: 'schedule',
    label: 'Schedule-Based',
    description: 'Predictable routines, structured naps, gradual independence',
    emoji: '📅',
  },
]

function loadExisting() {
  try {
    const saved = localStorage.getItem('babyProfile')
    return saved ? JSON.parse(saved) : null
  } catch {
    return null
  }
}

export default function OnboardingScreen({ onComplete }) {
  const existing = loadExisting()
  const [babyName, setBabyName] = useState(existing?.babyName || '')
  const [dateOfBirth, setDateOfBirth] = useState(existing?.dateOfBirth || '')
  const [parentingStyle, setParentingStyle] = useState(existing?.parentingStyle || '')

  const canSave = babyName.trim().length > 0 && dateOfBirth.length > 0 && parentingStyle.length > 0

  function handleSave() {
    if (!canSave) return
    const profile = { babyName: babyName.trim(), dateOfBirth, parentingStyle, momName: 'Mama' }
    localStorage.setItem('babyProfile', JSON.stringify(profile))
    onComplete(profile)
  }

  const isEditing = !!existing

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '48px 24px 32px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: '700', color: '#1a1a2e', lineHeight: 1.3 }}>
        {isEditing ? 'Edit Profile' : 'Welcome'}
      </h1>
      <p style={{ margin: '0 0 40px', fontSize: '15px', color: '#888' }}>
        {isEditing ? 'Update your baby\'s info below.' : 'Tell us about your baby to get started.'}
      </p>

      {/* Baby name */}
      <label style={{ display: 'block', marginBottom: '24px' }}>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Baby's Name
        </span>
        <input
          type="text"
          placeholder="e.g. Lila"
          value={babyName}
          onChange={e => setBabyName(e.target.value)}
          autoFocus={!isEditing}
          style={{
            width: '100%',
            fontSize: '17px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '2px solid #E5E7EB',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
        />
      </label>

      {/* Date of birth */}
      <label style={{ display: 'block', marginBottom: '32px' }}>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Date of Birth
        </span>
        <input
          type="date"
          value={dateOfBirth}
          onChange={e => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          style={{
            width: '100%',
            fontSize: '17px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '2px solid #E5E7EB',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1a1a2e',
          }}
        />
      </label>

      {/* Parenting style */}
      <div style={{ marginBottom: '40px' }}>
        <span style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#555', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Parenting Style
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {styleOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setParentingStyle(option.value)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px',
                padding: '16px',
                borderRadius: '14px',
                border: `2px solid ${parentingStyle === option.value ? '#7C3AED' : '#E5E7EB'}`,
                backgroundColor: parentingStyle === option.value ? '#F3E8FF' : '#fff',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <span style={{ fontSize: '26px' }}>{option.emoji}</span>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '600', color: '#1a1a2e' }}>
                  {option.label}
                </p>
                <p style={{ margin: 0, fontSize: '13px', color: '#666', lineHeight: 1.5 }}>
                  {option.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canSave}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '14px',
          border: 'none',
          backgroundColor: canSave ? '#7C3AED' : '#E5E7EB',
          color: canSave ? '#fff' : '#999',
          fontSize: '16px',
          fontWeight: '600',
          cursor: canSave ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
        }}
      >
        {isEditing ? 'Save Changes' : 'Get Started'}
      </button>
    </div>
  )
}
