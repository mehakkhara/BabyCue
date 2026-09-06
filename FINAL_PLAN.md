# Numae — Final Plan

**Written:** 2026-09-06
**Repo:** `~/Desktop/baby_app` · branch `feat/journal-on-home-and-video`
**Scope:** (1) rename BabyCue → Numae, (2) remove the Ask tab, (3) add illustrated Goodnight Stories, (4) enhance Journal, (5) finish the path to the App Store.

> Naming note: `plan.md` (2026-05-25) spells the new name **"Nubae"**. This document uses **"Numae"**, per the current decision. That older entry is superseded.

---

## 0. Where the app actually is today

| Area | State |
|---|---|
| Frontend | React 18 + Vite 6, plain inline styles, no router. 5 tabs: Today / Ask / Growth / Milestones / Journal |
| Content | 540 curated tips in `src/data/tips.js` (~700 lines), sourced AAP/WHO/CDC + CDC milestones |
| Backend | Express on Railway — `server/index.js`, two endpoints: `POST /api/chat`, `POST /api/daily-tip`. Model: `claude-sonnet-4-6` |
| Auth + profile | Supabase (email/password + magic link), profile in `baby_profiles`; guest mode falls back to localStorage |
| Journal | **Device-local only** — IndexedDB (`baby-journal`), blobs stored as ArrayBuffer. Photos *and* videos |
| Chat history, saved tips, streak, AI tip cache | localStorage, with `chat_messages` mirrored to Supabase |
| PWA | `vite-plugin-pwa`, service worker precaching app shell (~518 KiB / 12 entries), manifest + icons shipped |
| Deploy | GitHub Action auto-deploys `main` → GitHub Pages at `mehakkhara.github.io/BabyCue/` (`base: '/BabyCue/'`) |
| Native shell | Not started — no Capacitor, no `ios/` folder, no Apple Developer enrollment |

**Three real defects found while scoping this plan** (fix them inside the workstreams below, not as separate PRs):

1. `compressImage()` in `src/data/journalStore.js:79` is **exported but never called**. Every journal photo is stored at full camera resolution — a 4 MB iPhone photo goes into IndexedDB as 4 MB. This is the single biggest reason journal sync will be expensive later.
2. Videos have **no size guard at all**. A 60-second 4K clip is ~200 MB into IndexedDB. Safari will start throwing quota errors.
3. `HomeScreen.jsx:181` calls `getEntries()`, which hydrates **every** entry's full blob into memory on home-screen mount. `loadRecentJournalNotes()` in `src/lib/aiContext.js:26` does the same thing to read five text notes.

---

## 1. Rename: BabyCue → Numae

**Goal:** every user-visible string, tab title, install name, and store listing says Numae.

### The decision that gates everything else

| Option | Pages URL | Vite `base` | Work | Recommendation |
|---|---|---|---|---|
| **A. Product name only** (repo stays `BabyCue`) | unchanged `/BabyCue/` | unchanged | ~1 hour | ✅ **Do this now** |
| **B. Rename repo too** | `/Numae/` | `'/Numae/'` | +Railway `ALLOWED_ORIGINS`, +re-deploy, old URL 404s | Later, only if you never buy a domain |
| **C. Custom domain** (`numae.app`) | `numae.app` | `'/'` | +DNS, +Pages custom domain, +CORS | ✅ **Do this before App Store submission** — it also gives you the privacy-policy and support URLs Apple requires, and makes the Capacitor base path trivial |

**Plan: A now, C before submission, skip B.** Renaming the repo and then buying a domain means doing the CORS/base-path dance twice.

### Checklist

- [ ] `package.json` → `"name": "numae"` (and `server/package.json`)
- [ ] `index.html` → `<title>Numae — Your Mom Assistant</title>`, `apple-mobile-web-app-title` → `Numae`
- [ ] `public/manifest.webmanifest` → `name`, `short_name`, `description`
- [ ] `src/screens/AuthScreen.jsx` — the only `.jsx` with a hardcoded "BabyCue" string
- [ ] `README.md`, `CLAUDE.md` (product context header), `SETUP_SUPABASE.md`
- [ ] `supabase/schema.sql` — comment references only; **do not rename tables** (would require a migration for zero benefit)
- [ ] Cache names in `vite.config.js` (`babycue-daily-tip` → `numae-daily-tip`) — cosmetic, but a stale-cache name is confusing during debugging
- [ ] **Leave alone:** `plan.md`, `notes.md`, `HOW_TIPS_WERE_SOURCED.md`, `pwa-scope.md`, `app-store-scope.md`, git history — these are historical records
- [ ] Delete the stray `vite.config 2.js` (a Finder duplicate, currently untracked)

### Open

- **Logo.** Current icons are a pastel-lavender placeholder. A real 1024×1024 mark is **required** for the App Store (no transparency, no rounded corners). Decide: keep the heart, or commission new. This is on the critical path for §5.
- **App Store name availability.** Check "Numae" is free in App Store Connect *before* committing to the rename in store metadata. Names are globally unique.

**Effort:** ~1 hour. **PR:** `rename/numae`. Do this first — it's the smallest diff and everything else inherits the new name.

---

## 2. Remove the Ask feature

**Why it's the right call:** the chat tab is the app's most expensive surface (unbounded token spend, no rate limit), its highest-liability surface (free-text medical questions from anxious parents), and the one most easily replaced by ChatGPT on the same phone. The curated tips, milestones, growth chart, journal, and now stories are things the app does that a general chatbot can't. Cutting Ask concentrates the product.

**It also simplifies the App Store submission** — no free-form AI chat means a much narrower privacy policy and a much smaller content-moderation question in review.

### Removal surface — cleanly contained

| File | Action |
|---|---|
| `src/screens/ChatScreen.jsx` | **Delete** (253 lines) |
| `src/lib/chatStore.js` | **Delete** (115 lines) |
| `src/App.jsx` | Remove import (line 4), `backfillLocalChatIfNeeded` import (line 12) + its call, the `chat` entry in `NAV_ITEMS` (line 53), and the render line (line 136) |
| `vite.config.js` | Remove the `/api/chat` NetworkOnly runtime-caching rule (line 34) |
| `server/index.js` | Remove `POST /api/chat` (lines 86–140) |

**Keep, do not delete:**

- `src/lib/aiContext.js` — used by **both** ChatScreen and HomeScreen, and Goodnight Stories will use it too.
- `buildContextLines()` in `server/index.js:42` — shared by `/api/daily-tip` and the new story endpoint.
- The `chat_messages` **table in Supabase.** Dropping it destroys real users' saved conversations. Stop writing to it, leave it in place. Revisit in a later cleanup once you're confident Ask isn't coming back — and offer an export first if it ever gets dropped.

**Don't get confused by these:** `src/data/tips.js`, `milestones.js`, and `babyStates.js` contain the word "chat" in ordinary prose ("have back-and-forth chats with your baby"). Those are content, not code.

### The upside: a free nav slot

Nav goes 5 → 4 tabs, which means **Goodnight Stories can be a real tab** rather than a card buried on Home:

```
Today  ·  Stories  ·  Growth  ·  Milestones  ·  Journal
```

Still five items, same layout, no iPhone SE crowding. The Stories tab shows a subtle moon indicator after 6pm local but stays reachable all day.

**Effort:** ~1 hour. **PR:** `remove/ask-tab`. Do it right after the rename — every later workstream is simpler with it gone.

---

## 3. Goodnight Stories, illustrated with Van Gogh

**Why it fits:** every other feature is daytime — tips, tracking, milestones. Bedtime is when a parent is most likely to have the phone in hand and least likely to want a screen full of advice. A short illustrated story is a *use*, not a *task*. It gives the app a second daily ritual alongside the morning tip, which is the retention loop the app doesn't have yet. And it replaces Ask as the app's AI centerpiece with something a general chatbot can't casually reproduce.

**What it is:** a three-part bedtime story written for *this* baby — their name, their age band, maybe something from today's journal — with a real Van Gogh painting on each page. Roughly 3–4 minutes to read aloud, ending in sleep.

---

### 3a. The pictures: real Van Gogh, public domain

Van Gogh died in 1890, so his paintings are in the public domain worldwide. Rather than imitating his style with an image generator, the app shows **the actual paintings** — free, permanent, offline, legally clean, and genuinely more beautiful than anything a generator would produce.

**Sources** (prefer explicitly open-access collections):

| Source | Notes |
|---|---|
| **Art Institute of Chicago API** | CC0, IIIF endpoints, **no API key needed**. Has *The Bedroom* |
| **The Met Collection API** | Open Access CC0, **no key**. Has *Wheat Field with Cypresses*, *Irises*, *Shoes* |
| **Rijksmuseum API** | Free key required |
| **Van Gogh Museum (Amsterdam)** | Publishes many works at high resolution |
| **Wikimedia Commons (PD-Art)** | Fills gaps — e.g. *The Starry Night*, whose holder (MoMA) isn't open-access, but the painting itself is public domain |

> **Worth a 10-minute check before submission:** in the US, a faithful photograph of a flat public-domain artwork carries no new copyright, but some European museums assert rights over their reproductions. Sourcing from CC0 collections where possible sidesteps the question entirely. App Store Connect asks a content-rights question at submission, so have the source list ready.

**Curation: ~40 paintings, hand-picked.** This is the part that can't be automated, and it's where the feature succeeds or fails.

- **Include** the gentle, luminous, natural ones: *The Starry Night*, *Starry Night Over the Rhône*, *Almond Blossom*, *Blossoming Almond Branch in a Glass*, *Irises*, *Sunflowers*, *Wheat Field with Cypresses*, *Café Terrace at Night*, *The Bedroom*, *Landscape with Snow*, *Fishing Boats on the Beach*, *Green Wheat Fields, Auvers*, *Butterflies and Poppies*, *The Mulberry Tree*, *Orchard in Blossom*, *Roses*.
- **Exclude** the anguished ones. *Wheatfield with Crows*, *At Eternity's Gate*, *Skull with Burning Cigarette*, *The Potato Eaters*, *Prisoners Exercising*, the bandaged-ear self-portraits. Not at bedtime.
- **Exclude by title, too.** Because each page shows an attribution line, the *title* is user-visible. A perfectly lovely painting called *Garden of the Asylum* is not what a parent wants to read at bedtime. Judge the caption, not just the canvas.

**Tag each painting** with motif keywords the story generator can use: `night`, `stars`, `moon`, `blossom`, `flowers`, `field`, `wheat`, `sea`, `boats`, `room`, `garden`, `snow`, `birds`, `butterflies`, `tree`, `orchard`. Store as a small manifest:

```js
// src/data/paintings.js
{ id: 'almond-blossom', title: 'Almond Blossom', year: 1890,
  collection: 'Van Gogh Museum, Amsterdam',
  file: 'art/almond-blossom.webp',
  tags: ['blossom', 'tree', 'sky'],
  describe: 'Pale pink almond blossoms on dark branches against a bright turquoise sky.' }
```

The `describe` field is the important one — it's what gets passed to the model.

**The key design decision: pick the paintings first, then write the story to them.**

```
1. Pick 3 paintings that share a mood (weighted to avoid recent repeats)
2. Pass their `describe` text into the system prompt
3. Model writes a 3-beat story that moves through those three scenes
4. Reader shows: painting → text → painting → text → painting → text
```

Generating the story first and matching art afterward produces pictures that feel decorative and slightly off. Painting-first makes the art feel *intentional* — the blossoms in the picture are the blossoms in the sentence. Same single API call, much better result.

**Asset pipeline:**

- [ ] Download originals, crop to a consistent portrait-ish aspect (paintings vary wildly), export **WebP ~1400px wide, ~120–180 KB each**
- [ ] ~40 images ≈ **6 MB total** — this does *not* go in the service worker precache (current precache is 518 KiB; a 6 MB precache would make first load unusable)
  - **Web:** lazy-load per story, add a `CacheFirst` runtime rule in `vite.config.js` for `/art/*` with a long `maxAgeSeconds`. Precache only ~6 starter paintings so the first story works offline
  - **Native (Capacitor):** bundle all 40. A 6 MB addition is nothing for an App Store binary, and it makes stories fully offline from install
- [ ] Attribution line under each image: *"Almond Blossom, 1890 · Van Gogh Museum, Amsterdam"* — required practice, and a quietly lovely touch for the parent
- [ ] Track shown painting IDs in localStorage; don't repeat a painting within ~10 nights

---

### 3b. The story

New endpoint `POST /api/goodnight-story` in `server/index.js`, alongside `/api/daily-tip`. Same Anthropic client, same `buildContextLines()` helper — it already assembles age, feeding, sleep arrangement, growth, and recent journal notes, which is exactly the context a personalized story needs. No new infrastructure.

```
POST /api/goodnight-story
  body: { profile, context, paintings: [{title, describe}, ×3], options: { length? } }
  → streams text/event-stream
```

**Model choice.** The server runs `claude-sonnet-4-6` today. For stories:

| Model | ID | Input / Output per MTok | Est. cost per story* |
|---|---|---|---|
| **Claude Opus 5** ✅ recommended | `claude-opus-5` | $5 / $25 | ~$0.03 |
| Claude Sonnet 5 | `claude-sonnet-5` | $3 / $15 | ~$0.02 |
| Claude Sonnet 4.6 (current) | `claude-sonnet-4-6` | $3 / $15 | ~$0.02 |

<sub>\* ~1,200 input tokens (context + three painting descriptions) + ~900 output tokens. At one story per night: **~$0.90/month per daily user on Opus 5**, ~$0.60 on Sonnet 5.</sub>

Use **`claude-opus-5`** for stories. This is the one feature where output *quality* is the entire product — a flat story is worse than no story, and the delta is a penny a night. Leave `/api/daily-tip` on Sonnet 4.6.

**Two things that differ from Sonnet 4.6 and will bite silently:**

1. **Thinking is ON by default on Opus 5.** Omitting the `thinking` parameter runs adaptive thinking, and `max_tokens` caps thinking *plus* response text **together**. The existing endpoints use `max_tokens: 400` and `1024` — a story sized like that truncates mid-sentence. Set `max_tokens: 4096`.
2. **Stream it.** A three-part story is 8–15 seconds. Streaming turns that into words appearing on the page — which for a bedtime story is genuinely *better* than an instant dump, because the parent reads at the pace it arrives. Use `client.messages.stream(...)` and pipe SSE. It also removes HTTP-timeout risk at the higher `max_tokens`.

**System prompt requirements.** The prompt is the feature:

- **Three beats, one per painting**, in the given order. Each beat opens in that painting's scene.
- **Age-appropriate.** A 2-month-old's story is really for the parent's voice — rhythm and softness over plot. An 18-month-old can follow a simple sequence. Gate on `ageInMonths`.
- **Ends in sleep.** Every story lands the same way: the character settles, the world goes quiet. That's the whole point.
- **No scary beats.** No loss, no danger, no separation-from-parent anxiety, no darkness-as-threat. State this explicitly — models drift toward conflict because that's what stories usually have.
- **Uses the baby's name** naturally, not in every sentence.
- **Optional journal thread.** If recent journal notes exist, weave in *one* real detail. If not, don't fabricate one.
- **Never names Van Gogh or describes the painting as a painting.** The story is set *in* the scene, not *about* it.
- **Gender-neutral toward the parent**, plain text, no markdown — same rules the existing prompts already enforce.

---

### 3c. The reader

- [ ] **`src/screens/StoriesScreen.jsx`** — new tab (uses the slot Ask vacated). Landing view: a "Tonight's story" button plus the saved-stories shelf.
- [ ] **`src/screens/StoryReader.jsx`** — full-screen, paged. Painting fills the top ~55%, text below. Swipe or tap for the next page. No chrome except a back arrow.
- [ ] **Dim mode is not optional.** This is read in a dark room at 8pm. Warm off-white text on a deep background; never bright white. Consider dimming the painting slightly too.
- [ ] Large type, generous line height — it's being read aloud, often one-handed.
- [ ] Streaming render: page 1's painting appears immediately (it's a local asset), text fills in as it arrives.
- [ ] **Save this story** → stores the text plus the three painting IDs (localStorage first, Supabase later per §4). Paintings are already on device, so a saved story is a few KB. Parents will re-read favorites, and a re-read costs **$0**.
- [ ] Offline: saved stories fully readable. New generation needs network — show "you're offline, here are your saved stories", never a spinner that goes nowhere.
- [ ] Optional length control only (short ~2 min / longer ~4 min). Skip theme pickers; more choice at bedtime is friction, and the paintings already set the mood.
- [ ] `vite.config.js`: add `/api/goodnight-story` as **NetworkOnly**. A cached story would serve stale, and the entire point is that it's new. (Saved stories are a separate local read, unaffected.)

### Safety and guardrails

- [ ] **Rate limit.** One generation per 60s client-side, plus a server-side cap (~20/day/user) so a stuck retry loop can't run up the bill. The server currently has **no rate limiting on any endpoint** — add shared middleware while you're in there.
- [ ] Failure → fall back to the saved-stories shelf with a plain message. Never a blank screen at bedtime.
- [ ] No medical or developmental claims inside stories. It's fiction; keep the evidence-based framing entirely out.

**Effort:** ~2.5 days — art curation and pipeline ~5h (mostly manual, and worth the care), backend + prompt iteration ~7h, reader UI ~8h. **PR:** `feat/goodnight-stories`. Curating the paintings is fully parallelizable and needs no code — start it early.

---

## 4. Journal enhancement

Split into three tiers. **Tier 1 is a prerequisite for Tier 2** — syncing uncompressed 4 MB photos to Supabase would blow through the 1 GB free tier in ~250 photos.

### Tier 1 — Fix what's broken (do first, ~half a day)

- [ ] **Wire up `compressImage()`.** In `JournalScreen.jsx` `handleSave()`, run photos through `compressImage(file, 1200, 0.8)` before `addEntry()`. Takes a 4 MB photo to ~200 KB. The function already exists and works — it's just never called.
- [ ] **Guard video size.** Reject clips over ~50 MB with a clear message ("Videos need to be under about 30 seconds"), or better, cap duration client-side. Consider whether video belongs in IndexedDB at all long-term, or should go straight to Supabase Storage.
- [ ] **Stop loading all blobs on Home.** Add `getEntriesMeta()` to `journalStore.js` — same cursor, skips `photoBuffer`. Home only needs the count and the latest note. Load blobs lazily per-card in `EntryCard`. Same fix applies to `loadRecentJournalNotes()` in `aiContext.js`, which reads five text notes but currently hydrates every video in the database to do it — and Stories will call that function nightly.
- [ ] Store `ageMonths` (and `ageDays`) **at time of capture** on each entry. Today an entry only has `createdAt`, so you can't render "Kabir, 4 months 2 weeks" without recomputing from DOB — and if the DOB is ever corrected, every past entry silently shifts.

### Tier 2 — Cloud sync (~1–1.5 days)

This is what makes the journal trustworthy. Today, a mom who signs in on a new phone sees an empty journal and assumes the app lost her baby photos. That's the worst first impression the app can make, and it's an App Store review risk if a reviewer signs in on a fresh device.

- [ ] **Schema:**
  ```sql
  journal_entries (
    id uuid pk, user_id uuid, note text, media_path text,
    media_type text, age_months numeric, created_at timestamptz
  )
  ```
  RLS: `auth.uid() = user_id` on select/insert/update/delete. **Test that user A cannot read user B's entries** before shipping — this is baby photos.
- [ ] **Storage:** bucket `journal-media`, path `{user_id}/{uuid}.jpg`. Private bucket + signed URLs, never public.
- [ ] **Dual-write during transition.** Write to both IndexedDB and Supabase; read from Supabase when signed in, IndexedDB in guest mode. Once verified, read-from-Supabase only, keep IndexedDB as the offline cache.
- [ ] **Backfill on first sign-in.** Mirror the existing `backfillLocalProfileIfNeeded()` pattern in `src/lib/db.js` — push local entries up once, mark done. (The chat backfill you're deleting in §2 is the other working example of this pattern; read it before deleting it.)
- [ ] **Offline write queue.** Entries created offline save locally and sync on reconnect. This is the case that actually happens — a photo taken in a car, in a waiting room.
- [ ] Quota: ~200 KB/photo compressed → ~5,000 photos on the free tier. Fine for now.

### Tier 3 — The parts that make it a keepsake (~1 day)

- [ ] **Timeline grouping.** Section headers by month: "4 months old · June 2026". Today it's undifferentiated reverse-chron, which stops feeling like a memory book past ~20 entries.
- [ ] **Edit a note.** Currently you can only add or delete. Typos in a memory you'll keep for 18 years are worth fixing.
- [ ] **Age stamp on every card** — "Kabir, 4 months 2 weeks" beside the date, using Tier 1's `ageMonths`. This is what turns a photo roll into a baby book.
- [ ] **Search / filter** by note text and by month.
- [ ] **Export.** "Download my memories" → zip of media + `memories.md`. Matters twice over: parents want it, and it's most of the work of the account-deletion obligation in §5.10.
- [ ] **Milestone link.** When a milestone is marked "Yes", offer "Add a photo of this?" → prefilled journal entry. Connects two features that currently don't know about each other.

**PRs:** `fix/journal-media-size` (Tier 1) → `feat/journal-supabase-sync` (Tier 2) → `feat/journal-timeline` (Tier 3). Keep them separate; Tier 1 is small and shippable today.

---

## 5. App Store release

Source: `app-store-scope.md` (2026-05-14), reconciled against today's repo and the decisions above.

### Already done

✅ App shell + service worker · ✅ PWA manifest · ✅ 192/512 icons (placeholder art) · ✅ Supabase auth incl. password path · ✅ Backend deployed on Railway

### Still to do

| # | Item | Effort | Blocking? |
|---|---|---|---|
| 5.1 | **Apple Developer Program enrollment** — $99/yr, individual, 1–2 days for ID verification | 30 min + wait | 🔴 **Start today.** Everything native queues behind it |
| 5.2 | **Real 1024×1024 app icon** (no alpha, no rounded corners) + matching PWA icons | ~2h | 🔴 Blocks submission *and* §1 |
| 5.3 | **Custom domain** `numae.app` → Pages. Sets `base: '/'`, gives you privacy + support URLs | ~2h + DNS | 🟡 Strongly recommended before 5.4 |
| 5.4 | **Capacitor wrap.** `npm i @capacitor/core @capacitor/cli @capacitor/ios` → `npx cap init "Numae" com.mehakkhara.numae` → `webDir: 'dist'` → `cap add ios` → runs in Simulator | ~4h | 🔴 |
| 5.5 | **Vite base path for native.** Native needs `base: '/'`, web needs `'/BabyCue/'`. Use `base: process.env.NATIVE ? '/' : '/BabyCue/'`. Moot if 5.3 lands first | 30 min | 🔴 |
| 5.6 | **Auth rewire.** Magic link opens Safari, not the app. v1: hide the magic-link button when `Capacitor.getPlatform() === 'ios'`, password-only on native | ~30 min | 🔴 |
| 5.7 | **CORS.** Railway `ALLOWED_ORIGINS` += `capacitor://localhost,http://localhost` | 15 min | 🔴 |
| 5.8 | **Native capability** — Apple rejects thin web wrappers. **Native camera for Journal** (`@capacitor/camera` + `NSCameraUsageDescription`) is the cheapest credible answer and slots straight into §4 | ~4h | 🔴 |
| 5.9 | **Privacy policy** at `numae.app/privacy` | ~1.5h | 🔴 |
| 5.10 | **Account deletion.** Apple requires in-app account deletion for any app with accounts. Not built. Needs: delete Supabase rows across all tables + storage objects + auth user | ~3h | 🔴 |
| 5.11 | **Screenshots** — 6.5" (1284×2778) and 6.7" (1290×2796), 3–10 each, from Simulator with realistic mock data | ~3h | 🔴 |
| 5.12 | **App Store Connect listing** — name (check availability!), subtitle ≤30 chars, description ≤4000, keywords ≤100, category Lifestyle / Health & Fitness, age rating 4+, support URL | ~4h | 🔴 |
| 5.13 | **TestFlight beta** — internal testers, real-device feedback before Apple review | 1d setup + ~1wk testing | 🟡 Recommended |
| 5.14 | Submit → review (1–3 days typical). **Plan for one rejection round** | — | — |

### How §2 and §3 change the submission

- **Removing Ask shrinks the privacy policy.** No free-text chat means no user-authored conversations sent to Anthropic. The disclosure narrows to: profile + journal → Supabase; baby age/profile context → Anthropic via your proxy for the daily tip and story. No third-party analytics, no trackers, **no image-generation vendor** — the art ships with the app.
- **Stories now carries the "not a thin wrapper" argument alone.** With chat gone, the reviewer-facing case is: native camera (5.8) + an illustrated, offline-capable generative story feature. That's stronger than a tips list, but it means §3 must ship **before** submission, not after.
- **Content rights question.** App Store Connect asks about third-party content. Answer: all artwork is public domain (Vincent van Gogh, d. 1890), sourced from open-access museum collections. Keep the per-painting source list with the asset manifest — you may need to show it.
- **App size.** ~6 MB of bundled paintings is a non-issue for an App Store binary, and it makes stories work on a plane.
- **Journal cloud sync (§4 Tier 2) is a review risk if skipped** — a reviewer signing in on a test device sees an empty journal.
- **Ongoing cost of native:** every web release now needs `npm run build` → `npx cap copy` → bump build number → archive → upload → 1–3 day review. Batch releases weekly or biweekly, not per-feature.

---

## 6. Build order

```
Week 1   ├─ §1 Rename → Numae                       (1h)   ← smallest diff, everything inherits it
         ├─ §2 Remove Ask tab                       (1h)   ← every later workstream is simpler after this
         ├─ 5.1 Apple Developer enrollment          (30m)  ← start the 1–2 day clock immediately
         ├─ §4 Tier 1  Fix journal media + perf     (4h)   ← unblocks Tier 2; Stories depends on the aiContext fix
         ├─ 5.2 Real app icon                       (2h)
         └─ §3a Curate the 40 paintings             (5h)   ← no code, fully parallel, start now

Week 2   ├─ §3b/3c Goodnight Stories                (2d)   ← the feature; carries the App Store case
         └─ 5.3 Custom domain numae.app             (2h)

Week 3   ├─ §4 Tier 2  Journal → Supabase           (1.5d) ← cross-device trust
         └─ 5.10 Account deletion                   (3h)   ← same code path as export

Week 4   ├─ 5.4–5.8 Capacitor + native camera       (2d)
         └─ §4 Tier 3  Timeline / edit / export     (1d)

Week 5   ├─ 5.9, 5.11, 5.12 Paperwork               (2d)
         └─ 5.13 TestFlight                          (1d + a week of testing)

Week 6-7 └─ 5.14 Submit → review → likely one rejection round
```

**Total: ~5–7 weeks part-time to first submission.** The long poles are Capacitor and paperwork, not code.

### PR convention

Per the existing project rule: **always open a PR before merging to main; never push directly to main.** Each numbered workstream is its own PR. Keep §4's three tiers as three PRs — very different risk profiles.

---

## 7. Deferred / explicitly not doing

**Now moot, because Ask is gone** — delete these from `plan.md`:

- ~~Chat retry + typed error states (`plan.md` Finding 7)~~ — the screen no longer exists
- ~~Chat history → Supabase~~ — already built, now unused; table preserved, writes stopped

**Still parked:**

- **Community Q&A tab** — big feature, big moderation burden, and it conflicts with the "no social feed in v1" principle in `CLAUDE.md`. Revisit after launch with a small invite group.
- **Tip expansion Phases 2–3** (AAP Bright Futures pull, AI top-up for thin months) — 540 tips is already more than a year of daily content. Not on the launch path.
- **Push notifications** — highest-value native capability, but ~1–2 days plus APNs setup. Ship as v1.1 once the review pipeline works. Natural pairing: a gentle 7:30pm "Tonight's story is ready."
- **iOS PWA splash screens** (`pwa-scope.md` Step 3) — obsolete once Capacitor generates a native launch storyboard. Skip.
- **Balanced parenting style** (`plan.md` Finding 4) — the parenting-style filter was removed entirely on 2026-05-24. This item is dead; delete it from `plan.md`.
- **AI-generated art per story** — considered and rejected for v1. It would mean a new non-Anthropic vendor, ~$0.04–0.08 and 10–20s per image, a moderation pass, and image storage for saved stories. Real Van Gogh is free, instant, offline, and better. Revisit only if the 40-painting library starts feeling repetitive.
