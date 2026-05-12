import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

// Tracks the current Supabase auth session.
// - status: 'loading' until the initial getSession() resolves, then 'ready'
// - session: null when signed out (or when Supabase isn't configured at all)
// When Supabase isn't configured the hook reports status: 'ready', session: null
// so callers fall straight through to guest mode.
export function useSession() {
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'ready')
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return
      setSession(data.session ?? null)
      setStatus('ready')
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  return { status, session }
}

export async function signOut() {
  if (!isSupabaseConfigured) return
  await supabase.auth.signOut()
}
