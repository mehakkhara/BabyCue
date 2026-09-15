// Growth — three segments. Overview is the bigger picture (age, typical
// numbers, what's blooming this month, development by category); Milestones
// is the CDC checklist; Health is the WHO chart and measurements. Nothing
// here is logged day to day — this is not a tracking app.
import { useMemo, useState } from 'react'
import { getBabyAgeInMonths, formatBabyAge } from '../data/tips'
import { statItemsFor, AGE_STATS_SOURCE } from '../data/ageStats'
import { MILESTONES, DOMAINS, DOMAIN_KEYS, checkpointForAge } from '../data/milestones'
import { loadStatuses } from '../lib/milestoneProgress'
import { personalize } from '../lib/pronouns'
import DevelopmentChecklist from '../components/DevelopmentChecklist'
import GrowthHealth from '../components/GrowthHealth'
import { Screen, Card, StatTile, SegmentedControl, SectionHeader, IconTile, IconButton } from '../components/ui'
import { color, shadow, type } from '../theme'

const SEGMENTS = [
  { value: 'overview',   label: 'Overview' },
  { value: 'milestones', label: 'Milestones' },
  { value: 'health',     label: 'Health' },
]

export default function GrowthScreen({ profile, onProfileChange, onOpen }) {
  const [segment, setSegment] = useState('overview')
  const [domain, setDomain] = useState(null)
  const babyName = (profile.babyName || '').trim() || 'your baby'
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const month = Math.max(0, Math.min(24, ageInMonths))
  const checkpoint = checkpointForAge(ageInMonths)
  const statuses = useMemo(() => loadStatuses(), [segment])
  const milestones = MILESTONES[checkpoint] || []

  // "This month": one line per domain, in display order, up to three.
  const thisMonth = DOMAIN_KEYS
    .map(k => milestones.find(m => m.domain === k))
    .filter(Boolean)
    .slice(0, 3)

  function openDomain(key) {
    setDomain(key)
    setSegment('milestones')
    window.scrollTo({ top: 0, behavior: 'auto' })
  }

  return (
    <Screen>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ ...type.h1, fontSize: '24px' }}>{babyName}'s Growth</h1>
          <p style={{ ...type.body, marginTop: '4px' }}>{personalize('A bigger picture of {their} amazing journey', profile)}</p>
        </div>
        <IconButton label="Your profile" onClick={() => onOpen('profile')}>👤</IconButton>
      </div>

      <SegmentedControl options={SEGMENTS} value={segment} onChange={v => { setSegment(v); if (v !== 'milestones') setDomain(null) }} />

      {segment === 'overview' && (
        <div style={{ marginTop: '16px' }}>
          {/* Current age */}
          <Card padding="16px 18px" style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <p style={{ ...type.h3, fontSize: '18px' }}>{formatBabyAge(profile.dateOfBirth)}</p>
                <p style={{ ...type.small, marginTop: '2px' }}>Current age</p>
              </div>
              <button onClick={() => onOpen('editProfile')} style={{ border: 'none', background: 'none', color: color.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '6px 0' }}>
                Edit
              </button>
            </div>
          </Card>

          {/* Typical numbers — reference only */}
          <div style={{ display: 'flex', gap: '10px' }}>
            {statItemsFor(month).map(s => <StatTile key={s.label} emoji={s.emoji} value={s.value} label={s.label} />)}
          </div>
          <p style={{ ...type.small, fontSize: '10px', color: '#c4c4d4', textAlign: 'center', margin: '8px 4px 0' }}>
            Ranges, not targets · {AGE_STATS_SOURCE}
          </p>

          {/* This month */}
          {thisMonth.length > 0 && (
            <Card padding="16px 18px" style={{ marginTop: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <IconTile emoji="📅" hue="mint" size={30} />
                <p style={type.bodyStrong}>Around this age</p>
              </div>
              {thisMonth.map(m => {
                const done = statuses[m.id] === 'done'
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '5px 0' }}>
                    <span aria-hidden="true" style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                      background: done ? '#dcfce7' : color.tint, color: done ? color.success : color.primary,
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700,
                    }}>✓</span>
                    <p style={{ ...type.body, fontSize: '13.5px', color: color.ink }}>{personalize(m.text, profile)}</p>
                  </div>
                )
              })}
              <p style={{ ...type.small, marginTop: '8px', color: '#c4c4d4', fontSize: '11px' }}>
                Typical around {checkpoint} months, not a test · CDC
              </p>
            </Card>
          )}

          {/* Development highlights */}
          <SectionHeader title="Development highlights" action="See all" onAction={() => openDomain(null)} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {DOMAIN_KEYS.map(k => {
              const d = DOMAINS[k]
              const items = milestones.filter(m => m.domain === k)
              const done = items.filter(m => statuses[m.id] === 'done').length
              return (
                <button key={k} onClick={() => openDomain(k)} style={{
                  background: color.surface, border: 'none', borderRadius: '16px', padding: '12px 4px 10px',
                  boxShadow: shadow.card, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                }}>
                  <IconTile emoji={d.emoji} hue={d.hue} size={38} />
                  <span style={{ fontSize: '10.5px', fontWeight: 700, color: color.ink, textAlign: 'center', lineHeight: 1.2 }}>{d.short}</span>
                  {items.length > 0 && (
                    <span style={{ fontSize: '10px', color: done === items.length ? color.success : color.faint, fontWeight: 600 }}>
                      {done}/{items.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {segment === 'milestones' && (
        <div style={{ marginTop: '16px' }}>
          <DevelopmentChecklist profile={profile} domain={domain} onClearDomain={() => setDomain(null)} />
        </div>
      )}

      {segment === 'health' && (
        <div style={{ marginTop: '16px' }}>
          <GrowthHealth profile={profile} onProfileChange={onProfileChange} />
        </div>
      )}
    </Screen>
  )
}
