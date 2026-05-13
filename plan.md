# BabyCue — Build Plan

## Current State
React/Vite frontend. Baby profile stored in localStorage. 76 hardcoded tips across months 1–12, filtered by age and parenting style. Deployed on GitHub Pages.

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
