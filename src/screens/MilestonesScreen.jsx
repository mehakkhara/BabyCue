import { useState } from 'react'
import { getBabyAgeInMonths } from '../data/tips'
import { MILESTONES, DOMAINS, CHECKPOINTS, checkpointForAge, MILESTONE_NOTE } from '../data/milestones'
import { loadStatuses, setStatus } from '../lib/milestoneProgress'

export default function MilestonesScreen({ profile }) {
  const { babyName, dateOfBirth } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)

  const [milestoneCheckpoint, setMilestoneCheckpoint] = useState(null) // null = follow baby's age
  const [statuses, setStatuses] = useState(() => loadStatuses())

  function mark(id, status) {
    setStatuses({ ...setStatus(id, status) })
  }

  const activeCheckpoint = milestoneCheckpoint ?? checkpointForAge(ageInMonths)
  const list = MILESTONES[activeCheckpoint] || []
  const done = list.filter(m => statuses[m.id] === 'done').length
  const idx = CHECKPOINTS.indexOf(activeCheckpoint)
  const isCurrent = activeCheckpoint === checkpointForAge(ageInMonths)
  const navBtn = disabled => ({
    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
    background: disabled ? '#f3f4f6' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
    color: disabled ? '#c4c4d4' : '#fff', fontSize: '16px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  })

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 16px', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', paddingLeft: '2px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e1b4b' }}>
          Milestones
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af', lineHeight: 1.5 }}>
          Check off what {babyName} is doing and watch the progress unfold.
        </p>
      </div>

      {/* Milestone card */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '18px',
        marginBottom: '14px',
        boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
        borderLeft: '4px solid #7C6FF7',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#7C6FF7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Around {activeCheckpoint} months
          </span>
          {list.length > 0 && (
            <span style={{ fontSize: '11px', fontWeight: '600', color: done === list.length ? '#15803d' : '#a78bfa' }}>
              {done === list.length ? `All ${list.length} 🎉` : `${done} of ${list.length}`}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '10px 0 14px' }}>
          <button onClick={() => setMilestoneCheckpoint(CHECKPOINTS[Math.max(0, idx - 1)])} disabled={idx === 0} style={navBtn(idx === 0)}>‹</button>
          <div style={{ textAlign: 'center' }}>
            {isCurrent ? (
              <span style={{ fontSize: '13px', color: '#9ca3af', fontWeight: '600' }}>
                Where {babyName} is now
              </span>
            ) : (
              <button
                onClick={() => setMilestoneCheckpoint(null)}
                style={{ background: 'none', border: 'none', fontSize: '13px', color: '#a78bfa', cursor: 'pointer', fontWeight: '600', padding: 0 }}
              >
                Back to {babyName}'s age
              </button>
            )}
          </div>
          <button onClick={() => setMilestoneCheckpoint(CHECKPOINTS[Math.min(CHECKPOINTS.length - 1, idx + 1)])} disabled={idx === CHECKPOINTS.length - 1} style={navBtn(idx === CHECKPOINTS.length - 1)}>›</button>
        </div>

        {list.map(m => {
          const status = statuses[m.id]
          const isDone = status === 'done'
          const isNotYet = status === 'notyet'
          const dom = DOMAINS[m.domain]
          return (
            <div
              key={m.id}
              style={{
                background: isDone ? '#f0fdf4' : '#faf9ff',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '8px',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ display: 'inline-block', fontSize: '9px', fontWeight: '700', color: dom.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                {dom.label}
              </span>
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#1e1b4b', fontWeight: isDone ? '600' : '500' }}>
                {m.text}
              </p>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button
                  onClick={() => mark(m.id, 'done')}
                  style={{
                    flex: 1,
                    padding: '7px',
                    borderRadius: '9px',
                    border: 'none',
                    background: isDone ? '#dcfce7' : '#f0f0f5',
                    color: isDone ? '#15803d' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {isDone ? '✓ Yes!' : 'Yes!'}
                </button>
                <button
                  onClick={() => mark(m.id, 'notyet')}
                  style={{
                    flex: 1,
                    padding: '7px',
                    borderRadius: '9px',
                    border: 'none',
                    background: isNotYet ? '#ede9fe' : '#f0f0f5',
                    color: isNotYet ? '#7C6FF7' : '#9ca3af',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  Not yet
                </button>
              </div>
              {isNotYet && (
                <div style={{
                  marginTop: '10px',
                  background: '#f5f3ff',
                  borderRadius: '10px',
                  padding: '10px 12px',
                }}>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: '#6b5bd6' }}>
                    <strong>💡 Try this:</strong> {m.tip}
                  </p>
                </div>
              )}
            </div>
          )
        })}

        <p style={{ margin: '6px 2px 0', fontSize: '11px', color: '#c4c4d4', lineHeight: 1.5 }}>
          {MILESTONE_NOTE}
        </p>
      </div>
    </div>
  )
}
