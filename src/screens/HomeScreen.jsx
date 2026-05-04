import { useState } from 'react'
import TipCard from '../components/TipCard'
import { getTipsForProfile, getBabyAgeInMonths } from '../data/tips'

const AGE_STATS = {
  0:  { milk: '16–24 oz', wake: '45–60 min', naps: '4–5', diapers: '8–12' },
  1:  { milk: '16–24 oz', wake: '45–60 min', naps: '4–5', diapers: '8–12' },
  2:  { milk: '24–32 oz', wake: '1–1.5 hr',  naps: '4–5', diapers: '6–8'  },
  3:  { milk: '24–32 oz', wake: '1–1.5 hr',  naps: '3–5', diapers: '6–8'  },
  4:  { milk: '24–36 oz', wake: '1.5–2 hr',  naps: '3–4', diapers: '4–6'  },
  5:  { milk: '24–36 oz', wake: '1.5–2.5 hr',naps: '3',   diapers: '4–6'  },
  6:  { milk: '24–36 oz', wake: '2–3 hr',    naps: '2–3', diapers: '4–6'  },
  7:  { milk: '24–32 oz', wake: '2.5–3 hr',  naps: '2–3', diapers: '4–5'  },
  8:  { milk: '24–32 oz', wake: '2.5–3 hr',  naps: '2',   diapers: '4–5'  },
  9:  { milk: '24–32 oz', wake: '3–3.5 hr',  naps: '2',   diapers: '4–5'  },
  10: { milk: '16–24 oz', wake: '3–4 hr',    naps: '1–2', diapers: '4–5'  },
  11: { milk: '16–24 oz', wake: '3–4 hr',    naps: '1–2', diapers: '4–5'  },
  12: { milk: '16–24 oz', wake: '3.5–4.5 hr',naps: '1',   diapers: '4–5'  },
}

const styleLabels = {
  gentle: 'Gentle Parenting',
  schedule: 'Schedule-Based',
}

const TOPICS = [
  { value: null,          label: 'All',         emoji: '✨' },
  { value: 'sleep',       label: 'Sleep',       emoji: '🌙' },
  { value: 'teething',    label: 'Teething',    emoji: '🦷' },
  { value: 'feeding',     label: 'Feeding',     emoji: '🍼' },
  { value: 'development', label: 'Development', emoji: '🧠' },
  { value: 'motor',       label: 'Motor',       emoji: '💪' },
]

const STAT_COLORS = [
  { bg: '#E8F0FE', accent: '#4F7CF7' },
  { bg: '#EDE8FD', accent: '#8B5CF6' },
  { bg: '#D4EDE6', accent: '#059669' },
  { bg: '#FCE4EC', accent: '#E91E8C' },
]

export default function HomeScreen({ onResetProfile }) {
  const [selectedTopic, setSelectedTopic] = useState(null)

  const profile = JSON.parse(localStorage.getItem('babyProfile') || '{}')
  const { babyName, dateOfBirth, parentingStyle, momName } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)
  const contentMonth = Math.max(1, Math.min(ageInMonths, 12))
  const tipsList = getTipsForProfile(contentMonth, parentingStyle, selectedTopic)
  const stats = AGE_STATS[contentMonth] || AGE_STATS[12]
  const STAT_ITEMS = [
    { icon: '🍼', label: 'Milk/day',    value: stats.milk    },
    { icon: '⏱️', label: 'Wake window', value: stats.wake    },
    { icon: '💤', label: 'Naps',        value: stats.naps    },
    { icon: '🩹', label: 'Diapers',     value: stats.diapers },
  ]

  const dailyTip = getTipsForProfile(contentMonth, parentingStyle)[0]

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '28px 16px 16px',
      minHeight: '100vh',
    }}>

      {/* Header card */}
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '22px 20px',
        marginBottom: '14px',
        boxShadow: '0 4px 24px rgba(100,100,180,0.08)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>
          Hi {momName}!
        </p>
        <h1 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '700', color: '#1e1b4b', lineHeight: 1.2 }}>
          {babyName} is {ageInMonths === 0 ? 'a newborn' : `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'} old`}
        </h1>
        <span style={{
          display: 'inline-block',
          background: 'linear-gradient(135deg, #ede8ff, #dce8f8)',
          color: '#6d5fe6',
          fontSize: '12px',
          fontWeight: '600',
          padding: '5px 12px',
          borderRadius: '20px',
          letterSpacing: '0.02em',
        }}>
          {styleLabels[parentingStyle]}
        </span>
      </div>

      {/* Stats banner */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', overflowX: 'auto', paddingBottom: '2px' }}>
        {STAT_ITEMS.map((stat, i) => {
          const { bg, accent } = STAT_COLORS[i]
          return (
            <div key={stat.label} style={{
              flex: '1 0 76px',
              background: '#fff',
              borderRadius: '18px',
              padding: '14px 8px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {/* Pastel color tab at top */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                borderRadius: '18px 18px 0 0',
                backgroundColor: accent,
                opacity: 0.6,
              }} />
              <span style={{ fontSize: '18px', marginTop: '4px' }}>{stat.icon}</span>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e1b4b', textAlign: 'center', lineHeight: 1.2 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', lineHeight: 1.3 }}>
                {stat.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Tip of the Day */}
      {dailyTip && (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '14px',
          boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
          borderLeft: '4px solid #a78bfa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <span style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Tip of the Day
            </span>
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1e1b4b', lineHeight: 1.5 }}>
            {dailyTip.title}
          </p>
          <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.65', color: '#6b7280' }}>
            {dailyTip.body}
          </p>
        </div>
      )}

      {/* This Month's Focus */}
      <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
        <span style={{ fontSize: '16px' }}>🌙</span>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#6b7280' }}>
          This Month's Focus
          {selectedTopic && (
            <span style={{ fontSize: '13px', fontWeight: '500', color: '#7C6FF7', marginLeft: '8px' }}>
              — {TOPICS.find(t => t.value === selectedTopic)?.label}
            </span>
          )}
        </h2>
      </div>

      {/* Tip cards */}
      {tipsList.length > 0 ? (
        tipsList.map(tip => (
          <TipCard
            key={tip.id}
            title={tip.title}
            body={tip.body}
            style={tip.style}
            source={tip.source}
          />
        ))
      ) : (
        <p style={{ color: '#9ca3af', fontSize: '14px', padding: '0 4px' }}>
          No {selectedTopic} tips for month {ageInMonths} yet — try another topic!
        </p>
      )}

      {/* Topic chips */}
      <div style={{ marginTop: '28px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '4px' }}>
          Explore by Topic
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {TOPICS.map(topic => {
            const isSelected = selectedTopic === topic.value
            return (
              <button
                key={String(topic.value)}
                onClick={() => setSelectedTopic(topic.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isSelected
                    ? 'linear-gradient(135deg, #7C6FF7, #a78bfa)'
                    : '#fff',
                  color: isSelected ? '#fff' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(124,111,247,0.35)'
                    : '0 2px 8px rgba(100,100,180,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                <span>{topic.emoji}</span>
                <span>{topic.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Edit profile */}
      <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '16px' }}>
        <button
          onClick={onResetProfile}
          style={{ background: 'none', border: 'none', color: '#c4c4d4', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  )
}
