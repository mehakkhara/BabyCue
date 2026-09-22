// All parent checklists: due now, coming up, and earlier ones. Reached from
// "All checklists" on Today's To-do card and from Profile.
import { useState } from 'react'
import { getBabyAgeInMonths } from '../data/tips'
import { groupChecklists, itemCount } from '../data/checklists'
import { loadProgress, doneCount, isComplete } from '../lib/checklistProgress'
import { personalize } from '../lib/pronouns'
import { Screen, Card, ListRow, SectionHeader, Pill } from '../components/ui'
import { color, type } from '../theme'

export default function ChecklistsScreen({ profile, onBack, onOpenChecklist }) {
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const [progress] = useState(() => loadProgress())
  const { now, soon, past } = groupChecklists(ageInMonths)
  const babyName = (profile.babyName || '').trim() || 'your baby'

  function subtitle(c) {
    const done = doneCount(progress, c)
    const total = itemCount(c)
    if (done >= total) return 'All done'
    if (done === 0) return c.kind === 'wellVisit' ? `Around month ${c.month}` : `Month ${c.window[0]}–${c.window[1]}`
    return `${done} of ${total} done`
  }

  function group(title, list, last = false) {
    if (list.length === 0) return null
    return (
      <>
        <SectionHeader title={title} />
        <Card padding="4px 14px" style={{ marginBottom: last ? 0 : '4px' }}>
          {list.map((c, i) => (
            <ListRow
              key={c.id}
              emoji={c.emoji} hue={c.hue}
              title={personalize(c.title, profile)}
              subtitle={subtitle(c)}
              onClick={() => onOpenChecklist?.(c.id)}
              trailing={isComplete(progress, c) ? <Pill tone="success">✓</Pill> : null}
              last={i === list.length - 1}
            />
          ))}
        </Card>
      </>
    )
  }

  return (
    <Screen onBack={onBack} detail title="Checklists" subtitle={`What to prepare and what to expect, timed to ${babyName}'s age.`}>
      {group('Due now', now)}
      {group('Coming up', soon)}
      {group('Earlier', past, true)}
      <p style={{ ...type.small, textAlign: 'center', marginTop: '22px', color: '#c4c4d4' }}>
        Logistics and what to expect. For {babyName}'s health questions, ask your pediatrician.
      </p>
    </Screen>
  )
}
