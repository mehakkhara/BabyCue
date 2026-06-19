import { useEffect, useState } from 'react'
import { getTipsForProfile, getBabyAgeInMonths, formatBabyAge } from '../data/tips'
import { addEntry, getEntries } from '../data/journalStore'
import { supabase } from '../lib/supabase'
import { loadLatestGrowth, loadRecentJournalNotes } from '../lib/aiContext'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

function todayKey() {
  return new Date().toISOString().split('T')[0]
}

function profileFingerprint(profile, ageInMonths) {
  return [
    profile.babyName, ageInMonths,
    profile.babySex, profile.feedingMethod, profile.sleepArrangement,
    profile.birthContext, profile.siblings,
  ].map(v => v ?? '').join('|')
}

const AGE_STATS = {
  0:  { milk: '16–24 oz', wake: '45–60 min', naps: '4–5', diapers: '8–12' },
  1:  { milk: '16–24 oz', wake: '45–60 min', naps: '4–5', diapers: '8–12' },
  2:  { milk: '24–32 oz', wake: '1–1.5 hr',  naps: '4–5', diapers: '6–8'  },
  3:  { milk: '24–32 oz', wake: '1–1.5 hr',  naps: '3–5', diapers: '6–8'  },
  4:  { milk: '24–36 oz', wake: '1.5–2 hr',  naps: '3–4', diapers: '4–6'  },
  5:  { milk: '24–36 oz', wake: '1.5–2.5 hr',naps: '3',   diapers: '4–6'  },
  6:  { milk: '24–36 oz', wake: '2–3 hr',    naps: '2–3', diapers: '4–6'  },
  7:  { milk: '24–32 oz', wake: '2.5–3 hr',  naps: '2–3', diapers: '4–5'  },
  8:  { milk: '24–32 oz', wake: '2.5–3 hr',  naps: '2',   diapers: '4–5'  },
  9:  { milk: '24–32 oz', wake: '3–3.5 hr',  naps: '2',   diapers: '4–5'  },
  10: { milk: '16–24 oz', wake: '3–4 hr',    naps: '1–2', diapers: '4–5'  },
  11: { milk: '16–24 oz', wake: '3–4 hr',    naps: '1–2', diapers: '4–5'  },
  12: { milk: '16–24 oz', wake: '3.5–4.5 hr',naps: '1–2', diapers: '4–5'  },
  13: { milk: '16–24 oz', wake: '4–5 hr',    naps: '1–2', diapers: '3–5'  },
  14: { milk: '16–24 oz', wake: '4–5 hr',    naps: '1–2', diapers: '3–5'  },
  15: { milk: '16–24 oz', wake: '4.5–5.5 hr',naps: '1–2', diapers: '3–5'  },
  16: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  17: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  18: { milk: '16–24 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  19: { milk: '14–20 oz', wake: '5–6 hr',    naps: '1',   diapers: '3–4'  },
  20: { milk: '14–20 oz', wake: '5.5–6 hr',  naps: '1',   diapers: '3–4'  },
  21: { milk: '14–20 oz', wake: '5.5–6 hr',  naps: '1',   diapers: '3–4'  },
  22: { milk: '14–20 oz', wake: '5.5–6.5 hr',naps: '1',   diapers: '2–4'  },
  23: { milk: '14–20 oz', wake: '6+ hr',     naps: '1',   diapers: '2–4'  },
  24: { milk: '14–20 oz', wake: '6+ hr',     naps: '1',   diapers: '2–4'  },
}

const PRIMARY_TOPICS = [
  { value: null,          label: 'All',         emoji: '✨' },
  { value: 'sleep',       label: 'Sleep',       emoji: '🌙' },
  { value: 'feeding',     label: 'Feeding',     emoji: '🍼' },
  { value: 'development', label: 'Development', emoji: '🧠' },
  { value: 'motor',       label: 'Motor',       emoji: '💪' },
  { value: 'regression',  label: 'Regression',  emoji: '🔄' },
]

const OTHER_TOPICS = [
  { value: 'activity', label: 'Activities',  emoji: '🎨' },
  { value: 'teething', label: 'Teething',    emoji: '🦷' },
  { value: 'fussy',    label: 'Fussy Phase', emoji: '😮‍💨' },
  { value: 'leap',     label: 'Dev Leap',    emoji: '🧩' },
]

const STAT_COLORS = [
  { accent: '#4F7CF7' },
  { accent: '#8B5CF6' },
  { accent: '#059669' },
  { accent: '#E91E8C' },
]

export default function HomeScreen({ profile, onResetProfile, onSignOut, onOpenJournal }) {
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [savedTips, setSavedTips] = useState(() => {
    try { return JSON.parse(localStorage.getItem('savedTips') || '[]') } catch { return [] }
  })
  const [gotItId, setGotItId] = useState(null)
  const [manualOffset, setManualOffset] = useState(0)
  const [aiTip, setAiTip] = useState(null)
  const [aiTipLoading, setAiTipLoading] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdSubmitting, setPwdSubmitting] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState(false)

  const [potdFile, setPotdFile] = useState(null)
  const [potdPreviewUrl, setPotdPreviewUrl] = useState(null)
  const [potdNote, setPotdNote] = useState('')

  // Track the current UTC day so day-bounded effects (AI tip, "today's photo")
  // re-run when the app stays open across midnight — e.g., an installed PWA
  // resumed from background the next morning would otherwise keep yesterday's
  // tip frozen because nothing triggers a re-render.
  const [today, setToday] = useState(() => todayKey())
  useEffect(() => {
    function checkDay() {
      const t = todayKey()
      setToday(prev => (prev === t ? prev : t))
    }
    document.addEventListener('visibilitychange', checkDay)
    window.addEventListener('focus', checkDay)
    return () => {
      document.removeEventListener('visibilitychange', checkDay)
      window.removeEventListener('focus', checkDay)
    }
  }, [])
  const [potdSaving, setPotdSaving] = useState(false)
  const [potdError, setPotdError] = useState('')
  const [potdSavedToday, setPotdSavedToday] = useState(false)
  const [potdSavedPreviewUrl, setPotdSavedPreviewUrl] = useState(null)

  useEffect(() => {
    if (!potdFile) { setPotdPreviewUrl(null); return }
    const url = URL.createObjectURL(potdFile)
    setPotdPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [potdFile])

  // Check if a photo was already saved to the journal today, and reset at
  // midnight so "today's photo" rolls over.
  useEffect(() => {
    let cancelled = false
    let savedUrl = null
    ;(async () => {
      try {
        const entries = await getEntries()
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)
        const todays = entries.find(e => e.photoBlob && e.createdAt >= startOfDay.getTime())
        if (cancelled) return
        if (todays) {
          savedUrl = URL.createObjectURL(todays.photoBlob)
          setPotdSavedPreviewUrl(savedUrl)
          setPotdSavedToday(true)
        } else {
          setPotdSavedToday(false)
          setPotdSavedPreviewUrl(null)
        }
      } catch { /* ignore — uploader still works */ }
    })()
    return () => {
      cancelled = true
      if (savedUrl) URL.revokeObjectURL(savedUrl)
    }
  }, [today])

  async function handleSavePhotoOfDay() {
    if (!potdFile) return
    setPotdSaving(true)
    setPotdError('')
    try {
      await addEntry({
        note: potdNote.trim(),
        photoBlob: potdFile,
        photoType: potdFile.type || 'image/jpeg',
      })
      const url = URL.createObjectURL(potdFile)
      setPotdSavedPreviewUrl(url)
      setPotdSavedToday(true)
      setPotdFile(null)
      setPotdNote('')
    } catch (err) {
      setPotdError(err?.message || 'Could not save. Try again.')
    } finally {
      setPotdSaving(false)
    }
  }

  function openPasswordModal() {
    setNewPwd('')
    setConfirmPwd('')
    setPwdError('')
    setPwdSuccess(false)
    setShowPasswordModal(true)
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    if (newPwd.length < 6) {
      setPwdError('Password must be at least 6 characters.')
      return
    }
    if (newPwd !== confirmPwd) {
      setPwdError('Passwords do not match.')
      return
    }

    setPwdSubmitting(true)
    setPwdError('')

    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdSubmitting(false)

    if (error) {
      setPwdError(error.message || 'Could not update password. Please try again.')
    } else {
      setPwdSuccess(true)
      setTimeout(() => setShowPasswordModal(false), 1500)
    }
  }

  function saveTip(id) {
    setSavedTips(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('savedTips', JSON.stringify(next))
      return next
    })
  }

  const { babyName, dateOfBirth, momName } = profile
  const ageInMonths = getBabyAgeInMonths(dateOfBirth)
  const currentMonth = Math.max(1, Math.min(ageInMonths, 24))
  const [browseMonth, setBrowseMonth] = useState(currentMonth)

  const stats = AGE_STATS[browseMonth] || AGE_STATS[12]
  const STAT_ITEMS = [
    { icon: '🍼', label: 'Milk/day',    value: stats.milk    },
    { icon: '⏱️', label: 'Wake window', value: stats.wake    },
    { icon: '💤', label: 'Naps',        value: stats.naps    },
    { icon: '🩹', label: 'Diapers',     value: stats.diapers },
  ]

  const otherTopicValues = OTHER_TOPICS.map(t => t.value)
  const allTips = selectedTopic === 'other'
    ? getTipsForProfile(browseMonth).filter(t => otherTopicValues.includes(t.topic))
    : getTipsForProfile(browseMonth, selectedTopic)
  const dayIndex = Math.floor(Date.now() / 86400000)
  // One tip per day, advancing by 1 each day so it changes daily. The
  // "Show me a different tip" button bumps manualOffset for the current filter
  // only — it doesn't shift tomorrow's tip.
  const tipOfDay = allTips.length > 0
    ? allTips[(dayIndex + manualOffset) % allTips.length]
    : null

  // Reset to today's batch whenever the user changes month/style/topic — the
  // manual offset is meaningful only for the current filter, not across filters.
  useEffect(() => {
    setManualOffset(0)
  }, [browseMonth, selectedTopic])

  const isCurrentMonth = browseMonth === currentMonth
  // AI tip is anchored to the user's actual baby + actual style — not whatever
  // month/style they're browsing. Only fetch when they're on their own context.
  const showAiTip = isCurrentMonth

  useEffect(() => {
    if (!showAiTip || !babyName || !dateOfBirth) return
    let cancelled = false

    const fp = profileFingerprint(profile, ageInMonths)
    const cacheKey = `dailyTip:${todayKey()}:${fp}`

    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed && parsed.title) setAiTip(parsed)
        return
      } catch { /* fall through and refetch */ }
    }

    async function fetchTip() {
      setAiTipLoading(true)
      try {
        const latestGrowth = loadLatestGrowth(profile)
        const recentJournal = await loadRecentJournalNotes(5)

        const res = await fetch(`${SERVER_URL}/api/daily-tip`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile: { ...profile, ageInMonths },
            context: { latestGrowth, recentJournal },
          }),
        })
        const data = await res.json()
        if (cancelled) return
        if (res.ok && data.tip && data.tip.title) {
          setAiTip(data.tip)
          try { localStorage.setItem(cacheKey, JSON.stringify(data.tip)) } catch { /* quota */ }
        } else {
          setAiTip(null)
        }
      } catch {
        if (!cancelled) setAiTip(null)
      } finally {
        if (!cancelled) setAiTipLoading(false)
      }
    }

    fetchTip()
    return () => { cancelled = true }
  }, [today, showAiTip, babyName, dateOfBirth, ageInMonths,
      profile.babySex, profile.feedingMethod, profile.sleepArrangement,
      profile.birthContext, profile.siblings])

  return (
    <div style={{
      maxWidth: '480px',
      margin: '0 auto',
      padding: '28px 16px 16px',
      minHeight: '100vh',
    }}>

      {/* Header card */}
      <div style={{
        background: '#fff',
        borderRadius: '24px',
        padding: '22px 20px',
        marginBottom: '14px',
        boxShadow: '0 4px 24px rgba(100,100,180,0.08)',
      }}>
        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#9ca3af', fontWeight: '500' }}>
          Hi {momName}!
        </p>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1e1b4b', lineHeight: 1.2 }}>
          {babyName} is {formatBabyAge(dateOfBirth)}
        </h1>
      </div>

      {/* Month navigator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        background: '#fff',
        borderRadius: '16px',
        padding: '10px 14px',
        boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
      }}>
        <button
          onClick={() => setBrowseMonth(m => Math.max(1, m - 1))}
          disabled={browseMonth === 1}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: browseMonth === 1 ? '#f3f4f6' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
            color: browseMonth === 1 ? '#c4c4d4' : '#fff',
            fontSize: '16px',
            cursor: browseMonth === 1 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ‹
        </button>

        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#1e1b4b' }}>
            Month {browseMonth}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={() => setBrowseMonth(currentMonth)}
              style={{
                display: 'block',
                margin: '2px auto 0',
                background: 'none',
                border: 'none',
                fontSize: '11px',
                color: '#a78bfa',
                cursor: 'pointer',
                fontWeight: '600',
                padding: 0,
              }}
            >
              Back to now
            </button>
          )}
          {isCurrentMonth && (
            <span style={{ display: 'block', fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
              Current age
            </span>
          )}
        </div>

        <button
          onClick={() => setBrowseMonth(m => Math.min(24, m + 1))}
          disabled={browseMonth === 24}
          style={{
            width: '32px', height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: browseMonth === 24 ? '#f3f4f6' : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
            color: browseMonth === 24 ? '#c4c4d4' : '#fff',
            fontSize: '16px',
            cursor: browseMonth === 24 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          ›
        </button>
      </div>

      {/* Stats banner */}
      <p style={{
        margin: '0 4px 6px',
        fontSize: '11px',
        fontWeight: '700',
        color: '#9ca3af',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}>
        Typical for month {browseMonth}
      </p>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
        {STAT_ITEMS.map((stat, i) => (
          <div key={stat.label} style={{
            flex: '1 0 76px',
            background: '#fff',
            borderRadius: '18px',
            padding: '14px 8px 12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '4px',
              borderRadius: '18px 18px 0 0',
              backgroundColor: STAT_COLORS[i].accent,
              opacity: 0.6,
            }} />
            <span style={{ fontSize: '18px', marginTop: '4px' }}>{stat.icon}</span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#1e1b4b', textAlign: 'center', lineHeight: 1.2 }}>
              {stat.value}
            </span>
            <span style={{ fontSize: '10px', color: '#9ca3af', textAlign: 'center', lineHeight: 1.3 }}>
              {stat.label}
            </span>
          </div>
        ))}
      </div>
      <p style={{
        margin: '0 4px 14px',
        fontSize: '10px',
        color: '#c4c4d4',
        textAlign: 'center',
        lineHeight: 1.5,
      }}>
        Based on American Academy of Pediatrics guidance
      </p>

      {/* Topic chips — primary inline + Other expands the rest */}
      <div style={{ marginBottom: '14px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '2px' }}>
          Explore by Topic
        </p>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}>
          {[...PRIMARY_TOPICS, { value: 'other', label: 'Other', emoji: '＋' }].map(topic => {
            const isSelected = selectedTopic === topic.value
            return (
              <button
                key={String(topic.value)}
                onClick={() => setSelectedTopic(topic.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: 'none',
                  background: isSelected
                    ? 'linear-gradient(135deg, #7C6FF7, #a78bfa)'
                    : '#fff',
                  color: isSelected ? '#fff' : '#6b7280',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: isSelected
                    ? '0 4px 12px rgba(124,111,247,0.35)'
                    : '0 2px 8px rgba(100,100,180,0.08)',
                  transition: 'all 0.15s',
                }}
              >
                <span>{topic.emoji}</span>
                <span>{topic.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tips section */}
      <div key={`${selectedTopic}-${browseMonth}`} style={{ animation: 'fadeIn 0.2s ease' }}>
        {tipOfDay ? (
          <>
            {/* Tip of the Day — AI-generated when available, curated otherwise */}
            {(() => {
              const useAi = showAiTip && aiTip && !aiTipLoading && selectedTopic === null && manualOffset === 0
              const heroTitle = useAi ? aiTip.title : tipOfDay.title
              const heroBody = useAi ? aiTip.body : tipOfDay.body
              const heroSource = useAi ? aiTip.source : tipOfDay.source
              const heroId = useAi ? `ai:${todayKey()}` : tipOfDay.id
              const accent = useAi ? '#7C6FF7' : '#a78bfa'
              return (
                <div style={{
                  background: '#fff',
                  borderRadius: '20px',
                  padding: '20px',
                  marginBottom: '12px',
                  boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
                  borderLeft: `4px solid ${accent}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '16px' }}>{useAi ? '✨' : '💡'}</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Tip of the Day
                    </span>
                    {useAi && (
                      <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: '#fff',
                        background: '#7C6FF7',
                        padding: '2px 7px',
                        borderRadius: '10px',
                        letterSpacing: '0.04em',
                      }}>
                        ✨ AI · for {babyName}
                      </span>
                    )}
                  </div>
                  {aiTipLoading && showAiTip && !aiTip ? (
                    <>
                      <div style={{ height: '14px', width: '70%', background: '#f1edff', borderRadius: '6px', marginBottom: '10px' }} />
                      <div style={{ height: '11px', width: '95%', background: '#f5f3ff', borderRadius: '6px', marginBottom: '6px' }} />
                      <div style={{ height: '11px', width: '85%', background: '#f5f3ff', borderRadius: '6px' }} />
                    </>
                  ) : (
                    <>
                      <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '600', color: '#1e1b4b', lineHeight: 1.5 }}>
                        {heroTitle}
                      </p>
                      <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.65', color: '#6b7280' }}>
                        {heroBody}
                      </p>
                      {heroSource && (
                        <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#c4b5fd' }}>
                          Source: {heroSource}
                        </p>
                      )}
                    </>
                  )}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button
                      onClick={() => saveTip(heroId)}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: 'none',
                        background: savedTips.includes(heroId) ? '#ede9fe' : '#f5f3ff',
                        color: savedTips.includes(heroId) ? '#7C6FF7' : '#9ca3af',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {savedTips.includes(heroId) ? '🔖 Saved' : '🔖 Save tip'}
                    </button>
                    <button
                      onClick={() => setGotItId(heroId)}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: 'none',
                        background: gotItId === heroId ? '#ecfdf5' : '#f0fdf4',
                        color: gotItId === heroId ? '#15803d' : '#9ca3af',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {gotItId === heroId ? '✓ Done!' : '✓ Got it'}
                    </button>
                  </div>
                </div>
              )
            })()}

            {allTips.length > 1 && (
              <button
                onClick={() => setManualOffset(o => o + 1)}
                style={{
                  width: '100%',
                  padding: '12px',
                  marginTop: '4px',
                  background: 'transparent',
                  border: '1px dashed #c4b5fd',
                  borderRadius: '14px',
                  color: '#7C6FF7',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span style={{ fontSize: '15px' }}>↻</span>
                <span>Show me a different tip</span>
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* Memory book — saves to Journal */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '18px',
        marginTop: '24px',
        marginBottom: '4px',
        boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
        borderLeft: '4px solid #E91E8C',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '16px' }}>📸</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#E91E8C', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {babyName}'s memory book
          </span>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
          A tiny moment from today — saved straight to your journal.
        </p>

        {potdSavedToday ? (
          <div>
            <div style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              background: '#fef7fb',
              border: '1px solid #fbcfe8',
              borderRadius: '14px',
              padding: '12px',
            }}>
              {potdSavedPreviewUrl ? (
                <img
                  src={potdSavedPreviewUrl}
                  alt="Today's photo"
                  style={{
                    width: '64px',
                    height: '64px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '12px',
                  background: '#fce7f3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>📷</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: '0 0 2px', fontSize: '13px', fontWeight: '700', color: '#9d174d' }}>
                  ✓ Saved to your journal
                </p>
                <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#9ca3af' }}>
                  Come back tomorrow for another moment.
                </p>
                {onOpenJournal && (
                  <button
                    onClick={onOpenJournal}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      color: '#E91E8C',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    View in journal →
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <label
              htmlFor="potd-photo-input"
              style={{
                display: 'block',
                border: '2px dashed #fbcfe8',
                borderRadius: '14px',
                padding: potdPreviewUrl ? 0 : '28px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '12px',
                overflow: 'hidden',
                background: potdPreviewUrl ? 'transparent' : '#fef7fb',
              }}
            >
              {potdPreviewUrl ? (
                <img
                  src={potdPreviewUrl}
                  alt="preview"
                  style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
                />
              ) : (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
                  <span style={{ color: '#9d174d', fontSize: '13px', fontWeight: '600' }}>
                    Tap to add today's photo
                  </span>
                </>
              )}
            </label>
            <input
              id="potd-photo-input"
              type="file"
              accept="image/*"
              onChange={e => setPotdFile(e.target.files?.[0] || null)}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />

            {potdFile && (
              <>
                <textarea
                  value={potdNote}
                  onChange={e => setPotdNote(e.target.value)}
                  placeholder="Add a note... (optional)"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1.5px solid #fbcfe8',
                    fontSize: '13px',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                />

                {potdError && (
                  <p style={{
                    margin: '0 0 10px',
                    fontSize: '12px',
                    color: '#b91c1c',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '8px 10px',
                  }}>
                    {potdError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { setPotdFile(null); setPotdNote(''); setPotdError('') }}
                    disabled={potdSaving}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '10px',
                      border: '1.5px solid #f3f4f6',
                      background: '#fff',
                      color: '#6b7280',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: potdSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePhotoOfDay}
                    disabled={potdSaving}
                    style={{
                      flex: 2,
                      padding: '10px',
                      borderRadius: '10px',
                      border: 'none',
                      background: potdSaving
                        ? '#f9a8d4'
                        : 'linear-gradient(135deg, #E91E8C, #f472b6)',
                      color: '#fff',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: potdSaving ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {potdSaving ? 'Saving…' : 'Save to journal'}
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Edit profile / Sign out */}
      <div style={{ textAlign: 'center', marginTop: '32px', paddingBottom: '16px', display: 'flex', gap: '14px', justifyContent: 'center' }}>
        <button
          onClick={onResetProfile}
          style={{ background: 'none', border: 'none', color: '#c4c4d4', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
        >
          Edit Profile
        </button>
        {onSignOut && (
          <button
            onClick={openPasswordModal}
            style={{ background: 'none', border: 'none', color: '#c4c4d4', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Change Password
          </button>
        )}
        {onSignOut && (
          <button
            onClick={onSignOut}
            style={{ background: 'none', border: 'none', color: '#c4c4d4', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Sign Out
          </button>
        )}
      </div>

      {showPasswordModal && (
        <div
          onClick={() => !pwdSubmitting && setShowPasswordModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: '700', color: '#1e1b4b' }}>
              Change your password
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
              Pick a new password to sign in with. If you signed in via magic link before, this is the first one — set it now and you can skip the email step next time.
            </p>

            {pwdSuccess ? (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                padding: '14px',
                color: '#065f46',
                fontSize: '14px',
                textAlign: 'center',
              }}>
                Password updated. You can sign in with it next time.
              </div>
            ) : (
              <form onSubmit={handleSetPassword}>
                <input
                  type="password"
                  required
                  autoFocus
                  autoComplete="new-password"
                  placeholder="New password"
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  disabled={pwdSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '10px',
                  }}
                />
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  disabled={pwdSubmitting}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: '15px',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: '12px',
                  }}
                />

                {pwdError && (
                  <p style={{
                    margin: '0 0 12px',
                    fontSize: '13px',
                    color: '#b91c1c',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '10px',
                    padding: '10px 12px',
                  }}>
                    {pwdError}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(false)}
                    disabled={pwdSubmitting}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: pwdSubmitting ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwdSubmitting || !newPwd || !confirmPwd}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: pwdSubmitting || !newPwd || !confirmPwd
                        ? '#c4b5fd'
                        : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: pwdSubmitting || !newPwd || !confirmPwd ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {pwdSubmitting ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
