// Mom's corner: the baby photo, profile edits, saved tips, the daily nudge,
// her check-in streak, password and sign-out. Everything that used to sit at
// the bottom of Home lives here so Today stays calm.
import { useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadSaved } from '../lib/savedTips'
import { streakSummary } from '../lib/streak'
import { pickNudge } from '../data/nudges'
import { getBabyAgeInMonths, formatBabyAge } from '../data/tips'
import { getBabyPhoto, setBabyPhoto, clearBabyPhoto } from '../lib/babyPhoto'
import {
  isSupported as notifsSupported, permission as notifPermission, isEnabled as nudgeIsEnabled,
  setEnabled as setNudgeEnabled, requestPermission as requestNotifPermission, showNudge, lastShownId,
} from '../lib/notifications'
import StreakRow from '../components/StreakRow'
import { Screen, Card, ListRow, Avatar, PrimaryButton } from '../components/ui'
import { color, gradient, shadow, type } from '../theme'

export default function ProfileScreen({ profile, onBack, onEditProfile, onSavedTips, onChecklists, onSignOut, onPhotoChange }) {
  const babyName = (profile.babyName || '').trim() || 'your baby'
  const momName = (profile.momName || '').trim() || 'Mama'
  const ageInMonths = getBabyAgeInMonths(profile.dateOfBirth)
  const savedCount = loadSaved().length

  const [photo, setPhoto] = useState(() => getBabyPhoto())
  const [photoBusy, setPhotoBusy] = useState(false)
  const fileRef = useRef(null)

  const [nudgeOn, setNudgeOn] = useState(() => nudgeIsEnabled())
  const [nudgePerm, setNudgePerm] = useState(() => notifPermission())

  const [showPwd, setShowPwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdBusy, setPwdBusy] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdOk, setPwdOk] = useState(false)

  async function onPickPhoto(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoBusy(true)
    try {
      const url = await setBabyPhoto(file)
      setPhoto(url)
      onPhotoChange?.(url)
    } catch (err) {
      console.error('Baby photo failed:', err)
    } finally {
      setPhotoBusy(false)
    }
  }

  function removePhoto() {
    clearBabyPhoto()
    setPhoto(null)
    onPhotoChange?.(null)
  }

  async function toggleNudge() {
    if (nudgeOn) { setNudgeEnabled(false); setNudgeOn(false); return }
    let perm = notifPermission()
    if (perm === 'default') perm = await requestNotifPermission()
    setNudgePerm(perm)
    if (perm === 'granted') {
      setNudgeEnabled(true)
      setNudgeOn(true)
      showNudge(pickNudge(ageInMonths, babyName, lastShownId()))
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    if (newPwd.length < 6) return setPwdError('Password must be at least 6 characters.')
    if (newPwd !== confirmPwd) return setPwdError('Passwords do not match.')
    setPwdBusy(true); setPwdError('')
    const { error } = await supabase.auth.updateUser({ password: newPwd })
    setPwdBusy(false)
    if (error) setPwdError(error.message || 'Could not update password. Please try again.')
    else { setPwdOk(true); setTimeout(() => setShowPwd(false), 1500) }
  }

  const input = {
    width: '100%', padding: '12px 14px', fontSize: '15px', border: '1px solid #e5e7eb',
    borderRadius: '12px', outline: 'none', marginBottom: '10px', fontFamily: 'inherit',
  }

  return (
    <Screen onBack={onBack} detail>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
        <Avatar name={momName} size={56} />
        <div>
          <h1 style={{ ...type.h1, fontSize: '22px' }}>{momName}</h1>
          <p style={{ ...type.body, marginTop: '2px' }}>{babyName}'s mom · {formatBabyAge(profile.dateOfBirth)}</p>
        </div>
      </div>

      {/* Baby photo */}
      <Card style={{ marginBottom: '14px' }} padding="16px 18px">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '18px', flexShrink: 0,
            background: photo ? `center / cover no-repeat url(${photo})` : gradient.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '26px', fontWeight: 700,
          }}>
            {!photo && babyName[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={type.bodyStrong}>{babyName}'s photo</p>
            <p style={{ ...type.small, marginTop: '2px' }}>{photo ? 'Shown on your Today screen.' : 'Add one for the Today screen.'}</p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button onClick={() => fileRef.current?.click()} disabled={photoBusy} style={{ border: 'none', background: 'none', color: color.primary, fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                {photoBusy ? 'Saving…' : photo ? 'Change photo' : 'Add a photo'}
              </button>
              {photo && (
                <button onClick={removePhoto} style={{ border: 'none', background: 'none', color: color.faint, fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} style={{ display: 'none' }} />
      </Card>

      <Card style={{ marginBottom: '14px' }} padding="4px 14px">
        <ListRow emoji="👶" hue="lavender" title="Edit profile" subtitle="Name, birthday, feeding and sleep details" onClick={onEditProfile} />
        <ListRow emoji="🔖" hue="amber" title="Saved tips" subtitle={savedCount === 0 ? 'Nothing saved yet' : `${savedCount} saved`} onClick={onSavedTips} />
        <ListRow emoji="✅" hue="mint" title="Checklists" subtitle="Well visits, starting solids, babyproofing" onClick={onChecklists} last={!notifsSupported()} />
        {notifsSupported() && (
          <ListRow
            emoji="🔔" hue="sky" title="Daily nudge"
            subtitle={nudgePerm === 'denied' ? 'Blocked in browser settings' : `A gentle reminder to check in on ${babyName}`}
            onClick={toggleNudge}
            right={<Toggle on={nudgeOn} />}
            last
          />
        )}
      </Card>

      <Card style={{ marginBottom: '14px' }} padding="16px 18px">
        <p style={type.bodyStrong}>Your check-ins</p>
        <StreakRow summary={streakSummary()} babyName={babyName} />
      </Card>

      {onSignOut && (
        <Card padding="4px 14px">
          <ListRow emoji="🔑" hue="mint" title="Change password" onClick={() => { setNewPwd(''); setConfirmPwd(''); setPwdError(''); setPwdOk(false); setShowPwd(true) }} />
          <ListRow emoji="👋" hue="rose" title="Sign out" onClick={onSignOut} right={null} last />
        </Card>
      )}

      {showPwd && (
        <div onClick={() => !pwdBusy && setShowPwd(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '24px' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '360px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <h2 style={{ ...type.h2, fontSize: '18px', marginBottom: '6px' }}>Change your password</h2>
            <p style={{ ...type.body, fontSize: '13px', marginBottom: '18px' }}>
              Pick a new password to sign in with. If you signed in via magic link before, this is the first one.
            </p>
            {pwdOk ? (
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '12px', padding: '14px', color: '#065f46', fontSize: '14px', textAlign: 'center' }}>
                Password updated. You can sign in with it next time.
              </div>
            ) : (
              <form onSubmit={handleSetPassword}>
                <input type="password" required autoFocus autoComplete="new-password" placeholder="New password" value={newPwd} onChange={e => setNewPwd(e.target.value)} disabled={pwdBusy} style={input} />
                <input type="password" required autoComplete="new-password" placeholder="Confirm new password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} disabled={pwdBusy} style={input} />
                {pwdError && <p style={{ margin: '0 0 12px', fontSize: '13px', color: color.danger, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 12px' }}>{pwdError}</p>}
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" onClick={() => setShowPwd(false)} disabled={pwdBusy} style={{ flex: 1, padding: '12px', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                  <button type="submit" disabled={pwdBusy || !newPwd || !confirmPwd} style={{ flex: 1, padding: '12px', background: pwdBusy || !newPwd || !confirmPwd ? color.lavender : gradient.primary, color: '#fff', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{pwdBusy ? 'Saving…' : 'Save'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </Screen>
  )
}

function Toggle({ on }) {
  return (
    <span aria-hidden="true" style={{ width: '46px', height: '28px', borderRadius: '14px', background: on ? gradient.primary : '#e5e3ee', position: 'relative', display: 'inline-block', flexShrink: 0, transition: 'all 0.15s' }}>
      <span style={{ position: 'absolute', top: '3px', left: on ? '21px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </span>
  )
}
