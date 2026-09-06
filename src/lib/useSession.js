import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from './supabase'

// Tracks the current Supabase auth session.
// - status: 'loading' until the initial getSession() resolves, then 'ready'
// - session: null when signed out (or when Supabase isn't configured at all)
// When Supabase isn't configured the hook reports status: 'ready', session: null
// so callers fall straight through to guest mode.
// The server actively rejected this token — the account is gone, or the JWT is
// no longer acceptable. Distinct from "we couldn't reach the server", which
// must NOT sign anyone out: the app is meant to work on a plane.
function isAuthRejection(error) {
  return error?.status === 401 || error?.status === 403
}

export function useSession() {
  const [status, setStatus] = useState(isSupabaseConfigured ? 'loading' : 'ready')
  const [session, setSession] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return

    let cancelled = false
    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      const stored = data.session ?? null

      // getSession() only reads the token out of localStorage — it never asks
      // whether that user still exists. getUser() does. Without this check a
      // token belonging to a deleted account looks perfectly valid all the way
      // down to the foreign key on auth.users, and the parent sees a database
      // error on the onboarding screen.
      if (stored) {
        try {
          const { error } = await supabase.auth.getUser()
          if (isAuthRejection(error)) {
            await supabase.auth.signOut({ scope: 'local' })
            if (!cancelled) { setSession(null); setStatus('ready') }
            return
          }
        } catch {
          // Offline. Keep the cached session — being unreachable is not a
          // reason to lock someone out of their own baby's journal.
        }
      }

      if (cancelled) return
      setSession(stored)
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
