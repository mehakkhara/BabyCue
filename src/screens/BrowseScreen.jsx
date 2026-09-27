// Browse the whole library by month: a month strip, then every tip and
// activity for that month grouped by topic. ("What to expect" for the baby's
// own month lives on Today → MonthScreen; this page is the full library.) Opens on
// the baby's current month. Reached from "Browse by month" on Today.
import { useEffect, useMemo, useRef, useState } from 'react'
import { tips, funActivities, getBabyAgeInMonths } from '../data/tips'
import { personalize } from '../lib/pronouns'
import { clampMonth, topicLabel, TOPIC_EMOJI, TOPIC_HUE } from '../lib/dailyTip'
import { Screen, IconTile, Chevron, SectionHeader } from '../components/ui'
import { color, shadow, type } from '../theme'

const MONTHS = Array.from({ length: 24 }, (_, i) => i + 1)

// Topic order on the page: the everyday ones first, phases last.
const TOPIC_ORDER = ['sleep', 'feeding', 'development', 'motor', 'activity', 'play', 'teething', 'leap', 'regression', 'fussy']

export default function BrowseScreen({ profile, onBack, onOpenTip }) {
  const babyMonth = clampMonth(getBabyAgeInMonths(profile.dateOfBirth))
  const [month, setMonth] = useState(babyMonth)
  const stripRef = useRef(null)

  // Keep the selected month in view when it changes (and centre it on open).
  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-month="${month}"]`)
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [month])

  const groups = useMemo(() => {
    const pool = [...tips, ...funActivities].filter(t => t.month === month)
    const byTopic = new Map()
    for (const t of pool) {
      if (!byTopic.has(t.topic)) byTopic.set(t.topic, [])
      byTopic.get(t.topic).push(t)
    }
    const order = [...TOPIC_ORDER, ...[...byTopic.keys()].filter(k => !TOPIC_ORDER.includes(k))]
    return order.filter(k => byTopic.has(k)).map(k => ({ topic: k, items: byTopic.get(k) }))
  }, [month])

  const count = groups.reduce((n, g) => n + g.items.length, 0)
  const babyName = (profile.babyName || '').trim() || 'your baby'

  return (
    <Screen onBack={onBack} detail title="Browse by month" subtitle={`Everything in the library, one month at a time. ${babyName} is in month ${babyMonth}.`}>
      {/* Month strip */}
      <div ref={stripRef} style={{ display: 'flex', gap: '6px', overflowX: 'auto', padding: '2px 2px 8px', margin: '0 -2px 14px', scrollbarWidth: 'none' }}>
        {MONTHS.map(m => {
          const on = m === month
          const isBaby = m === babyMonth
          return (
            <button key={m} data-month={m} onClick={() => setMonth(m)} aria-label={`Month ${m}`} style={{
              flexShrink: 0, width: 46, height: 52, borderRadius: 14, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: on ? color.primary : color.surface, color: on ? '#fff' : color.ink,
              boxShadow: on ? shadow.button : shadow.card,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              outline: isBaby && !on ? `2px solid ${color.lavender}` : 'none',
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700, lineHeight: 1 }}>{m}</span>
              <span style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '0.04em', opacity: on ? 0.85 : 0.55 }}>{m === 1 ? 'MONTH' : 'MONTHS'}</span>
            </button>
          )
        })}
      </div>

      {/* Tips for the month, by topic */}
      {count === 0 ? (
        <p style={{ ...type.body, textAlign: 'center', padding: '30px 10px', color: color.faint }}>Nothing written for this month yet.</p>
      ) : (
        groups.map(g => (
          <div key={g.topic}>
            <SectionHeader title={`${topicLabel(g.topic)} · ${g.items.length}`} />
            {g.items.map(t => (
              <button key={String(t.id)} onClick={() => onOpenTip?.(t)} style={{
                width: '100%', textAlign: 'left', background: color.surface, border: 'none',
                borderRadius: '16px', padding: '12px 14px', boxShadow: shadow.card, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px',
              }}>
                <IconTile emoji={TOPIC_EMOJI[t.topic] || '💡'} hue={TOPIC_HUE[t.topic] || 'lavender'} size={38} />
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ ...type.bodyStrong, fontSize: '14px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personalize(t.title, profile)}</span>
                  <span style={{ ...type.small, display: 'block', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{personalize(t.body, profile)}</span>
                </span>
                <Chevron />
              </button>
            ))}
          </div>
        ))
      )}
      <p style={{ ...type.small, textAlign: 'center', marginTop: '22px', color: '#c4c4d4' }}>
        {count} {count === 1 ? 'item' : 'items'} for month {month}. Guidance, not medical advice.
      </p>
    </Screen>
  )
}
