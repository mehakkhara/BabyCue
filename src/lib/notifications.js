// Notifications helper — permission flow + firing a local notification.
//
// SCOPE: this handles the opt-in, the OS permission, and showing a nudge while
// the app is reachable (preview + foreground). Actual *scheduled background*
// delivery (daily, app closed) requires Web Push infra — VAPID keys, a custom
// service-worker `push` handler, and a Railway cron endpoint to send — or a
// native (Capacitor/APNs) build. Those are a separate infra step; this module
// is the client half that stays the same either way.

const PREF_KEY = 'nudgePrefs' // { enabled, lastShownId, lastShownAt }

export function isSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

// 'granted' | 'denied' | 'default' | 'unsupported'
export function permission() {
  return isSupported() ? Notification.permission : 'unsupported'
}

export async function requestPermission() {
  if (!isSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) || '{}')
  } catch {
    return {}
  }
}

function savePrefs(p) {
  try {
    localStorage.setItem(PREF_KEY, JSON.stringify(p))
  } catch {
    /* quota — non-critical */
  }
}

export function isEnabled() {
  return !!loadPrefs().enabled
}

export function setEnabled(enabled) {
  const p = loadPrefs()
  p.enabled = enabled
  savePrefs(p)
  return p
}

export function lastShownId() {
  return loadPrefs().lastShownId ?? null
}

// Fire a notification now. Prefers the service-worker registration (required on
// Android/installed PWAs); falls back to the Notification constructor. Records
// which nudge was shown so the next pick avoids repeating it.
export async function showNudge({ id, title, body }) {
  if (permission() !== 'granted') return false
  const opts = {
    body,
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-192.png',
    tag: 'daily-nudge', // collapses duplicates
  }
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration()
      if (reg) {
        await reg.showNotification(title, opts)
        recordShown(id)
        return true
      }
    }
    new Notification(title, opts)
    recordShown(id)
    return true
  } catch {
    return false
  }
}

function recordShown(id) {
  const p = loadPrefs()
  p.lastShownId = id
  p.lastShownAt = Date.now()
  savePrefs(p)
}
