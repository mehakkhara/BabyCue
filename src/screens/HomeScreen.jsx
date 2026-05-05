import { useState } from 'react'
import TipCard from '../components/TipCard'
import { getTipsForProfile, getBabyAgeInMonths, formatBabyAge } from '../data/tips'

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

const styleEmoji = {
  gentle: '🌿',
  schedule: '📅',
}

const otherStyle = {
  gentle: 'schedule',
  schedule: 'gentle',
}

const TOPICS = [
  { value: 'sleep',       label: 'Sleep',       emoji: '🌙', desc: 'Schedules, naps & night waking'  },
  { value: 'feeding',     label: 'Feeding',     emoji: '🍼', desc: 'Milk, solids & feeding cues'     },
  { value: 'development', label: 'Development', emoji: '🧠', desc: 'Milestones & play'               },
  { value: 'activity',    label: 'Activities',  emoji: '🎨', desc: 'What to do with baby right now'  },
  { value: 'teething',    label: 'Teething',    emoji: '🦷', desc: 'Comfort & timing'                },
  { value: 'motor',       label: 'Motor',       emoji: '💪', desc: 'Movement & strength'             },
]

const STAT_COLORS = [
  { accent: '#4F7CF7' },
  { accent: '#8B5CF6' },
  { accent: '#059669' },
  { accent: '#E91E8C' },
]

export default function HomeScreen({ onResetProfile }) {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [viewStyle, setViewStyle] = useState(null)

  const profile = JSON.parse(localStorage.getItem('babyProfile') || '{}')
  const { babyName, dateOfBirth, parentingStyle, momName } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)
  const contentMonth = Math.max(1, Math.min(ageInMonths, 12))
  const stats = AGE_STATS[contentMonth] || AGE_STATS[12]
  const STAT_ITEMS = [
    { icon: '🍼', label: 'Milk/day',    value: stats.milk    },
    { icon: '⏱️', label: 'Wake window', value: stats.wake    },
    { icon: '💤', label: 'Naps',        value: stats.naps    },
    { icon: '🩹', label: 'Diapers',     value: stats.diapers },
  ]

  const activeStyle = viewStyle || parentingStyle

  const dailyTip = getTipsForProfile(contentMonth, parentingStyle)[0]
  const topicTips = selectedTopic
    ? getTipsForProfile(contentMonth, activeStyle, selectedTopic)
    : []

  const activeTopic = TOPICS.find(t => t.value === selectedTopic)

  function openTopic(topic) {
    setSelectedTopic(topic)
    setViewStyle(null)
  }

  function closeTopic() {
    setSelectedTopic(null)
    setViewStyle(null)
  }

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
          {babyName} is {formatBabyAge(dateOfBirth)}
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
        {STAT_ITEMS.map((stat, i) => (
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
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '4px',
              borderRadius: '18px 18px 0 0',
              backgroundColor: STAT_COLORS[i].accent,
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
        ))}
      </div>

      {/* Tip of the Day */}
      {dailyTip && (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '20px',
          marginBottom: '20px',
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

      {/* Topic browser */}
      {!selectedTopic ? (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '2px' }}>
            What do you want to explore?
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {TOPICS.map((topic, i) => (
              <button
                key={topic.value}
                onClick={() => openTopic(topic.value)}
                style={{
                  background: '#fff',
                  border: 'none',
                  borderRadius: '18px',
                  padding: '18px 16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
                  transition: 'transform 0.12s, box-shadow 0.12s',
                  gridColumn: TOPICS.length % 2 !== 0 && i === TOPICS.length - 1 ? 'span 2' : undefined,
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onTouchStart={e => e.currentTarget.style.transform = 'scale(0.97)'}
                onTouchEnd={e => e.currentTarget.style.transform = 'scale(1)'}
              >
                <span style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }}>{topic.emoji}</span>
                <span style={{ display: 'block', fontSize: '14px', fontWeight: '700', color: '#1e1b4b', marginBottom: '4px' }}>
                  {topic.label}
                </span>
                <span style={{ display: 'block', fontSize: '12px', color: '#9ca3af', lineHeight: 1.4 }}>
                  {topic.desc}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ animation: 'fadeIn 0.2s ease' }}>
          {/* Back button */}
          <button
            onClick={closeTopic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0 0 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#7C6FF7',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            {activeTopic.emoji} {activeTopic.label}
          </button>

          {/* Style toggle */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginBottom: '16px',
            background: '#f3f4f6',
            borderRadius: '14px',
            padding: '4px',
          }}>
            {[parentingStyle, otherStyle[parentingStyle]].map(s => {
              const isActive = activeStyle === s
              const isOwn = s === parentingStyle
              return (
                <button
                  key={s}
                  onClick={() => setViewStyle(s)}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: isActive ? '#fff' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(100,100,180,0.12)' : 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: isActive ? '#1e1b4b' : '#9ca3af',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                  }}
                >
                  <span>{styleEmoji[s]}</span>
                  <span>{isOwn ? 'Your style' : styleLabels[s]}</span>
                </button>
              )
            })}
          </div>

          {/* Tips */}
          <div key={activeStyle} style={{ animation: 'fadeIn 0.18s ease' }}>
            {topicTips.length > 0 ? (
              topicTips.map(tip => (
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
                No {activeTopic.label.toLowerCase()} tips for this month yet — check back soon!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Edit profile */}
      <div style={{ textAlign: 'center', marginTop: '36px', paddingBottom: '16px' }}>
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
