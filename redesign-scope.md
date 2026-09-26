# Redesign Scope — the 8-screen mockup (2026-09-14)

**Product in one line (Mehak, 2026-09-14):** *A daily parenting companion that tells you one useful thing to know, one thing to do, and helps you remember one moment.* Today = Learn / Do / Remember (+ Read at bedtime). Anything on a screen that doesn't serve one of those three is a candidate to move or cut.

Source: the 8-screen mockup (Today, Tip detail, Activity detail, Stories, Story player, Growth, Journal, Mood).
This doc maps each screen against what the app does today and breaks the gap into PR-sized chunks.

Sizes: **S** ≈ a couple of hours · **M** ≈ a day · **L** ≈ 2–3 days. Content work is listed separately from code because it runs in parallel and needs your review, not mine.

---

## What the mockup changes at the product level

1. **Today becomes a launcher, not a feed.** Greeting + baby hero photo + four rows (Learn / Do / Remember / Read). Everything that lives inline on Home today (month navigator, stats chips, tip card, topic chips, feelings chips, photo hunt, saved tips, notification toggle, profile/sign-out) either moves to a detail page, another tab, or a new Profile screen.
2. **Detail pages with a back arrow.** Tip, Activity, Story player and Mood are full screens that hide the tab bar. The app currently has only tabs + bottom sheets/modals, no stack. This is the one structural change everything else depends on.
3. **Activities are a new content type**, separate from tips: numbered steps, "builds X", minutes, materials, and a "Did you try this?" rating.
4. **Stories get audio.** The player screen (play, scrub, ±15 s) is the single biggest new capability.
5. **Growth absorbs the routine numbers and development categories**; Journal absorbs the photo hunt and gains a date strip and voice memos; Mood becomes a first-class daily check-in that should feed tip selection.
6. **Tokens, not a new font.** Decided 2026-09-14: the app stays Inter-only (no serif). The mockup's calm comes from the layout, one lavender primary, tinted icon tiles, 20–24 px cards and lots of whitespace, which tokens + a shared UI kit deliver.

**Decisions taken 2026-09-14:** no story audio (screen 5 becomes a restyled reader, not a player); keep Inter; remaining decisions get made screen by screen as we build; every piece of content stays science-backed (see "Content rules" at the end).

---

## Phase 0 — Foundation (one PR, **L**)

**Status 2026-09-14 (evening): all eight screens built and committed on `feat/redesign-foundation` — Growth (three segments), Journal (date strip, prompt card, voice memos, compact hunt, search) and Stories (Tonight card, chips, search, reader back/heart/prompt) followed in the same day. Remaining from this doc: real painting images (19 WebP), an `activities.js` with numbered steps, Supabase sync. Originally built first: Screen 1 (Today), Screen 2 (Tip detail, optional fields), Screen 3 (Activity detail using the activity-topic tips until `activities.js` exists), Screen 8 (Mood), Profile, the photo-hunt move to Journal, and the typical-numbers tiles on Growth.**

Nothing below is worth building on the current ad-hoc styling and sheet-only navigation.

- [ ] **Design tokens** `src/theme.js`: colors (primary `#7C6FF7`, tints, ink `#1e1b4b`, muted, success, per-icon tile tints), radii (card 20/24, chip 12, pill 20), shadow, spacing, type scale. Keep inline-style approach (repo is 100 % inline JS styles, zero CSS files) so nothing else has to change.
- [ ] ~~Serif display font~~ — dropped. Titles use Inter at a heavier weight and larger size.
- [ ] **Shared components** in `src/components/ui/`: `Screen` (page frame with optional back arrow + right-side icon actions), `Card`, `ListRow` (tinted icon tile + title + subtitle + chevron), `Pill`/`Chip`, `PrimaryButton` / `SecondaryButton`, `InfoRow` (icon + one line), `StatTile`, `SegmentedControl`, `SectionHeader` (title + "See all"). Roughly 10 small files.
- [ ] **Detail-page stack.** Add a `view` state in `App.jsx` (`{ name, params }` or `null`) with `pushView` / `popView`, wired to `history.pushState` so the phone's back gesture and the browser back button both pop. Detail views render above the tab bar; tabs stay on the four root screens. No router dependency needed.
- [ ] **Profile screen** (avatar tap from Today): Edit profile (existing OnboardingScreen in edit mode), baby photo, notifications toggle, saved tips list, change password, sign out. This is where the tail of today's HomeScreen goes.
- [ ] **Tab bar restyle**: same four tabs, filled-icon active state, slightly larger labels.

---

## Screen 1 — Today (simplified) — **M** after Phase 0

Current `HomeScreen.jsx` is 1,254 lines and renders ten sections. Target is five.

| Mockup element | Today | Work |
|---|---|---|
| "Good morning, Mehak ☀️" + subtitle | greeting exists | reuse `greetingForHour`; new one-line subtitle copy |
| Mom avatar (top right) | none | opens Profile screen (Phase 0); initials fallback |
| Baby hero photo card (name, age, date) | none — no baby photo anywhere in the app | see **Baby photo** below |
| Quote line under the photo | none | small rotating pool of ~20 lines, or reuse `nudges.js` copy |
| "Today for you": Learn / Do / Remember / Read | tip card inline; no activity; photo hunt inline; stories on their own tab | four `ListRow`s. Learn → Tip detail (screen 2). Do → Activity detail (screen 3). Remember → `MemoryForm` sheet (already shared with Journal). Read → tonight's story via `pickTonight()`, straight into the player |
| Tab bar | exists | restyle only |

**Moves out of Home:** month navigator → Growth (browse ages there, or drop); `AGE_STATS` chips → Growth Overview tiles; topic chips → Tip detail "Related tips"/Saved list; feelings chips → Mood screen (screen 8); PhotoHunt → Journal; saved tips + notification toggle + profile/password/sign-out → Profile screen.

**Baby photo (new):** add a photo step to onboarding/Edit profile, store as a blob in IndexedDB (same `compressImage` path as journal), sync to the `baby-photos` bucket later. Fallback order: profile photo → most recent journal photo → soft illustration placeholder. **S–M**.

**Decision needed — streak.** The mockup has no streak row. Options: drop it, or fold the number into the subtitle ("Day 12 with Kabir"). `streak.js` and check-ins keep working either way.

**Decision needed — Flashback.** Not in the mockup. Suggest it becomes the "Remember" row's subtitle when a flashback exists ("One year ago today…"), otherwise "Capture a moment".

---

## Screen 2 — Tip detail — **M** code + content track

Tips today are `{ id, month, topic, title, body, source }` — 693 of them. The mockup shows six structured parts the data doesn't have.

| Mockup element | Source |
|---|---|
| Kicker "TODAY'S TIP" + age chip | month → "12 months" |
| Big serif title + one-line summary | `title` + `body` (body becomes the summary) |
| "Try it today" example quote | **new field** `tryToday` |
| "Why it matters" | **new field** `whyItMatters` |
| "Takes about N minutes" | **new field** `minutes` |
| "Great for X–Y months" | derive: `month` to `month + 2`, or new `ageRange` |
| Got it / Save for later | exist (`markCheckIn('tip')`, `savedTips.js`) — restyle |
| Bookmark + share icons (top right) | bookmark = save; share = `navigator.share` with title + body (S) |
| Related tips (2 chips) | two other tips, same month, same topic, not today's — `getTipsForProfile(month, topic)` |

**Code (M):** `TipDetail` view; render every new field as optional so the screen works before content is enriched; AI daily tip renders through the same view (it already returns `title/body/source`; ask the server for the new fields too — server prompt tweak, S).

**Content (parallel track):** enrich 693 tips with `tryToday`, `whyItMatters`, `minutes`. Best route is the one already sketched in `plan.md` Phase 3: a one-off Node script that batches by topic through the Anthropic API with structured outputs, writes back to `tips.js`, and you review in passes. Roughly $3–6 in API spend and a few review hours. Until then the detail page simply shows title + body + source + related.

---

## Screen 3 — Activity detail — **M** code + content track

There is no activity entity. Forty-eight tips carry `topic: 'activity'` and `funActivities` has six prose entries that no screen ever renders.

**Data (new)** `src/data/activities.js`:
```
{ id, months: [min, max], title, summary, steps: [..3], builds: 'Cognitive skills',
  minutes: 5, materials: 'Everyday items', image?: string }
```

**Code (M):**
- `ActivityDetail` view: kicker, title, summary, hero image, "How to do it" numbered steps, three `InfoRow`s, "Let's do it!" (counts as a check-in), "Did you try this?" three-way rating.
- `src/lib/activityFeedback.js`: localStorage `{ activityId: { rating, date } }`; one activity per day chosen like the tip (`dayIndex % pool`), skipping ones rated "Loved it" less often than untried ones.
- "Do" row on Today links here.

**Content (parallel):** 1–2 activities per month × 24 months ≈ 30–50 activities with real steps. Sources: CDC "Learn the Signs" play tips, Zero to Three, AAP HealthyChildren play pages. Same framing rules as the tips (action-first, soft age language). Convert the 6 `funActivities` first.

**Decision needed — activity images.** A photo per activity is the heaviest content ask in the mockup. Options: (a) one illustration per `builds` category (4–6 images, S); (b) no image v1, icon tile instead; (c) real photos later. Recommend (a).

---

## Screen 4 — Stories shelf — **M**

Stories already have a Tonight hero + age-band list + `pickTonight()`. Gap is mostly data and polish.

| Mockup element | Today | Work |
|---|---|---|
| Header "Stories" + subtitle + search icon | header exists | search over 15 titles is thin; **suggest skipping search until the shelf is bigger** |
| Tonight card with real painting, duration + age chips, "Read now" | procedural canvas art, no duration, no age chip | real images (below); `durationMin` per story; band label |
| "More stories for Kabir" + See all | "For {baby}" + "rest of the shelf" | rename; rows get painting thumb, title, painting name, duration |
| Bedtime cue banner | exists (first 3 opens) | keep |

- **Real painting images (content, M):** 19 Van Gogh works, public domain. Plan already exists in `STORIES_DRAFT.md` §643–672: ~150 KB WebP each from AIC/Met/Wikimedia, dropped into `public/art/`; `PaintingCanvas.jsx` already switches to `<img>` when a painting has a `file` field. Precache grows by ~3 MB, acceptable.
- **Duration:** derive from word count at read-aloud pace (~120 wpm) or from audio length once audio exists. S.

---

## Screen 5 — Story reader — **M** (audio dropped 2026-09-14)

Decided: no audio. The screen keeps the mockup's shell (light, full-bleed painting, back + heart, title + blurb, "Try this while reading" callout) with the existing paged story text in place of the scrubber. The audio comparison below is kept for the record only.

The reader today is a dark, paged (3-page) text view with tap/swipe/keyboard navigation. The mockup is a light full-bleed painting, title + one-line blurb, an audio scrubber with ±15 s, and a "Try this while reading" callout. No text on screen.

**Decision needed — audio.** Three routes:

| Route | Pros | Cons | Size |
|---|---|---|---|
| **A. Device TTS** (`speechSynthesis`) | free, offline, no files | robotic on some devices; no real seek, so scrubber and ±15 s have to be faked at sentence level | M |
| **B. Pre-generated narration** (one MP3 per story from a TTS API such as ElevenLabs or OpenAI TTS, hosted on Supabase Storage, cached after first play) | real player, warm voice, true scrubbing | 15 × ~2 MB streamed not bundled; generation cost ~$5 one-off; re-generate if text changes | M code + S content |
| **C. Mom records her own** (`MediaRecorder`) | the most "Numae" idea of the three; also enables Journal voice memos | needs a recording flow; no audio until she records | M |

Recommend **B now, C as the follow-up** ("Record it in your voice"), because C shares the MediaRecorder work with the Journal voice memo (screen 7).

**Also in this screen:**
- Keep the story text reachable. Reading aloud from the screen is the current use. Proposal: art + player in the top half, story text scrolls beneath (sentences highlight as audio plays if route A or B with timestamps). Flag this as a deliberate deviation from the mockup.
- Heart = favourite. `storyProgress.js` already has `toggleFavourite`; no UI calls it. S.
- "Try this while reading" = **new field** `readingPrompt` per story (15 lines of content). S.
- `markRead` currently fires on the last page; move to "played 80 %" or "reached the end of the text".

---

## Screen 6 — Growth — **M**

Current `StatsScreen` is one long scroll: percentile tiles, WHO chart, measurement form, history, then `DevelopmentChecklist`. The mockup turns it into a four-tab overview.

| Segment | Content | Work |
|---|---|---|
| **Overview** (mockup) | "12 months · Current age · Edit"; four `StatTile`s (milk/day, wake window, naps, diapers); "This month" 3 bullets; "Development highlights" 4 category tiles | tiles come from the `AGE_STATS` table currently on Home (move + restyle, S). "This month" bullets are **new content**: 3 lines × 24 months, can be drawn from milestone text for the checkpoint (S content). Category tiles open the checklist filtered by domain |
| **Milestones** | `DevelopmentChecklist` as is | rename domains to match the mockup: language → Communication, motor → Movement, social → Social & Emotional, thinking → Thinking. S |
| **Health** | WHO chart, measurements, history (today's StatsScreen body) | move under the tab, restyle. S–M |
| ~~Routine~~ | dropped 2026-09-14: "I don't want to create another tracking app". Growth has three segments: Overview / Milestones / Health. The four typical-for-this-age numbers stay on Overview as reference only |

Profile icon top right → Profile screen. "Edit" on the age card → Edit profile DOB.

---

## Screen 7 — Journal — **L**

Current Journal: header + count + Add, Then↔Now slider, month sections (hero + 4:5 grid), `EntrySheet` modal, `MemoryForm` sheet. No date navigation, no search, photo hunt lives on Home.

| Mockup element | Work |
|---|---|
| Header + search icon | search over notes: S (filter `getEntries()` by note text). Fine to ship, entries have notes |
| Month arrows + 7-day date strip | **new** `DateStrip` component. Tapping a day filters the list to that day; dots under days that have entries; today selected by default. M |
| "What made you smile today?" prompt card: Add photo / Record a moment / Write a note | Add photo + Write a note open `MemoryForm` with the right mode (S). **Record a moment = voice memo, new:** `MediaRecorder` → audio blob stored exactly like video in `journalStore` (`photoType: 'audio/webm'` or `audio/mp4` on iOS), entry card shows a play pill + waveform-ish bar. M. Shares work with story route C |
| September Photo Hunt card + "All 9" + thumbnails + Add | move `PhotoHunt` from Home into Journal; condensed 3-thumb row on Journal, "All 9" opens the full 3×3 grid as a detail view. M |
| Entry list below | existing month sections, restyled with the tokens. S |

**Decision needed — Then↔Now.** Not in the mockup. Options: keep it as a row under the photo hunt card, move it to Growth Overview ("Then and now"), or reach it only from the keepsake picker. Recommend Growth Overview, it's a growth story.

---

## Screen 8 — Mood ("How is Kabir today?") — **M**

Already 70 % built: `babyStates.js` has six states (fussy, clingy, won't settle, won't eat, unwell, happy) each with age-banded causes → actions, and `babyPatterns.js` remembers what helped. Today it's a chip row on Home that opens a bottom sheet.

| Mockup element | Work |
|---|---|
| Full-screen view with back arrow, 2×4 grid, Save | new `MoodCheckIn` view using the stack. S |
| Eight states: Happy, Fussy, Clingy, Won't settle, Not eating well, Tummy issues, Sleepy, Great day! | add **Tummy issues**, **Sleepy**, **Great day!** to `babyStates.js` with causes/actions per band (content, S–M). Map existing keys: sleep → Won't settle, feeding → Not eating well; "unwell" stays as a red-flag route or is folded into Tummy issues |
| Multi-select + Save | today is single-tap. New `src/lib/moodLog.js`: localStorage `moodLog[YYYY-MM-DD] = [states]`, counts as a check-in. S |
| "Your responses help us personalize tips" | make it true: after Save, (1) show the existing causes/actions responder for any concerning state, (2) bias today's tip and activity pick toward the matching topic (Won't settle → sleep tips, Not eating well → feeding, Fussy → fussy/teething). Today state never touches tip selection. M |
| Entry point | not shown in the mockup. Suggest a small "How is Kabir today?" line under the hero on Today, plus a once-a-day prompt on first open. Also feeds the AI tip context (`aiContext.js`) |

---

## Content track (runs alongside the code, needs your review)

| Item | Count | Route | Your time |
|---|---|---|---|
| Tip enrichment (`tryToday`, `whyItMatters`, `minutes`) | 693 | Node script + structured outputs, batched by topic | ~3–4 h review |
| Activities with steps | 30–50 | 6 converted from `funActivities`, rest sourced CDC / Zero to Three / AAP, AI-drafted, reviewed | ~2–3 h |
| "This month" bullets | 24 × 3 | draft from milestone checkpoints | ~1 h |
| Story `durationMin` + `readingPrompt` | 15 | by hand | ~30 min |
| Painting images | 19 WebP | download + crop per `STORIES_DRAFT.md` | ~1 h |
| Story narration (if route B) | 15 MP3 | TTS API one-off | ~1 h listening |
| Mood states: Tummy issues, Sleepy, Great day! | 3 × 4 age bands | by hand | ~1 h |
| Quote lines for Today | ~20 | by hand | 20 min |

---

## Suggested build order (one PR each, on top of `feat/dogfood-sept-2026`)

| # | PR | Size | Unlocks |
|---|---|---|---|
| 0 | Open the two pending PRs (`feat/photo-hunt-camera`, `feat/dogfood-sept-2026`) so this work starts from main | S | clean base |
| 1 | Foundation: tokens, serif font, UI kit, detail stack, Profile screen, tab restyle | L | everything |
| 2 | Today simplified + Tip detail (optional fields) + baby photo + Mood view | L | the first screen you'll actually feel |
| 3 | Growth: segmented control, Overview tiles, development categories, Health tab | M | |
| 4 | Journal: date strip, prompt card, photo hunt move, voice memo, search | L | |
| 5 | Stories shelf + restyled reader + real art | M | |
| 6 | Activities: data, detail view, rating, "Do" row | M + content | |
| — | Content track (tips enrichment script first, it has the longest review tail) | parallel | |

Rough total: **three to four weeks of sessions** for code, with content review in between. Each PR is reviewable in the dev server on your phone before merge, per the usual flow.

---

## Decisions to make before PR 1

1. ~~Audio route for stories~~ — decided: none.
2. **Activity imagery** — per-category illustration, none, or per-activity photo. (Recommend per-category.)
3. **Streak row** — drop, or fold into the Today subtitle.
4. **Then↔Now and Flashback** — where they live once Home is simplified. (Recommend Growth Overview and the "Remember" row subtitle.)
5. ~~Routine tab~~ — decided 2026-09-14: none. Not a tracking app.
6. ~~Serif font~~ — decided: keep Inter.
7. **Name in the header** — the mockup never shows a product name. Fine to ship the redesign before the Numae rename, or fold the rename into PR 1 since it touches the same copy.

## Content rules (unchanged principle, restated for the new content types)

- **Activities** carry a `source` exactly like tips (CDC "Learn the Signs", AAP HealthyChildren, Zero to Three, WHO). No activity ships without one. The "Builds X" line must be what the source says it builds, not a guess.
- **Tip enrichment** ("Try it today", "Why it matters", minutes) is generated *from the tip's own cited source*, not new claims. The script passes the existing `source` and instructs the model to stay inside it; anything that introduces a new claim gets flagged for your review rather than merged.
- **"This month" bullets** on Growth come from the CDC checkpoint milestones already in `milestones.js`, with the same soft age language.
- **Mood → tip biasing** only re-ranks the already-sourced tip pool. Causes/actions for the three new mood states follow the same age-banded, source-cited pattern as `babyStates.js`.
- The AI daily tip already returns `null` when it cannot cite a real source; the new fields inherit that rule.

## Not in scope here

- Supabase sync of journal/growth/mood/activity data (separate track, unchanged).
- Capacitor / App Store wrap (`app-store-scope.md`). The in-app camera (concept C) stays parked with it.
- Community / Q&A (parked 2026-05-25).
