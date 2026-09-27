// Detail-page stack. Tabs stay the root; a "view" is a page pushed on top
// (tip, activity, mood, profile, story). Each push also pushes a browser
// history entry, so the phone's back gesture and the browser back button pop
// the view instead of leaving the app.
import { useCallback, useEffect, useState } from 'react'

export function useViewStack() {
  const [stack, setStack] = useState([])

  useEffect(() => {
    // Any back navigation drops the top view. Forward is not supported —
    // detail pages are re-opened from the tab, not re-entered.
    function onPop() {
      setStack(s => (s.length ? s.slice(0, -1) : s))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const push = useCallback((name, params = {}) => {
    setStack(s => [...s, { name, params, key: Date.now() }])
    try { window.history.pushState({ view: name }, '') } catch { /* sandboxed */ }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  const pop = useCallback(() => {
    // history.back() fires popstate, which drops the view. Fall back to a
    // direct pop when there is no history entry to unwind (fresh load).
    if (window.history.state && window.history.state.view) {
      window.history.back()
    } else {
      setStack(s => (s.length ? s.slice(0, -1) : s))
    }
  }, [])

  // Replace the top view without growing the stack (tip → related tip).
  const replace = useCallback((name, params = {}) => {
    setStack(s => [...s.slice(0, -1), { name, params, key: Date.now() }])
    try { window.history.replaceState({ view: name }, '') } catch { /* ignore */ }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [])

  return { view: stack[stack.length - 1] || null, depth: stack.length, push, pop, replace }
}
