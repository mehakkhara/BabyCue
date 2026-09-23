-- BabyCue — Supabase schema (Phase 1 of Level 2)
-- Paste this into the Supabase SQL editor and click Run.
-- Safe to re-run: every statement is guarded with "if not exists" or "or replace".

-- =============================================================
-- Tables
-- =============================================================

create table if not exists public.profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  mom_name           text,
  baby_name          text not null,
  date_of_birth      date not null,
  parenting_style    text,
  baby_sex           text,
  feeding_method     text,
  sleep_arrangement  text,
  birth_context      text,
  siblings           text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create table if not exists public.growth_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  weight      numeric,
  height      numeric,
  created_at  timestamptz not null default now()
);

create table if not exists public.journal_entries (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  note        text,
  photo_path  text,
  created_at  timestamptz not null default now()
);

create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create table if not exists public.saved_tips (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  tip_id      integer not null,
  created_at  timestamptz not null default now(),
  unique (profile_id, tip_id)
);

-- =============================================================
-- Indexes
-- =============================================================

create index if not exists idx_profiles_user            on public.profiles(user_id);
create index if not exists idx_growth_profile_date      on public.growth_entries(profile_id, date desc);
create index if not exists idx_journal_profile_created  on public.journal_entries(profile_id, created_at desc);
create index if not exists idx_chat_profile_created     on public.chat_messages(profile_id, created_at);

-- =============================================================
-- Row Level Security — every row scoped to its owning user
-- =============================================================

alter table public.profiles         enable row level security;
alter table public.growth_entries   enable row level security;
alter table public.journal_entries  enable row level security;
alter table public.chat_messages    enable row level security;
alter table public.saved_tips       enable row level security;

drop policy if exists "profiles_owner_all"        on public.profiles;
drop policy if exists "growth_owner_all"          on public.growth_entries;
drop policy if exists "journal_owner_all"         on public.journal_entries;
drop policy if exists "chat_owner_all"            on public.chat_messages;
drop policy if exists "saved_tips_owner_all"      on public.saved_tips;

create policy "profiles_owner_all"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "growth_owner_all"
  on public.growth_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "journal_owner_all"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "chat_owner_all"
  on public.chat_messages for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_tips_owner_all"
  on public.saved_tips for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- =============================================================
-- Storage bucket for journal photos
-- =============================================================

insert into storage.buckets (id, name, public)
  values ('baby-photos', 'baby-photos', false)
  on conflict (id) do nothing;

drop policy if exists "photos_owner_read"    on storage.objects;
drop policy if exists "photos_owner_write"   on storage.objects;
drop policy if exists "photos_owner_update"  on storage.objects;
drop policy if exists "photos_owner_delete"  on storage.objects;

-- Photo paths follow the convention "<user_id>/<filename>" so the first
-- path segment identifies the owner.
create policy "photos_owner_read"
  on storage.objects for select
  using (bucket_id = 'baby-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'baby-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_owner_update"
  on storage.objects for update
  using (bucket_id = 'baby-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'baby-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================
-- Journal sync (2026-09-22, sync-scope.md Phase A)
-- Safe to re-run. Adds the columns the app already stores locally, plus the
-- fields the sync needs: a device-independent id, a soft delete, and an
-- updated_at for last-write-wins.
-- =============================================================
alter table public.journal_entries alter column profile_id drop not null;
alter table public.journal_entries
  add column if not exists client_id   uuid,
  add column if not exists kind        text not null default 'memory',
  add column if not exists source      text,
  add column if not exists entry_at    timestamptz,
  add column if not exists media_type  text,
  add column if not exists width       integer,
  add column if not exists height      integer,
  add column if not exists fit         text,
  add column if not exists position    text,
  add column if not exists updated_at  timestamptz not null default now(),
  add column if not exists deleted_at  timestamptz;
create unique index if not exists journal_client_id on public.journal_entries (client_id);
create index if not exists journal_user_updated on public.journal_entries (user_id, updated_at);
