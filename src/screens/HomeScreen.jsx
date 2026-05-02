import { useState } from 'react'
import TipCard from '../components/TipCard'
import { getTipsForProfile, getBabyAgeInMonths } from '../data/tips'

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

export default function HomeScreen({ onResetProfile }) {
  const [selectedTopic, setSelectedTopic] = useState(null)

  const profile = JSON.parse(localStorage.getItem('babyProfile') || '{}')
  const { babyName, dateOfBirth, parentingStyle, momName } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)
  const contentMonth = Math.max(1, Math.min(ageInMonths, 12))
  const tipsList = getTipsForProfile(contentMonth, parentingStyle, selectedTopic)

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '24px 16px',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      minHeight: '100vh',
      backgroundColor: '#FAFAFA',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '16px',
        padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#888' }}>Hi {momName}!</p>
        <h1 style={{ margin: '0 0 10px', fontSize: '24px', fontWeight: '700', color: '#1a1a2e' }}>
          {babyName} is {ageInMonths === 0 ? 'a newborn' : `${ageInMonths} ${ageInMonths === 1 ? 'month' : 'months'} old`}
        </h1>
        <span style={{
          display: 'inline-block',
          backgroundColor: '#F3E8FF',
          color: '#7C3AED',
          fontSize: '12px',
          fontWeight: '600',
          padding: '4px 10px',
          borderRadius: '20px',
        }}>
          {styleLabels[parentingStyle]}
        </span>
      </div>

      {/* Daily Tip box — always shows unfiltered first tip */}
      {getTipsForProfile(contentMonth, parentingStyle).length > 0 && (
        <div style={{
          backgroundColor: '#FFF8E1',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
          borderLeft: '4px solid #F59E0B',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '18px' }}>💡</span>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Tip of the Day
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: '#1a1a2e', fontWeight: '500' }}>
            {getTipsForProfile(contentMonth, parentingStyle)[0].title}
          </p>
          <p style={{ margin: '6px 0 0', fontSize: '13px', lineHeight: '1.6', color: '#555' }}>
            {getTipsForProfile(contentMonth, parentingStyle)[0].body}
          </p>
        </div>
      )}

      {/* This Month's Focus label */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>🌙</span>
        <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#555' }}>
          This Month's Focus
          {selectedTopic && (
            <span style={{ fontSize: '13px', fontWeight: '400', color: '#7C3AED', marginLeft: '8px' }}>
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
        <p style={{ color: '#999', fontSize: '14px' }}>
          No {selectedTopic} tips for month {ageInMonths} yet — try another topic!
        </p>
      )}


      {/* Topic chips */}
      <div style={{ marginTop: '32px' }}>
        <p style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
                  border: `2px solid ${isSelected ? '#7C3AED' : '#E5E7EB'}`,
                  backgroundColor: isSelected ? '#7C3AED' : '#fff',
                  color: isSelected ? '#fff' : '#555',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
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
      <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '24px' }}>
        <button
          onClick={onResetProfile}
          style={{ background: 'none', border: 'none', color: '#AAA', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Edit Profile
        </button>
      </div>
    </div>
  )
}
