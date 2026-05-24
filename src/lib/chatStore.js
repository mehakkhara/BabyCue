import { supabase, isSupabaseConfigured } from './supabase'

const LOCAL_KEY = 'chatMessages'

export function loadLocalChat() {
  try {
    const saved = localStorage.getItem(LOCAL_KEY)
    return saved ? JSON.parse(saved) : []
  } catch {
    return []
  }
}

function saveLocalChat(messages) {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(messages)) } catch { /* quota */ }
}

async function currentUserId() {
  if (!isSupabaseConfigured) return null
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id ?? null
}

async function currentProfileId(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('currentProfileId error:', error.message)
    return null
  }
  return data?.id ?? null
}

export async function loadChatMessages() {
  const userId = await currentUserId()
  if (!userId) return loadLocalChat()

  const profileId = await currentProfileId(userId)
  if (!profileId) return []

  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: true })
  if (error) {
    console.error('loadChatMessages error:', error.message)
    return loadLocalChat()
  }
  return data ?? []
}

export async function appendChatMessage(message) {
  const userId = await currentUserId()
  if (!userId) {
    const local = loadLocalChat()
    local.push(message)
    saveLocalChat(local)
    return
  }

  const profileId = await currentProfileId(userId)
  if (!profileId) {
    const local = loadLocalChat()
    local.push(message)
    saveLocalChat(local)
    return
  }

  const { error } = await supabase.from('chat_messages').insert({
    user_id: userId,
    profile_id: profileId,
    role: message.role,
    content: message.content,
  })
  if (error) console.error('appendChatMessage error:', error.message)
}

// First sign-in: push localStorage chat history up to Supabase, but only if
// the signed-in user has zero chat rows yet (prevents duplicates on repeat
// sign-ins). Mirror of backfillLocalProfileIfNeeded in db.js.
export async function backfillLocalChatIfNeeded() {
  const userId = await currentUserId()
  if (!userId) return

  const profileId = await currentProfileId(userId)
  if (!profileId) return

  const { count, error: countErr } = await supabase
    .from('chat_messages')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
  if (countErr) {
    console.error('chat backfill count error:', countErr.message)
    return
  }
  if ((count ?? 0) > 0) return

  const local = loadLocalChat()
  if (local.length === 0) return

  const rows = local.map(msg => ({
    user_id: userId,
    profile_id: profileId,
    role: msg.role,
    content: msg.content,
  }))
  const { error } = await supabase.from('chat_messages').insert(rows)
  if (error) console.error('chat backfill insert error:', error.message)
}
