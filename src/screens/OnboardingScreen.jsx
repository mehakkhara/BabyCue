import { useEffect, useState } from 'react'
import { getProfile } from '../lib/db'

const sexOptions = [
  { value: 'F', label: 'Girl', emoji: '👧' },
  { value: 'M', label: 'Boy',  emoji: '👦' },
]

const feedingOptions = [
  { value: 'breast',   label: 'Breastfed' },
  { value: 'formula',  label: 'Formula' },
  { value: 'mixed',    label: 'Mixed (breast + formula)' },
  { value: 'solids',   label: 'Mostly solids now' },
]

const sleepOptions = [
  { value: 'own_room',   label: 'Own room' },
  { value: 'room_share', label: 'Room-sharing' },
  { value: 'bed_share',  label: 'Bed-sharing / co-sleeping' },
]

const birthOptions = [
  { value: 'full_term', label: 'Full-term (37+ weeks)' },
  { value: 'preterm',   label: 'Preterm (before 37 weeks)' },
]

const siblingOptions = [
  { value: 'only',     label: 'No older siblings' },
  { value: 'siblings', label: 'Has older sibling(s)' },
]

const labelStyle = {
  display: 'block',
  fontSize: '13px',
  fontWeight: '600',
  color: '#555',
  marginBottom: '8px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
}

const inputStyle = {
  width: '100%',
  fontSize: '17px',
  padding: '14px 16px',
  borderRadius: '12px',
  border: '2px solid #E5E7EB',
  outline: 'none',
  boxSizing: 'border-box',
}

function ChoiceRow({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
      {options.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(selected ? '' : opt.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: `2px solid ${selected ? '#7C3AED' : '#E5E7EB'}`,
              backgroundColor: selected ? '#F3E8FF' : '#fff',
              color: selected ? '#5b21b6' : '#444',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.emoji ? `${opt.emoji} ` : ''}{opt.label}
          </button>
        )
      })}
    </div>
  )
}

export default function OnboardingScreen({ onComplete }) {
  // undefined while loading existing profile, null when none, object when found
  const [existing, setExisting] = useState(undefined)
  const [momName, setMomName] = useState('')
  const [babyName, setBabyName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [babySex, setBabySex] = useState('')
  const [feedingMethod, setFeedingMethod] = useState('')
  const [sleepArrangement, setSleepArrangement] = useState('')
  const [birthContext, setBirthContext] = useState('')
  const [siblings, setSiblings] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    let cancelled = false
    getProfile().then(p => {
      if (cancelled) return
      setExisting(p)
      if (p) {
        setMomName(p.momName || '')
        setBabyName(p.babyName || '')
        setDateOfBirth(p.dateOfBirth || '')
        setBabySex(p.babySex || '')
        setFeedingMethod(p.feedingMethod || '')
        setSleepArrangement(p.sleepArrangement || '')
        setBirthContext(p.birthContext || '')
        setSiblings(p.siblings || '')
        setNotes(p.notes || '')
      }
    })
    return () => { cancelled = true }
  }, [])

  const isEditing = !!existing
  const hasOptionalDetails =
    babySex || feedingMethod || sleepArrangement || birthContext || siblings || notes
  const [showMore, setShowMore] = useState(false)
  useEffect(() => {
    if (isEditing && hasOptionalDetails) setShowMore(true)
  }, [isEditing, hasOptionalDetails])

  const canSave = babyName.trim().length > 0 && dateOfBirth.length > 0

  const missingFields = [
    babyName.trim().length === 0 && "baby's name",
    dateOfBirth.length === 0 && 'date of birth',
  ].filter(Boolean)

  async function handleSave() {
    if (!canSave || saving) return
    const profile = {
      momName: momName.trim() || 'Mama',
      babyName: babyName.trim(),
      dateOfBirth,
      babySex: babySex || null,
      feedingMethod: feedingMethod || null,
      sleepArrangement: sleepArrangement || null,
      birthContext: birthContext || null,
      siblings: siblings || null,
      notes: notes.trim() || null,
    }
    setSaving(true)
    setSaveError('')
    try {
      await onComplete(profile)
    } catch (err) {
      console.error('Profile save failed:', err)
      setSaveError(err?.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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
      <p style={{ margin: '0 0 16px', fontSize: '15px', color: '#888' }}>
        {isEditing ? 'Update your baby\'s info below.' : 'Tell us about your baby to get started.'}
      </p>
      {!isEditing && (
        <div style={{
          background: 'linear-gradient(135deg, #ede9fe, #dce8f8)',
          borderRadius: '12px',
          padding: '14px 16px',
          marginBottom: '32px',
          fontSize: '14px',
          color: '#6d5fe6',
          fontWeight: '500',
          lineHeight: 1.6,
          textAlign: 'center',
        }}>
          🌿 Daily tips personalized to your baby's exact age.
        </div>
      )}

      {/* Mom's name */}
      <label style={{ display: 'block', marginBottom: '24px' }}>
        <span style={labelStyle}>Your Name</span>
        <input
          type="text"
          placeholder="e.g. Sarah"
          value={momName}
          onChange={e => setMomName(e.target.value)}
          autoFocus={!existing}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
        />
      </label>

      {/* Baby name */}
      <label style={{ display: 'block', marginBottom: '24px' }}>
        <span style={labelStyle}>Baby's Name</span>
        <input
          type="text"
          placeholder="e.g. Lila"
          value={babyName}
          onChange={e => setBabyName(e.target.value)}
          style={inputStyle}
          onFocus={e => e.target.style.borderColor = '#7C3AED'}
          onBlur={e => e.target.style.borderColor = '#E5E7EB'}
        />
      </label>

      {/* Date of birth */}
      <label style={{ display: 'block', marginBottom: '32px' }}>
        <span style={labelStyle}>Date of Birth</span>
        <input
          type="date"
          value={dateOfBirth}
          onChange={e => setDateOfBirth(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          style={{ ...inputStyle, color: '#1a1a2e' }}
        />
      </label>

      {/* Tell us more — collapsible optional section */}
      <button
        type="button"
        onClick={() => setShowMore(v => !v)}
        style={{
          background: '#fff',
          border: '2px dashed #E5E7EB',
          borderRadius: '12px',
          padding: '14px 16px',
          fontSize: '14px',
          fontWeight: 600,
          color: '#7C3AED',
          cursor: 'pointer',
          marginBottom: showMore ? '20px' : '40px',
          textAlign: 'left',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>✨ Tell us more for better answers</span>
        <span style={{ fontSize: '18px', color: '#9ca3af' }}>{showMore ? '−' : '+'}</span>
      </button>

      {showMore && (
        <div style={{ marginBottom: '40px' }}>
          <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#888', lineHeight: 1.6 }}>
            All optional. The more we know, the more personalized your AI answers will be.
          </p>

          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Baby's Sex</span>
            <ChoiceRow options={sexOptions} value={babySex} onChange={setBabySex} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Feeding</span>
            <ChoiceRow options={feedingOptions} value={feedingMethod} onChange={setFeedingMethod} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Sleep Setup</span>
            <ChoiceRow options={sleepOptions} value={sleepArrangement} onChange={setSleepArrangement} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Birth</span>
            <ChoiceRow options={birthOptions} value={birthContext} onChange={setBirthContext} />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <span style={labelStyle}>Siblings</span>
            <ChoiceRow options={siblingOptions} value={siblings} onChange={setSiblings} />
          </div>

          <label style={{ display: 'block', marginBottom: '8px' }}>
            <span style={labelStyle}>Anything else we should know?</span>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. reflux, currently sleep training, recovering from an ear infection..."
              rows={3}
              maxLength={500}
              style={{
                ...inputStyle,
                fontSize: '15px',
                resize: 'vertical',
                fontFamily: 'inherit',
                lineHeight: 1.5,
              }}
              onFocus={e => e.target.style.borderColor = '#7C3AED'}
              onBlur={e => e.target.style.borderColor = '#E5E7EB'}
            />
            <span style={{ display: 'block', textAlign: 'right', fontSize: '11px', color: '#aab', marginTop: '4px' }}>
              {notes.length}/500
            </span>
          </label>
        </div>
      )}

      {!isEditing && !canSave && missingFields.length > 0 && (
        <p style={{
          margin: '0 0 8px',
          fontSize: '12px',
          color: '#9ca3af',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          Add {missingFields.length === 1
            ? missingFields[0]
            : missingFields.length === 2
              ? `${missingFields[0]} and ${missingFields[1]}`
              : `${missingFields.slice(0, -1).join(', ')}, and ${missingFields[missingFields.length - 1]}`} to continue
        </p>
      )}

      {saveError && (
        <p style={{
          margin: '0 0 8px',
          fontSize: '13px',
          color: '#dc2626',
          textAlign: 'center',
          lineHeight: 1.5,
        }}>
          {saveError}
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={!canSave || saving}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: '14px',
          border: 'none',
          backgroundColor: canSave && !saving ? '#7C3AED' : '#E5E7EB',
          color: canSave && !saving ? '#fff' : '#999',
          fontSize: '16px',
          fontWeight: '600',
          cursor: canSave && !saving ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
        }}
      >
        {saving ? 'Saving…' : (isEditing ? 'Save Changes' : 'Get Started')}
      </button>
    </div>
  )
}
