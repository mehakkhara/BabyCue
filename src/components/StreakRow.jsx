// Seven-day check-in tracker shown under the Home greeting.
// Tone is encouragement-only — a missed day never gets called out.

const WEEKDAY = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function weekdayLetter(key) {
  const [y, m, d] = key.split('-').map(Number)
  return WEEKDAY[new Date(y, m - 1, d).getDay()]
}

function message({ streak, todayDone }, babyName) {
  if (todayDone && streak > 1) return `${streak} days in a row — you keep showing up 💜`
  if (todayDone) return 'Checked in today 💜'
  if (streak > 0) return `${streak}-day streak going — today's tip counts`
  return `Tap “Got it” on today's tip to check in`
}

export default function StreakRow({ summary, babyName }) {
  const { streak, days } = summary
  return (
    <div style={{ marginTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px', flex: 1 }}>
          {days.map(d => (
            <div
              key={d.key}
              style={{
                flex: 1,
                maxWidth: '38px',
                height: '38px',
                borderRadius: '10px',
                background: d.done ? '#ede9fe' : '#f4f3fa',
                outline: d.isToday ? '2px solid #c4b5fd' : 'none',
                outlineOffset: '1px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2px',
                transition: 'background 0.25s ease',
              }}
            >
              <span
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: d.done ? '#7C6FF7' : '#ddd6fe',
                  transform: d.done ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.25s ease',
                }}
              />
              <span style={{ fontSize: '9px', fontWeight: '700', color: d.done ? '#7C6FF7' : '#b7b3cf' }}>
                {weekdayLetter(d.key)}
              </span>
            </div>
          ))}
        </div>
        {streak > 0 && (
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {/* key={streak} remounts the flame so the pop replays on each new day */}
            <span key={streak} style={{ display: 'inline-block', fontSize: '18px', animation: 'popIn 0.45s ease' }}>
              🔥
            </span>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#7C6FF7' }}>
              {streak}
            </span>
          </div>
        )}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
        {message(summary, babyName)}
      </p>
    </div>
  )
}
