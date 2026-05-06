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
  12: { milk: '16–24 oz', wake: '3.5–4.5 hr',naps: '1–2', diapers: '4–5'  },
  13: { milk: '16–24 oz', wake: '4–5 hr',    naps: '1–2', diapers: '3–5'  },
  14: { milk: '16–24 oz', wake: '4–5 hr',    naps: '1–2', diapers: '3–5'  },
  15: { milk: '16–24 oz', wake: '4.5–5.5 hr',naps: '1–2', diapers: '3–5'  },
  16: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  17: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  18: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  19: { milk: '14–20 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  20: { milk: '14–20 oz', wake: '5.5–6 hr',  naps: '1',   diapers: '3–4'  },
  21: { milk: '14–20 oz', wake: '5.5–6 hr',  naps: '1',   diapers: '3–4'  },
  22: { milk: '14–20 oz', wake: '5.5–6.5 hr',naps: '1',   diapers: '2–4'  },
  23: { milk: '14–20 oz', wake: '6+ hr',     naps: '1',   diapers: '2–4'  },
  24: { milk: '14–20 oz', wake: '6+ hr',     naps: '1',   diapers: '2–4'  },
}

const styleLabels = {
  gentle: 'Gentle Parenting',
  schedule: 'Schedule-Based',
}

const styleEmoji = {
  gentle: '🌿',
  schedule: '📅',
}

const PRIMARY_TOPICS = [
  { value: null,          label: 'All',         emoji: '✨' },
  { value: 'sleep',       label: 'Sleep',       emoji: '🌙' },
  { value: 'feeding',     label: 'Feeding',     emoji: '🍼' },
  { value: 'development', label: 'Development', emoji: '🧠' },
  { value: 'motor',       label: 'Motor',       emoji: '💪' },
]

const OTHER_TOPICS = [
  { value: 'activity',   label: 'Activities',  emoji: '🎨' },
  { value: 'teething',   label: 'Teething',    emoji: '🦷' },
  { value: 'fussy',      label: 'Fussy Phase', emoji: '😮‍💨' },
  { value: 'leap',       label: 'Dev Leap',    emoji: '🧩' },
  { value: 'regression', label: 'Regression',  emoji: '🔄' },
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
  const [showOtherTopics, setShowOtherTopics] = useState(false)

  const profile = JSON.parse(localStorage.getItem('babyProfile') || '{}')
  const { babyName, dateOfBirth, parentingStyle, momName } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)
  const currentMonth = Math.max(1, Math.min(ageInMonths, 24))
  const [browseMonth, setBrowseMonth] = useState(currentMonth)

  const stats = AGE_STATS[browseMonth] || AGE_STATS[12]
  const STAT_ITEMS = [
    { icon: '🍼', label: 'Milk/day',    value: stats.milk    },
    { icon: '⏱️', label: 'Wake window', value: stats.wake    },
    { icon: '💤', label: 'Naps',        value: stats.naps    },
    { icon: '🩹', label: 'Diapers',     value: stats.diapers },
  ]

  const activeStyle = viewStyle || parentingStyle
  const allTips = getTipsForProfile(browseMonth, activeStyle, selectedTopic)
  const dayIndex = Math.floor(Date.now() / 86400000)
  const todayTipIndex = allTips.length > 0 ? dayIndex % allTips.length : 0
  const tipOfDay = allTips[todayTipIndex]
  const extraTips = allTips.filter((_, i) => i !== todayTipIndex).slice(0, 2)

  const isCurrentMonth = browseMonth === currentMonth

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

      {/* Month navigator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        background: '#fff',
        borderRadius: '16px',
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
      }}>
        <button
          onClick={() => setBrowseMonth(m => Math.max(1, m - 1))}
          disabled={browseMonth === 1}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: browseMonth === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
            color: browseMonth === 1 ? '#c4c4d4' : '#fff',
            fontSize: '16px',
            cursor: browseMonth === 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ‹
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e1b4b' }}>
            Month {browseMonth}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={() => setBrowseMonth(currentMonth)}
              style={{
                display: 'block',
                margin: '2px auto 0',
                background: 'none',
                border: 'none',
                fontSize: '11px',
                color: '#a78bfa',
                cursor: 'pointer',
                fontWeight: '600',
                padding: 0,
              }}
            >
              Back to now
            </button>
          )}
          {isCurrentMonth && (
            <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Current age
            </span>
          )}
        </div>

        <button
          onClick={() => setBrowseMonth(m => Math.min(24, m + 1))}
          disabled={browseMonth === 24}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: browseMonth === 24 ? '#f3f4f6' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
            color: browseMonth === 24 ? '#c4c4d4' : '#fff',
            fontSize: '16px',
            cursor: browseMonth === 24 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ›
        </button>
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

      {/* Tips section */}
      <div key={`${activeStyle}-${selectedTopic}-${browseMonth}`} style={{ animation: 'fadeIn 0.2s ease' }}>
        {tipOfDay ? (
          <>
            {/* Tip of the Day */}
            <div style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '20px',
              marginBottom: '12px',
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
                {tipOfDay.title}
              </p>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.65', color: '#6b7280' }}>
                {tipOfDay.body}
              </p>
              {tipOfDay.source && (
                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#c4b5fd' }}>
                  Source: {tipOfDay.source}
                </p>
              )}
            </div>

            {/* Two more tips */}
            {extraTips.map(tip => (
              <TipCard
                key={tip.id}
                title={tip.title}
                body={tip.body}
                style={tip.style}
                source={tip.source}
              />
            ))}
          </>
        ) : (
          <p style={{ color: '#9ca3af', fontSize: '14px', padding: '0 4px', marginBottom: '12px' }}>
            No tips for this filter yet — try another topic!
          </p>
        )}
      </div>

      {/* Style toggle */}
      <div style={{
        display: 'flex',
        gap: '8px',
        margin: '20px 0 16px',
        background: '#f3f4f6',
        borderRadius: '14px',
        padding: '4px',
      }}>
        {[parentingStyle, parentingStyle === 'gentle' ? 'schedule' : 'gentle'].map(s => {
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

      {/* Topic chips */}
      <div>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '2px' }}>
          Explore by Topic
        </p>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {PRIMARY_TOPICS.map(topic => {
            const isSelected = selectedTopic === topic.value
            return (
              <button
                key={String(topic.value)}
                onClick={() => {
                  setSelectedTopic(topic.value)
                  setShowOtherTopics(false)
                }}
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
                  flexShrink: 0,
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
          {/* Other chip */}
          {(() => {
            const otherSelected = OTHER_TOPICS.some(t => t.value === selectedTopic)
            const isActive = showOtherTopics || otherSelected
            return (
              <button
                onClick={() => setShowOtherTopics(v => !v)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isActive
                    ? 'linear-gradient(135deg, #7C6FF7, #a78bfa)'
                    : '#fff',
                  color: isActive ? '#fff' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: isActive
                    ? '0 4px 12px rgba(124,111,247,0.35)'
                    : '0 2px 8px rgba(100,100,180,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                <span>＋</span>
                <span>Other</span>
              </button>
            )
          })()}
        </div>

        {/* Other topics expanded row */}
        {showOtherTopics && (
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            marginTop: '8px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            animation: 'fadeIn 0.15s ease',
          }}>
            {OTHER_TOPICS.map(topic => {
              const isSelected = selectedTopic === topic.value
              return (
                <button
                  key={topic.value}
                  onClick={() => setSelectedTopic(isSelected ? null : topic.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    background: isSelected
                      ? 'linear-gradient(135deg, #e879f9, #a78bfa)'
                      : '#faf5ff',
                    color: isSelected ? '#fff' : '#7c3aed',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    flexShrink: 0,
                    boxShadow: isSelected
                      ? '0 4px 12px rgba(168,85,247,0.35)'
                      : '0 2px 8px rgba(168,85,247,0.08)',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{topic.emoji}</span>
                  <span>{topic.label}</span>
                </button>
              )
            })}
          </div>
        )}
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
