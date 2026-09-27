# PWA Path — BabyCue on Home Screen Without the App Store

A scoping doc for turning BabyCue into a Progressive Web App, so it can be added to the iOS home screen and launch fullscreen like a native app — no Apple Developer Program, no review queue, no app store.

This work is **purely additive** and doesn't conflict with a future App Store wrap (via Capacitor). You can do both.

---

## Progress (updated 2026-05-18)

- [x] **Step 1 — Web manifest.** `public/manifest.webmanifest` created with name, theme color `#7C6FF7`, background `#dce8f8`, standalone display, and 4 icon entries. `index.html` updated with `<link rel="manifest">` and `<meta name="theme-color">`.
- [x] **Step 2 — Placeholder icons.** Generated via `/tmp/gen_icons.py` using PIL: `public/icons/icon-192.png`, `icon-512.png`, `icon-maskable-192.png`, `icon-maskable-512.png`. Purple "BC" wordmark on theme-color background. Replace with real BabyCue logo (1024×1024 source) before shipping to real users — recommend [realfavicongenerator.net](https://realfavicongenerator.net) for the full set.
- [ ] **Step 3 — iOS splash screens.** Not started. Needs per-device PNGs + `<link rel="apple-touch-startup-image">` tags.
- [x] **Step 4 — Service worker via `vite-plugin-pwa`.** Installed `vite-plugin-pwa` (dev dep) and configured `VitePWA` in `vite.config.js` with `registerType: 'autoUpdate'`, `manifest: false` (existing manifest at `public/manifest.webmanifest` is reused), and Workbox runtime caching: NetworkFirst for `/api/*` (8s timeout, 1-day cache), StaleWhileRevalidate for `fonts.googleapis.com`, CacheFirst for `fonts.gstatic.com`. Build verified — generates `dist/sw.js`, `dist/workbox-*.js`, and precaches 12 entries (~518 KiB).
- [ ] **Step 5 — Test on a real iPhone** (Share → Add to Home Screen, then airplane-mode test). On user.
- [x] **Step 6 — Deploy.** `npm run deploy` shipped on 2026-05-18 to https://mehakkhara.github.io/BabyCue/. `plan.md` updated.

---

## What "PWA" actually means for BabyCue

A PWA is your existing React+Vite app plus three additions:

1. **A web manifest file** — JSON describing your app's name, icon, theme color, and that it should launch fullscreen.
2. **A set of icon images** at standard sizes (192×192, 512×512, plus an iOS-specific 180×180).
3. **A service worker** — a background script that caches your build so the app loads instantly and works offline.

That's it. No new framework, no rewrite, no native build.

---

## What the user experience looks like on iPhone

1. User opens `https://mehakkhara.github.io/BabyCue/` in **Safari** (must be Safari — Chrome on iOS doesn't support Add to Home Screen).
2. User taps **Share → Add to Home Screen**. One-time action.
3. From that point on, BabyCue has its own icon on their home screen. Tapping it:
   - Launches fullscreen — no URL bar, no Safari tabs visible
   - Shows the splash screen you configured
   - Animates open like any other iOS app
   - Appears in the iOS app switcher with your icon
4. Works offline (after the service worker caches the build on first launch).

To the user, it's indistinguishable from an App Store app, except for the install step.

---

## What works on iOS PWAs (as of 2026)

| Feature | iOS PWA support |
|---|---|
| Standalone fullscreen launch | ✅ since iOS 11 |
| Custom app icon | ✅ |
| Splash screen | ✅ (needs per-device-size images) |
| Service worker / offline | ✅ |
| localStorage + IndexedDB | ✅ (your current storage works as-is) |
| Camera (file input with `capture` attr) | ✅ — already works in JournalScreen |
| Geolocation, mic, share | ✅ |
| Push notifications | ⚠️ iOS 16.4+ only, must be installed first, more friction than native |
| Background sync | ⚠️ partially supported, unreliable on iOS |
| FaceID / biometric login | ⚠️ Web Authentication API exists but UX is rough |

---

## What you give up vs. App Store

- **Discovery.** No one finds you by searching the App Store. You grow via direct link sharing.
- **Reviews / ratings.** App Store reviews are powerful social proof for parenting apps. PWA has none.
- **Trust signal.** Some users instinctively trust App Store apps more.
- **Updates feel invisible.** PWAs update silently on next launch. Users never see "What's new in BabyCue 1.2."
- **Push notifications are weaker.** iOS PWA push works but with caveats — must be installed first, no rich images.

---

## Concrete work to ship the PWA

Total: **~2–3 hours**.

### 1. Create the web manifest (15 min)
- New file: `public/manifest.webmanifest`
- Fields: `name`, `short_name`, `start_url: "."`, `display: "standalone"`, `background_color`, `theme_color: "#7C6FF7"`, `icons` array
- Link it from `index.html`: `<link rel="manifest" href="manifest.webmanifest">`

### 2. Generate the icon set (30 min)
- Source: one 1024×1024 PNG of the BabyCue logo (no transparency, no rounded corners — the OS rounds)
- Use [realfavicongenerator.net](https://realfavicongenerator.net) — generates all required sizes including iOS, Android, and maskable variants
- Output goes in `public/icons/`
- Add `<link rel="apple-touch-icon" href="...">` and `<meta name="apple-mobile-web-app-capable" content="yes">` to `index.html`

### 3. Add iOS splash screens (30 min)
- iOS needs specific splash image sizes per device class (iPhone SE, 14, 14 Pro Max, etc.)
- Generators handle this automatically (realfavicongenerator covers it, or [appsco.pe](https://appsco.pe/developer/splash-screens) as a backup)
- Add the resulting `<link rel="apple-touch-startup-image">` tags to `index.html`

### 4. Add a service worker via `vite-plugin-pwa` (45 min)
- `npm install -D vite-plugin-pwa`
- Configure in `vite.config.js` with `VitePWA({ registerType: 'autoUpdate', workbox: { ... } })`
- This auto-generates a service worker that pre-caches your build output (HTML, JS, CSS, icons)
- Strategy: cache-first for static assets, network-first for `/api/*` calls (so the AI tip + chat always try the network first but fall back to cache if offline)

### 5. Test on a real iPhone (15 min)
- Open `https://mehakkhara.github.io/BabyCue/` in Safari on your phone
- Share → Add to Home Screen → confirm icon and name look right
- Launch from home screen → confirm fullscreen, splash, and app behavior
- Toggle airplane mode → confirm offline experience (app still loads, AI/chat shows error states, growth/journal still readable)

### 6. Update plan.md and ship (15 min)
- `npm run deploy` pushes the PWA-enabled build to GitHub Pages
- Add a line to `plan.md` marking the PWA as shipped
- Tell test users (friends, your own family) how to install it via Share → Add to Home Screen

---

## Files that will change

```
public/manifest.webmanifest      (new)
public/icons/*.png               (new, ~10 files)
public/apple-splash-*.png        (new, ~5 files)
index.html                       (modified — manifest link, apple meta tags, splash links)
vite.config.js                   (modified — add VitePWA plugin)
package.json                     (modified — add vite-plugin-pwa)
plan.md                          (modified — mark PWA shipped)
```

No changes to React code. No changes to the backend. No changes to Supabase setup. Purely additive shell.

---

## Why this is worth doing even if App Store is the goal

- **Validation in days, not weeks.** You can put BabyCue on real moms' phones via direct link tomorrow. Get usage signal before committing to the 2-week App Store path.
- **Doesn't block the App Store path.** Capacitor wraps your same `dist/` build. If/when you do the Capacitor wrap, the PWA files don't get in the way (Capacitor just bundles the same web build into a native shell).
- **A working PWA is also a better App Store wrap.** Capacitor uses the WebView to render your app — having a service worker + offline cache means the eventual native app also has those benefits with no extra work.
- **Lets you keep shipping fast.** Every web change ships immediately via `npm run deploy`. The App Store path adds a 1–3 day review queue per release. The PWA is the *fast lane* alongside the *App Store lane*.

---

## PWA vs. App Store at a glance

| | PWA | App Store (via Capacitor) |
|---|---|---|
| Time to ship v1 | 2–3 hours | 1.5–2 weeks |
| Cost | $0 | $99/year (Apple) |
| Distribution | Direct link only | App Store search + direct link |
| Updates | Instant (`npm run deploy`) | 1–3 day review per update |
| Push notifications | Weak (iOS 16.4+, install-gated) | Strong (native APNs) |
| Discoverability | None | App Store search |
| Social proof | None | App Store reviews/ratings |
| Native camera | File input (works, less polished) | Native picker |
| Biometric login | Web Auth API (rough UX) | FaceID native |
| Trust signal | Weaker | Stronger |
| Dev loop | Same as web | Slower (review queue) |

---

## Recommended approach

Do PWA **first** (one weekend, no commitment), then layer the App Store on top once you've validated demand. The PWA validates the product; the App Store amplifies a product that's already working.
