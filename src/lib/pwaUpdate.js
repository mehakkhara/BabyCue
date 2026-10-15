// Keep the installed app current without a reinstall.
//
// The service worker caches the whole app shell so it opens instantly and
// works offline. The catch: after a deploy, the new worker installs quietly
// (registerType 'autoUpdate' in vite.config.js) but the page on screen keeps
// running the old JavaScript until something reloads it. On an iPhone home
// screen the app is resumed from memory for days, so that reload never came
// and the fix was to delete and reinstall. Two small pieces close the gap:
//
// 1. Ask for an update every time the app comes to the foreground (and on a
//    timer while it stays open). Browsers otherwise only check on navigation.
// 2. When a new worker takes control, reload the page once so the new code
//    is what's running. Local data is untouched: it lives in IndexedDB and
//    localStorage, not in the service worker cache.
import { registerSW } from 'virtual:pwa-register'

const CHECK_EVERY_MS = 60 * 60 * 1000   // once an hour while the app stays open

export function startPwaUpdates() {
  if (!('serviceWorker' in navigator)) return

  // Only reload when we are replacing an old worker. On a first install the
  // worker claims the page too, and reloading then would be a needless flash.
  const hadController = Boolean(navigator.serviceWorker.controller)
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloaded) return
    reloaded = true
    window.location.reload()
  })

  registerSW({
    immediate: true,
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (document.visibilityState !== 'visible') return
        registration.update().catch(() => { /* offline or dev server, try next time */ })
      }
      document.addEventListener('visibilitychange', check)
      window.addEventListener('online', check)
      setInterval(check, CHECK_EVERY_MS)
    },
  })
}
