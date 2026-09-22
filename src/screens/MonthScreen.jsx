// "What to expect this month" for the baby's own month: sleep, feeding,
// growing and a heads-up, with the source. Free and one tap from Today.
// (The full month-by-month library is BrowseScreen.)
import { getBabyAgeInMonths, formatBabyAge } from '../data/tips'
import { overviewForMonth } from '../data/monthOverview'
import { personalize } from '../lib/pronouns'
import { clampMonth } from '../lib/dailyTip'
import { Screen, Card, InfoRow, Pill } from '../components/ui'
import { color, type } from '../theme'

export default function MonthScreen({ profile, onBack }) {
  const month = clampMonth(getBabyAgeInMonths(profile.dateOfBirth))
  const overview = overviewForMonth(month)
  const next = month < 24 ? overviewForMonth(month + 1) : null
  const babyName = (profile.babyName || '').trim() || 'your baby'

  return (
    <Screen onBack={onBack} detail>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={type.kicker}>This month</p>
        <Pill>{formatBabyAge(profile.dateOfBirth)}</Pill>
      </div>
      <h1 style={{ ...type.h1, fontSize: '28px', marginBottom: '6px' }}>Month {month}: what to expect</h1>
      <p style={{ ...type.body, marginBottom: '16px' }}>The broad strokes for {babyName} right now. Every baby has their own pace, so treat these as a map, not a schedule.</p>

      {overview ? (
        <Card padding="10px 16px 14px" style={{ marginBottom: '14px' }}>
          <InfoRow emoji="🌙" hue="lavender" title="Sleep" text={personalize(overview.sleep, profile)} />
          <InfoRow emoji="🍼" hue="sky" title="Feeding" text={personalize(overview.feeding, profile)} />
          <InfoRow emoji="🧠" hue="mint" title="Growing" text={personalize(overview.development, profile)} />
          <InfoRow emoji="💡" hue="amber" title="Heads-up" text={personalize(overview.headsUp, profile)} />
          <p style={{ ...type.small, marginTop: '8px', color: color.lavender }}>Source: {overview.source}</p>
        </Card>
      ) : (
        <p style={{ ...type.body, textAlign: 'center', padding: '30px 10px', color: color.faint }}>Nothing written for this month yet.</p>
      )}

      {next && (
        <Card padding="12px 16px" style={{ background: color.tintLight, boxShadow: 'none' }}>
          <p style={{ ...type.label, marginBottom: '4px' }}>A peek at month {month + 1}</p>
          <p style={{ ...type.body, fontSize: '13px' }}>{personalize(next.headsUp, profile)}</p>
        </Card>
      )}

      <p style={{ ...type.small, textAlign: 'center', marginTop: '22px', color: '#c4c4d4' }}>
        Guidance, not medical advice. For {babyName}'s health questions, ask your pediatrician.
      </p>
    </Screen>
  )
}
