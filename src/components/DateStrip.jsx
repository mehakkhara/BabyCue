// Month arrows + a seven-day strip centred on `anchor`. Days with entries
// carry a dot; tapping a day selects it (tap again to clear). Future days
// are disabled — the journal is about what happened.
import { dayKey } from '../lib/streak'
import { color, shadow } from '../theme'

const DAY_MS = 86400000
const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function DateStrip({ anchor, onAnchor, selected, onSelect, entryDays }) {
  const today = dayKey(new Date())
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + (i - 3))
    return { date: d, key: dayKey(d) }
  })
  const label = anchor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
  const arrow = {
    width: 30, height: 30, borderRadius: '10px', border: 'none', background: color.surface, boxShadow: shadow.card,
    color: color.ink, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit',
  }

  return (
    <div style={{ background: color.surface, borderRadius: '20px', padding: '12px 12px 10px', boxShadow: shadow.card }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <button style={arrow} aria-label="Earlier" onClick={() => onAnchor(new Date(anchor.getTime() - 7 * DAY_MS))}>‹</button>
        <span style={{ fontSize: '14px', fontWeight: 700, color: color.ink }}>{label}</span>
        <button style={arrow} aria-label="Later" onClick={() => onAnchor(new Date(anchor.getTime() + 7 * DAY_MS))} disabled={days[6].key >= today}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {days.map(({ date, key }) => {
          const isSel = selected === key
          const isToday = key === today
          const future = key > today
          const has = entryDays.has(key)
          return (
            <button key={key} disabled={future} onClick={() => onSelect(isSel ? null : key)} style={{
              border: 'none', borderRadius: '12px', padding: '8px 0 6px', cursor: future ? 'default' : 'pointer', fontFamily: 'inherit',
              background: isSel ? color.primary : 'transparent', color: isSel ? '#fff' : future ? '#d4d2e0' : color.ink,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              outline: isToday && !isSel ? `1.5px solid ${color.lavender}` : 'none',
            }}>
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{date.getDate()}</span>
              <span style={{ fontSize: '10px', fontWeight: 600, color: isSel ? 'rgba(255,255,255,0.85)' : color.faint }}>{WEEKDAY[date.getDay()]}</span>
              <span aria-hidden="true" style={{ width: 5, height: 5, borderRadius: '50%', background: has ? (isSel ? '#fff' : color.primary) : 'transparent' }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
