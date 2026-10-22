# BabyCue

A calm companion for the first two years. One evidence-based tip a day, one small activity, a bedtime story, and a private journal, all matched to the baby's exact age. No feed, no tracking, no chat.

**Live app:** https://mehakkhara.github.io/BabyCue/ (installable to the phone's home screen as a PWA)

The name is a working title and will change before launch.

---

## What it does

**Today** is the home screen. Top to bottom: the baby's photo, a one-line mood check-in, today's tip in full, the day's activity with how long it takes, Journal and Read tiles, and what to expect this month with any checklist due now.

- **Today's tip** — one advice tip per day from the month's pool of 31, so a month never repeats. "Got it" counts as a daily check-in.
- **Do today** — one sourced activity drawn from the baby's month and the month either side (36 at any time), so the row does not repeat for over a month.
- **Browse by month** — the whole library: every tip and activity for any month, grouped by topic. Intended as the paid tier; no paywall yet.
- **Mood check-in** — "How is Kabir today?" with a few states. Leans the day's tip toward the matching topic. Not a tracker.
- **Stories** — original illustrated goodnight stories plus a museum shelf built on public-domain Van Gogh paintings, with a tonight's pick by age.
- **Growth** — an overview for the baby's month, the CDC-style milestone checklist with a "Not yet" tip for each, and WHO growth charts with logged measurements.
- **Journal** — photos, short videos, voice memos and notes on a timeline. Photo hunt prompts each month, keepsake cards from any photo, Then and Now pairs, and a month reel: one month of photos as a short video narrated by the parent's own voice memos, rendered on the device.
- **Checklists** — logistics and what-to-expect lists (well visits, starting solids, babyproofing) that surface on Today when they are due.
- **Streak and nudges** — daily check-ins form a gentle streak; an optional local notification reminds the parent to check in.

### Content

- **1,032 tips** in `src/data/tips.js`: 31 advice tips and 12 activities for each of months 1 to 24.
- Every tip cites one of: AAP (HealthyChildren.org), CDC, WHO, Zero to Three, ASHA, the Pediatric Sleep Council, Nemours KidsHealth. Tips are written in our own words from guidance a writer actually read; no diagnosis, symptoms or "when to call the doctor" content, by rule.
- Each tip is enriched offline with a try-it-today example, a why-it-matters line and a duration (`src/data/tipEnrichment.json`), shown on the tip page under the body.
- Placeholders `{baby}`, `{they}`, `{them}`, `{their}` are filled from the profile, so every tip reads with the baby's name and pronouns.
- Disclaimer wording lives in one place, `src/lib/disclaimer.js`: under every tip, on the Profile About card, and under Get started in onboarding.

---

## Architecture

```
┌──────────────────────────────────────┐        ┌──────────────────────────────────────┐
│  React + Vite PWA                    │ HTTPS  │  Supabase                            │
│  GitHub Pages                        │ ─────► │  auth · profiles · journal metadata  │
│  mehakkhara.github.io/BabyCue        │        │  photo/video/audio storage bucket    │
│                                      │        │  small stores (moods, streak, …)     │
│  Static bundle, no secrets           │        │                                      │
└──────────────────────────────────────┘        └──────────────────────────────────────┘
```

**Local-first, Supabase as the durable copy.** The phone keeps a replica it reads instantly and offline: the journal in IndexedDB, everything small in localStorage. Every write goes local first, then into an outbox that drains to Supabase when there is a session and a network. On open and on sign-in the app pulls what other devices added. Move phones, sign in on a laptop, or change domains, and nothing is lost. Details in `sync-scope.md`.

There is no AI in the running app. Claude is used once, offline, by the enrichment script. The `server/` folder is a leftover Express proxy from the earlier chat feature; nothing in the app calls it.

---

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | [React 18](https://react.dev), [Vite 6](https://vitejs.dev), `vite-plugin-pwa` (service worker, auto-update) |
| Auth, database, file storage | [Supabase](https://supabase.com) (email/password + magic link, Postgres with RLS, storage bucket) |
| On-device storage | IndexedDB (journal media) and localStorage (profile cache, small stores) |
| Content tooling | Node scripts; [Anthropic SDK](https://docs.anthropic.com) for offline enrichment only |
| Hosting | [GitHub Pages](https://pages.github.com) via GitHub Actions |
| Lint | ESLint, run on every PR by the Build check workflow |

---

## Project structure

```
baby_app/
├── src/
│   ├── App.jsx                  # Tab bar (Today, Stories, Growth, Journal), view stack, session gate
│   ├── theme.js                 # Colours, radii, type scale
│   ├── screens/                 # One file per screen: HomeScreen, TipDetail, BrowseScreen, MonthScreen,
│   │                            #   MoodScreen, StoriesScreen, StoryReader, GrowthScreen, JournalScreen,
│   │                            #   ChecklistsScreen, ChecklistDetail, SavedTipsScreen, ProfileScreen,
│   │                            #   OnboardingScreen, AuthScreen, ResetPasswordScreen
│   ├── components/              # Journal pieces (PhotoHunt, ReelModal, ThenNow, KeepsakeModal, VoiceMemo…),
│   │                            #   DevelopmentChecklist, StoryArt, PaintingCanvas, shared ui.jsx
│   ├── data/
│   │   ├── tips.js              # The tip and activity library (1,032 rows)
│   │   ├── tipEnrichment.json   # Try-today / why / minutes per tip id
│   │   ├── stories.js, paintings.js, milestones.js, checklists.js, monthOverview.js
│   │   ├── journalStore.js      # IndexedDB CRUD for journal entries and media
│   │   └── whoStandards.js      # WHO growth percentile tables
│   └── lib/
│       ├── dailyTip.js          # Picks today's tip and activity; pure functions over the library
│       ├── sync.js, syncedStore.js   # Outbox to Supabase, pull on open, small-store mirroring
│       ├── disclaimer.js        # Legal wording, one place
│       ├── pronouns.js          # {baby}/{their} placeholders
│       ├── moodLog.js, streak.js, savedTips.js, checklistProgress.js, milestoneProgress.js
│       ├── reel.js, photoHunt.js, keepsakeCard.js, babyPhoto.js
│       ├── supabase.js, useSession.js, db.js
│       └── notifications.js, pwaUpdate.js, viewStack.js
├── scripts/
│   ├── merge-new-tips.mjs       # Validate and splice a folder of new tip JSON into tips.js
│   ├── enrich-tips.mjs          # Offline enrichment passes (needs ANTHROPIC_API_KEY in server/.env)
│   └── rank-demo.mjs
├── supabase/schema.sql          # Tables, storage bucket, RLS policies
├── public/                      # Manifest, icons, story art, design mockup pages
├── .github/workflows/
│   ├── build-check.yml          # Lint + build on every PR (required status)
│   └── deploy.yml               # Manual "Run workflow": builds main and publishes gh-pages
├── CLAUDE.md                    # Product context for Claude Code
├── sync-scope.md, pwa-scope.md, app-store-scope.md, redesign-scope.md   # Scoping docs
└── SETUP_SUPABASE.md            # One-time Supabase setup
```

---

## Local development

```bash
npm install
npm run dev        # http://localhost:5173/BabyCue/
```

Create a `.env` with your Supabase project values (see `.env.example`):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Without them the app runs local-only: no sign-in, no sync.

To test on a phone, open `http://<your Mac's LAN IP>:5173/BabyCue/` on the same Wi-Fi. Camera, microphone and notifications need HTTPS or localhost, so some journal features only work on the live site.

```bash
npm run lint
npm run build      # output in dist/
```

---

## Adding tips

1. Write a folder of JSON files, each an array of `{ month, topic, title, body, source }`. Topics: sleep, feeding, development, motor, activity, fussy, teething, leap, regression. Sources: the seven listed above, exactly.
2. Validate: `node scripts/merge-new-tips.mjs <folder>`. It checks months, topics, sources, placeholders, pronouns, body length, duplicate titles, and repeats of the same idea in another month.
3. Merge: `node scripts/merge-new-tips.mjs <folder> --write`.
4. Enrich: `node scripts/enrich-tips.mjs` then `node scripts/enrich-tips.mjs --why`. Both are resumable. Use `--limit 10` if the API times out on 20-tip batches. `--dry-run` estimates cost.

One idea appears in one month only across months 1 to 24, because a parent moves through the months in order.

---

## How changes reach the live site

1. Branch, open a PR into `main`. Never push to `main` directly.
2. The Build check workflow must pass (lint + build).
3. Merge. **Merging does not publish.**
4. Actions → "Deploy to GitHub Pages" → "Run workflow" on `main`. The built site goes to the `gh-pages` branch and GitHub Pages serves it. Installed copies of the app reload themselves on the next open.

The deploy needs two repository secrets: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The URL is the bare project URL, with no path on the end.

---

## Status and roadmap

Done: tip library for months 1 to 24, journal with sync, stories, growth and milestones, checklists, PWA install and self-update, disclaimer.

Next, roughly in order: run the pending deploy; choose the final name and move to a domain; privacy policy and terms of service; a first-run test on the live site from a fresh account; decide on free vs paid Browse; App Store wrap via Capacitor (`app-store-scope.md`); crash reporting.

---

## Useful links

- **Live app:** https://mehakkhara.github.io/BabyCue/
- **Repo:** https://github.com/mehakkhara/BabyCue
- **Actions (deploy):** https://github.com/mehakkhara/BabyCue/actions
- **Supabase dashboard:** https://supabase.com/dashboard
- **Vite docs:** https://vitejs.dev · **React docs:** https://react.dev
