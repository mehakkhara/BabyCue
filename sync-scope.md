# Supabase Sync — Journal, Photos and Everything Else on the Phone

Scoping doc, 2026-09-22. The goal: nothing the parent has saved lives only on one phone. Move to a new domain, get a new phone, or sign in on the Mac, and the journal, checklists, moods and streak are all there.

Today the app is **local-only** apart from the profile:

| Data | Where it lives now | Size |
|---|---|---|
| Profile | Supabase `profiles` (synced since May) | tiny |
| Journal entries + photos, videos, voice memos, keepsakes | IndexedDB `baby-journal` | the big one, ~500 KB per photo |
| Growth entries | localStorage `growthEntries` | tiny |
| Saved tips, mood log, check-in streak, milestone ticks, custom milestones, activity ratings, baby patterns, checklist progress | localStorage, one key each | tiny |
| Baby hero photo | localStorage `babyPhoto` (data URL) | ~200 KB |
| Chat history | localStorage (a Supabase branch exists, never merged) | small |

Why it matters now: the custom-domain move changes the browser origin. IndexedDB and localStorage do not carry over. Without sync, the move deletes the journal on the phone.

---

## The shape: local-first, Supabase as the durable copy

The database analogy: the phone keeps a **replica** it reads from instantly and offline. Supabase is the **primary**. Every write goes to the replica first, then to the primary through an outbox. On open and on sign-in, the replica pulls anything newer from the primary.

Three rules that keep it simple:

1. **Reads never wait for the network.** Every screen keeps reading IndexedDB and localStorage exactly as today. No call site changes.
2. **Writes go local, then queue.** `addEntry` / `updateEntry` / `deleteEntry` save locally and drop a job in an outbox. A background worker drains the outbox whenever online. If the upload fails, the job stays and retries next open.
3. **Last write wins, per record.** Every record carries `updated_at`. On pull, a newer remote row replaces the local one; an older one is ignored. Journal entries are almost never edited from two devices at once, so this is enough.

Guest mode (no sign-in) keeps working unchanged. Sync only runs with a session.

---

## Phase A — Journal entries and media (the one that matters)

### Schema changes (`supabase/schema.sql`)

`journal_entries` exists but only has `note` and `photo_path`. Add the columns the app already stores locally, plus what sync needs:

```sql
alter table public.journal_entries
  add column if not exists client_id   uuid unique,          -- the entry's id on every device
  add column if not exists kind        text not null default 'memory',   -- 'memory' | 'keepsake'
  add column if not exists source      text,                 -- 'photoHunt' | null
  add column if not exists entry_at    timestamptz,          -- the date the parent chose (createdAt locally)
  add column if not exists media_type  text,                 -- 'image/jpeg' | 'video/mp4' | 'audio/webm' ...
  add column if not exists width       integer,
  add column if not exists height      integer,
  add column if not exists fit         text,
  add column if not exists position    text,
  add column if not exists updated_at  timestamptz not null default now(),
  add column if not exists deleted_at  timestamptz;          -- soft delete so other devices remove it
create index if not exists journal_user_updated on public.journal_entries (user_id, updated_at);
```

`photo_path` stays and holds the storage key. The bucket `baby-photos` and its owner-only policies already exist. Path convention: `<user_id>/<client_id>.<ext>`.

### Local changes

- **Stable ids.** IndexedDB entries use an auto-increment integer today, different on every device. Bump `DB_VERSION` and give every entry a `clientId` (UUID) in the upgrade step. New entries get one on save. The integer `id` stays as the local key so nothing else changes.
- **Sync fields on the local record:** `updatedAt`, `deletedAt`, `synced` (boolean), `remotePath`.
- **Outbox** as a second object store: `{ id, op: 'upsert' | 'delete', clientId, attempts, lastError }`.
- **`src/lib/sync.js`** owns push and pull. `journalStore` calls `sync.enqueue()` after each write; `App.jsx` calls `sync.run()` on open, on sign-in, and when the browser fires `online`.

### Push (outbox → Supabase)

For each job, in order:

1. Upload the media blob to `baby-photos/<user_id>/<clientId>.<ext>` (`upsert: true`, so retries are safe).
2. Upsert the row in `journal_entries` keyed on `client_id`.
3. Mark the local entry `synced`, drop the job.

Deletes: set `deleted_at` on the row and remove the storage object. Local delete stays immediate.

### Pull (Supabase → local)

1. Fetch rows where `updated_at > lastSyncAt` (kept in localStorage per user), newest first.
2. For each row not in IndexedDB, or newer than the local copy: download the media from storage, write the entry. Rows with `deleted_at` delete the local entry.
3. Save the new `lastSyncAt`.

Media download is the slow part. Do it in the background newest-first with a small progress line on the Journal tab ("Bringing over 42 memories…"). Entries appear as their media lands. Journal already handles entries with no blob (it shows a placeholder), so partially synced state is not a broken state.

### Backfill on first sign-in

Same pattern as `backfillLocalProfileIfNeeded`: when a session appears and the outbox is empty but local entries have no `synced` flag, enqueue all of them. On Mehak's phone this is a one-time upload of the whole journal. It runs in the background; the app stays usable.

### Where the parent sees it

- Profile: a "Sync" row showing "All memories backed up" or "12 waiting to upload" and a "Sync now" tap.
- Journal: the progress line during a big pull.
- No new settings. Signed in means synced.

---

## Phase B — Everything else, in one table

The nine localStorage stores are small JSON documents. Instead of nine tables, one:

```sql
create table if not exists public.user_state (
  user_id    uuid not null references auth.users(id) on delete cascade,
  key        text not null,              -- 'moodLog' | 'checkIns' | 'checklistProgress' | ...
  value      jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);
-- plus the same owner-only RLS policy as the other tables
```

A tiny wrapper, `lib/syncedStore.js`, replaces the `localStorage.getItem/setItem` pair inside each of the nine modules. Reads stay synchronous from localStorage. Writes also upsert the row. On open and sign-in, pull all keys and take whichever side has the newer `updated_at`.

This covers growth entries too, for now. The `growth_entries` table from May stays for a later, per-row version if charts ever need server queries.

Chat history: the unmerged `persist-chat-history-supabase` branch already writes `chat_messages`. Revisit it after Phase B; it may just need a rebase.

### Phase C — The hero photo

`babyPhoto` is a data URL in localStorage. Move it to `baby-photos/<user_id>/baby-photo.jpg` and keep the data URL as the local cache. One small PR.

---

## Order of work and size

| PR | What | Size |
|---|---|---|
| 1 | Schema migration SQL, `clientId` upgrade in IndexedDB, outbox store, `sync.js` push only, backfill, Profile sync row | ~1 day |
| 2 | Pull with background media download, Journal progress line, soft deletes both ways | ~1 day |
| 3 | `user_state` table + `syncedStore` wrapper over the nine small stores | ~half day |
| 4 | Hero photo to storage | ~1 hour |

Each is reviewable on its own. After PR 2 the domain move is safe.

---

## Testing plan

- **Two browsers on the Mac**: Chrome signed in, Safari signed in as the same user. Add a memory in one, see it in the other after "Sync now". Delete in one, gone in the other.
- **Phone → Mac**: sign in on the Mac after the phone backfills. The whole journal should come over, newest first.
- **Offline**: airplane mode, add a memory, back online, watch the Profile counter drop to zero.
- **Fresh origin**: open the app at a different local port, sign in, confirm everything arrives. This is a rehearsal for the domain move.

---

## Costs and limits

- Supabase free tier: 1 GB storage, roughly 2,000 compressed photos. Videos and voice memos count too. Worth a look at how many videos are in the journal today before deciding whether video uploads wait for Wi-Fi.
- Egress is the other free-tier number; a full pull of a 500 MB journal onto a new device uses half a month of it. Fine for one parent, a thing to watch with users.

## Decisions needed before PR 1

1. **Videos and voice memos in the first pass, or photos only?** Recommendation: everything, because a partial backup is the kind that surprises you later.
2. **Upload on any connection, or Wi-Fi only for video?** Recommendation: any connection for now, it's one household.
3. **Pull everything on a new device, or newest 100 and the rest on demand?** Recommendation: everything, newest first, in the background.
4. **One `user_state` table for the small stores** (recommended) or one table per store?

## Out of scope

- Real-time sync between two open devices. Pull on open plus "Sync now" is enough.
- Sharing a journal with a second parent account. Wants its own design (a `families` table and a policy change).
- Encryption beyond what Supabase does at rest. Photos are private by RLS and the bucket is not public.
