// Journal sync, push side (sync-scope.md, Phase A / PR 1).
//
// The phone is the replica, Supabase is the primary. journalStore writes
// locally and drops a job in the outbox; this module drains the outbox when
// there is a session and a network. Pull (server → phone) is PR 2.
//
// Status is observable so Profile can show "12 waiting to upload".
import { supabase, isSupabaseConfigured } from './supabase'
import {
  listOutbox, removeJob, updateJob, getEntryByClientId, markSynced, unsyncedClientIds, enqueue,
  upsertFromRemote, deleteByClientId, attachMedia, entriesMissingMedia,
} from '../data/journalStore'

const BUCKET = 'baby-photos'
const TABLE = 'journal_entries'
const LAST_SYNC_KEY = 'journalSync:lastAt'
const LAST_PULL_KEY = 'journalSync:lastPull:'   // + user id
const PAGE = 200
const MAX_ATTEMPTS = 8

const state = {
  configured: isSupabaseConfigured,
  signedIn: false,
  running: false,
  pending: 0,
  lastSyncAt: readLastSyncAt(),
  lastError: null,
  // Pull progress: memories arriving from other devices.
  downloading: null,   // { done, total } while media is coming down, else null
}
const listeners = new Set()
let inFlight = null

export function getSyncStatus() { return { ...state } }

export function onSyncChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function emit() {
  const snapshot = getSyncStatus()
  for (const fn of listeners) { try { fn(snapshot) } catch { /* listener error is not ours */ } }
}

function readLastSyncAt() {
  try { return Number(localStorage.getItem(LAST_SYNC_KEY)) || null } catch { return null }
}

function writeLastSyncAt(ts) {
  try { localStorage.setItem(LAST_SYNC_KEY, String(ts)) } catch { /* quota */ }
}

const EXT = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/heic': 'heic',
  'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm',
  'audio/webm': 'webm', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/ogg': 'ogg',
}
function extFor(type) {
  if (EXT[type]) return EXT[type]
  const sub = String(type || '').split('/')[1]
  return sub ? sub.replace(/[^a-z0-9]/gi, '').slice(0, 8) || 'bin' : 'bin'
}

async function userId() {
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

// Refresh the pending count without pushing. Cheap; call after local writes.
export async function refreshSyncStatus() {
  try {
    const [jobs, uid] = await Promise.all([listOutbox(), userId()])
    state.pending = jobs.length
    state.signedIn = !!uid
  } catch { /* IndexedDB unavailable: leave the last known state */ }
  emit()
}

// Errors that mean "try again later", not "this job is bad".
function isTransient(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  return !navigator.onLine || /fetch|network|timeout|failed to|load failed|503|502|429/.test(msg)
}

function rowFor(entry, uid, remotePath) {
  return {
    client_id: entry.clientId,
    user_id: uid,
    note: entry.note || '',
    kind: entry.kind || 'memory',
    source: entry.source || null,
    entry_at: new Date(entry.createdAt || Date.now()).toISOString(),
    media_type: entry.photoBuffer || entry.photoBlob ? (entry.photoType || 'image/jpeg') : null,
    photo_path: remotePath,
    width: entry.width || null,
    height: entry.height || null,
    fit: entry.fit || 'cover',
    position: entry.position || 'center',
    updated_at: new Date(entry.updatedAt || Date.now()).toISOString(),
    deleted_at: null,
  }
}

async function pushUpsert(job, uid) {
  const entry = await getEntryByClientId(job.clientId)
  if (!entry) { await removeJob(job.id); return }   // deleted locally before it uploaded
  let remotePath = entry.remotePath || null
  if (entry.photoBlob) {
    remotePath = `${uid}/${entry.clientId}.${extFor(entry.photoType)}`
    const { error } = await supabase.storage.from(BUCKET).upload(remotePath, entry.photoBlob, {
      upsert: true, contentType: entry.photoType || 'image/jpeg', cacheControl: '31536000',
    })
    if (error) throw error
  }
  const { error } = await supabase.from(TABLE).upsert(rowFor(entry, uid, remotePath), { onConflict: 'client_id' })
  if (error) throw error
  await markSynced(entry.clientId, remotePath)
  await removeJob(job.id)
}

async function pushDelete(job, uid) {
  const { error } = await supabase.from(TABLE)
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('client_id', job.clientId)
    .eq('user_id', uid)
  if (error) throw error
  if (job.remotePath) {
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove([job.remotePath])
    if (rmErr && !/not found/i.test(rmErr.message || '')) throw rmErr
  }
  await removeJob(job.id)
}

// First sign-in on a device that already has a journal: queue everything.
async function backfill() {
  const ids = await unsyncedClientIds()
  for (const clientId of ids) await enqueue('upsert', clientId)
  return ids.length
}

function readLastPull(uid) {
  try { return localStorage.getItem(LAST_PULL_KEY + uid) || null } catch { return null }
}
function writeLastPull(uid, iso) {
  try { localStorage.setItem(LAST_PULL_KEY + uid, iso) } catch { /* quota */ }
}

function announcePulled() {
  try { window.dispatchEvent(new Event('journal:pulled')) } catch { /* not in a browser */ }
}

// Server → this device. Rows changed since the last pull, oldest change
// first so the watermark can move as pages complete. Media comes separately.
async function pull(uid) {
  let since = readLastPull(uid)
  let changed = 0
  for (;;) {
    let q = supabase.from(TABLE).select('*').eq('user_id', uid).order('updated_at', { ascending: true }).limit(PAGE)
    if (since) q = q.gt('updated_at', since)
    const { data, error } = await q
    if (error) throw error
    if (!data || data.length === 0) break
    for (const row of data) {
      if (!row.client_id) continue          // rows from before sync existed
      if (row.deleted_at) { if (await deleteByClientId(row.client_id)) changed++ }
      else { const r = await upsertFromRemote(row); if (r !== 'kept') changed++ }
      since = row.updated_at
    }
    writeLastPull(uid, since)
    if (data.length < PAGE) break
  }
  if (changed > 0) announcePulled()
  return changed
}

// Fetch media for entries that arrived without it, newest first, one at a
// time so a big journal streams in rather than stalls.
async function downloadMedia() {
  const todo = await entriesMissingMedia()
  if (todo.length === 0) { state.downloading = null; emit(); return 0 }
  state.downloading = { done: 0, total: todo.length }
  emit()
  let got = 0
  for (const item of todo) {
    if (!navigator.onLine) break
    const { data, error } = await supabase.storage.from(BUCKET).download(item.remotePath)
    if (error) {
      if (isTransient(error)) break
      // Missing on the server: leave the entry, it still has its note.
      state.downloading.done++
      continue
    }
    await attachMedia(item.clientId, await data.arrayBuffer(), data.type || item.photoType)
    got++
    state.downloading.done++
    if (got % 3 === 0) announcePulled()
    emit()
  }
  state.downloading = null
  if (got > 0) announcePulled()
  emit()
  return got
}

// Drain the outbox. Safe to call often; concurrent calls share one run.
export function runSync(reason = 'manual') {
  if (inFlight) return inFlight
  inFlight = (async () => {
    state.lastError = null
    if (!supabase) { state.configured = false; await refreshSyncStatus(); return { skipped: 'not configured' } }
    const uid = await userId()
    state.signedIn = !!uid
    if (!uid) { await refreshSyncStatus(); return { skipped: 'signed out' } }
    if (!navigator.onLine) { await refreshSyncStatus(); return { skipped: 'offline' } }

    state.running = true
    emit()
    let done = 0
    try {
      await backfill()
      const jobs = await listOutbox()
      state.pending = jobs.length
      emit()
      for (const job of jobs) {
        try {
          if (job.op === 'delete') await pushDelete(job, uid)
          else await pushUpsert(job, uid)
          done++
          state.pending = Math.max(0, state.pending - 1)
          emit()
        } catch (err) {
          const attempts = (job.attempts || 0) + 1
          await updateJob(job.id, { attempts, lastError: String(err?.message || err) })
          if (isTransient(err)) { state.lastError = 'Waiting for a connection'; break }
          state.lastError = friendly(err)
          if (attempts >= MAX_ATTEMPTS) { /* leave it; Profile shows the error */ }
          // A bad job should not block the rest: keep going.
        }
      }
      // Then bring down what other devices added.
      try {
        await pull(uid)
        await downloadMedia()
      } catch (err) {
        state.lastError = isTransient(err) ? 'Waiting for a connection' : friendly(err)
      }
      if (done > 0 || state.pending === 0) { state.lastSyncAt = Date.now(); writeLastSyncAt(state.lastSyncAt) }
    } finally {
      state.running = false
      await refreshSyncStatus()
    }
    return { done, reason }
  })().finally(() => { inFlight = null })
  return inFlight
}

function friendly(err) {
  const msg = String(err?.message || err || '')
  if (/column .* does not exist|client_id/i.test(msg)) return 'The database needs the sync update (run schema.sql)'
  if (/bucket/i.test(msg)) return 'Photo storage is not set up yet'
  if (/row-level security|policy/i.test(msg)) return 'Not allowed to save here (sign out and back in)'
  return msg.slice(0, 120) || 'Could not back up'
}

// Wire the triggers once: on app start, when the network returns, when the
// app comes back to the foreground, and after every local journal write.
let wired = false
export function startSync() {
  if (wired) return
  wired = true
  const kick = why => { runSync(why).catch(() => {}) }
  window.addEventListener('online', () => kick('online'))
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') kick('visible') })
  window.addEventListener('journal:changed', () => kick('write'))
  kick('start')
}
