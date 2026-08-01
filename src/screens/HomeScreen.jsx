import { useEffect, useState } from 'react'
import { getTipsForProfile, getBabyAgeInMonths, formatBabyAge } from '../data/tips'
import { addEntry, getEntries, isVideoType } from '../data/journalStore'
import { supabase } from '../lib/supabase'
import { loadLatestGrowth, loadRecentJournalNotes } from '../lib/aiContext'
import { loadSaved, isSaved, toggleSaved, removeSaved } from '../lib/savedTips'
import { BABY_STATES, getStateResponse } from '../data/babyStates'
import { markHelped, timesHelped } from '../lib/babyPatterns'
import { pickNudge } from '../data/nudges'
import { isSupported as notifsSupported, permission as notifPermission, isEnabled as nudgeIsEnabled, setEnabled as setNudgeEnabled, requestPermission as requestNotifPermission, showNudge, lastShownId } from '../lib/notifications'

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
  const [savedTips, setSavedTips] = useState(() => loadSaved())
  const [showSaved, setShowSaved] = useState(false)
  const [gotItId, setGotItId] = useState(null)
  const [activeState, setActiveState] = useState(null) // state key of the open sheet, or null
  const [helpedCause, setHelpedCause] = useState(null) // cause marked "this helped" in the open sheet
  const [triedCauses, setTriedCauses] = useState([])   // causes crossed off in the open sheet
  const [helpedReflection, setHelpedReflection] = useState(null) // pattern surfaced back to her
  const [nudgeOn, setNudgeOn] = useState(() => nudgeIsEnabled())
  const [nudgePerm, setNudgePerm] = useState(() => notifPermission())
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


  function openState(stateKey) {
    setActiveState(stateKey)
    setHelpedCause(null)
    setTriedCauses([])
    setHelpedReflection(null)
  }

  function closeState() {
    setActiveState(null)
    setHelpedCause(null)
    setTriedCauses([])
    setHelpedReflection(null)
  }

  // Cross-off checklist: toggle a cause she's already tried.
  function toggleTried(cause) {
    setTriedCauses(prev => prev.includes(cause) ? prev.filter(c => c !== cause) : [...prev, cause])
  }

  // The one signal worth keeping: which cause actually helped this baby.
  // If it's helped before, reflect that pattern back to her.
  function handleHelped(stateKey, cause) {
    const priorHelps = timesHelped(stateKey, cause)
    setHelpedCause(cause)
    markHelped(stateKey, cause)
    setHelpedReflection(priorHelps >= 1 ? `💜 This often helps ${babyName} — good to remember.` : null)
  }

  async function toggleNudge() {
    if (nudgeOn) {
      setNudgeEnabled(false)
      setNudgeOn(false)
      return
    }
    let perm = notifPermission()
    if (perm === 'default') perm = await requestNotifPermission()
    setNudgePerm(perm)
    if (perm === 'granted') {
      setNudgeEnabled(true)
      setNudgeOn(true)
      // Fire one nudge right away so she sees it worked.
      showNudge(pickNudge(ageInMonths, babyName, lastShownId()))
    }
  }

  const [potdSaving, setPotdSaving] = useState(false)
  const [potdError, setPotdError] = useState('')
  const [showUploader, setShowUploader] = useState(false)
  const [photoVersion, setPhotoVersion] = useState(0)
  const [recentPhotos, setRecentPhotos] = useState([])

  // Load journal photos so the home screen can feature the most recent one and
  // show the rest below. Re-runs whenever a new photo is saved (photoVersion).
  // Object URLs are revoked on cleanup to avoid leaking memory.
  useEffect(() => {
    let cancelled = false
    const urls = []
    ;(async () => {
      try {
        const entries = await getEntries()
        const withPhotos = entries.filter(e => e.photoBlob).slice(0, 12)
        const mapped = withPhotos.map(e => {
          const url = URL.createObjectURL(e.photoBlob)
          urls.push(url)
          return { id: e.id, url, note: e.note, createdAt: e.createdAt, type: e.photoType }
        })
        if (cancelled) { urls.forEach(u => URL.revokeObjectURL(u)); return }
        setRecentPhotos(mapped)
      } catch { /* ignore — strip just stays empty */ }
    })()
    return () => {
      cancelled = true
      urls.forEach(u => URL.revokeObjectURL(u))
    }
  }, [photoVersion])

  useEffect(() => {
    if (!potdFile) { setPotdPreviewUrl(null); return }
    const url = URL.createObjectURL(potdFile)
    setPotdPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [potdFile])

  async function handleSavePhoto() {
    if (!potdFile) return
    setPotdSaving(true)
    setPotdError('')
    try {
      await addEntry({
        note: potdNote.trim(),
        photoBlob: potdFile,
        photoType: potdFile.type || 'image/jpeg',
      })
      setPotdFile(null)
      setPotdNote('')
      setShowUploader(false)
      setPhotoVersion(v => v + 1) // refresh featured photo + strip
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

  // Pass the full tip object so AI tips (whose text isn't otherwise stored)
  // persist into the Saved collection.
  function saveTip(tip) {
    setSavedTips(toggleSaved(tip))
  }

  function unsaveTip(id) {
    setSavedTips(removeSaved(id))
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
  // The curated sourced tip is always the daily hero. The AI tip is only a
  // fallback for when the curated pool has nothing to show for this filter.
  const hasCuratedTip = tipOfDay != null

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
    // Only reach for an AI tip when the curated pool is empty for this view.
    // With a sourced tip available, skip the fetch entirely (no cost, no stale cache).
    if (!showAiTip || !babyName || !dateOfBirth || hasCuratedTip) return
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
  }, [today, showAiTip, hasCuratedTip, babyName, dateOfBirth, ageInMonths,
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

      {/* How's baby? responder sheet */}
      {activeState && (() => {
        const r = getStateResponse(activeState, ageInMonths)
        if (!r) return null
        return (
          <div
            onClick={closeState}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(30,27,75,0.35)',
              zIndex: 50,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{
                width: '100%',
                maxWidth: '480px',
                maxHeight: '85vh',
                background: '#faf9ff',
                borderRadius: '24px 24px 0 0',
                padding: '20px 18px calc(20px + env(safe-area-inset-bottom))',
                overflowY: 'auto',
                boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
                animation: 'fadeIn 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '4px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e1b4b', lineHeight: 1.3 }}>
                  {r.state.emoji} {r.state.ask(babyName)}
                </h2>
                <button
                  onClick={closeState}
                  aria-label="Close"
                  style={{
                    border: 'none',
                    background: '#ece9f6',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    color: '#6b7280',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              </div>
              <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#a78bfa', fontWeight: '600' }}>
                {r.tone === 'positive' ? "What's blooming right now" : 'Common at this age'} · {r.bandLabel}
                {r.tone !== 'positive' && triedCauses.length > 0 && (
                  <span style={{ color: '#c4b5fd' }}> · {triedCauses.length} of {r.reasons.length} tried</span>
                )}
              </p>

              {r.reasons.map(reason => {
                const wasHelp = helpedCause === reason.cause
                const tried = triedCauses.includes(reason.cause)
                const dimmed = tried && !wasHelp
                return (
                  <div
                    key={reason.cause}
                    style={{
                      background: wasHelp ? '#f0fdf4' : '#fff',
                      border: wasHelp ? '1.5px solid #86efac' : '1.5px solid transparent',
                      borderRadius: '16px',
                      padding: '14px 16px',
                      marginBottom: '10px',
                      boxShadow: '0 2px 12px rgba(100,100,180,0.06)',
                      opacity: dimmed ? 0.55 : 1,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <p style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: '700', color: '#1e1b4b', textDecoration: dimmed ? 'line-through' : 'none' }}>
                      {reason.cause}
                    </p>
                    <p style={{ margin: '0 0 10px', fontSize: '13px', lineHeight: 1.6, color: '#6b7280' }}>
                      {reason.action}
                    </p>
                    {r.tone !== 'positive' && (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                          onClick={() => handleHelped(activeState, reason.cause)}
                          disabled={wasHelp}
                          style={{
                            border: 'none',
                            background: wasHelp ? 'transparent' : '#f5f3ff',
                            color: wasHelp ? '#15803d' : '#7C6FF7',
                            borderRadius: '8px',
                            padding: wasHelp ? 0 : '5px 10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            cursor: wasHelp ? 'default' : 'pointer',
                          }}
                        >
                          {wasHelp ? '💜 Glad this helped' : 'This helped'}
                        </button>
                        {!wasHelp && (
                          <button
                            onClick={() => toggleTried(reason.cause)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: tried ? '#a78bfa' : '#c4c4d4',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              padding: '5px 4px',
                            }}
                          >
                            {tried ? '↩︎ Not yet' : 'Tried it'}
                          </button>
                        )}
                      </div>
                    )}
                    {wasHelp && helpedReflection && (
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#15803d', fontWeight: '600' }}>
                        {helpedReflection}
                      </p>
                    )}
                  </div>
                )
              })}

              {r.tone === 'positive' ? (
                <div style={{
                  background: '#fdf4ff',
                  border: '1px solid #f5d0fe',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginTop: '4px',
                }}>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: '#a21caf' }}>
                    {r.positiveNote}
                  </p>
                </div>
              ) : r.redFlag ? (
                <div style={{
                  background: '#fff7ed',
                  border: '1px solid #fed7aa',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  marginTop: '4px',
                }}>
                  <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.6, color: '#9a3412' }}>
                    <strong>When to call the doctor:</strong> {r.redFlag}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        )
      })()}

      {/* Saved tips sheet */}
      {showSaved && (
        <div
          onClick={() => setShowSaved(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30,27,75,0.35)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '480px',
              maxHeight: '80vh',
              background: '#faf9ff',
              borderRadius: '24px 24px 0 0',
              padding: '20px 18px calc(20px + env(safe-area-inset-bottom))',
              overflowY: 'auto',
              boxShadow: '0 -8px 40px rgba(100,100,180,0.25)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#1e1b4b' }}>
                🔖 Saved tips
              </h2>
              <button
                onClick={() => setShowSaved(false)}
                aria-label="Close"
                style={{
                  border: 'none',
                  background: '#ece9f6',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  color: '#6b7280',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            {savedTips.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: '#9ca3af' }}>
                <div style={{ fontSize: '34px', marginBottom: '8px' }}>🔖</div>
                <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                  No saved tips yet.<br />Tap <strong>Save tip</strong> on any tip to keep it here.
                </p>
              </div>
            ) : (
              savedTips.map(t => (
                <div
                  key={String(t.id)}
                  style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    marginBottom: '10px',
                    boxShadow: '0 2px 12px rgba(100,100,180,0.06)',
                    borderLeft: '4px solid #a78bfa',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'flex-start' }}>
                    <p style={{ margin: '0 0 6px', fontSize: '14px', fontWeight: '600', color: '#1e1b4b', lineHeight: 1.4 }}>
                      {t.title}
                    </p>
                    <button
                      onClick={() => unsaveTip(t.id)}
                      aria-label="Remove from saved"
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#c4b5fd',
                        fontSize: '15px',
                        cursor: 'pointer',
                        flexShrink: 0,
                        padding: 0,
                        lineHeight: 1,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.6, color: '#6b7280' }}>
                    {t.body}
                  </p>
                  {t.source && (
                    <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#c4b5fd' }}>
                      Source: {t.source}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

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
        {(tipOfDay || (showAiTip && (aiTip || aiTipLoading))) ? (
          <>
            {/* Tip of the Day — curated sourced tip is the daily hero; AI only fills in
                when the curated pool has nothing to show for this filter. */}
            {(() => {
              const useAi = !tipOfDay && showAiTip && aiTip && !aiTipLoading
              const heroTitle = useAi ? aiTip.title : tipOfDay.title
              const heroBody = useAi ? aiTip.body : tipOfDay.body
              const heroSource = useAi ? aiTip.source : tipOfDay.source
              const heroId = useAi ? `ai:${todayKey()}` : tipOfDay.id
              const heroTopic = useAi ? (aiTip.topic ?? selectedTopic ?? null) : tipOfDay.topic
              const heroSaved = isSaved(heroId, savedTips)
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
                    {allTips.length > 1 && (
                      <button
                        onClick={() => setManualOffset(o => o + 1)}
                        aria-label="Show a different tip"
                        title="Show a different tip"
                        style={{
                          marginLeft: 'auto',
                          flexShrink: 0,
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#f5f3ff',
                          color: '#7C6FF7',
                          fontSize: '15px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        ↻
                      </button>
                    )}
                  </div>
                  {!tipOfDay && aiTipLoading && showAiTip && !aiTip ? (
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
                      onClick={() => saveTip({ id: heroId, title: heroTitle, body: heroBody, source: heroSource, topic: heroTopic })}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '10px',
                        border: 'none',
                        background: heroSaved ? '#ede9fe' : '#f5f3ff',
                        color: heroSaved ? '#7C6FF7' : '#9ca3af',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {heroSaved ? '🔖 Saved' : '🔖 Save tip'}
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

          </>
        ) : null}
      </div>

      {/* How's baby feeling today? — chips styled like Explore by Topic */}
      <div style={{ marginTop: '24px', marginBottom: '14px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '11px', fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '2px' }}>
          How's {babyName} feeling today?
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
          {BABY_STATES.map(s => (
            <button
              key={s.key}
              onClick={() => openState(s.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '8px 14px',
                borderRadius: '20px',
                border: 'none',
                background: '#fff',
                color: '#6b7280',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(100,100,180,0.08)',
                transition: 'all 0.15s',
              }}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Memory book — saves to Journal */}
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '18px',
        marginTop: '24px',
        marginBottom: '4px',
        boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
        borderLeft: '4px solid #7C6FF7',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '16px' }}>📸</span>
          <span style={{ fontSize: '11px', fontWeight: '700', color: '#7C6FF7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {babyName}'s memory book
          </span>
        </div>
        <p style={{ margin: '0 0 14px', fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
          Little moments to look back on — add a photo or video whenever you like.
        </p>

        {showUploader ? (
          <>
            <label
              htmlFor="potd-photo-input"
              style={{
                display: 'block',
                border: '2px dashed #ddd6fe',
                borderRadius: '14px',
                padding: potdPreviewUrl ? 0 : '28px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                marginBottom: '12px',
                overflow: 'hidden',
                background: potdPreviewUrl ? 'transparent' : '#f5f3ff',
              }}
            >
              {potdPreviewUrl ? (
                isVideoType(potdFile?.type) ? (
                  <video
                    src={potdPreviewUrl}
                    controls
                    playsInline
                    style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover', background: '#000' }}
                  />
                ) : (
                  <img
                    src={potdPreviewUrl}
                    alt="preview"
                    style={{ width: '100%', display: 'block', maxHeight: '280px', objectFit: 'cover' }}
                  />
                )
              ) : (
                <>
                  <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
                  <span style={{ color: '#7C6FF7', fontSize: '13px', fontWeight: '600' }}>
                    Tap to choose a photo or video
                  </span>
                </>
              )}
            </label>
            <input
              id="potd-photo-input"
              type="file"
              accept="image/*,video/*"
              onChange={e => setPotdFile(e.target.files?.[0] || null)}
              style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
            />

            <textarea
              value={potdNote}
              onChange={e => setPotdNote(e.target.value)}
              placeholder="Add a note... (optional)"
              rows={2}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #ddd6fe',
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
                onClick={() => { setShowUploader(false); setPotdFile(null); setPotdNote(''); setPotdError('') }}
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
                onClick={handleSavePhoto}
                disabled={potdSaving || !potdFile}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: potdSaving || !potdFile
                    ? '#c4b5fd'
                    : 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: potdSaving || !potdFile ? 'not-allowed' : 'pointer',
                }}
              >
                {potdSaving ? 'Saving…' : 'Save to journal'}
              </button>
            </div>
          </>
        ) : recentPhotos.length > 0 ? (
          <>
            {/* Featured — the most recent memory, shown large */}
            <div style={{ borderRadius: '14px', overflow: 'hidden', marginBottom: recentPhotos[0].note ? '8px' : '12px' }}>
              {isVideoType(recentPhotos[0].type) ? (
                <video
                  src={recentPhotos[0].url}
                  controls
                  playsInline
                  style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover', background: '#000' }}
                />
              ) : (
                <img
                  src={recentPhotos[0].url}
                  alt=""
                  style={{ width: '100%', display: 'block', maxHeight: '300px', objectFit: 'cover' }}
                />
              )}
            </div>
            {recentPhotos[0].note && (
              <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                {recentPhotos[0].note}
              </p>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowUploader(true)}
                style={{
                  flex: 2,
                  padding: '10px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #7C6FF7, #a78bfa)',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                + Add photo/video
              </button>
              {onOpenJournal && (
                <button
                  onClick={onOpenJournal}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: '10px',
                    border: '1.5px solid #ede9fe',
                    background: '#fff',
                    color: '#7C6FF7',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  View journal
                </button>
              )}
            </div>
          </>
        ) : (
          <label
            htmlFor="potd-photo-input-empty"
            onClick={() => setShowUploader(true)}
            style={{
              display: 'block',
              border: '2px dashed #ddd6fe',
              borderRadius: '14px',
              padding: '28px 16px',
              textAlign: 'center',
              cursor: 'pointer',
              background: '#f5f3ff',
            }}
          >
            <div style={{ fontSize: '28px', marginBottom: '4px' }}>📷</div>
            <span style={{ color: '#7C6FF7', fontSize: '13px', fontWeight: '600' }}>
              Tap to add your first photo or video
            </span>
          </label>
        )}
      </div>

      {/* More memories — the rest of the baby pictures (the most recent is featured above) */}
      {recentPhotos.length > 1 && (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '18px 0 18px 18px',
          marginTop: '12px',
          boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
          borderLeft: '4px solid #a78bfa',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
            marginBottom: '14px',
            paddingRight: '18px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ fontSize: '16px' }}>📖</span>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                More of {babyName}'s memories
              </span>
            </div>
            {onOpenJournal && (
              <button
                onClick={onOpenJournal}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  color: '#7C6FF7',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                View all →
              </button>
            )}
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            overflowX: 'auto',
            paddingRight: '18px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}>
            {recentPhotos.slice(1).map(photo => (
              <button
                key={String(photo.id)}
                onClick={onOpenJournal}
                title={photo.note || undefined}
                style={{
                  position: 'relative',
                  flexShrink: 0,
                  width: '92px',
                  height: '92px',
                  padding: 0,
                  border: '2px solid #ede9fe',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: onOpenJournal ? 'pointer' : 'default',
                  background: '#f5f3ff',
                  boxShadow: '0 2px 10px rgba(100,100,180,0.10)',
                }}
              >
                {isVideoType(photo.type) ? (
                  <>
                    <video
                      src={photo.url}
                      muted
                      playsInline
                      preload="metadata"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', background: '#000' }}
                    />
                    <span style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: 'rgba(0,0,0,0.45)',
                      color: '#fff',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingLeft: '2px',
                      pointerEvents: 'none',
                    }}>▶</span>
                  </>
                ) : (
                  <img
                    src={photo.url}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Saved tips entry */}
      <button
        onClick={() => setShowSaved(true)}
        style={{
          width: '100%',
          marginTop: '24px',
          padding: '16px 18px',
          background: '#fff',
          border: 'none',
          borderRadius: '20px',
          boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
          borderLeft: '4px solid #a78bfa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span style={{ fontSize: '20px' }}>🔖</span>
        <div style={{ textAlign: 'left', flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e1b4b' }}>
            Saved tips
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>
            {savedTips.length === 0
              ? 'Bookmark tips to keep them here'
              : `${savedTips.length} tip${savedTips.length === 1 ? '' : 's'} saved`}
          </p>
        </div>
        <span style={{ fontSize: '18px', color: '#c4b5fd', flexShrink: 0 }}>›</span>
      </button>

      {/* Daily nudge — notification opt-in */}
      {notifsSupported() && (
        <div style={{
          background: '#fff',
          borderRadius: '20px',
          padding: '16px 18px',
          marginTop: '12px',
          boxShadow: '0 4px 20px rgba(100,100,180,0.07)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#1e1b4b' }}>
                🔔 Daily nudge
              </p>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af', lineHeight: 1.5 }}>
                A gentle, curious reminder to check in on {babyName}.
              </p>
            </div>
            <button
              onClick={toggleNudge}
              aria-label="Toggle daily nudge"
              style={{
                flexShrink: 0,
                width: '46px',
                height: '28px',
                borderRadius: '14px',
                border: 'none',
                background: nudgeOn ? 'linear-gradient(135deg, #7C6FF7, #a78bfa)' : '#e5e3ee',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.15s',
              }}
            >
              <span style={{
                position: 'absolute',
                top: '3px',
                left: nudgeOn ? '21px' : '3px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: '#fff',
                transition: 'left 0.15s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
            </button>
          </div>
          {nudgePerm === 'denied' && (
            <p style={{ margin: '10px 0 0', fontSize: '12px', color: '#b45309', lineHeight: 1.5 }}>
              Notifications are blocked. Enable them for this site in your browser settings to turn this on.
            </p>
          )}
        </div>
      )}

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
