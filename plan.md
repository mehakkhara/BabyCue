# BabyCue — Build Plan

## Current State
React/Vite frontend. Baby profile stored in localStorage. 76 hardcoded tips across months 1–12, filtered by age and parenting style. Deployed on GitHub Pages.

**Shipped 2026-05-18 — PWA (service worker phase).** `vite-plugin-pwa` configured in `vite.config.js`. Service worker precaches the app shell (~518 KiB, 12 entries) for instant + offline load. Runtime caching split: `/api/daily-tip` uses NetworkFirst (24h offline fallback), `/api/chat` uses NetworkOnly (no stale answers). Still TODO from `pwa-scope.md`: iOS splash screens (Step 3), real-iPhone install test (Step 5), and replacing the placeholder "BC" icons with a real BabyCue logo before sharing with real users.

---

## Tip Expansion — 2026-06-21

**Goal:** grow tip pool from ~12/month to **30/month** (720 total) so the home-screen rotation feels fresh for longer and the "+Other" bucket isn't dominated by repeats.

### Phase 1 — CDC Milestones pass ✅ Shipped 2026-06-21

Added **80 new tips** (ids 438–517) sourced from CDC's "Learn the Signs. Act Early." milestone pages. All framed action-first with soft age language ("around X months", "some babies do this earlier — both are normal") so parents of slower-tracking babies don't feel behind. `style` field dropped — filter was removed 2026-05-24.

**Per-month tip count after CDC pass:**

| Month | Count | Gap to 30 |     | Month | Count | Gap to 30 |
|------:|------:|----------:|-----|------:|------:|----------:|
| 1     | 11    | -19       |     | 13    | 12    | -18       |
| **2** | **20**| **-10**   |     | 14    | 11    | -19       |
| 3     | 12    | -18       |     | **15**| **21**| **-9**    |
| **4** | **25**| **-5**    |     | 16    | 12    | -18       |
| 5     | 10    | -20       |     | 17    | 12    | -18       |
| **6** | **24**| **-6**    |     | **18**| **23**| **-7**    |
| 7     | 10    | -20       |     | 19    | 11    | -19       |
| 8     | 16    | -14       |     | 20    | 11    | -19       |
| **9** | **24**| **-6**    |     | 21    | 11    | -19       |
| 10    | 14    | -16       |     | 22    | 10    | -20       |
| 11    | 10    | -20       |     | 23    | 10    | -20       |
| **12**| **26**| **-4**    |     | **24**| **24**| **-6**    |

(Bold rows = well-visit months that the CDC pass directly boosted.)

**Total tips now:** 364 of 720 target. Need **~350 more**, mostly on the off-visit months (1, 3, 5, 7, 8, 10, 11, 13, 14, 16, 17, 19-23).

### Phase 2 — AAP Bright Futures pull (next)

AAP's Bright Futures anticipatory guidance covers more month-checkpoints than CDC, including 1mo, 2mo, 4mo, 6mo, 9mo, 12mo, 15mo, 18mo, 24mo. Richer content (10-20 actionable items per visit) but harder to extract — PDF-formatted, behind a navigation tree on aap.org / healthychildren.org.

- [ ] Pull HealthyChildren.org age pages (1mo, 3mo, 5mo, 7mo, 11mo, 13mo, 17mo, 23mo are all browsable) — should yield ~5-10 tips per off-visit month, taking us closer to 25/month.
- [ ] Pull Bright Futures previsit handouts for each well-child visit — should bump visit-months from ~24 to ~30.
- [ ] Use same framing rules: action-first, soft age language, drop diagnostic-only items.
- [ ] Source attribution: `'AAP'` or `'AAP Bright Futures'` (be consistent).

### Phase 3 — AI generation for remaining gaps

After Phases 1 + 2, the still-thin months (likely 5, 7, 11, 19-23 — older toddler months poorly covered by both CDC and AAP) get topped up with AI generation.

- [ ] One-off Node script: loop `month × topic` combos still short of 30, call `/api/daily-tip`-style endpoint, parse JSON, append to `tips.js`.
- [ ] Human-review each output before commit — kill weak/duplicate tips, keep the rest.
- [ ] Batch by **topic, not month** — generates 24 months of "sleep" tips in one sitting so reviewer judgment stays consistent within a topic.
- [ ] Estimated cost: $2-5 in Claude API spend total; ~2 hours review time.

### Open Questions

- **Topic distribution per month**: should every month have ≥3 tips per primary topic (sleep/feeding/development/motor/regression), or should distribution vary by what's developmentally relevant (e.g., regression spikes at 4mo, 9mo, 18mo)? Current preference: let it vary naturally.
- **Source diversity**: most existing tips cite AAP/WHO/CDC. Adding more from Zero to Three, Harvard Center on the Developing Child, Pediatric Sleep Council — when does source diversity matter for parent trust?

---

## Up Next — 2026-05-25

Three forward-looking changes captured at end-of-day 2026-05-24. Each touches multiple files / external services, so each gets its own focused PR.

### Rename BabyCue → Nubae

**Why:** product rebrand. All user-facing copy + URLs need to follow.

- [ ] Decide if the GitHub repo gets renamed too (`mehakkhara/BabyCue` → `mehakkhara/Nubae`) or only the product name. Repo rename changes the Pages URL from `mehakkhara.github.io/BabyCue/` to `mehakkhara.github.io/Nubae/` — and the Vite `base` in `vite.config.js` plus the Railway `ALLOWED_ORIGINS` CORS list need to match.
- [ ] Update `package.json` `name`, `README.md` headings + URLs, `index.html` `<title>` + meta, and the PWA manifest's `name` + `short_name`.
- [ ] Update all user-facing copy: `AuthScreen` tagline ("Welcome to BabyCue"), `OnboardingScreen` welcome banner, `HomeScreen` header, `CLAUDE.md` product context.
- [ ] Search for "BabyCue" string globally — every reference in `src/`, `server/`, `.env.production`, `supabase/`, docs. Update with care; some may be intentional historical references in commit messages or notes (leave those).
- [ ] Re-run `npm run deploy` after the rename so the new bundle goes live at the new URL. Old URL will 404 until the repo is renamed (or stays alive if only the product name changes).

**Open questions:**
- Logo: keep the pastel-lavender heart, or commission a new mark for Nubae?
- Domain: any plan to point a custom domain at it (e.g. `nubae.app`)? That'd let us avoid the `/Nubae/` path entirely.

### Persist all user details (full Supabase memory)

**Why:** today the app is split storage: profile + auth in Supabase, but journal photos/notes are in IndexedDB (device-local) and chat history + AI tip cache are in `localStorage`. If a mom signs in from a different device, she sees a blank journal. Goal: every detail the user enters should survive across devices.

- [ ] **Journal → Supabase**. Schema: `journal_entries` table (id, user_id, note, photo_path, created_at, RLS by user_id). Photos go in Supabase Storage bucket `journal-photos/{user_id}/{uuid}.jpg`. Migrate the current `journalStore.js` IndexedDB layer to dual-write during transition, then read-from-Supabase only.
- [ ] **Chat history → Supabase**. Schema: `chat_messages` (id, user_id, role, content, status, error_type, created_at). Replace `ChatScreen`'s `localStorage` history with a Supabase query on mount. Index on `(user_id, created_at)` so the timeline reads fast.
- [ ] **AI tip cache → Supabase or skip**. The per-day AI tip cache could move too, but the cost saving is marginal ($0.01/day) and the device-local cache is fine — decide whether it's worth the trip.
- [ ] **Backfill on first sign-in**. When a previously-guest user signs in, do a one-time push of their local data up (similar to `backfillLocalProfileIfNeeded` in `lib/db.js`). Don't lose anything.
- [ ] **RLS policies**: each new table needs `auth.uid() = user_id` policies before going live. Test that user A can't read user B's journal.

**Open questions:**
- Storage cost: Supabase free tier is 1 GB storage. Photos at ~500 KB each → ~2,000 photos before paid tier kicks in. Set per-user upload quota or compress aggressively (the existing `compressImage` helper in `journalStore.js` already does max 1200px @ 0.8 jpeg quality — keep it).
- Privacy posture: with all data server-side, GDPR / "delete my account" obligations grow. Add a "Delete everything" button in the password modal area.

### Community feature — Q&A for moms

**Why:** moms ask the AI for personalized advice, but sometimes they want validation from other moms ("did your 6-month-old also do this?"). A community tab gives that, without losing the AI as the personalized layer.

- [ ] **Tab in bottom nav.** Add a 5th nav item between Growth and Journal (or replace Growth if cramped — decide). Icon: speech-bubble or people-circle.
- [ ] **Posts feed.** Schema: `posts` (id, user_id, body, baby_age_in_months_at_post, topic_tag, created_at, reply_count). Display name = mom's first name from profile; never show last name or email. Topic tags reuse the existing `PRIMARY_TOPICS` + `OTHER_TOPICS` taxonomy so filtering matches the home screen.
- [ ] **Replies.** Schema: `post_replies` (id, post_id, user_id, body, created_at). Linear thread (no nested replies) for v1 simplicity.
- [ ] **Composer.** Tap "+" → modal with topic dropdown + body textarea (500 char limit). Submit → insert + optimistic UI.
- [ ] **Moderation.** Three layers needed before this goes public:
  1. Client-side: rate-limit (one post per 60s, three replies per 60s) to slow spam.
  2. Server-side: a moderation pass on every submitted post via Claude (`/api/moderate-post` — flag medical advice, harmful content, personal info). Reject with a clear message before insert.
  3. Reporting: each post has a "Report" button → flagged posts go to a `reports` table; admin (you, for now) reviews.
- [ ] **Content policy banner** on first visit to the tab: "This is moms helping moms. Not medical advice. For anything urgent, call your pediatrician." Same energy as the rest of the app.
- [ ] **Read-only fallback** for guest mode (Supabase not configured / not signed in): show the feed but disable composing — drives sign-in.

**Open questions:**
- Do we let moms reply anonymously, or always show their first name? Probably show first name (accountability), but allow a "hide my baby's age" toggle per post.
- Push notifications when someone replies to your post? Defer to Level 3 (push notifications was already there).
- Migration risk: a community tab raises the support burden a lot. Validate with a small invite group before public launch.

**Build order for these three:** rename first (smallest, cosmetic), then full-Supabase persistence (foundation for community since community = more rows in more tables), then community (the big one).

---

## Deferred from Dogfood UX Review (2026-05-12)

The first dogfood pass surfaced 8 findings; 6 shipped in the `polish-onboarding-and-home` PR. Two are deferred here because each has nontrivial ripple beyond a single-screen change.

### Finding 4 — Add "Balanced / still figuring it out" parenting style

**Why this is bigger than a copy change:** the parenting style isn't just a label — it drives which tips surface on Home via `getTipsForProfile()` in `src/data/tips.js`. Every tip is tagged with `gentle` or `schedule`. Adding a third style needs a content-modelling decision:

- [ ] Option A: tag a subset of existing tips as `balanced` too (a curated mix). Means writing fresh tags across ~76 tips.
- [ ] Option B: at runtime, treat `balanced` as "show tips tagged with either style, interleaved" — no content changes, but means slightly less style-coherent advice.
- [ ] Option C: route `balanced` to a new tip pool. Most work; highest authorial control.
- [ ] Rewrite the existing Gentle description to drop the comparative phrasing ("minimal crying") regardless of which option above is chosen.
- [ ] Update `styleLabels` and `styleEmoji` in `HomeScreen.jsx` to include the new value.
- [ ] Default new users to `balanced` in onboarding (vs. forcing a choice).

**Recommended:** Option B first (zero content cost, validates user demand), then Option A if balanced becomes the dominant choice.

### Finding 7 — Chat retry + typed error states

**What's needed:** the current `ChatScreen` collapses every failure mode (network, server error, rate-limit, safety refusal) into one bubble in the conversation, with no way to retry without retyping.

- [ ] Change message shape from `{role, content}` to `{role, content, status, errorType?}` where status is `ok | failed`. Hydrate handling in `loadMessages()` so old saved messages without these fields still render.
- [ ] In `sendMessage`, distinguish `catch` (network) vs `!res.ok` (server, with HTTP status) vs `res.ok && data.error` (Claude refused or upstream error). Set `errorType` accordingly.
- [ ] Render failed assistant turns with red styling, an icon, and an inline **Retry** button. Retry should re-fire `sendMessage` with the prior user message (track the source user turn via index or id).
- [ ] Update copy per error type — e.g. network → "Check your connection", 429 → "Too many questions in a row, wait a moment", 5xx → "Server hiccup, try again."

**Why deferred:** state refactor + retry plumbing is ~30–45 min of careful work. Best done as its own focused PR so the diff is easy to review and revert if the new message shape breaks anything.

---

## UI Improvements

### Polish & Feel
- [ ] Add a proper app icon and name in the browser tab
- [ ] Smooth transitions when switching topic filters
- [ ] Empty state illustrations (when no tips match a filter)
- [ ] Loading skeleton screens instead of blank flashes
- [ ] Make the parenting style badge on the home screen tappable to edit

### Content & Layout
- [ ] Show baby's age in weeks for the first 3 months (more meaningful than "1 month")
- [ ] Add a progress indicator showing which month's content the user is on
- [ ] Tip cards: add a "source" link or badge so evidence feels more credible
- [ ] Add a milestone checklist section per month (e.g. "Is your baby doing these things?")

### Mobile Experience
- [ ] Test and fix layout on small screens (iPhone SE)
- [ ] Add bottom navigation bar (Today / Ask / Profile)
- [ ] Make topic filter chips horizontally scrollable instead of wrapping

---

## Level 1 — AI Assistant

**Goal:** Let the mom type a question and get back a response that knows her baby's exact age and parenting style. Replace generic Google searches with a personalized answer.

### What to Build
- [ ] Set up a lightweight backend (Node.js + Express or Python + FastAPI) to proxy Claude API calls securely — API keys must never be in the frontend
- [ ] Build a chat UI component: text input, send button, message thread
- [ ] Pass baby context with every message: age in months, parenting style, baby name
- [ ] Prompt engineering: instruct Claude to act as a calm, evidence-based mom assistant, cite sources, and never give medical diagnoses
- [ ] Add suggested questions on the chat screen (e.g. "Why won't my baby nap?", "Is this normal?")
- [ ] Deploy the backend (Railway or Render — both have free tiers)

### Example Interaction
> **Mom:** Kabir has been waking up every 2 hours at night and he's 4 months old.
>
> **App:** Four months is one of the most common times for night waking to increase — it's often called the 4-month sleep regression and it's tied to a real neurological change in how babies cycle through sleep stages. For gentle parenting, the most effective approach at this age is...

### Cost Estimate
- Claude API: ~$1–3/month for personal daily use
- Backend hosting: free tier on Railway or Render

---

## Content Enhancement — AI Tip of the Day

**Goal:** Make the home screen feel fresh every day with a personalized, AI-generated tip that knows the baby's exact age, parenting style, growth data, and recent journal entries. Curated AAP/WHO-cited tips stay below as the evidence-based base — the AI tip sits on top as the "today, just for you" hero card.

**Why this matters:** The curated pool is ~5–8 tips per month per style. Once you've seen them, you've seen them. An AI-generated daily tip never repeats and can react to actual context (e.g., "Kabir hasn't gained weight in 2 weeks per your growth log — here's what to watch for") in a way curated content can't.

### What to Build
- [ ] New `/api/daily-tip` endpoint on the existing Railway server. Same Claude call pattern as `/api/chat`, but a different system prompt focused on producing one focused tip.
- [ ] System prompt that returns a tip with: a 4–8 word title, 2–3 sentence body, and a cited source (must reference AAP, WHO, CDC, or a peer-reviewed study — no made-up citations). If Claude can't cite real evidence, it must say so and the app falls back to a curated tip.
- [ ] Frontend: fetch once on home screen mount, cache the result in `localStorage` with today's date as the key so it doesn't re-call Claude on every navigation. Show a small "✨ AI" badge on the card so the mom knows it's personalized vs. curated.
- [ ] Pass the same enriched context the chat endpoint already builds (`server/index.js` `buildContextLines`): age, sex, feeding method, sleep arrangement, latest growth + WHO percentiles, recent journal entries.
- [ ] Loading state: skeleton card while the request is in flight. Curated tips still render below so the screen is never blank.
- [ ] Failure handling: if the endpoint errors or Claude can't produce a sourced tip, hide the AI card entirely and show only curated tips. Never show a fake citation.

### Why the Caching Matters
Without caching, every time the mom switches tabs and comes back to Home, we'd hit Claude again. With one call per day per user, cost is ~$0.01/day even for daily active use. The cache key should be `dailyTip:YYYY-MM-DD:<profileFingerprint>` so changing the baby's age (next month) or profile fields invalidates it.

### Open Questions
- Should the AI tip also rotate within a day if context changes (e.g., new growth entry added)? Probably yes — invalidate the cache when the profile is edited.
- Should we let the mom see *yesterday's* AI tip too? Probably not — keep one card, keep it simple.

### Cost Estimate
- ~$0.30–1.00/month per daily user at current Claude pricing. Effectively free for personal use.

---

## Level 2 — Accounts & Persistence

**Goal:** Move the baby profile off localStorage so it persists across devices and browsers. Let the mom log in from her phone, tablet, and laptop.

### What to Build
- [ ] Set up Supabase (free tier) — handles auth and database
- [ ] User authentication: email/password sign up and login
- [ ] Store baby profile in Supabase database instead of localStorage
- [ ] Store chat history so conversations persist across sessions
- [ ] Allow multiple baby profiles (for moms with more than one child)
- [ ] Account settings: change email, password, delete account
- [ ] Update GitHub Pages deploy or migrate to Vercel (better fit for apps with a backend)

### Stack
- **Auth + Database:** Supabase
- **Hosting:** Vercel (supports both frontend and backend in one deploy)

### Cost Estimate
- Supabase: free up to 50,000 monthly active users
- Vercel: free for personal projects

---

## Level 3 — External Data & Deep Personalization (Future)

**Goal:** Pull in real data about the baby to make advice hyper-specific — not just age and parenting style, but actual sleep logs, feeding patterns, and growth data.

### Ideas to Explore
- [ ] **Sleep tracking integration** — connect to apps like Huckleberry or Baby Tracker via export/import
- [ ] **Growth charts** — log weight and height, surface WHO growth percentile context
- [ ] **Feeding logs** — track breast/bottle feeds and get tips based on actual feeding patterns
- [ ] **Pediatrician notes** — allow manual input of doctor's notes or milestones flagged at visits
- [ ] **Push notifications** — proactive reminders ("Kabir is turning 6 months in 3 days — time to think about starting solids")
- [ ] **Wearable data** — Owlet, Nanit integrations for sleep quality data

### Considerations
- Data privacy: baby health data is sensitive — need clear privacy policy and secure data handling
- HIPAA: only relevant if expanding to other users at scale with medical-adjacent data
- Complexity: each integration is its own project — pick one and validate before building more

---

## Build Order Recommendation

1. **UI improvements** — quick wins, makes the app feel more polished before adding features
2. **Level 1 (AI)** — highest value addition, relatively self-contained
3. **Level 2 (Accounts)** — needed before sharing with anyone else or using across devices
4. **Level 3** — only after validating that the core app is useful
