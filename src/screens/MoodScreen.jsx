// "How is baby today?" — a 2×4 grid, several picks allowed, Save. After
// saving, each concern she picked opens its age-aware causes below, and the
// day's tip leans toward the matching topic (see lib/moodLog).
import { useState } from 'react'
import { BABY_STATES } from '../data/babyStates'
import { getTodayMoods, saveTodayMoods } from '../lib/moodLog'
import { markCheckIn } from '../lib/streak'
import { getBabyAgeInMonths } from '../data/tips'
import StateResponder from '../components/StateResponder'
import { Screen, PrimaryButton, Notice, Card } from '../components/ui'
import { color, shadow, type } from '../theme'

const TILE_BG = {
  happy: '#fef9c3', fussy: '#ffe4e6', clingy: '#ede9fe', sleep: '#e0e7ff',
  feeding: '#e0f2fe', tummy: '#ffedd5', sleepy: '#f3e8ff', great: '#dcfce7',
}

export default function MoodScreen({ profile, onBack }) {
  const babyName = (profile.babyName || '').trim() || 'your baby'
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const [picked, setPicked] = useState(() => getTodayMoods())
  const [saved, setSaved] = useState(() => getTodayMoods().length > 0)
  const [openState, setOpenState] = useState(null)

  const grid = BABY_STATES.filter(s => !s.hidden)

  function toggle(key) {
    setSaved(false)
    setPicked(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key])
  }

  function handleSave() {
    saveTodayMoods(picked)
    markCheckIn('feeling')
    setSaved(true)
    const firstConcern = grid.find(s => picked.includes(s.key) && s.tone === 'concern')
    setOpenState(firstConcern ? firstConcern.key : (picked[0] || null))
  }

  const pickedStates = grid.filter(s => picked.includes(s.key))

  return (
    <Screen onBack={onBack} detail>
      <h1 style={{ ...type.h1, marginBottom: '6px' }}>How is {babyName} today?</h1>
      <p style={{ ...type.body, marginBottom: '20px' }}>
        Let us know so we can give you more relevant tips.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {grid.map(s => {
          const on = picked.includes(s.key)
          return (
            <button key={s.key} onClick={() => toggle(s.key)} aria-pressed={on} style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '14px',
              borderRadius: '16px', border: on ? `2px solid ${color.primary}` : '2px solid transparent',
              background: TILE_BG[s.key] || color.tint, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: on ? shadow.button : 'none', transition: 'box-shadow 0.15s',
            }}>
              <span style={{ fontSize: '24px', lineHeight: 1 }}>{s.emoji}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: color.ink, textAlign: 'left' }}>{s.label}</span>
            </button>
          )
        })}
      </div>

      <div style={{ marginTop: '18px' }}>
        <PrimaryButton onClick={handleSave} disabled={picked.length === 0 && !saved} done={saved}>
          {saved ? '✓ Saved for today' : 'Save'}
        </PrimaryButton>
      </div>

      <div style={{ marginTop: '12px' }}>
        <Notice emoji="💜">Your responses help us personalize tips, activities and stories.</Notice>
      </div>

      {saved && pickedStates.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          {pickedStates.map(s => {
            const open = openState === s.key
            return (
              <Card key={s.key} style={{ marginBottom: '10px' }} padding="0">
                <button onClick={() => setOpenState(open ? null : s.key)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 18px',
                  border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                }}>
                  <span style={{ fontSize: '22px' }}>{s.emoji}</span>
                  <span style={{ ...type.bodyStrong, flex: 1 }}>{s.ask(babyName)}</span>
                  <span style={{ color: color.lavender, fontSize: '16px', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>›</span>
                </button>
                {open && (
                  <div style={{ padding: '0 18px 16px' }}>
                    <StateResponder stateKey={s.key} ageInMonths={ageInMonths} profile={profile} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      <button onClick={() => setOpenState(openState === 'unwell' ? null : 'unwell')} style={{
        display: 'block', width: '100%', marginTop: '18px', border: 'none', background: 'none',
        color: color.inkSoft, fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline',
      }}>
        {babyName} seems unwell? When to call the doctor
      </button>
      {openState === 'unwell' && (
        <Card style={{ marginTop: '12px' }}>
          <StateResponder stateKey="unwell" ageInMonths={ageInMonths} profile={profile} />
        </Card>
      )}
    </Screen>
  )
}
