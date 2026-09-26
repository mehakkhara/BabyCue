import { supabase, isSupabaseConfigured } from './supabase'

const LOCAL_KEY = 'babyProfile'

function rowToProfile(row) {
  if (!row) return null
  return {
    momName: row.mom_name ?? null,
    babyName: row.baby_name,
    dateOfBirth: row.date_of_birth,
    parentingStyle: row.parenting_style ?? null,
    babySex: row.baby_sex ?? null,
    feedingMethod: row.feeding_method ?? null,
    sleepArrangement: row.sleep_arrangement ?? null,
    birthContext: row.birth_context ?? null,
    siblings: row.siblings ?? null,
    notes: row.notes ?? null,
  }
}

function profileToRow(profile, userId) {
  return {
    user_id: userId,
    mom_name: profile.momName || null,
    baby_name: profile.babyName,
    date_of_birth: profile.dateOfBirth,
    parenting_style: profile.parentingStyle || null,
    baby_sex: profile.babySex || null,
    feeding_method: profile.feedingMethod || null,
    sleep_arrangement: profile.sleepArrangement || null,
    birth_context: profile.birthContext || null,
    siblings: profile.siblings || null,
    notes: profile.notes || null,
    updated_at: new Date().toISOString(),
  }
}

function loadLocalProfile() {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    if (!saved) return null
    const profile = JSON.parse(saved)
    if (!profile?.babyName) return null
    if (!profile.babySex) {
      const legacy = localStorage.getItem('babySex')
      if (legacy) profile.babySex = legacy
    }
    return profile
  } catch {
    return null
  }
}

function saveLocalProfile(profile) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(profile))
  if (profile.babySex) localStorage.setItem('babySex', profile.babySex)
}

async function currentUserId() {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

// getSession() reads the token out of localStorage without asking the server
// whether that user still exists. If the account was deleted — by us, by the
// user on another device, or because the project was reset — the token still
// looks valid and still passes RLS (auth.uid() comes from the JWT signature,
// not from a lookup). The insert then dies on the foreign key into auth.users.
//
// 23503 = foreign_key_violation. PGRST301 = JWT expired / not acceptable.
function isDeadSession(error) {
  return error?.code === '23503'
    || error?.code === 'PGRST301'
    || error?.status === 401
}

// Drop the stale token so the next render sends them to sign-in. Scope 'local'
// clears storage without calling the server — the token is already worthless,
// so a network round trip would just fail.
async function abandonDeadSession() {
  try {
    await supabase.auth.signOut({ scope: 'local' })
  } catch {
    // Nothing to do — the session is going away either way.
  }
}

export async function getProfile() {
  const userId = await currentUserId()
  if (!userId) return loadLocalProfile()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (isDeadSession(error)) await abandonDeadSession()
    else console.error('getProfile error:', error.message)
    return loadLocalProfile()
  }
  return rowToProfile(data)
}

export async function saveProfile(profile) {
  if (!profile?.babyName || !profile?.dateOfBirth) {
    throw new Error('Profile requires babyName and dateOfBirth')
  }

  const userId = await currentUserId()
  if (!userId) {
    saveLocalProfile(profile)
    return profile
  }

  const { data: existing, error: selErr } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selErr) {
    if (!isDeadSession(selErr)) throw selErr
    return saveAsGuest(profile)
  }

  const row = profileToRow(profile, userId)
  const { error } = existing?.id
    ? await supabase.from('profiles').update(row).eq('id', existing.id)
    : await supabase.from('profiles').insert(row)

  if (error) {
    if (!isDeadSession(error)) throw error
    // The account this token belongs to is gone. Don't strand the parent on
    // onboarding with a database error — keep their profile on the device and
    // let them sign in again when they're ready.
    return saveAsGuest(profile)
  }
  return profile
}

async function saveAsGuest(profile) {
  await abandonDeadSession()
  saveLocalProfile(profile)
  return profile
}

// Push any localStorage profile up to Supabase on first sign-in, but only if
// the signed-in user doesn't already have a profile row. Returns the resulting
// profile (Supabase row if backfilled or pre-existing, null if neither exists).
export async function backfillLocalProfileIfNeeded() {
  const userId = await currentUserId()
  if (!userId) return null

  const remote = await getProfile()
  if (remote) return remote

  const local = loadLocalProfile()
  if (!local) return null

  await saveProfile(local)
  return local
}
