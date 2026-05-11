import { useState } from 'react'
import { WHO, getPercentile, ordinal, monthsBetween } from '../data/whoStandards'

const MONTHS25 = Array.from({ length: 25 }, (_, i) => i)

function GrowthChart({ entries, sex, metric }) {
  const W = 320, H = 200
  const PL = 40, PR = 22, PT = 10, PB = 28
  const PW = W - PL - PR
  const PH = H - PT - PB

  const isWeight = metric === 'weight'
  // WHO data is in kg; display weight in lbs
  const KG_TO_LBS = 2.205
  const cv = v => isWeight ? v * KG_TO_LBS : v
  const yMin = isWeight ? 1.5 * KG_TO_LBS : 43
  const yMax = isWeight ? 17  * KG_TO_LBS : 97

  const data = WHO[metric][sex === 'M' ? 'boys' : 'girls']

  function toX(m) { return PL + (m / 24) * PW }
  function toY(v) { return PT + (1 - (v - yMin) / (yMax - yMin)) * PH }

  function polyPts(arr) {
    return MONTHS25.map(m => `${toX(m).toFixed(1)},${toY(cv(arr[m])).toFixed(1)}`).join(' ')
  }
  function bandPts(upper, lower) {
    const up = MONTHS25.map(m => `${toX(m).toFixed(1)},${toY(cv(upper[m])).toFixed(1)}`)
    const dn = [...MONTHS25].reverse().map(m => `${toX(m).toFixed(1)},${toY(cv(lower[m])).toFixed(1)}`)
    return [...up, ...dn].join(' ')
  }

  const babyPts = entries
    .filter(e => e[metric] != null && e.ageMonths >= 0 && e.ageMonths <= 24)
    .sort((a, b) => a.ageMonths - b.ageMonths)
    .map(e => ({ x: toX(e.ageMonths), y: toY(e[metric]) }))

  const yLabels = isWeight ? [5, 10, 15, 20, 25, 30, 35] : [45, 55, 65, 75, 85, 95]
  const xLabels = [0, 6, 12, 18, 24]

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* Subtle grid */}
      {yLabels.map(v => (
        <line key={v} x1={PL} y1={toY(v).toFixed(1)} x2={W - PR} y2={toY(v).toFixed(1)}
          stroke="#f0eeff" strokeWidth="1" />
      ))}

      {/* P3–P97 outer band */}
      <polygon points={bandPts(data.p97, data.p3)} fill="rgba(167,139,250,0.10)" />
      {/* P15–P85 inner band */}
      <polygon points={bandPts(data.p85, data.p15)} fill="rgba(167,139,250,0.13)" />
      {/* P50 median */}
      <polyline points={polyPts(data.p50)} fill="none"
        stroke="#c4b5fd" strokeWidth="1.5" strokeDasharray="4,3" />

      {/* Percentile labels on right */}
      <text x={W - PR + 3} y={toY(cv(data.p97[24])) + 3} fontSize="7.5" fill="#c4b5fd">97</text>
      <text x={W - PR + 3} y={toY(cv(data.p50[24])) + 3} fontSize="7.5" fill="#c4b5fd">50</text>
      <text x={W - PR + 3} y={toY(cv(data.p3[24]))  + 3} fontSize="7.5" fill="#c4b5fd">3</text>

      {/* Axes */}
      <line x1={PL} y1={PT} x2={PL} y2={H - PB} stroke="#e5e7eb" strokeWidth="1" />
      <line x1={PL} y1={H - PB} x2={W - PR} y2={H - PB} stroke="#e5e7eb" strokeWidth="1" />

      {/* Y labels */}
      {yLabels.map(v => (
        <text key={v} x={PL - 4} y={toY(v) + 3.5} textAnchor="end" fontSize="8.5" fill="#9ca3af">
          {v}
        </text>
      ))}

      {/* X labels */}
      {xLabels.map(m => (
        <text key={m} x={toX(m)} y={H - 6} textAnchor="middle" fontSize="8.5" fill="#9ca3af">
          {m}
        </text>
      ))}
      <text x={PL + PW / 2} y={H - 1} textAnchor="middle" fontSize="8" fill="#c4c4d4">months</text>

      {/* Baby line */}
      {babyPts.length > 1 && (
        <polyline
          points={babyPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
          fill="none" stroke="#10b981" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        />
      )}

      {/* Baby dots */}
      {babyPts.map((p, i) => (
        <circle key={i} cx={p.x.toFixed(1)} cy={p.y.toFixed(1)}
          r="4" fill="#10b981" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  )
}

function loadEntries() {
  try { return JSON.parse(localStorage.getItem('growthEntries') || '[]') } catch { return [] }
}
function loadSex() {
  try {
    const profile = JSON.parse(localStorage.getItem('babyProfile') || '{}')
    return profile.babySex || localStorage.getItem('babySex') || null
  } catch { return null }
}

export default function StatsScreen() {
  const [entries, setEntries] = useState(loadEntries)
  const [sex, setSex] = useState(loadSex)
  const [metric, setMetric] = useState('weight')
  const [showForm, setShowForm] = useState(false)
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0])
  const [formWeight, setFormWeight] = useState('')
  const [formHeight, setFormHeight] = useState('')

  const profile = JSON.parse(localStorage.getItem('babyProfile') || '{}')
  const { babyName, dateOfBirth } = profile

  const enriched = entries
    .map(e => ({ ...e, ageMonths: monthsBetween(dateOfBirth, e.date) }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))

  const latest = enriched[0]

  function chooseSex(s) {
    setSex(s)
    localStorage.setItem('babySex', s)
    try {
      const stored = JSON.parse(localStorage.getItem('babyProfile') || '{}')
      stored.babySex = s
      localStorage.setItem('babyProfile', JSON.stringify(stored))
    } catch { /* profile missing — legacy key still set above */ }
  }

  function saveEntry() {
    const weight = formWeight ? parseFloat(formWeight) : null
    const height = formHeight ? parseFloat(formHeight) : null
    if (!formDate || (weight == null && height == null)) return
    const next = [...entries, { date: formDate, weight, height }]
    setEntries(next)
    localStorage.setItem('growthEntries', JSON.stringify(next))
    setFormWeight('')
    setFormHeight('')
    setShowForm(false)
  }

  function deleteEntry(idx) {
    const next = entries.filter((_, i) => {
      const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date))
      return entries.indexOf(sorted[idx]) !== i
    })
    setEntries(next)
    localStorage.setItem('growthEntries', JSON.stringify(next))
  }

  const btnBase = {
    flex: 1, padding: '9px', borderRadius: '10px', border: 'none',
    fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s',
  }

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 16px 16px', minHeight: '100vh' }}>

      {/* Header */}
      <div style={{
        background: '#fff', borderRadius: '24px', padding: '22px 20px',
        marginBottom: '14px', boxShadow: '0 4px 24px rgba(100,100,180,0.08)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>Growth</p>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700', color: '#1e1b4b' }}>
          {babyName}'s Stats
        </h1>
      </div>

      {/* Sex picker — shown once */}
      {!sex && (
        <div style={{
          background: '#fff', borderRadius: '20px', padding: '24px 20px',
          marginBottom: '14px', boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: '#1e1b4b', marginBottom: '6px' }}>
            One quick question
          </p>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '20px', lineHeight: 1.6 }}>
            WHO growth charts differ for boys and girls. Is {babyName} a boy or a girl?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => chooseSex('M')} style={{
              ...btnBase, background: '#ede9fe', color: '#7C6FF7', fontSize: '15px',
            }}>👦 Boy</button>
            <button onClick={() => chooseSex('F')} style={{
              ...btnBase, background: '#fce7f3', color: '#db2777', fontSize: '15px',
            }}>👧 Girl</button>
          </div>
        </div>
      )}

      {sex && (
        <>
          {/* Current percentile summary */}
          {latest && (
            <div style={{
              display: 'flex', gap: '10px', marginBottom: '14px',
            }}>
              {latest.weight != null && (
                <div style={{
                  flex: 1, background: '#fff', borderRadius: '18px', padding: '16px 12px',
                  textAlign: 'center', boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
                  borderTop: '3px solid #10b981',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e1b4b' }}>
                    {latest.weight} lbs
                  </div>
                  <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700', marginTop: '2px' }}>
                    {ordinal(getPercentile(latest.ageMonths, latest.weight / 2.205, sex, 'weight'))} %ile
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Weight</div>
                </div>
              )}
              {latest.height != null && (
                <div style={{
                  flex: 1, background: '#fff', borderRadius: '18px', padding: '16px 12px',
                  textAlign: 'center', boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
                  borderTop: '3px solid #7C6FF7',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#1e1b4b' }}>
                    {latest.height} cm
                  </div>
                  <div style={{ fontSize: '11px', color: '#7C6FF7', fontWeight: '700', marginTop: '2px' }}>
                    {ordinal(getPercentile(latest.ageMonths, latest.height, sex, 'height'))} %ile
                  </div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>Length/Height</div>
                </div>
              )}
              {latest.weight == null && latest.height == null && null}
            </div>
          )}

          {/* Metric toggle */}
          <div style={{
            display: 'flex', gap: '6px', background: '#f3f4f6',
            borderRadius: '12px', padding: '3px', marginBottom: '10px',
          }}>
            {['weight', 'height'].map(m => (
              <button key={m} onClick={() => setMetric(m)} style={{
                flex: 1, padding: '8px', borderRadius: '9px', border: 'none',
                background: metric === m ? '#fff' : 'transparent',
                boxShadow: metric === m ? '0 2px 8px rgba(100,100,180,0.12)' : 'none',
                fontSize: '13px', fontWeight: '600',
                color: metric === m ? '#1e1b4b' : '#9ca3af',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {m === 'weight' ? '⚖️ Weight' : '📏 Length/Height'}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '16px 12px 8px',
            marginBottom: '14px', boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingLeft: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e1b4b' }}>
                {metric === 'weight' ? 'Weight (lbs)' : 'Length/Height (cm)'}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#9ca3af' }}>
                  <span style={{ display: 'inline-block', width: 20, height: 2, background: '#c4b5fd', borderRadius: 1 }} /> WHO 50th
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#9ca3af' }}>
                  <span style={{ display: 'inline-block', width: 8, height: 8, background: '#10b981', borderRadius: '50%' }} /> {babyName}
                </span>
              </div>
            </div>
            <GrowthChart entries={enriched} sex={sex} metric={metric} />
            <p style={{ fontSize: '10px', color: '#c4c4d4', textAlign: 'center', margin: '6px 0 0', lineHeight: 1.5 }}>
              Shaded bands show WHO 3rd–97th and 15th–85th percentile ranges
            </p>
          </div>

          {/* Add entry button */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                color: '#fff', fontSize: '15px', fontWeight: '600',
                cursor: 'pointer', marginBottom: '14px',
                boxShadow: '0 4px 14px rgba(124,111,247,0.3)',
              }}
            >
              + Add Measurement
            </button>
          )}

          {/* Add entry form */}
          {showForm && (
            <div style={{
              background: '#fff', borderRadius: '20px', padding: '20px',
              marginBottom: '14px', boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
            }}>
              <p style={{ margin: '0 0 16px', fontSize: '15px', fontWeight: '700', color: '#1e1b4b' }}>
                New Measurement
              </p>

              <label style={{ display: 'block', marginBottom: '12px' }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                  Date
                </span>
                <input type="date" value={formDate}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setFormDate(e.target.value)}
                  style={{
                    width: '100%', fontSize: '15px', padding: '11px 14px',
                    borderRadius: '10px', border: '2px solid #e5e7eb', outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </label>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                <label style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Weight (lbs)
                  </span>
                  <input type="number" step="0.1" min="0" max="70" placeholder="e.g. 15.9"
                    value={formWeight} onChange={e => setFormWeight(e.target.value)}
                    style={{
                      width: '100%', fontSize: '15px', padding: '11px 14px',
                      borderRadius: '10px', border: '2px solid #e5e7eb', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </label>
                <label style={{ flex: 1 }}>
                  <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                    Length/Height (cm)
                  </span>
                  <input type="number" step="0.1" min="0" max="120" placeholder="e.g. 68.5"
                    value={formHeight} onChange={e => setFormHeight(e.target.value)}
                    style={{
                      width: '100%', fontSize: '15px', padding: '11px 14px',
                      borderRadius: '10px', border: '2px solid #e5e7eb', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setShowForm(false)} style={{
                  ...btnBase, background: '#f3f4f6', color: '#9ca3af',
                }}>Cancel</button>
                <button
                  onClick={saveEntry}
                  disabled={!formDate || (!formWeight && !formHeight)}
                  style={{
                    ...btnBase, flex: 2,
                    background: (formWeight || formHeight) ? 'linear-gradient(135deg,#7C6FF7,#a78bfa)' : '#e5e7eb',
                    color: (formWeight || formHeight) ? '#fff' : '#9ca3af',
                    cursor: (formWeight || formHeight) ? 'pointer' : 'not-allowed',
                  }}
                >Save</button>
              </div>
            </div>
          )}

          {/* Measurement history */}
          {enriched.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                History
              </p>
              {enriched.map((e, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: '14px', padding: '14px 16px',
                  marginBottom: '8px', boxShadow: '0 2px 10px rgba(100,100,180,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#9ca3af', fontWeight: '500' }}>
                      {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}
                      {Math.round(e.ageMonths)} months old
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {e.weight != null && (
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e1b4b' }}>
                          ⚖️ {e.weight} lbs
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '600', marginLeft: '4px' }}>
                            {ordinal(getPercentile(e.ageMonths, e.weight / 2.205, sex, 'weight'))}
                          </span>
                        </span>
                      )}
                      {e.height != null && (
                        <span style={{ fontSize: '13px', fontWeight: '700', color: '#1e1b4b' }}>
                          📏 {e.height} cm
                          <span style={{ fontSize: '11px', color: '#7C6FF7', fontWeight: '600', marginLeft: '4px' }}>
                            {ordinal(getPercentile(e.ageMonths, e.height, sex, 'height'))}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteEntry(i)}
                    style={{ background: 'none', border: 'none', color: '#e5e7eb', fontSize: '16px', cursor: 'pointer', padding: '4px' }}
                  >✕</button>
                </div>
              ))}
            </div>
          )}

          {enriched.length === 0 && (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#c4c4d4', fontSize: '14px' }}>
              No measurements yet — add the first one above.
            </div>
          )}

          {/* Sex change */}
          <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
            <button onClick={() => { setSex(null); localStorage.removeItem('babySex') }}
              style={{ background: 'none', border: 'none', color: '#c4c4d4', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}>
              Change boy/girl setting
            </button>
          </div>
        </>
      )}
    </div>
  )
}
