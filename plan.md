# BabyCue — Build Plan

## Current State
React/Vite frontend. Baby profile stored in localStorage. 76 hardcoded tips across months 1–12, filtered by age and parenting style. Deployed on GitHub Pages.

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
