// One checklist: sections of tickable items, a progress pill, and a way to
// hide it from Today once it is handled.
import { useState } from 'react'
import { checklistById, itemCount } from '../data/checklists'
import { loadProgress, isChecked, toggleItem, setAll, doneCount, isHidden, setHidden } from '../lib/checklistProgress'
import { personalize } from '../lib/pronouns'
import { markCheckIn } from '../lib/streak'
import { Screen, Card, Pill, SecondaryButton, IconTile } from '../components/ui'
import Burst from '../components/Burst'
import { color, type } from '../theme'

export default function ChecklistDetail({ id, profile, onBack }) {
  const checklist = checklistById(id)
  const [progress, setProgress] = useState(() => loadProgress())
  const [celebrate, setCelebrate] = useState(false)

  if (!checklist) {
    return <Screen onBack={onBack} detail title="Checklist"><p style={type.body}>This checklist isn't available.</p></Screen>
  }

  const total = itemCount(checklist)
  const done = doneCount(progress, checklist)
  const complete = done >= total
  const hidden = isHidden(progress, checklist.id)
  const babyName = (profile.babyName || '').trim() || 'your baby'

  function tick(itemId) {
    const wasComplete = complete
    const next = toggleItem(checklist.id, itemId)
    setProgress(next)
    if (!wasComplete && doneCount(next, checklist) >= total) {
      setCelebrate(true); setTimeout(() => setCelebrate(false), 1200)
      markCheckIn('checklist')
    }
  }

  return (
    <Screen onBack={onBack} detail>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={type.kicker}>{checklist.kind === 'wellVisit' ? 'Well visit' : 'Get ready'}</p>
        <Pill tone={complete ? 'success' : 'tint'}>{complete ? 'All done' : `${done} of ${total}`}</Pill>
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
        <IconTile emoji={checklist.emoji} hue={checklist.hue} size={44} />
        <h1 style={{ ...type.h1, fontSize: '26px', margin: 0 }}>{personalize(checklist.title, profile)}</h1>
      </div>
      <p style={{ ...type.body, marginBottom: '16px' }}>{personalize(checklist.intro, profile)}</p>

      {checklist.sections.map(section => (
        <Card key={section.title} padding="12px 16px" style={{ marginBottom: '12px' }}>
          <p style={{ ...type.bodyStrong, fontSize: '14px', marginBottom: section.note ? '2px' : '6px' }}>{personalize(section.title, profile)}</p>
          {section.note && <p style={{ ...type.small, marginBottom: '6px' }}>{section.note}</p>}
          {section.items.map(item => {
            const on = isChecked(progress, checklist.id, item.id)
            return (
              <button key={item.id} onClick={() => tick(item.id)} aria-pressed={on} style={{
                width: '100%', display: 'flex', gap: '12px', alignItems: 'flex-start', textAlign: 'left',
                padding: '8px 0', border: 'none', background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
                borderTop: `1px solid ${color.hairline}`,
              }}>
                <span aria-hidden="true" style={{
                  width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: '1px',
                  border: on ? 'none' : `2px solid ${color.lavender}`, background: on ? color.primary : 'transparent',
                  color: '#fff', fontSize: '13px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}>{on ? '✓' : ''}</span>
                <span style={{ ...type.body, fontSize: '14px', color: on ? color.faint : color.ink, textDecoration: on ? 'line-through' : 'none' }}>
                  {personalize(item.text, profile)}
                </span>
              </button>
            )
          })}
        </Card>
      ))}

      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <SecondaryButton onClick={() => setProgress(setAll(checklist, !complete))} style={{ flex: 1 }}>
          {complete ? 'Clear all' : 'Mark all done'}
        </SecondaryButton>
        <SecondaryButton onClick={() => setProgress(setHidden(checklist.id, !hidden))} active={hidden} style={{ flex: 1 }}>
          {hidden ? 'Show on Today' : 'Hide from Today'}
        </SecondaryButton>
      </div>
      {celebrate && <Burst kind="confetti" />}

      <p style={{ ...type.small, marginTop: '18px', color: color.lavender }}>Source: {checklist.source}</p>
      <p style={{ ...type.small, textAlign: 'center', marginTop: '14px', color: '#c4c4d4' }}>
        Logistics and what to expect, not medical advice. For {babyName}'s health questions, ask your pediatrician.
      </p>
    </Screen>
  )
}
