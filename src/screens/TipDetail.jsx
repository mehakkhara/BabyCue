// One tip (or one activity) on its own page. Structured fields (tryToday,
// whyItMatters, minutes, steps, builds, materials) render only when the tip
// has them — the curated pool is being enriched over time, and every tip
// still shows its title, body and source without them.
import { useState } from 'react'
import { personalize } from '../lib/pronouns'
import { getBabyAgeInMonths } from '../data/tips'
import { isSaved, loadSaved, toggleSaved } from '../lib/savedTips'
import { markCheckIn } from '../lib/streak'
import { getRating, setRating, RATINGS } from '../lib/activityFeedback'
import { relatedTips, ageRangeLabel, topicLabel, clampMonth, TOPIC_EMOJI, TOPIC_HUE } from '../lib/dailyTip'
import { Screen, IconButton, Pill, PrimaryButton, SecondaryButton, InfoRow, SectionHeader, Card, IconTile, Chevron } from '../components/ui'
import Burst from '../components/Burst'
import { color, shadow, type } from '../theme'

const KICKER = { tip: "Today's tip", activity: "Today's activity", saved: 'Saved tip', related: 'Related tip', browse: 'From the library' }

export default function TipDetail({ tip, kind = 'tip', profile, onBack, onOpenTip }) {
  const [saved, setSaved] = useState(() => isSaved(tip.id, loadSaved()))
  const [gotIt, setGotIt] = useState(false)
  const [hearts, setHearts] = useState(false)
  const [rating, setRatingState] = useState(() => getRating(tip.id))

  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const babyName = (profile.babyName || '').trim() || 'your baby'
  const title = personalize(tip.title, profile)
  const body = personalize(tip.body, profile)
  const isActivity = kind === 'activity'
  const related = relatedTips(tip, clampMonth(ageInMonths))

  function save() {
    if (!saved) { setHearts(true); setTimeout(() => setHearts(false), 900) }
    setSaved(!!toggleSaved({ id: tip.id, title, body, source: tip.source, topic: tip.topic }).find(t => t.id === tip.id))
  }

  function share() {
    const text = `${title}\n\n${body}${tip.source ? `\n\nSource: ${tip.source}` : ''}`
    if (navigator.share) navigator.share({ title, text }).catch(() => {})
    else if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {})
  }

  function done() {
    setGotIt(true)
    markCheckIn(isActivity ? 'activity' : 'tip')
  }

  function rate(key) {
    setRatingState(setRating(tip.id, key))
    if (!gotIt && key !== 'skip') done()
  }

  return (
    <Screen
      onBack={onBack}
      detail
      actions={[
        <IconButton key="save" label={saved ? 'Saved' : 'Save for later'} onClick={save} active={saved}>{saved ? '🔖' : '🔖'}</IconButton>,
        <IconButton key="share" label="Share" onClick={share}>↗</IconButton>,
      ]}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={type.kicker}>{KICKER[kind] || KICKER.tip}</p>
        <Pill>{clampMonth(ageInMonths)} months</Pill>
      </div>

      <h1 style={{ ...type.h1, fontSize: '28px', marginBottom: '10px' }}>{title}</h1>
      <p style={{ ...type.body, fontSize: '15px', color: color.text, marginBottom: '18px' }}>{body}</p>

      {isActivity && Array.isArray(tip.steps) && tip.steps.length > 0 && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ ...type.bodyStrong, marginBottom: '8px' }}>How to do it</p>
          {tip.steps.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '6px 0' }}>
              <span style={{ width: 24, height: 24, borderRadius: 8, background: color.tint, color: color.primary, fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
              <p style={{ ...type.body, color: color.ink, fontSize: '14px' }}>{personalize(s, profile)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Order: the reason first, then the concrete thing to do with its time right under it. */}
      {tip.whyItMatters && (
        <div style={{ marginBottom: '6px' }}>
          <InfoRow emoji="🧠" hue="sky" title="Why it matters" text={personalize(tip.whyItMatters, profile)} />
        </div>
      )}
      {tip.tryToday && (
        <div style={{ marginBottom: '14px' }}>
          <InfoRow emoji="💬" hue="peach" title="Try it today" text={`“${personalize(tip.tryToday, profile)}”`} />
        </div>
      )}

      <div style={{ marginBottom: '18px' }}>
        {tip.builds && <InfoRow emoji="🧠" hue="sky" text={`Builds ${tip.builds}`} />}
        {tip.minutes && <InfoRow emoji="⏱️" hue="amber" text={`Takes about ${tip.minutes} minutes`} />}
        {tip.materials && <InfoRow emoji="🧺" hue="mint" text={tip.materials} />}
        <InfoRow emoji="👶" hue="rose" text={`Great for ${ageRangeLabel(tip)}`} />
        {tip.source && <InfoRow emoji="📚" hue="lavender" text={`Source: ${tip.source}`} />}
      </div>

      <div style={{ position: 'relative' }}>
        <PrimaryButton onClick={done} done={gotIt}>
          {gotIt ? (isActivity ? '✓ Nice — that counts for today' : '✓ Got it') : (isActivity ? "Let's do it!" : '✓ Got it')}
        </PrimaryButton>
        {hearts && <Burst kind="hearts" />}
      </div>
      {!isActivity && (
        <SecondaryButton onClick={save} active={saved} style={{ marginTop: '10px' }}>
          {saved ? '🔖 Saved' : '🔖 Save for later'}
        </SecondaryButton>
      )}

      {isActivity && (
        <Card style={{ marginTop: '16px' }} padding="16px 18px">
          <p style={{ ...type.bodyStrong, marginBottom: '12px' }}>Did you try this?</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {RATINGS.map(r => {
              const on = rating === r.key
              return (
                <button key={r.key} onClick={() => rate(r.key)} style={{
                  flex: 1, padding: '12px 6px', borderRadius: '14px', border: on ? `2px solid ${color.primary}` : '2px solid transparent',
                  background: on ? color.tint : color.tintLight, cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                }}>
                  <span style={{ fontSize: '24px', lineHeight: 1 }}>{r.emoji}</span>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: on ? color.primary : color.muted }}>{r.label}</span>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {related.length > 0 && (
        <>
          <SectionHeader title="Related tips" />
          {related.map(r => (
            <button key={r.id} onClick={() => onOpenTip?.(r)} style={{
              width: '100%', textAlign: 'left', background: color.surface, border: 'none',
              borderRadius: '16px', padding: '12px 14px', boxShadow: shadow.card, cursor: 'pointer', fontFamily: 'inherit',
              display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px',
            }}>
              <IconTile emoji={TOPIC_EMOJI[r.topic] || '💡'} hue={TOPIC_HUE[r.topic] || 'lavender'} size={38} />
              <span style={{ minWidth: 0, flex: 1 }}>
                <span style={{ ...type.small, display: 'block', color: color.faint, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{topicLabel(r.topic)}</span>
                <span style={{ ...type.bodyStrong, fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personalize(r.title, profile)}</span>
              </span>
              <Chevron />
            </button>
          ))}
        </>
      )}
      <p style={{ ...type.small, textAlign: 'center', marginTop: '22px', color: '#c4c4d4' }}>
        Guidance, not medical advice. For {babyName}'s health questions, ask your pediatrician.
      </p>
    </Screen>
  )
}

