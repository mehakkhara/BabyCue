# Setting Up Supabase (Level 2 — Phase 1)

This is a one-time setup to give the app a real database and accounts. Until you finish this, the app keeps working exactly as before (guest mode using localStorage).

## 1. Create a Supabase project

1. Go to https://app.supabase.com and sign in with GitHub (free).
2. Click **New project**.
3. Pick a name (e.g. `babycue`), choose a region close to you, and set a database password. You can ignore the password — Supabase manages it for you.
4. Wait ~1 minute for the project to provision.

## 2. Run the schema SQL

1. In your project, click **SQL Editor** in the left sidebar.
2. Click **+ New query**.
3. Open `supabase/schema.sql` from this repo, copy the entire contents, paste it into the editor.
4. Click **Run** (or `⌘+Enter`). You should see "Success. No rows returned."

This creates 5 tables (profiles, growth_entries, journal_entries, chat_messages, saved_tips), a `baby-photos` storage bucket, and Row Level Security policies so each user only sees their own data.

## 3. Copy your API keys into `.env.local`

1. In Supabase, go to **Settings → API** in the left sidebar.
2. Copy the **Project URL** and the **`anon` `public` key**.
3. In this repo, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Paste your values into `.env.local`:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=ey...
   ```

`.env.local` is gitignored — your keys won't be committed.

## 4. Enable email magic-link login

1. In Supabase, go to **Authentication → Providers**.
2. Make sure **Email** is enabled (it is by default).
3. Scroll to **Email Auth** and confirm **Confirm email** is OFF for development (turn it back on for production once we're shipped).

## 5. Restart the dev server

```bash
npm run dev
```

That's it for Phase 1. The Supabase client is wired up but no UI uses it yet — Phase 2 adds the sign-in screen.

## What about production?

When we deploy auth (Phase 2+), we'll need to add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the production environment. For GitHub Pages there's no env-var system, so we'll either commit a `.env.production` (the anon key is safe to publish since RLS protects everything) or migrate to Vercel. We'll decide when we get there.
